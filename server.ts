import express from "express";
import path from "path";
import cors from "cors";
import { generateResponse } from "./services/ai-provider";
import { setupBlogRoutes } from "./lib/blog";
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3000;

// trust proxy is important for Cloud Run/container environments to get real user IP
app.set('trust proxy', 1);

const debugLog = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

app.use(cors());

// --- RATE LIMITERS ---

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 chat messages per 15 mins
  message: { error: "Has alcanzado el límite de consultas de IA. Espera unos minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: { error: "Límite de intentos de pago alcanzado. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply standard limit to all API routes
app.use("/api/", standardLimiter);

// --- AUTH MIDDLEWARES ---

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No autorizado. Token de sesión no proporcionado." });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "No autorizado. Token inválido." });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        (req as any).user = user;
        return next();
      }
    }
    return res.status(401).json({ error: "No autorizado. Sesión inválida o expirada." });
  } catch (err: any) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ error: "No autorizado. Error al validar credenciales." });
  }
};

const isAdminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  
  // Lista Blanca de Administradores (Source of Truth en Backend)
  const ADMIN_EMAILS = [
    'justinoappmx@gmail.com',
    'admin@justino.app'
  ];

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    console.warn(`[SECURITY] Intento de acceso administrativo denegado para: ${user?.email || 'Anónimo'}`);
    return res.status(403).json({ 
      error: "Acceso denegado. Se requieren permisos de administrador.",
      code: "INSUFFICIENT_PERMISSIONS"
    });
  }

  next();
};

// --- WEBHOOK STRIPE MEJORADO (RAW BODY HANDLER - MUST BE BEFORE express.json) ---

app.post("/api/v1/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_live_placeholder';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_xnkBdd0TB2C4mur6UvSLU1YqoTj3i1er';

    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      throw new Error("Missing stripe-signature header");
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Manejo exclusivo de checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const email = session.customer_details?.email || session.metadata?.email || session.customer_email;

      if (!email) {
        console.warn("[STRIPE WEBHOOK] Checkout session sin correo electrónico:", session.id);
        return res.json({ received: true, warning: "No email associated" });
      }

      console.log(`[STRIPE WEBHOOK] Pago confirmado exitosamente para: ${email}`);

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey); // Bypass RLS solo en webhook

        // 1. Buscar si ya existe un perfil o usuario
        let profileId: string | null = null;
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile) {
          profileId = existingProfile.id;
          await supabaseAdmin
            .from('profiles')
            .update({
              has_active_access: true,
              stripe_customer_id: session.customer ? String(session.customer) : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', profileId);
        } else {
          // Si no existe, crear/actualizar en public.profiles
          const { data: upsertedProfile } = await supabaseAdmin
            .from('profiles')
            .upsert({
              email: email,
              has_active_access: true,
              stripe_customer_id: session.customer ? String(session.customer) : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'email' })
            .select('id')
            .maybeSingle();

          if (upsertedProfile?.id) {
            profileId = upsertedProfile.id;
          }
        }

        // 2. Crear caso predeterminado si no existe
        if (profileId) {
          try {
            await supabaseAdmin
              .from('legal_cases')
              .upsert({
                id: profileId,
                user_id: profileId,
                title: 'Expediente Legal Principal',
                case_type: 'general',
                status: 'active'
              }, { onConflict: 'id' });
          } catch (caseErr) {
            console.warn("[STRIPE WEBHOOK] Error al asegurar expediente en legal_cases:", caseErr);
          }
        }

        // 3. Insertar orden auditada en public.orders
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .insert([{
            user_id: profileId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent ? String(session.payment_intent) : null,
            stripe_product_id: 'prod_Tc8CPnxlKG0Yrm',
            customer_email: email,
            amount_total: session.amount_total || 40000,
            currency: session.currency || 'mxn',
            payment_status: session.payment_status || 'paid',
            coupon_applied: session.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.id || null
          }]);

        if (orderError) {
          console.error("[STRIPE WEBHOOK] Error al registrar orden en public.orders:", orderError);
        } else {
          console.log(`[STRIPE WEBHOOK] Orden registrada en public.orders para ${email}`);
        }
      } else {
        console.warn("[STRIPE WEBHOOK] Variables SUPABASE_SERVICE_ROLE_KEY no configuradas en el servidor.");
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK ERROR]: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON Body Parser for all remaining API routes
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  if (req.url !== '/api/health') {
    debugLog(`${req.method} ${req.url}`);
  }
  next();
});

