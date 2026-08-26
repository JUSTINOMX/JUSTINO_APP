import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  if (!body || !body.messages) {
    return res.status(400).json({ error: "Messages are required" });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const moonshotKey = process.env.MOONSHOT_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  const hasDeepSeek = deepseekKey && deepseekKey.length > 5;
  const hasMoonshot = moonshotKey && moonshotKey.length > 5;
  const hasGemini = geminiKey && geminiKey.length > 5;

  let lastError = "No API keys configured";

  // 1. Try DeepSeek (25s timeout for complete legal documents)
  if (hasDeepSeek) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 25000);
      
      const payload = {
        ...body,
        max_tokens: 4096
      };

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey.trim()}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(id);

      if (response.ok) return res.json(await response.json());
      lastError = `DeepSeek error ${response.status}`;
    } catch (e: any) {
      lastError = `DeepSeek: ${e.message}`;
    }
  }

  // 2. Try Moonshot (15s timeout)
  if (hasMoonshot) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000);
      const payload = {
        ...body,
        max_tokens: 4096
      };
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${moonshotKey.trim()}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(id);
      if (response.ok) return res.json(await response.json());
      lastError = `Moonshot error ${response.status}`;
    } catch (e: any) {
      lastError = `Moonshot: ${e.message}`;
    }
  }

  // 3. Final Fallback: Gemini
  if (hasGemini) {
    try {
      const genAI = new GoogleGenAI({ apiKey: geminiKey!.trim() });
      
      const messages = body.messages || [];
      const system = messages.find((m: any) => m.role === 'system')?.content || "";
      const userMsgs = messages.filter((m: any) => m.role !== 'system');
      
      const last = userMsgs[userMsgs.length - 1]?.content || "";
      const history = userMsgs.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const result = await (genAI.models as any).generateContent({
        model: "gemini-2.5-flash",
        contents: [...history, { role: 'user', parts: [{ text: last }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: 0.15
        },
        system_instruction: system
      });

      return res.json({
        choices: [{
          message: { content: result.candidates[0].content.parts[0].text },
          finish_reason: "stop"
        }]
      });
    } catch (e: any) {
      lastError = `Gemini: ${e.message}`;
    }
  }

  return res.status(500).json({ error: lastError });
}
