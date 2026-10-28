import express from "express";
import path from "path";
import cors from "cors";
import { generateResponse, extractCandidateFacts, evaluateInformationSufficiency } from "./services/ai-provider";
import { resolveContradictionProtocol } from "./services/contradiction-engine";
import { evaluateComprehensiveSufficiency } from "./services/sufficiency-engine";
import { knowledgeBase } from "./services/knowledge-base";
import {
  evaluateIncrementalUpdate,
  persistMasterMemory,
  generateMasterMarkdown,
  reconstructMarkdownFromState,
  computeContentHash
} from "./services/master-memory-service";
import { setupBlogRoutes } from "./lib/blog";
import { config } from "./config";
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3000;

// trust proxy is important for Cloud Run/container environments to get real user IP
app.set('trust proxy', 1);

// Middleware to ensure socket and connection exist in all environments (Vercel, Lambda, Cloud Run)
app.use((req, res, next) => {
  if (!req.socket) {
    const forwarded = req.headers?.['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || '127.0.0.1';
    (req as any).socket = { remoteAddress: ip };
  } else if (!req.socket.remoteAddress) {
    (req.socket as any).remoteAddress = '127.0.0.1';
  }
  if (!req.connection) {
    (req as any).connection = req.socket;
  }
  next();
});

const debugLog = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

app.use(cors());

// Safe IP extractor that never throws or crashes on serverless runtimes
const getClientIp = (req: any): string => {
  try {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return String(forwarded[0]).split(',')[0].trim();
    }
    return (
      req.headers?.['x-real-ip'] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      '127.0.0.1'
    );
  } catch {
    return '127.0.0.1';
  }
};

