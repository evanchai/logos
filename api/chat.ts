import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  GOD_SYSTEM, GOD_INSTRUCTION,
  BUDDHA_SYSTEM, BUDDHA_INSTRUCTION,
  ALLAH_SYSTEM, ALLAH_INSTRUCTION,
} from "./prompts.js";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:logos",
});

type FigureId = "god" | "buddha" | "allah";

const PROMPTS: Record<FigureId, { system: string; instruction: string }> = {
  god: { system: GOD_SYSTEM, instruction: GOD_INSTRUCTION },
  buddha: { system: BUDDHA_SYSTEM, instruction: BUDDHA_INSTRUCTION },
  allah: { system: ALLAH_SYSTEM, instruction: ALLAH_INSTRUCTION },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set" });
  }

  const { message, history = [], figure } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  if (!figure || !PROMPTS[figure as FigureId]) {
    return res.status(400).json({ error: "Invalid figure" });
  }

  const prompt = PROMPTS[figure as FigureId];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: prompt.system,
    });

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of history) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: `${message}${prompt.instruction}` }],
    });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    const raw = result.response.text().trim();
    const replies = raw
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    console.log(JSON.stringify({ ts: Date.now(), figure, user: message, replies }));

    return res.status(200).json({ replies: replies.length > 0 ? replies : ["..."] });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "Failed to generate reply" });
  }
}