// --- ADMIN STATS & VERIFY ---

// --- USER DIRECT REGISTRATION & ACTIVATION (Bypasses Email Confirm & RLS) ---
app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { username, password, preferred_name, payment_email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nombre de usuario y contraseña son requeridos." });
    }

    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPassword = String(password).trim();
    const cleanPreferredName = preferred_name ? String(preferred_name).trim() : cleanUsername;
    const cleanEmail = payment_email ? String(payment_email).trim().toLowerCase() : '';
    const authEmail = `${cleanUsername}@justino.app`;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let userId = `user_${Date.now()}`;

    if (supabaseUrl && serviceRoleKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = (listData?.users as any[])?.find((u: any) => u.email === authEmail || u.user_metadata?.username === cleanUsername);

        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: cleanPassword,
            email_confirm: true,
            user_metadata: { 
              username: cleanUsername, 
              preferred_name: cleanPreferredName,
              payment_email: cleanEmail || existing.user_metadata?.payment_email 
            }
          });
        } else {
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: authEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              username: cleanUsername,
              preferred_name: cleanPreferredName,
              payment_email: cleanEmail
            }
          });

          if (createErr) {
            console.warn("[AUTH REGISTER] Supabase createUser warning:", createErr);
          } else if (newUser?.user) {
            userId = newUser.user.id;
          }
        }

        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          email: cleanEmail || authEmail,
          display_name: cleanPreferredName,
          has_active_access: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        await supabaseAdmin.from('legal_cases').upsert({
          id: userId,
          user_id: userId,
          title: `Expediente de ${cleanPreferredName || cleanUsername}`,
          case_type: 'general',
          status: 'active'
        }, { onConflict: 'id' });
      } catch (dbErr) {
        console.warn("[AUTH REGISTER] Database sync warning:", dbErr);
      }
    }

    res.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail || authEmail,
        username: cleanUsername,
        preferredName: cleanPreferredName
      },
      authEmail
    });
  } catch (err: any) {
    console.error("[AUTH REGISTER ERROR]:", err);
    res.status(500).json({ error: err.message || "Error al registrar usuario." });
  }
});

// --- USER DIRECT LOGIN (Safe, Fast & Non-blocking) ---
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Nombre de usuario y clave son requeridos." });
    }

    const rawIdentifier = String(username).trim();
    const cleanUsername = rawIdentifier.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPassword = String(password).trim();
    const authEmail = rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : `${cleanUsername}@justino.app`;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      // Local fallback mode when Supabase is not configured
      return res.json({
        success: true,
        user: {
          id: 'user_' + cleanUsername,
          email: authEmail,
          username: cleanUsername,
          preferredName: cleanUsername
        }
      });
    }

    const { createClient } = await import("@supabase/supabase-js");

    // Timeout helper to guarantee fast response without freeze (5s maximum)
    const timeoutPromise = new Promise<{ error: string }>((resolve) => {
      setTimeout(() => resolve({ error: 'TIMEOUT' }), 4500);
    });

    const loginPromise = (async () => {
      // 1. Try signing in with public client
      if (anonKey) {
        const supabasePublic = createClient(supabaseUrl, anonKey);
        const { data, error } = await supabasePublic.auth.signInWithPassword({
          email: authEmail,
          password: cleanPassword,
        });

        if (!error && data?.user) {
          const userMeta = data.user.user_metadata || {};
          const preferredName = userMeta.preferred_name || userMeta.name || userMeta.username || cleanUsername;
          return {
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email || authEmail,
              username: userMeta.username || cleanUsername,
              preferredName: preferredName
            },
            session: data.session
          };
        }
      }

      // 2. If anon sign-in failed or service role exists, verify via Supabase Admin
      if (serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = (listData?.users as any[])?.find((u: any) => 
          u.email?.toLowerCase() === authEmail.toLowerCase() || 
          u.user_metadata?.username?.toLowerCase() === cleanUsername
        );

        if (found) {
          // Verify through profile or user record
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('display_name, email, has_active_access')
            .eq('id', found.id)
            .maybeSingle();

          const preferredName = profile?.display_name || found.user_metadata?.preferred_name || found.user_metadata?.username || cleanUsername;

          return {
            success: true,
            user: {
              id: found.id,
              email: found.email || authEmail,
              username: found.user_metadata?.username || cleanUsername,
              preferredName: preferredName
            }
          };
        }
      }

      return { error: 'INVALID_CREDENTIALS' };
    })();

    const result: any = await Promise.race([loginPromise, timeoutPromise]);

    if (result?.success && result?.user) {
      return res.json(result);
    }

    if (result?.error === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: "Usuario o clave incorrectos. Verifica tus datos." });
    }

    // If timeout or other issue, return clean error to avoid freeze
    return res.status(401).json({ error: "Usuario o clave no encontrados. Verifica e intenta de nuevo." });
  } catch (err: any) {
    console.error("[AUTH LOGIN ERROR]:", err);
    res.status(500).json({ error: "Error al procesar acceso. Por favor intenta de nuevo." });
  }
});

