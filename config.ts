
// ==============================================================================
// CONFIGURACIÓN MAESTRA DE JUSTINO
// ==============================================================================

export const config = {
  // 1. STRIPE (Pagos)
  // IMPORTANTE: En tu Dashboard de Stripe (https://dashboard.stripe.com/payment-links)
  // 1. Edita tu link de pago.
  // 2. Ve a la pestaña "After payment" (Después del pago).
  // 3. Selecciona "Don't show confirmation page" (No mostrar página de confirmación).
  // 4. Selecciona "Redirect customers to your website" (Redirigir a tu sitio web).
  // 5. PEGA TU URL DE VERCEL AQUÍ: https://justino-mx.vercel.app/?success=true
  stripePaymentLink: "https://buy.stripe.com/eVqcN5bp2d739up9an1Nu04", 

  // 2. SUPABASE
  supabaseUrl: "https://msigkydllxgirspdjegm.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaWdreWRsbHhnaXJzcGRqZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTkyNzEsImV4cCI6MjA4MTQ3NTI3MX0.mq1lXAuc5hfgXb0Fg1m45X0fAolO0gic0IngIa_IAjQ",

};
