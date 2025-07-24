import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const SYSTEM_PROMPT = "You are a helpful EdTech assistant for LettrBlack. Answer everything like a smart study buddy.";

// Simple in-memory rate limit (per IP)
const lastRequest: Record<string, number> = {};
const RATE_LIMIT_MS = 5000;

router.post("/api/ai-chat", async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  if (lastRequest[ip] && Date.now() - lastRequest[ip] < RATE_LIMIT_MS) {
    return res.status(429).json({ error: "Too many requests. Please wait a few seconds." });
  }
  lastRequest[ip] = Date.now();

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid message." });
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        max_tokens: 512,
        temperature: 0.7
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.json({ reply: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: "No reply from AI." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to contact OpenAI." });
  }
});

export default router; 