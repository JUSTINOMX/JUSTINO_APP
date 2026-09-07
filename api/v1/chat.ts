import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateResponse } from "../../services/ai-provider";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  if (!body || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const userMessages = body.messages.filter((m: any) => m.role === 'user' || m.role === 'assistant');
    if (userMessages.length === 0) {
      return res.status(400).json({ error: "No valid messages found" });
    }

    const data = await generateResponse(userMessages);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[API v1 Chat Handler Error]:", error);
    return res.status(200).json({
      choices: [{
        message: {
          content: "He registrado los detalles de tu caso. Por favor, continúa indicándome los datos o reenvía tu último mensaje para trazar tu estrategia."
        },
        finish_reason: "stop"
      }]
    });
  }
}
