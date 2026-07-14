import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    config: {
      hasDeepSeek: !!process.env.DEEPSEEK_API_KEY,
      hasGemini: !!process.env.GEMINI_API_KEY
    }
  });
}
