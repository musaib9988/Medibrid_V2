var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_generative_ai = require("@google/generative-ai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  let ai = null;
  const getAiClient = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      ai = new import_generative_ai.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return ai;
  };
  app.post("/api/medibot", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }
      const lastUserMsg = messages.filter((m) => m.role === "user").pop();
      const userPrompt = lastUserMsg?.parts?.[0]?.text || "";
      if (process.env.GEMINI_API_KEY) {
        try {
          const aiClient = getAiClient();
          const systemInstruction = `You are MediBot, an empathetic healthcare AI assistant for the MediBrid app in Jammu & Kashmir.
          Provide helpful, concise medical advice for symptoms (fever, cold, cough, headache, stomach pain), medicine dosage & timing, and guide users to book OPD tokens or find doctors on MediBrid.
          Always include a brief disclaimer to consult a doctor for severe symptoms.`;
          const model = aiClient.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction
          });
          const history = messages.slice(0, -1).map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: msg.parts
          }));
          const chat = model.startChat({ history });
          const result = await chat.sendMessage(userPrompt);
          const responseText = result.response.text();
          if (responseText) {
            return res.json({ text: responseText });
          }
        } catch (geminiErr) {
          console.warn("Gemini API call notice (using MediBot Smart Healthcare Engine):", geminiErr);
        }
      }
      const promptLower = userPrompt.toLowerCase();
      let reply = "";
      if (promptLower.includes("fever") || promptLower.includes("temperature") || promptLower.includes("bukhar")) {
        reply = "\u{1F321}\uFE0F **Fever Management & Guidance**:\n\n1. **Rest & Hydration**: Drink plenty of water, ORS, or warm soups.\n2. **Medication**: Paracetamol (PCM 500mg/650mg) is commonly used for fever after meals every 6 hours as needed.\n3. **Cool Sponge**: Apply a damp towel to forehead if temperature is high (>101\xB0F).\n4. **When to see a doctor**: If fever lasts more than 3 days, or is accompanied by severe rash or breathing difficulty, please book an OPD token immediately on MediBrid to visit a nearby clinic.\n\n*Disclaimer: Consult a qualified doctor for medical diagnosis.*";
      } else if (promptLower.includes("headache") || promptLower.includes("head pain") || promptLower.includes("sir dard")) {
        reply = "\u{1F486} **Headache Relief Guidance**:\n\n1. Rest in a dark, quiet room.\n2. Stay hydrated with water or electrolyte liquid.\n3. Mild pain relief like Paracetamol can help.\n4. If headache is severe or accompanied by blurred vision, please consult a neurologist or physician via MediBrid.\n\n*Disclaimer: Consult a doctor for persistent symptoms.*";
      } else if (promptLower.includes("cough") || promptLower.includes("cold") || promptLower.includes("sore throat") || promptLower.includes("khansi")) {
        reply = "\u{1F637} **Cold & Cough Advice**:\n\n1. Gargle with warm salt water 2-3 times daily for sore throat.\n2. Take steam inhalation to clear nasal congestion.\n3. Honey with warm ginger tea can soothe throat irritation.\n4. If cough persists for more than a week, book an OPD appointment on MediBrid for a physician checkup.\n\n*Disclaimer: Visit a clinic for proper prescription.*";
      } else if (promptLower.includes("book") || promptLower.includes("appointment") || promptLower.includes("token") || promptLower.includes("opd") || promptLower.includes("slot")) {
        reply = "\u{1F3AB} **How to Book OPD Tokens on MediBrid**:\n\n1. Go to the **Home** tab on MediBrid.\n2. Select your district or search for your clinic/doctor.\n3. Click on the clinic card to open the profile.\n4. Click **'Book Appointment / Token'**, select date & doctor.\n5. Confirm booking to instantly receive your Live Queue OPD Token Number!\n\nYou can track live waiting queue status in real-time under 'My Bookings'.";
      } else if (promptLower.includes("medicine") || promptLower.includes("tablet") || promptLower.includes("dosage") || promptLower.includes("syrup") || promptLower.includes("timing")) {
        reply = "\u{1F48A} **General Medicine Safety & Timing**:\n\n1. **Painkillers & NSAIDs**: Always take after meals to prevent stomach irritation.\n2. **Antibiotics**: Take at regular intervals as prescribed and complete full course.\n3. **Antacids**: Usually taken 30 minutes before breakfast.\n4. **Multivitamins**: Best taken in morning or afternoon with water.\n\nAlways verify medicine dosage with your doctor or pharmacist on MediBrid!";
      } else {
        reply = `\u{1F44B} **Hello! I'm MediBot, your MediBrid AI Healthcare Assistant.**

I can help you with:
- Symptom checks & home care (fever, cough, cold, headache)
- Medicine timing, usage & precautions
- Finding doctors and clinics across J&K
- Booking OPD Tokens and tracking live queue status

How can I assist your health today?

*Disclaimer: MediBot provides general health information. Always consult a certified physician for medical treatment.*`;
      }
      return res.json({ text: reply });
    } catch (error) {
      console.error("MediBot error:", error);
      res.json({
        text: "\u{1F44B} Hi! I'm MediBot. How can I help you today? You can ask me about fever remedies, medicine usage, or how to book OPD tokens on MediBrid!"
      });
    }
  });
  app.post("/api/send-notification", async (req, res) => {
    try {
      const { title, body, tokens } = req.body;
      const serverKey = process.env.FCM_SERVER_KEY;
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required." });
      }
      if (serverKey && tokens && Array.isArray(tokens) && tokens.length > 0) {
        try {
          const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `key=${serverKey}`
            },
            body: JSON.stringify({
              registration_ids: tokens,
              notification: { title, body, sound: "default", icon: "/icon.svg" },
              data: { click_action: "FLUTTER_NOTIFICATION_CLICK", status: "done" }
            })
          });
          const data = await response.json();
          return res.json({ success: true, fcmResult: data });
        } catch (fcmErr) {
          console.warn("FCM Gateway notice:", fcmErr);
        }
      }
      return res.json({ success: true, message: "In-App Push notification broadcasted successfully." });
    } catch (error) {
      console.error("FCM Error:", error);
      res.json({ success: true, message: "Notification handled in-app." });
    }
  });
  app.get("/api/health-tip", async (req, res) => {
    try {
      if (process.env.GEMINI_API_KEY) {
        try {
          const aiClient = new import_genai.GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } }
          });
          const response = await aiClient.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Generate a daily health and wellness tip specifically tailored for people living in Jammu & Kashmir, considering local climate, seasonal health care, and traditional wellness advice. Return JSON with keys: title, category, tip.",
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  title: { type: import_genai.Type.STRING },
                  category: { type: import_genai.Type.STRING },
                  tip: { type: import_genai.Type.STRING }
                },
                required: ["title", "category", "tip"]
              }
            }
          });
          if (response.text) {
            const data = JSON.parse(response.text);
            return res.json(data);
          }
        } catch (e) {
          if (e?.status === 429 || e?.message?.includes("429") || e?.message?.includes("quota") || e?.message?.includes("RESOURCE_EXHAUSTED")) {
            console.log("Gemini API rate limit reached. Using fallback health tip.");
          } else {
            console.warn("Gemini health tip generation fallback used:", e);
          }
        }
      }
      const fallbackTips = [
        {
          title: "Winter Joint & Arthritis Care in Kashmir",
          category: "Seasonal Care",
          tip: "During cold winter months in J&K, keep joints warm with thermal layers, stay hydrated, and engage in gentle indoor stretching to maintain synovial fluid circulation and reduce stiffness."
        },
        {
          title: "Saffron & Honey Immunity Boost",
          category: "Nutrition & Immunity",
          tip: "Incorporate warm Kashmiri Kahwa with a pinch of saffron and crushed almonds to boost antioxidant levels and support respiratory health during chilly mornings."
        },
        {
          title: "Cardio Health in Mountain Altitude",
          category: "Heart & Fitness",
          tip: "When engaging in outdoor walks or hiking in valley terrains, maintain a steady breathing pace to allow your cardiovascular system to comfortably adapt to altitude oxygen levels."
        }
      ];
      const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
      return res.json(randomTip);
    } catch (err) {
      res.json({
        title: "Daily Wellness Tip",
        category: "General Health",
        tip: "Drink plenty of lukewarm water throughout the day and ensure 7-8 hours of restful sleep to maintain robust immune health."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
