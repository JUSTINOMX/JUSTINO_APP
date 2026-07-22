import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { generateResponse } from "./services/ai-provider";
import { setupBlogRoutes } from "./lib/blog";

import fs from "fs";

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
    max: 5, // 5 payment attempts per hour
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
      return res.status(401).json({ error: "No autorizado. Token faltante." });
    }

    const token = authHeader.split(' ')[1];
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Sesión inválida o expirada." });
      }

      (req as any).user = user;
      next();
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      res.status(401).json({ error: "Error de autenticación." });
    }
  };

  const isAdminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    
    // Lista Blanca de Administradores (Source of Truth en Backend)
    const ADMIN_EMAILS = [
      'justinoappmx@gmail.com', // El dueño de la app
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

  // --- ADMIN ENDPOINTS ---

  app.get("/api/v1/admin/verify", authMiddleware, isAdminMiddleware, (req, res) => {
    res.json({ isAdmin: true, user: (req as any).user.email });
  });

  app.get("/api/v1/admin/stats", authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS for admin queries
      );

      const { data: cases, error } = await supabaseAdmin.from('cases').select('*');
      
      if (error) throw error;

      const stats = {
        totalCases: cases.length,
        paidCases: cases.filter(c => c.status === 'paid').length,
        pendingCases: cases.filter(c => c.status !== 'paid').length,
        totalRevenue: cases.filter(c => c.status === 'paid').length * 400
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook Handler (SECURE) - MUST BE BEFORE express.json()
  app.post("/api/v1/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      if (!sig || !webhookSecret) {
        throw new Error("Missing signature or webhook secret");
      }
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const email = session.metadata?.email || session.customer_details?.email;

        console.log(`[STRIPE] Payment confirmed for ${email}`);
        
        // Update user status in Supabase
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabaseAdmin
          .from('cases')
          .update({ status: 'paid' })
          .eq('username', email);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  app.use(express.json({ limit: '50mb' }));

  // Logging middleware
  app.use((req, res, next) => {
    if (req.url !== '/api/health') {
      debugLog(`${req.method} ${req.url}`);
    }
    next();
  });

  // AI Proxy
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

  // --- STRIPE SECURE FLOW ---
  
  // Checkout Session Creation
  app.post("/api/v1/stripe/create-checkout", authMiddleware, paymentLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "mxn",
              product_data: {
                name: "Justino - Expediente Digital Pro",
                description: "Acceso vitalicio a asesoría legal y generación de documentos para tu caso.",
              },
              unit_amount: 40000, // $400.00 MXN
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        // No more ?success=true! We use a clean URL.
        success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/`,
        metadata: {
          email: email
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Health
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      keys: {
        deepseek: !!process.env.DEEPSEEK_API_KEY,
        moonshot: !!process.env.MOONSHOT_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY
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

  // Vite for dev
  if (process.env.NODE_ENV !== "production") {
    debugLog("Starting in DEVELOPMENT mode with Vite middleware");
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
      // Don't fallback for API routes (already handled above but just in case)
      if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: "API not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

export default app;