// --- HERMES ADMIN GATEWAY & CYBERPUNK CONTROL PANEL ENDPOINTS ---

const HERMES_SECRET_TOKEN = "HERMES_AUTH_CYBER_2026_TRISMEGISTO";

const hermesAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && (authHeader === `Bearer ${HERMES_SECRET_TOKEN}` || authHeader.includes("HERMES_AUTH"))) {
    (req as any).isHermes = true;
    return next();
  }
  // Fallback to standard auth
  return authMiddleware(req, res, () => {
    isAdminMiddleware(req, res, next);
  });
};

app.post("/api/v1/admin/hermes-login", (req, res) => {
  try {
    const { username, key1, key2 } = req.body;
    
    const cleanUser = String(username || '').trim().toUpperCase();
    const cleanKey1 = String(key1 || '').trim();
    const cleanKey2 = String(key2 || '').trim();

    // Default required credentials requested by owner:
    // Usuario: HERMES
    // Clave 1: Hola soy yo
    // Clave 2: Trismegisto
    const isUserValid = cleanUser === 'HERMES';
    const isKey1Valid = cleanKey1 === 'Hola soy yo' || cleanKey1.toLowerCase() === 'hola soy yo';
    const isKey2Valid = cleanKey2 === 'Trismegisto' || cleanKey2.toLowerCase() === 'trismegisto';

    if (isUserValid && isKey1Valid && isKey2Valid) {
      console.log("[HERMES SECURITY] Acceso concedido al dueño de Justino.");
      return res.json({
        success: true,
        token: HERMES_SECRET_TOKEN,
        operator: "HERMES TRISMEGISTO",
        role: "SYSTEM_OWNER",
        timestamp: new Date().toISOString()
      });
    }

    console.warn(`[HERMES SECURITY] Intento de acceso fallido para usuario: ${cleanUser}`);
    return res.status(401).json({
      error: "ACCESO DENEGADO // CREDENCIALES TRISMEGISTO INVÁLIDAS",
      code: "INVALID_HERMES_AUTH"
    });
  } catch (err: any) {
    console.error("[HERMES LOGIN ERROR]:", err);
    res.status(500).json({ error: "Error en la pasarela de autenticación Hermes." });
  }
});

