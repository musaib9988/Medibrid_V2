import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API (Lazy)
  let ai: GoogleGenerativeAI | null = null;
  const getAiClient = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return ai;
  };

  // API Routes
  app.post("/api/medibot", async (req, res) => {
    try {
      const aiClient = getAiClient();
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }

      console.log("MediBot received messages:", JSON.stringify(messages, null, 2));

      const systemInstruction = `You are MediBot, a helpful AI healthcare assistant for MediBrid. 
      Your purpose is to help users check medicine usage, benefits, and timing, and provide general advice and possible cures for simple symptoms like fever, cold, etc.
      Important Rules:
      1. Always maintain a friendly, professional, and empathetic tone.
      2. Keep responses concise and easy to read.
      3. For any symptoms provided by the user, provide general information and possible remedies, but ALWAYS include a disclaimer stating you are an AI and they should consult a real doctor or visit a clinic for serious conditions.
      4. Suggest that they can use the MediBrid platform to find doctors and clinics near them.`;

      // Use generateContent with the correct chat history format
      const model = aiClient.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction,
      });

      // Prepare chat history
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: msg.parts,
      }));
      
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
      const responseText = result.response.text();

      console.log("MediBot response:", responseText);

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("MediBot error:", error);
      res.status(500).json({ error: error.message || "Failed to process request." });
    }
  });

  // Push Notification Route
  app.post("/api/send-notification", async (req, res) => {
    try {
      const { title, body, tokens } = req.body;
      const serverKey = process.env.FCM_SERVER_KEY;

      if (!serverKey) {
        return res.status(500).json({ error: "FCM_SERVER_KEY is not configured on the server." });
      }

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({ error: "No target tokens provided." });
      }

      // FCM Legacy HTTP API supports up to 1000 tokens per request
      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `key=${serverKey}`,
        },
        body: JSON.stringify({
          registration_ids: tokens,
          notification: {
            title,
            body,
            sound: "default",
          },
          data: {
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            status: "done",
          }
        }),
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("FCM Error:", error);
      res.status(500).json({ error: "Failed to send notification" });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
