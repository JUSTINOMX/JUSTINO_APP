import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "El correo electrónico es requerido." });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.trim() === "" || stripeKey.includes("sk_test_...")) {
      return res.status(400).json({
        error: "La clave secreta de Stripe (STRIPE_SECRET_KEY) no está detectada en el servidor. Asegúrate de haberla guardado en Vercel y haber hecho un REDEPLOY de tu proyecto."
      });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey.trim());

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
    const origin = req.headers.origin || `${proto}://${host}`;

    // Allow promotion codes (cupones de descuento)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product: "prod_Tc8CPnxlKG0Yrm",
            unit_amount: 40000, // $400.00 MXN
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        email: email
      }
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return res.status(500).json({ error: error.message || "Error al conectar con Stripe." });
  }
}
