import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const session = await ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  console.log('Connected with Google Search tool!');
  session.close();
}
run().catch(console.error);