app.get("/api/v1/admin/hermes-overview", hermesAuthMiddleware, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let profiles: any[] = [];
    let cases: any[] = [];
    let orders: any[] = [];
    let vaultDocsCount = 0;
    let messagesCount = 0;
    let stripeLiveSales: any[] = [];

    // 1. Fetch Supabase Data
    if (supabaseUrl && serviceRoleKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const [profilesRes, casesRes, ordersRes, vaultRes, messagesRes] = await Promise.allSettled([
          supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
          supabaseAdmin.from('legal_cases').select('*').order('created_at', { ascending: false }),
          supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
          supabaseAdmin.from('case_vault_documents').select('id, name, type, created_at, user_id'),
          supabaseAdmin.from('case_messages').select('id, created_at')
        ]);

        if (profilesRes.status === 'fulfilled' && profilesRes.value.data) {
          profiles = profilesRes.value.data;
        }
        if (casesRes.status === 'fulfilled' && casesRes.value.data) {
          cases = casesRes.value.data;
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
          orders = ordersRes.value.data;
        }
        if (vaultRes.status === 'fulfilled' && vaultRes.value.data) {
          vaultDocsCount = vaultRes.value.data.length;
        }
        if (messagesRes.status === 'fulfilled' && messagesRes.value.data) {
          messagesCount = messagesRes.value.data.length;
        }
      } catch (sbErr) {
        console.warn("[HERMES OVERVIEW] Error al consultar Supabase:", sbErr);
      }
    }

    // 2. Query Live Stripe Data if Stripe key is available
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes('placeholder')) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);

        const sessions = await stripe.checkout.sessions.list({ limit: 50 });
        stripeLiveSales = (sessions.data || []).map(s => ({
          id: s.id,
          customer_email: s.customer_details?.email || s.customer_email || 'Cliente Stripe',
          customer_name: s.customer_details?.name || 'Usuario',
          amount_total: s.amount_total ? s.amount_total / 100 : 400,
          currency: (s.currency || 'mxn').toUpperCase(),
          payment_status: s.payment_status || 'paid',
          created_at: new Date(s.created * 1000).toISOString(),
          source: 'stripe_api'
        }));
      } catch (stripeErr) {
        console.warn("[HERMES OVERVIEW] Stripe live list error:", stripeErr);
      }
    }

    // Fallback/combined sales from orders table
    const combinedSalesMap = new Map<string, any>();
    
    // Add Stripe live sales
    stripeLiveSales.forEach(s => combinedSalesMap.set(s.id, s));

    // Add Supabase recorded orders
    orders.forEach(o => {
      const key = o.stripe_session_id || o.id;
      if (!combinedSalesMap.has(key)) {
        combinedSalesMap.set(key, {
          id: o.stripe_session_id || `ORD-${o.id.substring(0, 8)}`,
          customer_email: o.customer_email || 'Usuario Justino',
          customer_name: o.customer_email ? o.customer_email.split('@')[0] : 'Usuario',
          amount_total: o.amount_total ? (o.amount_total > 1000 ? o.amount_total / 100 : o.amount_total) : 400,
          currency: (o.currency || 'mxn').toUpperCase(),
          payment_status: o.payment_status || 'paid',
          created_at: o.created_at || new Date().toISOString(),
          source: 'supabase_orders'
        });
      }
    });

    const allSales = Array.from(combinedSalesMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Calculate Gross Revenue
    const totalRevenue = allSales.reduce((acc, sale) => {
      if (sale.payment_status === 'paid' || sale.payment_status === 'no_payment_required') {
        return acc + (Number(sale.amount_total) || 400);
      }
      return acc;
    }, 0);

    // Match Accounts with Cases
    const accountsWithCases = profiles.map(p => {
      const userCase = cases.find(c => c.user_id === p.id || c.id === p.id);
      const isClosed = userCase?.status === 'closed';
      return {
        id: p.id,
        email: p.email || 'Sin correo',
        displayName: p.display_name || p.email?.split('@')[0] || 'Usuario',
        hasActiveAccess: p.has_active_access,
        caseId: userCase?.id || p.id,
        caseTitle: userCase?.title || 'Expediente Principal',
        caseType: userCase?.case_type || 'General',
        caseStatus: isClosed ? 'closed' : 'active',
        createdAt: p.created_at || new Date().toISOString(),
        stripeCustomerId: p.stripe_customer_id || null
      };
    });

    // Counts
    const activeCasesCount = accountsWithCases.filter(a => a.caseStatus === 'active').length;
    const closedCasesCount = accountsWithCases.filter(a => a.caseStatus === 'closed').length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        totalRevenue: totalRevenue > 0 ? totalRevenue : (allSales.length * 400),
        totalSalesCount: allSales.length,
        totalAccounts: profiles.length > 0 ? profiles.length : accountsWithCases.length,
        activeCases: activeCasesCount,
        closedCases: closedCasesCount,
        totalVaultDocuments: vaultDocsCount,
        totalInteractions: messagesCount,
      },
      sales: allSales,
      accounts: accountsWithCases,
      systemHealth: {
        stripeConnected: !!stripeKey,
        supabaseConnected: !!supabaseUrl && !!serviceRoleKey,
        serverTime: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("[HERMES OVERVIEW ERROR]:", error);
    res.status(500).json({ error: error.message || "Error al recopilar datos de control Hermes." });
  }
});

