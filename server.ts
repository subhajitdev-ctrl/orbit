import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini Setup
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// PayPal Setup
let client: paypal.core.PayPalHttpClient | null = null;

function getPaypalClient() {
  if (!client) {
    const clientId = process.env.VITE_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) {
      throw new Error("Missing VITE_PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
    }

    const environment = mode === 'live' 
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    client = new paypal.core.PayPalHttpClient(environment);
  }
  return client;
}

export async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create PayPal Order
  app.post("/api/paypal/create-order", async (req, res) => {
    const { amount, currency } = req.body;
    
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: currency || "USD",
          value: amount.toString()
        }
      }]
    });

    try {
      const client = getPaypalClient();
      const order = await client.execute(request);
      res.json({ id: order.result.id });
    } catch (err: any) {
      console.error("PayPal Create Order Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Capture PayPal Order
  app.post("/api/paypal/capture-order", async (req, res) => {
    const { orderID } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
      const client = getPaypalClient();
      const capture = await client.execute(request);
      res.json(capture.result);
    } catch (err: any) {
      console.error("PayPal Capture Order Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Gemini Endpoints
  app.post("/api/gemini/mentor", async (req, res) => {
    try {
      const { messages, systemInstruction } = req.body;
      
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      
      res.json({ text: result.text });
    } catch (err: any) {
      console.error("Gemini Mentor Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/tasks", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      const result = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      
      res.json({ text: result.text });
    } catch (err: any) {
      console.error("Gemini Tasks Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/speech", async (req, res) => {
    try {
      const { text, voiceName } = req.body;
      
      const result = await genAI.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // @ts-ignore
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      
      const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      res.json({ audio: base64Audio });
    } catch (err: any) {
      console.error("Gemini Speech Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { base64Audio, prompt } = req.body;
      
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: base64Audio
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          temperature: 0.1,
        },
      });
      
      res.json({ text: result.text });
    } catch (err: any) {
      console.error("Gemini Transcribe Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/image", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" },
        },
      });
      
      let imageUrl = null;
      for (const part of result.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      
      res.json({ url: imageUrl });
    } catch (err: any) {
      console.error("Gemini Image Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Start server if run directly
const isMain = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isMain || process.env.NODE_ENV === "production") {
  startServer().then(app => {
    // Only listen if not on Vercel (Vercel handles the listen part for functions)
    if (!process.env.VERCEL) {
      const PORT = 3000;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }
  });
}
