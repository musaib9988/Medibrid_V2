import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const messages = [
    { role: 'model', parts: [{ text: "Hi" }] },
    { role: 'user', parts: [{ text: "Hello" }] }
  ];
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: messages,
  });
  console.log(response.text);
}
test().catch(console.error);
