import { GoogleGenAI, Type, Modality } from '@google/genai';

const getDynamicInstruction = () => {
    return `You are NEXUS, an advanced holographic AI interface... etc`;
}

const tools = [{
  functionDeclarations: [
    {
      name: 'display_visual_panel',
      description: 'Controls the visual interactive panel on the left side of the screen.',
      parameters: {
         type: Type.OBJECT,
         properties: {
            action: { type: Type.STRING, description: 'Must be "open" to display content, or "close" to hide the panel.' }
         },
         required: ['action']
      }
    }
  ]
}];

async function test() {
  const ai = new GoogleGenAI({});
  try {
    console.log("Connecting...");
    const sessionPromise = ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
        },
        systemInstruction: getDynamicInstruction(),
        tools: tools,
      },
      callbacks: {
          onerror: (e) => console.log("ON ERROR: ", e)
      }
    });
    console.log("Connected promise created!");
    const session = await sessionPromise;
    console.log("Session resolved!");
    
    await new Promise(r => setTimeout(r, 5000));
  } catch(e) {
    console.error("Caught error:", e);
  }
}
test();