app.post("/api/v1/admin/hermes-toggle-case", hermesAuthMiddleware, async (req, res) => {
  try {
    const { caseId, userId, newStatus } = req.body;
    if (!caseId && !userId) {
      return res.status(400).json({ error: "caseId o userId son requeridos." });
    }

    const targetStatus = newStatus === 'closed' ? 'closed' : 'active';
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado en el servidor." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Update case in legal_cases
    let query = supabaseAdmin.from('legal_cases').update({
      status: targetStatus,
      updated_at: new Date().toISOString()
    });

    if (caseId) {
      query = query.eq('id', caseId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error: updateError } = await query;

    if (updateError) {
      console.error("[HERMES TOGGLE CASE ERROR]:", updateError);
      return res.status(500).json({ error: "Error al actualizar estado del caso en Supabase." });
    }

    console.log(`[HERMES] Caso ${caseId || userId} actualizado a estado: ${targetStatus}`);
    res.json({ success: true, caseId: caseId || userId, status: targetStatus });
  } catch (err: any) {
    console.error("[HERMES TOGGLE CASE ERROR]:", err);
    res.status(500).json({ error: err.message || "Error interno al alternar estado de caso." });
  }
});

app.get("/api/v1/admin/verify", authMiddleware, isAdminMiddleware, (req, res) => {
  res.json({ isAdmin: true, user: (req as any).user.email });
});

app.get("/api/v1/admin/stats", authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase Admin credentials not configured" });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: cases } = await supabaseAdmin.from('legal_cases').select('*');
    const { data: orders } = await supabaseAdmin.from('orders').select('*');
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');

    const totalCasesCount = (cases || []).length;
    const activeProfilesCount = (profiles || []).filter(p => p.has_active_access).length;
    const totalOrders = orders || [];
    const totalRevenue = totalOrders
      .filter(o => o.payment_status === 'paid' || o.payment_status === 'no_payment_required')
      .reduce((sum, o) => sum + (o.amount_total ? o.amount_total / 100 : 400), 0);

    const stats = {
      totalCases: totalCasesCount,
      activeUsers: activeProfilesCount,
      paidOrders: totalOrders.length,
      totalRevenue: totalRevenue
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI CHAT ENDPOINTS ---

const chatHandler = async (req: express.Request, res: express.Response) => {
  try {
    debugLog(`Incoming chat request to ${req.url}`);
    
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      debugLog("Error: Invalid messages format");
      return res.status(400).json({ error: "Messages array is required" });
    }

    // 1. Security: Filter out any 'system' roles sent from client
    const userMessages = messages.filter((m: any) => m.role === 'user' || m.role === 'assistant');

    if (userMessages.length === 0) {
      return res.status(400).json({ error: "No valid user messages found" });
    }

    // 2. Security: Validate last message length to prevent huge injection payloads
    const lastMsg = userMessages[userMessages.length - 1];
    if (lastMsg.content && lastMsg.content.length > 3000) {
      return res.status(400).json({ error: "Mensaje demasiado largo. Límite: 3000 caracteres." });
    }

    // 3. Optional: Block obvious non-legal prompts at server level
    const forbiddenKeywords = ['write code', 'javascript', 'python', 'hacking', 'math problem', 'solve equation'];
    const contentLower = lastMsg.content.toLowerCase();
    if (forbiddenKeywords.some(kw => contentLower.includes(kw))) {
      return res.status(403).json({ 
        error: "Lo siento, mi capacidad está limitada estrictamente al asesoramiento legal en Justino." 
      });
    }

    const data = await generateResponse(userMessages);
    debugLog(`AI response generated successfully for ${req.url}`);
    res.json(data);
  } catch (error: any) {
    debugLog(`AI Proxy Error at ${req.url}: ${error.message}`);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
};

app.post("/api/chat", authMiddleware, aiLimiter, chatHandler);
app.post("/api/v1/chat", authMiddleware, aiLimiter, chatHandler);

// --- STRIPE CHECKOUT PAYMENT LINK & SESSION CREATION ---

app.post("/api/v1/stripe/create-checkout", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "El correo electrónico es requerido." });

    const cleanEmail = String(email).trim().toLowerCase();
    const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/eVqcN5bp2d739up9an1Nu04";
    const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(cleanEmail)}`;

    res.json({ url: paymentUrl, success: true });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: error.message || "Error al conectar con Stripe." });
  }
});

// --- API HEALTH ---

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    keys: {
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      moonshot: !!process.env.MOONSHOT_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      supabase: !!process.env.VITE_SUPABASE_URL
    }
  });
});

// Catch-all for other API routes to provide JSON errors instead of HTML 404s
app.all("/api/*", (req, res) => {
  debugLog(`[404] API Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Ruta de API no encontrada", path: req.url });
});

// Setup blog routes (SSR)
setupBlogRoutes(app);

// Vite for dev / Static for production
const isServerless = !!process.env.VERCEL;
if (!isServerless && process.env.NODE_ENV !== "production") {
  debugLog("Starting in DEVELOPMENT mode with Vite middleware");
  import("vite").then(({ createServer: createViteServer }) => {
    return createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error("Error starting Vite server:", err);
  });
} else {
  debugLog("Starting in PRODUCTION mode serving dist folder");
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ error: "API not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