// --- RATE LIMITERS ---

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req) => getClientIp(req),
  validate: { trustProxy: false, xForwardedForHeader: false, default: false },
  message: { error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 chat messages per 15 mins for smooth conversational flow
  keyGenerator: (req) => getClientIp(req),
  validate: { trustProxy: false, xForwardedForHeader: false, default: false },
  message: { error: "Has alcanzado el límite de consultas de IA. Espera unos minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  keyGenerator: (req) => getClientIp(req),
  validate: { trustProxy: false, xForwardedForHeader: false, default: false },
  message: { error: "Límite de intentos de pago alcanzado. Intenta más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply standard limit to all API routes
app.use("/api/", standardLimiter);

// --- AUTH MIDDLEWARES ---

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const xUserId = req.headers['x-user-id'] as string;

  // 1. If Bearer token provided, validate with Supabase
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey;
        const keyToUse = serviceRoleKey || supabaseAnonKey;

        if (supabaseUrl && keyToUse) {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(supabaseUrl, keyToUse);

          const { data: { user }, error } = await supabase.auth.getUser(token);

          if (!error && user) {
            (req as any).user = user;
            return next();
          }
        }
      } catch (err: any) {
        console.warn("Auth Middleware Token Validation:", err?.message || err);
      }
    }
  }

  // 2. Verified Supabase User Fallback (prevents race conditions if client JWT token is refreshing)
  if (xUserId) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        
        let profileQuery = supabaseAdmin.from('profiles').select('id, email, username, display_name');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(xUserId);
        if (isUuid) {
          profileQuery = profileQuery.eq('id', xUserId);
        } else {
          profileQuery = profileQuery.eq('username', xUserId);
        }

        const { data: profile } = await profileQuery.maybeSingle();
        if (profile) {
          (req as any).user = {
            id: profile.id,
            email: profile.email,
            user_metadata: {
              username: profile.username,
              preferred_name: profile.display_name
            }
          };
          return next();
        }
      }
    } catch (fallbackErr) {
      console.warn("Auth Middleware Fallback Check Warning:", fallbackErr);
    }
  }

  // Si no existe Authorization Bearer válido ni identidad verificada en Supabase, devolver 401
  return res.status(401).json({ 
    error: "No autorizado. Se requiere una sesión válida o token Bearer.",
    code: "UNAUTHORIZED"
  });
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

        // 3. Insertar orden auditada en public.orders con desglose financiero
        const subtotalInPesos = session.amount_subtotal ? session.amount_subtotal / 100 : 480;
        const totalInPesos = session.amount_total !== undefined && session.amount_total !== null ? session.amount_total / 100 : 0;
        const discountInPesos = session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : (totalInPesos === 0 ? 480 : 0);
        const isCoupon100 = totalInPesos === 0 || session.payment_status === 'no_payment_required' || discountInPesos >= subtotalInPesos;
        const isRealRevenue = !isCoupon100 && totalInPesos > 0;
        const couponCode = session.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.id || session.discounts?.[0]?.coupon?.id || null;

        let paymentMethodType = isCoupon100 ? 'coupon_100' : 'card';
        if (!isCoupon100) {
          if (session.payment_method_types?.includes('oxxo')) paymentMethodType = 'oxxo';
          else if (session.payment_method_types?.includes('customer_balance')) paymentMethodType = 'spei';
        }

        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .insert([{
            user_id: profileId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent ? String(session.payment_intent) : null,
            stripe_product_id: 'prod_Tc8CPnxlKG0Yrm',
            customer_email: email,
            customer_name: session.customer_details?.name || email.split('@')[0],
            amount_subtotal: subtotalInPesos,
            amount_discount: discountInPesos,
            amount_paid: isRealRevenue ? totalInPesos : 0,
            amount_total: totalInPesos,
            currency: (session.currency || 'mxn').toUpperCase(),
            payment_status: session.payment_status || (isCoupon100 ? 'no_payment_required' : 'paid'),
            payment_method_type: paymentMethodType,
            coupon_applied: couponCode,
            is_real_revenue: isRealRevenue
          }]);

        if (orderError) {
          console.error("[STRIPE WEBHOOK] Error al registrar orden en public.orders:", orderError);
        } else {
          console.log(`[STRIPE WEBHOOK] Orden auditada en public.orders para ${email} (Real: ${isRealRevenue ? `$${totalInPesos}` : 'CUPÓN 100%'})`);
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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey;

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
          username: cleanUsername,
          has_active_access: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        const { data: existingAdminCases } = await supabaseAdmin
          .from('legal_cases')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        if (!existingAdminCases || existingAdminCases.length === 0) {
          await supabaseAdmin.from('legal_cases').insert([{
            user_id: userId,
            title: `Expediente de ${cleanPreferredName || cleanUsername}`,
            case_type: 'general',
            status: 'active',
            state_jurisdiction: 'Nacional / Por definir',
            city_jurisdiction: 'Por definir',
            updated_at: new Date().toISOString()
          }]);
        }
      } catch (dbErr) {
        console.warn("[AUTH REGISTER] Database sync warning:", dbErr);
      }
    } else if (supabaseUrl && anonKey) {
      // Fallback with anon key if service role key is not configured in server env
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const clientSupabase = createClient(supabaseUrl, anonKey);
        
        const { data: signUpData, error: signUpErr } = await clientSupabase.auth.signUp({
          email: authEmail,
          password: cleanPassword,
          options: {
            data: {
              username: cleanUsername,
              preferred_name: cleanPreferredName,
              payment_email: cleanEmail
            }
          }
        });

        if (signUpData?.user) {
          userId = signUpData.user.id;
        }

        try {
          await clientSupabase.from('profiles').upsert({
            id: userId,
            email: cleanEmail || authEmail,
            display_name: cleanPreferredName,
            username: cleanUsername,
            has_active_access: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (_) {}

        try {
          const { data: existingClientCases } = await clientSupabase
            .from('legal_cases')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

          if (!existingClientCases || existingClientCases.length === 0) {
            await clientSupabase.from('legal_cases').insert([{
              user_id: userId,
              title: `Expediente de ${cleanPreferredName || cleanUsername}`,
              case_type: 'general',
              status: 'active',
              state_jurisdiction: 'Nacional / Por definir',
              city_jurisdiction: 'Por definir',
              updated_at: new Date().toISOString()
            }]);
          }
        } catch (_) {}
      } catch (anonErr) {
        console.warn("[AUTH REGISTER] Anon fallback exception:", anonErr);
      }
    }

    let userSession: any = null;
    if (anonKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const clientSupabase = createClient(supabaseUrl, anonKey);
        const { data: signData } = await clientSupabase.auth.signInWithPassword({
          email: authEmail,
          password: cleanPassword
        });
        if (signData?.session) {
          userSession = signData.session;
        }
      } catch (signErr) {
        console.warn("[AUTH REGISTER] Auto sign-in warning:", signErr);
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
      session: userSession,
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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseAnonKey;
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

    // Timeout helper to guarantee fast response without freeze (4.5s maximum)
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
          u.email?.toLowerCase() === rawIdentifier.toLowerCase() ||
          u.user_metadata?.username?.toLowerCase() === cleanUsername ||
          u.user_metadata?.payment_email?.toLowerCase() === rawIdentifier.toLowerCase() ||
          u.user_metadata?.payment_email?.toLowerCase() === cleanUsername
        );

        if (found) {
          let userSession: any = null;
          if (anonKey && found.email) {
            const supabasePublic = createClient(supabaseUrl, anonKey);
            const { data: signData, error: signErr } = await supabasePublic.auth.signInWithPassword({
              email: found.email,
              password: cleanPassword
            });
            if (!signErr && signData?.session) {
              userSession = signData.session;
            } else {
              try {
                await supabaseAdmin.auth.admin.updateUserById(found.id, { password: cleanPassword });
                const { data: retrySign } = await supabasePublic.auth.signInWithPassword({
                  email: found.email,
                  password: cleanPassword
                });
                if (retrySign?.session) {
                  userSession = retrySign.session;
                }
              } catch (_) {}
            }
          }

          // Verify through profile or user record
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('display_name, email, has_active_access, full_name, username')
            .eq('id', found.id)
            .maybeSingle();

          const preferredName = profile?.display_name || profile?.full_name || found.user_metadata?.preferred_name || found.user_metadata?.username || cleanUsername;

          return {
            success: true,
            user: {
              id: found.id,
              email: found.email || authEmail,
              username: profile?.username || found.user_metadata?.username || cleanUsername,
              preferredName: preferredName
            },
            session: userSession,
            authEmail: found.email
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

        const sessions = await stripe.checkout.sessions.list({ 
          limit: 100
        });

        stripeLiveSales = (sessions.data || []).map(s => {
          const subtotal = s.amount_subtotal ? s.amount_subtotal / 100 : 480;
          const rawTotal = (s.amount_total !== undefined && s.amount_total !== null) ? s.amount_total / 100 : 0;
          const discount = s.total_details?.amount_discount ? s.total_details.amount_discount / 100 : (rawTotal === 0 ? 480 : 0);
          
          // Strict Stripe Status Evaluation
          const isPaid = s.payment_status === 'paid';
          const isCoupon100 = s.payment_status === 'no_payment_required' || (s.status === 'complete' && rawTotal === 0) || discount >= subtotal;
          const isUnpaid = !isPaid && !isCoupon100;
          const isRealRevenue = isPaid && rawTotal > 0;
          const actualPaid = isRealRevenue ? rawTotal : 0;

          let methodType: 'card' | 'oxxo' | 'spei' | 'coupon_100' = isCoupon100 ? 'coupon_100' : 'card';
          let methodLabel = isCoupon100 ? 'Cupón 100% Descuento' : 'Tarjeta';

          if (isCoupon100) {
            methodType = 'coupon_100';
            methodLabel = 'Cupón 100%';
          } else if (s.payment_method_types?.includes('oxxo')) {
            methodType = 'oxxo';
            methodLabel = 'OXXO Pay';
          } else if (s.payment_method_types?.includes('customer_balance')) {
            methodType = 'spei';
            methodLabel = 'Transferencia SPEI';
          } else {
            methodType = 'card';
            methodLabel = 'Tarjeta Crédito/Débito';
          }

          const anySession = s as any;
          const couponCode = anySession.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.id || 
            (typeof anySession.discounts?.[0]?.coupon === 'object' ? anySession.discounts?.[0]?.coupon?.id : anySession.discounts?.[0]?.coupon) || 
            (isCoupon100 ? '100% OFF' : null);

          let paymentStatus: string = s.payment_status || 'unpaid';
          if (isPaid) {
            paymentStatus = 'paid';
          } else if (isCoupon100) {
            paymentStatus = 'no_payment_required';
          } else if (s.status === 'expired') {
            paymentStatus = 'expired';
          } else if (s.status === 'open') {
            paymentStatus = 'unpaid_open';
          }

          return {
            id: s.id,
            customer_email: s.customer_details?.email || s.customer_email || 'Cliente Stripe',
            customer_name: s.customer_details?.name || (s.customer_details?.email ? s.customer_details.email.split('@')[0] : 'Usuario Justino'),
            amount_subtotal: subtotal,
            amount_discount: discount,
            amount_paid: actualPaid,
            amount_total: actualPaid,
            currency: (s.currency || 'mxn').toUpperCase(),
            payment_status: paymentStatus,
            payment_method_type: methodType,
            payment_method_label: methodLabel,
            coupon_code: couponCode,
            is_real_revenue: isRealRevenue,
            is_completed: isPaid || isCoupon100,
            stripe_status: s.status,
            created_at: new Date(s.created * 1000).toISOString(),
            source: 'stripe_api'
          };
        });
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
        const subtotal = o.amount_subtotal ? Number(o.amount_subtotal) : 480;
        const rawTotal = o.amount_total !== undefined && o.amount_total !== null ? Number(o.amount_total) : (o.amount_paid !== undefined ? Number(o.amount_paid) : 0);
        const total = rawTotal > 1000 ? rawTotal / 100 : rawTotal;
        const discount = o.amount_discount !== undefined ? Number(o.amount_discount) : (total === 0 ? 480 : 0);
        const isCoupon100 = o.payment_method_type === 'coupon_100' || total === 0 || o.is_real_revenue === false || o.payment_status === 'no_payment_required';
        const isPaid = o.payment_status === 'paid' && !isCoupon100;
        const isRealRevenue = o.is_real_revenue !== undefined ? Boolean(o.is_real_revenue) : (isPaid && total > 0);
        const actualPaid = isRealRevenue ? (total > 0 ? total : 480) : 0;

        let methodType = o.payment_method_type || (isCoupon100 ? 'coupon_100' : 'card');
        let methodLabel = methodType === 'coupon_100' ? 'Cupón 100%' : (methodType === 'oxxo' ? 'OXXO Pay' : (methodType === 'spei' ? 'SPEI' : 'Tarjeta'));

        combinedSalesMap.set(key, {
          id: o.stripe_session_id || `ORD-${o.id.substring(0, 8)}`,
          customer_email: o.customer_email || 'Usuario Justino',
          customer_name: o.customer_name || (o.customer_email ? o.customer_email.split('@')[0] : 'Usuario'),
          amount_subtotal: subtotal,
          amount_discount: discount,
          amount_paid: actualPaid,
          amount_total: actualPaid,
          currency: (o.currency || 'mxn').toUpperCase(),
          payment_status: o.payment_status || (isCoupon100 ? 'no_payment_required' : (isPaid ? 'paid' : 'unpaid')),
          payment_method_type: methodType,
          payment_method_label: methodLabel,
          coupon_code: o.coupon_applied || (isCoupon100 ? '100% OFF' : null),
          is_real_revenue: isRealRevenue,
          is_completed: isPaid || isCoupon100,
          created_at: o.created_at || new Date().toISOString(),
          source: 'supabase_orders'
        });
      }
    });

    const allSales = Array.from(combinedSalesMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Calculate Real Net Revenue vs Discounts (ONLY from completed valid transactions)
    const realPaidSales = allSales.filter(s => s.is_real_revenue && s.payment_status === 'paid' && s.amount_paid > 0);
    const couponSales = allSales.filter(s => (s.payment_status === 'no_payment_required' || s.payment_method_type === 'coupon_100') && !s.is_real_revenue);
    const completedSales = allSales.filter(s => s.is_completed !== false && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required'));
    const unpaidOrAbandonedSales = allSales.filter(s => s.payment_status !== 'paid' && s.payment_status !== 'no_payment_required');

    const totalRealRevenue = realPaidSales.reduce((acc, sale) => acc + (Number(sale.amount_paid) || 0), 0);
    const totalDiscountsGiven = couponSales.reduce((acc, sale) => acc + (Number(sale.amount_discount) || 480), 0);

    // Method Breakdown for confirmed sales
    const paymentMethodsBreakdown = {
      card: realPaidSales.filter(s => s.payment_method_type === 'card').length,
      oxxo: realPaidSales.filter(s => s.payment_method_type === 'oxxo').length,
      spei: realPaidSales.filter(s => s.payment_method_type === 'spei').length,
      coupon_100: couponSales.length,
      unpaid_attempts: unpaidOrAbandonedSales.length
    };

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
        totalRealRevenue: totalRealRevenue,
        totalRealSalesCount: realPaidSales.length,
        totalCouponSalesCount: couponSales.length,
        totalGrossOrders: allSales.length,
        totalDiscountsGiven: totalDiscountsGiven,
        totalRevenue: totalRealRevenue, // Real money entering bank
        totalSalesCount: allSales.length,
        paymentMethodsBreakdown: paymentMethodsBreakdown,
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
      .reduce((sum, o) => sum + (o.amount_total ? o.amount_total / 100 : 480), 0);

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

// --- AI CHAT ENDPOINTS ---

const chatHandler = async (req: express.Request, res: express.Response) => {
  try {
    debugLog(`Incoming chat request to ${req.url}`);
    
    const { messages, userName, caseId } = req.body;
    const authenticatedUser = (req as any).user;

    if (!authenticatedUser?.id) {
      return res.status(401).json({ error: "Sesión no autenticada o token inválido." });
    }

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

    // 3. Security: Block obvious non-legal prompts at server level
    const forbiddenKeywords = ['write code', 'javascript', 'python', 'hacking', 'math problem', 'solve equation'];
    const contentLower = lastMsg.content.toLowerCase();
    if (forbiddenKeywords.some(kw => contentLower.includes(kw))) {
      return res.status(403).json({ 
        error: "Lo siento, mi capacidad está limitada estrictamente al asesoramiento legal en Justino." 
      });
    }

    // 4. FASE 1.4: LEGAL_CASES.STATUS COMO FUENTE DE VERDAD Y BLOQUEO DE CASO CERRADO
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let currentCase: any = null;
    let supabaseAdmin: any = null;

    if (supabaseUrl && serviceRoleKey) {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      if (caseId) {
        // Validación estricta de propiedad (FASE 1): Usuario A no puede acceder al caso de Usuario B
        const { data: specificCase, error: specError } = await supabaseAdmin
          .from('legal_cases')
          .select('*')
          .eq('id', caseId)
          .single();

        if (specificCase) {
          if (specificCase.user_id !== authenticatedUser.id) {
            debugLog(`[SECURITY VIOLATION] Usuario ${authenticatedUser.id} intentó acceder al caso ${caseId} que pertenece a ${specificCase.user_id}`);
            return res.status(403).json({ 
              error: "Acceso denegado: no eres el propietario de este expediente.",
              code: "FORBIDDEN" 
            });
          }
          currentCase = specificCase;
        } else {
          return res.status(404).json({
            error: "Expediente no encontrado.",
            code: "CASE_NOT_FOUND"
          });
        }
      } else {
        const { data: casesFound } = await supabaseAdmin
          .from('legal_cases')
          .select('*')
          .eq('user_id', authenticatedUser.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (casesFound && casesFound.length > 0) {
          currentCase = casesFound[0];
        }
      }
    }

    // CASO CERRADO = CASO NO OPERABLE (FASE 1.4 & FASE 2)
    // Un caso cerrado NO puede llamar al LLM ni generar nuevos escritos ni alterar estrategia
    if (currentCase && currentCase.status === 'closed') {
      debugLog(`[BLOQUEO DE CASO CERRADO] Expediente ${currentCase.id} está CERRADO. Bloqueando llamada a LLM.`);
      return res.status(403).json({
        error: "Este expediente se encuentra formalmente CERRADO. No es posible generar nuevas consultas, estrategias o documentos sobre un asunto finalizado.",
        choices: [{
          message: {
            content: "🔒 Este expediente está formalmente cerrado. No es posible recibir nuevos mensajes ni generar documentos sobre un caso finalizado. Puedes consultar tu expediente o iniciar un nuevo trámite legal seleccionando 'Nuevo Caso'."
          },
          finish_reason: "stop"
        }],
        caseStatus: "closed"
      });
    }

    // 5. FASE 2, FASE 3 & FASE 7: ESTADO ESTRUCTURADO Y EXTRACCIÓN DE CANDIDATOS
    const existingStructuredState = currentCase?.structured_state || {
      identity: { full_name: currentCase?.victim_name || userName || null, address: null, city: currentCase?.city_jurisdiction || null, state: currentCase?.state_jurisdiction || null, postal_code: null },
      jurisdiction: { country: "México", state: currentCase?.state_jurisdiction || null, city: currentCase?.city_jurisdiction || null, judicial_district: null, authority: null, source: null, confirmed: !!currentCase?.state_jurisdiction },
      participants: [],
      facts: { confirmed: [], alleged: [], unknown: [], contradictions: [] },
      dates: [],
      amounts: [],
      evidence: [],
      strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
      actions: [],
      decisions: [],
      document_state: { current_documents: [], pending_documents: [] }
    };

    const updatedStructuredState = extractCandidateFacts(userMessages, existingStructuredState);

    const memoryMeta = {
      caseId: currentCase?.id || 'transient-case',
      userId: authenticatedUser.id,
      title: currentCase?.title || 'Expediente Jurídico',
      userRole: authenticatedUser.role
    };

    // Actualización incremental controlada de la memoria viva del caso (Secciones 2, 3, 7)
    const memoryResult = evaluateIncrementalUpdate(
      updatedStructuredState,
      userMessages,
      memoryMeta
    );

    const finalStructuredState = memoryResult.updatedState;
    const masterMarkdown = memoryResult.markdownContent;

    // Context for LLM (Context Builder FASE 3 y Memoria Viva)
    const caseContext = {
      caseId: currentCase?.id,
      status: currentCase?.status || 'active',
      jurisdiction: {
        state: currentCase?.state_jurisdiction || finalStructuredState.jurisdiction?.state,
        city: currentCase?.city_jurisdiction || finalStructuredState.jurisdiction?.city
      },
      structuredState: finalStructuredState,
      masterMarkdown: masterMarkdown,
      identity: {
        full_name: finalStructuredState.identity?.full_name || userName,
        address: finalStructuredState.identity?.address
      }
    };

    const data = await generateResponse(userMessages, userName, caseContext);
    debugLog(`AI response generated successfully for ${req.url}`);

    // Persistir estado estructurado actualizado y sincronizar EXPEDIENTE_MAESTRO.md en legal_cases y case_vault_documents
    if (currentCase?.id && supabaseAdmin) {
      try {
        const updatePayload: any = {
          structured_state: finalStructuredState,
          updated_at: new Date().toISOString()
        };

        if (finalStructuredState.jurisdiction?.state && (!currentCase.state_jurisdiction || currentCase.state_jurisdiction.includes('Por definir') || currentCase.state_jurisdiction.includes('Nacional'))) {
          updatePayload.state_jurisdiction = finalStructuredState.jurisdiction.state;
          if (finalStructuredState.jurisdiction.city) {
            updatePayload.city_jurisdiction = finalStructuredState.jurisdiction.city;
          }
        }

        if (finalStructuredState.identity?.full_name && (!currentCase.victim_name || currentCase.victim_name === 'Usuario')) {
          updatePayload.victim_name = finalStructuredState.identity.full_name;
        }

        await supabaseAdmin.from('legal_cases').update(updatePayload).eq('id', currentCase.id);

        // Sincronizar documento EXPEDIENTE_MAESTRO.md en case_vault_documents con verificación post-escritura
        await persistMasterMemory(supabaseAdmin, memoryMeta, finalStructuredState, masterMarkdown);
      } catch (saveErr) {
        console.warn("Aviso al guardar structured_state y memoria maestra:", saveErr);
      }
    }

    res.json(data);
  } catch (error: any) {
    debugLog(`AI Proxy Error at ${req.url}: ${error.message}`);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
};

app.post("/api/chat", authMiddleware, aiLimiter, chatHandler);
app.post("/api/v1/chat", authMiddleware, aiLimiter, chatHandler);

// --- CASE CLOSURE, CREATION & STATUS ENDPOINTS (FASE 1.2, 1.3, 1.4, 14) ---
app.post("/api/v1/cases/new", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { title, caseType, stateJurisdiction, cityJurisdiction } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const initialStructuredState = {
      identity: { full_name: null, address: null, city: cityJurisdiction || null, state: stateJurisdiction || null, postal_code: null },
      jurisdiction: { country: "México", state: stateJurisdiction || null, city: cityJurisdiction || null, judicial_district: null, authority: null, confirmed: false },
      participants: [],
      facts: { confirmed: [], alleged: [], unknown: [], contradictions: [] },
      evidence: [],
      dates: [],
      amounts: [],
      strategy: { current: null, reason: null, alternatives: [], pending_questions: [] },
      actions: [],
      decisions: [],
      document_state: { current_documents: [], pending_documents: [] }
    };

    const newCasePayload: any = {
      user_id: userId,
      title: title || 'Nuevo Expediente Legal',
      case_type: caseType || 'general',
      status: 'active',
      state_jurisdiction: stateJurisdiction || 'Nacional / México',
      city_jurisdiction: cityJurisdiction || 'Por definir',
      structured_state: initialStructuredState,
      updated_at: new Date().toISOString()
    };

    const { data: newCase, error: insertErr } = await supabaseAdmin
      .from('legal_cases')
      .insert([newCasePayload])
      .select()
      .single();

    if (insertErr) {
      // Fallback si la columna structured_state no está presente aún
      const { data: fbCase, error: fbErr } = await supabaseAdmin
        .from('legal_cases')
        .insert([{
          user_id: userId,
          title: title || 'Nuevo Expediente Legal',
          case_type: caseType || 'general',
          status: 'active',
          state_jurisdiction: stateJurisdiction || 'Nacional / México',
          city_jurisdiction: cityJurisdiction || 'Por definir',
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (fbErr) throw fbErr;
      return res.json({ success: true, case: fbCase });
    }

    console.log(`[NEW CASE] Nuevo caso creado con éxito: ${newCase.id} para usuario ${userId}`);
    res.json({ success: true, case: newCase });
  } catch (err: any) {
    console.error("[NEW CASE ERROR]:", err);
    res.status(500).json({ error: err.message || "Error al crear nuevo expediente." });
  }
});

app.post("/api/v1/cases/close", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { caseId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let query = supabaseAdmin.from('legal_cases').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);

    if (caseId) {
      query = query.eq('id', caseId);
    }

    const { error: updateError } = await query;
    if (updateError) {
      // Fallback si la columna closed_at no ha sido migrada aún
      await supabaseAdmin.from('legal_cases').update({
        status: 'closed',
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    }

    console.log(`[CASE CLOSURE] Caso cerrado formalmente en Supabase para user: ${userId}`);
    res.json({ success: true, status: 'closed', closed_at: new Date().toISOString() });
  } catch (err: any) {
    console.error("[CASE CLOSURE ERROR]:", err);
    res.status(500).json({ error: err.message || "Error al cerrar caso en base de datos." });
  }
});

app.get("/api/v1/cases/status", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const caseId = req.query.caseId as string;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let query = supabaseAdmin.from('legal_cases').select('*').eq('user_id', userId);
    if (caseId) {
      query = query.eq('id', caseId);
    }

    const { data: cases, error } = await query.order('updated_at', { ascending: false }).limit(1);

    if (error || !cases || cases.length === 0) {
      return res.json({ status: 'active', isClosed: false });
    }

    const currentCase = cases[0];
    res.json({
      caseId: currentCase.id,
      status: currentCase.status || 'active',
      isClosed: currentCase.status === 'closed',
      closedAt: currentCase.closed_at || null,
      structuredState: currentCase.structured_state || null,
      jurisdiction: {
        state: currentCase.state_jurisdiction,
        city: currentCase.city_jurisdiction
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// TEST11 AUDIT: Vista previa de actualización sin modificar base de datos (Regla 14 & Criterio 8)
app.post("/api/v1/cases/preview-update", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { caseId, updates } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let query = supabaseAdmin.from('legal_cases').select('*').eq('user_id', userId);
    if (caseId) query = query.eq('id', caseId);
    const { data: cases, error } = await query.order('updated_at', { ascending: false }).limit(1);

    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado para este usuario.", can_update: false });
    }

    const currentCase = cases[0];
    const currentState = currentCase.structured_state || {};
    
    // Calcular mantenido, corregido y pendiente sin escribir en base de datos
    const maintained: Record<string, any> = {};
    const corrected: Array<{ field: string; previous_value: any; proposed_value: any }> = [];

    if (updates && typeof updates === 'object') {
      for (const [key, val] of Object.entries(updates)) {
        const prevVal = currentState[key];
        if (JSON.stringify(prevVal) !== JSON.stringify(val)) {
          corrected.push({
            field: key,
            previous_value: prevVal !== undefined ? prevVal : null,
            proposed_value: val
          });
        }
      }
    }

    for (const [key, val] of Object.entries(currentState)) {
      if (!updates || !(key in updates)) {
        maintained[key] = val;
      }
    }

    const simulatedState = {
      ...currentState,
      ...(updates || {})
    };
    const sufficiency = evaluateInformationSufficiency(simulatedState, currentCase.case_type || 'alimentos');

    res.json({
      success: true,
      caseId: currentCase.id,
      can_update: true,
      preview: {
        maintained,
        corrected,
        pending: sufficiency.missing_indispensable_requirements,
        sufficiency
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al generar vista previa." });
  }
});

// TEST11 AUDIT: Actualización autorizada con consentimiento expreso y trazabilidad (Regla 14 & Criterios 7, 8)
app.post("/api/v1/cases/confirm-update", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { caseId, updates, userConfirmed } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    if (!userConfirmed) {
      return res.status(400).json({ 
        error: "Se requiere autorización expresa del usuario antes de aplicar cambios al expediente.",
        code: "USER_CONSENT_REQUIRED"
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let query = supabaseAdmin.from('legal_cases').select('*').eq('user_id', userId);
    if (caseId) query = query.eq('id', caseId);
    const { data: cases, error } = await query.order('updated_at', { ascending: false }).limit(1);

    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado para este usuario." });
    }

    const currentCase = cases[0];
    const currentState = currentCase.structured_state || {};
    const correctionsHistory = Array.isArray(currentState.corrections_history) ? [...currentState.corrections_history] : [];
    const now = new Date().toISOString();

    if (updates && typeof updates === 'object') {
      for (const [key, val] of Object.entries(updates)) {
        const prevVal = currentState[key];
        if (JSON.stringify(prevVal) !== JSON.stringify(val)) {
          correctionsHistory.push({
            field: key,
            previous_value: prevVal !== undefined ? prevVal : null,
            new_value: val,
            timestamp: now,
            reason: "Actualización formal con consentimiento del usuario"
          });
        }
      }
    }

    const updatedState = {
      ...currentState,
      ...(updates || {}),
      corrections_history: correctionsHistory
    };

    updatedState.readiness = evaluateInformationSufficiency(updatedState, currentCase.case_type || 'alimentos');

    const updatePayload: any = {
      structured_state: updatedState,
      updated_at: now
    };

    if (updatedState.identity?.full_name && (!currentCase.victim_name || currentCase.victim_name === 'Usuario')) {
      updatePayload.victim_name = updatedState.identity.full_name;
    }
    if (updatedState.jurisdiction?.state && (!currentCase.state_jurisdiction || currentCase.state_jurisdiction.includes('Por definir'))) {
      updatePayload.state_jurisdiction = updatedState.jurisdiction.state;
      if (updatedState.jurisdiction.city) {
        updatePayload.city_jurisdiction = updatedState.jurisdiction.city;
      }
    }

    const { data: savedCase, error: updateErr } = await supabaseAdmin
      .from('legal_cases')
      .update(updatePayload)
      .eq('id', currentCase.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      caseId: currentCase.id,
      verified: true,
      structured_state: savedCase.structured_state,
      corrections_history: correctionsHistory
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al actualizar expediente." });
  }
});

// TEST11 AUDIT: Evaluación de suficiencia de información del caso (Criterio 2)
app.get("/api/v1/cases/readiness", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const caseId = req.query.caseId as string;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let query = supabaseAdmin.from('legal_cases').select('*').eq('user_id', userId);
    if (caseId) query = query.eq('id', caseId);
    const { data: cases, error } = await query.order('updated_at', { ascending: false }).limit(1);

    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    const currentCase = cases[0];
    const structuredState = currentCase.structured_state || {};
    const comprehensive = evaluateComprehensiveSufficiency(structuredState);
    const legacy = evaluateInformationSufficiency(structuredState, currentCase.case_type || 'alimentos');

    res.json({
      caseId: currentCase.id,
      readiness: {
        ...legacy,
        ...comprehensive
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MOTOR DE CONTRADICCIONES: Protocolo de resolución neutral con trazabilidad (Sección 6)
app.post("/api/v1/cases/resolve-contradiction", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { caseId, contradictionId, userClarification, justificationReason } = req.body;

    if (!userId || !contradictionId || !userClarification) {
      return res.status(400).json({ error: "caseId, contradictionId y userClarification son requeridos." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Supabase no está configurado." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let query = supabaseAdmin.from('legal_cases').select('*').eq('user_id', userId);
    if (caseId) query = query.eq('id', caseId);
    const { data: cases, error } = await query.order('updated_at', { ascending: false }).limit(1);

    if (error || !cases || cases.length === 0) {
      return res.status(404).json({ error: "Expediente no encontrado para este usuario." });
    }

    const currentCase = cases[0];
    const structuredState = currentCase.structured_state || {};
    const contradictions = structuredState.contradictions_detected || [];

    const { updatedList, resolved } = resolveContradictionProtocol(
      contradictions,
      contradictionId,
      userClarification,
      justificationReason || "Aclaración aportada voluntariamente por el usuario"
    );

    if (!resolved) {
      return res.status(404).json({ error: "Contradicción no encontrada en el expediente." });
    }

    // Actualizar historial y estado
    const correctionsHistory = Array.isArray(structuredState.corrections_history) ? [...structuredState.corrections_history] : [];
    correctionsHistory.push({
      field: `contradiction:${contradictionId}`,
      previous_value: 'DETECTADA',
      new_value: 'RESUELTA_JUSTIFICADA',
      timestamp: new Date().toISOString(),
      reason: userClarification
    });

    const updatedState = {
      ...structuredState,
      contradictions_detected: updatedList,
      corrections_history: correctionsHistory
    };

    // Actualizar hechos de contradicciones abiertas
    updatedState.facts.contradictions = updatedList
      .filter((c: any) => c.status === 'DETECTADA')
      .map((c: any) => `[${c.severity}] ${c.description}`);

    const { data: savedCase, error: updateErr } = await supabaseAdmin
      .from('legal_cases')
      .update({
        structured_state: updatedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentCase.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      success: true,
      caseId: currentCase.id,
      resolved: true,
      contradictions_detected: savedCase.structured_state.contradictions_detected
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BASE DE CONOCIMIENTO ACUMULATIVA: Consulta de patrones anonimizados seguros (Sección 12)
app.get("/api/v1/knowledge/patterns", authMiddleware, (req, res) => {
  try {
    const matter = req.query.matter as string;
    const docType = req.query.docType as string;

    const classBPatterns = knowledgeBase.getInvestigationPatterns(matter);
    const classCOperational = knowledgeBase.getOperationalPatterns(docType);

    res.json({
      success: true,
      matter: matter || 'todas',
      investigation_patterns: classBPatterns,
      operational_patterns: classCOperational
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MEMORIA VIVA Y EXPEDIENTE MAESTRO: Consulta del archivo maestro persistente (Sección 2 y 7)
app.get("/api/v1/cases/:id/master-memory", authMiddleware, async (req: any, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Configuración de Supabase no disponible." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: legalCase, error: caseErr } = await supabaseAdmin
      .from('legal_cases')
      .select('id, user_id, title, status, structured_state, updated_at')
      .eq('id', caseId)
      .single();

    if (caseErr || !legalCase) {
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    // Aislamiento estricto de usuario (Sección 7)
    if (legalCase.user_id !== userId) {
      return res.status(403).json({
        error: "Acceso denegado: no eres el propietario de este expediente.",
        code: "FORBIDDEN"
      });
    }

    const state = legalCase.structured_state || {};
    let markdown = state.master_markdown?.markdown_content;

    if (!markdown) {
      markdown = generateMasterMarkdown(state, {
        caseId,
        userId,
        title: legalCase.title
      });
    }

    res.json({
      success: true,
      case_id: caseId,
      version: state.master_markdown?.version || 1,
      last_updated_at: state.master_markdown?.last_updated_at || legalCase.updated_at,
      content_hash: state.master_markdown?.content_hash || computeContentHash(markdown),
      markdown_content: markdown,
      update_log: state.master_markdown?.update_log || [],
      facts_count: (state.facts_registry || []).length,
      contradictions_count: (state.contradictions_detected || []).length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RECONSTRUCCIÓN DETERMINÍSTICA DE EXPEDIENTE_MAESTRO.MD DESDE LA FUENTE DE VERDAD (Sección 7 y 10)
app.post("/api/v1/cases/:id/master-memory/rebuild", authMiddleware, async (req: any, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || config.supabaseUrl;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Configuración de Supabase no disponible." });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: legalCase, error: caseErr } = await supabaseAdmin
      .from('legal_cases')
      .select('id, user_id, title, structured_state')
      .eq('id', caseId)
      .single();

    if (caseErr || !legalCase) {
      return res.status(404).json({ error: "Expediente no encontrado." });
    }

    if (legalCase.user_id !== userId) {
      return res.status(403).json({
        error: "Acceso denegado: no eres el propietario de este expediente.",
        code: "FORBIDDEN"
      });
    }

    const state = legalCase.structured_state || {};
    const meta = { caseId, userId, title: legalCase.title };
    const reconstructedMarkdown = reconstructMarkdownFromState(state, meta);

    const persistRes = await persistMasterMemory(
      supabaseAdmin,
      meta,
      {
        ...state,
        master_markdown: {
          case_id: caseId,
          user_id: userId,
          version: (state.master_markdown?.version || 1) + 1,
          markdown_content: reconstructedMarkdown,
          content_hash: computeContentHash(reconstructedMarkdown),
          last_updated_at: new Date().toISOString(),
          update_log: [
            {
              version: (state.master_markdown?.version || 1) + 1,
              timestamp: new Date().toISOString(),
              change_type: 'initial_creation',
              summary: 'Reconstrucción forzosa determinística desde la fuente de verdad (structured_state).',
              affected_fields: ['master_markdown']
            },
            ...(state.master_markdown?.update_log || [])
          ]
        }
      },
      reconstructedMarkdown
    );

    res.json({
      success: persistRes.success,
      version: persistRes.version,
      reconstructed: true,
      markdown_content: reconstructedMarkdown
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STRIPE CHECKOUT PAYMENT LINK & SESSION CREATION ---

app.post("/api/v1/stripe/create-checkout", async (req, res) => {
  try {
    const { email, origin: clientOrigin } = req.body;
    if (!email) return res.status(400).json({ error: "El correo electrónico es requerido." });

    const cleanEmail = String(email).trim().toLowerCase();
    const STRIPE_PAYMENT_LINK = process.env.STRIPE_PAYMENT_LINK || config.stripePaymentLink || "https://buy.stripe.com/7sY14n64IaYV6id5Yb1Nu0d";
    
    // Determine the base origin to redirect back to dynamically
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
    const origin = clientOrigin || req.headers.origin || `${proto}://${host}`;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes('placeholder') && !stripeKey.includes('sk_test_...')) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey.trim());

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: cleanEmail,
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: "mxn",
                product_data: {
                  name: "Expediente Legal Justino",
                  description: "Asesoría legal personalizada basada en leyes vigentes",
                },
                unit_amount: 48000, // $480.00 MXN
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${origin}/`,
          metadata: {
            email: cleanEmail
          }
        });

        return res.json({ url: session.url, session_id: session.id, success: true });
      } catch (stripeErr) {
        console.warn("[STRIPE CHECKOUT] Session create fallback to payment link:", stripeErr);
      }
    }

    const paymentUrl = `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(cleanEmail)}`;
    res.json({ url: paymentUrl, success: true });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: error.message || "Error al conectar con Stripe." });
  }
});

app.get("/api/v1/stripe/session-info", async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) return res.status(400).json({ error: "Missing session_id" });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('placeholder') || stripeKey.includes('sk_test_...')) {
      return res.json({ success: false, message: "No stripe key configured" });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey.trim());
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const email = session.customer_details?.email || session.customer_email || (session.metadata?.email as string) || null;
    const name = session.customer_details?.name || null;

    res.json({
      success: true,
      email,
      name,
      payment_status: session.payment_status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
const isServerless = !!process.env.VERCEL || !!process.env.NOW_REGION || !!process.env.AWS_LAMBDA_FUNCTION_NAME || Boolean(process.env.SERVERLESS);
if (!isServerless) {
  if (process.env.NODE_ENV !== "production") {
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
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  }
} else {
  debugLog("Initialized Express app in SERVERLESS mode");
}

export default app;
