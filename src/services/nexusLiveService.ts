import { Type, Tool, GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getDynamicInstruction, nexusConfig } from '../config/nexusConfig';
import { useAIStore } from '../store/aiStore';
import { audioManager } from './audioManager';
import { videoManager } from './videoManager';
import { haService } from './haService';
import { getEnvironmentSensors } from './environmentSensors';

import { generateImageMessage } from './chatService';

let activeSession: any = null;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('NEXUS CRITICAL: API Token absent.');
  }
  return new GoogleGenAI({ apiKey });
};

// Tool Definitions for Live API
const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: 'display_visual_panel',
      description: 'Controls the visual interactive panel on the left side of the screen. Use this to display rich content (weather, news, code, formulas, articles, charts) or to close ANY open panel (including data panels or hologram images) when requested.',
      parameters: {
         type: Type.OBJECT,
         properties: {
            action: { type: Type.STRING, description: 'Must be "open" to display content, or "close" to hide the panel.' },
            title: { type: Type.STRING, description: 'Title of the content (e.g. "Weather in Paris" or "Calculus Formula"). Omit if action is "close".' },
            content: { type: Type.STRING, description: 'The payload data to render (Markdown, JSON, or Raw Code). For "chart", provide a JSON string with shape: { type: "line"|"bar"|"pie", data: [...], xAxisKey: string, series: [{dataKey: string, color?: string}] }. Omit if action is "close".' },
            contentType: { type: Type.STRING, description: 'Type of content: "code", "markdown", "weather", "news", "chart". Omit if action is "close".' },
            language: { type: Type.STRING, description: 'Programming language if contentType is "code". Otherwise omit.' }
         },
         required: ['action']
      }
    },
    {
      name: 'render_hologram_image',
      description: 'Generates an image and displays it on the left panel based on a prompt.',
      parameters: {
         type: Type.OBJECT,
         properties: { prompt: { type: Type.STRING, description: 'Image generation prompt.' } },
         required: ['prompt']
      }
    },
    {
      name: 'execute_script',
      description: 'Executes JavaScript code in a secure local sandbox. If you need to perform calculations, heavy string manipulation, or statistical analysis, run JavaScript here. The code MUST explicitly return the final value (e.g. `return 2 + 2;`). Supports async code.',
      parameters: {
         type: Type.OBJECT,
         properties: { code: { type: Type.STRING, description: 'The JavaScript code to execute. Must contain a return statement.' } },
         required: ['code']
      }
    },
    {
      name: 'render_data_chart',
      description: 'Displays a data visualization chart (bar, line, or pie). Use this when the user asks for a comparison, statistics, or graphical representation of data.',
      parameters: {
         type: Type.OBJECT,
         properties: {
             title: { type: Type.STRING, description: 'The title of the chart.' },
             chartData: { type: Type.STRING, description: 'A JSON string representing the chart. Format: {"type": "bar"|"line"|"pie", "data": [{"name": "A", "val": 10}, {"name": "B", "val": 20}], "xAxisKey": "name", "series": [{"dataKey": "val"}]}' }
         },
         required: ['title', 'chartData']
      }
    },
    {
      name: 'append_chart_data',
      description: 'Appends a single data point to an already open chart. Use this to simulate streaming or real-time data updates after opening a chart using display_visual_panel or render_data_chart.',
      parameters: {
         type: Type.OBJECT,
         properties: {
             dataPoint: { type: Type.STRING, description: 'A JSON string representing a single data point object, e.g. {"name": "C", "val": 30}.' }
         },
         required: ['dataPoint']
      }
    },
    {
      name: 'open_url',
      description: 'Opens a website or URL in a new browser tab. Use this when the user asks to open youtube, play a song (by opening youtube), search google directly, or go to a specific website.',
      parameters: {
         type: Type.OBJECT,
         properties: {
             url: { type: Type.STRING, description: 'The absolute URL to open (e.g. https://www.youtube.com/results?search_query=...).' }
         },
         required: ['url']
      }
    },
    {
      name: 'get_current_time',
      description: 'Gets the current local time and date of the user system.',
      parameters: {
         type: Type.OBJECT,
         properties: {
             timezone: { type: Type.STRING, description: 'Optional timezone. Defaults to local.' }
         }
      }
    },
    {
      name: 'search_wikipedia',
      description: 'Searches Wikipedia for an entity or concept and returns the top extract. Use this when the user asks for factual information, history, or knowledge that you do not have.',
      parameters: {
         type: Type.OBJECT,
         properties: {
             query: { type: Type.STRING, description: 'The search query.' },
             language: { type: Type.STRING, description: 'The 2-letter language code (e.g. en, ro, fr).' }
         },
         required: ['query', 'language']
      }
    },
    {
      name: 'get_screen_context',
      description: 'Reads the CURRENT state of the holographic panels visible to the user on the screen. Call this whenever the user refers to "this graph", "the image", "this code", "the screen" to know what they are looking at.'
    },
    {
      name: 'toggle_camera',
      description: 'Turns the user camera on or off when they ask you to look at them, turn on the video feed, or stop looking at them.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              action: { type: Type.STRING, description: 'Must be "open" or "close"' }
          },
          required: ['action']
      }
    },
    {
      name: 'toggle_home_assistant_entity',
      description: 'Toggles a Home Assistant entity (like a light or switch) connected to the local setup, such as an ESP8266 LED.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              action: { type: Type.STRING, description: '"on" to turn on, "off" to turn off, "toggle" to toggle the current state.' }
          },
          required: []
      }
    },
    {
      name: 'display_identified_objects',
      description: 'Provides a list of identified objects detected in the physical space of the camera feed. This will display bounding boxes overlaid on the camera feed. Use this when the user asks "what is in the room?" or "what do you see?".',
      parameters: {
         type: Type.OBJECT,
         properties: {
            objects: {
              type: Type.ARRAY,
              description: 'Array of detected physical objects.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique lowercase identifier of the object, e.g. "keyboard", "mug", "monitor", "plant"' },
                  name: { type: Type.STRING, description: 'Formal name, e.g. "Mechanical Keyboard", "Coffee Mug", "Curved Monitor", "House Plant"' },
                  confidence: { type: Type.NUMBER, description: 'Percentage confidence from 0 to 1, e.g. 0.95' },
                  boundingBox: { 
                    type: Type.ARRAY, 
                    description: 'Four numbers [top, left, width, height] as percentage (0 to 100). E.g. [30, 20, 25, 30]',
                    items: { type: Type.NUMBER }
                  },
                  status: { type: Type.STRING, description: 'Current operating condition, e.g., "Active", "Standby", "Idle", "Calibrated"' },
                  diagnostics: { type: Type.STRING, description: 'Brief descriptions or diagnostic specs of the object in Markdown format (to display when isolated).' },
                  mockAttributes: { type: Type.STRING, description: 'JSON string representing its telemetry properties, e.g. "{\\"Temperature\\": \\"23C\\", \\"Power Usage\\": \\"1.2W\\"}"' }
                },
                required: ['id', 'name', 'confidence']
              }
            }
         },
         required: ['objects']
      }
    },
    {
      name: 'isolate_object_view',
      description: 'Activates object isolation. When the user asks to "show details of the keyboard" or "arata tastatura" or "isolate the speaker", use this tool to isolate and focus on a single object in a separate window on the left side of the screen.',
      parameters: {
         type: Type.OBJECT,
         properties: {
            action: { type: Type.STRING, description: 'Must be "open" to show/isolate, or "close" to stop isolating.' },
            objectId: { type: Type.STRING, description: 'The unique ID of the object.' },
            objectName: { type: Type.STRING, description: 'Optional: name of the object to isolate.' },
            diagnostics: { type: Type.STRING, description: 'Optional: markdown diagnostics or descriptions.' },
            mockAttributes: { type: Type.STRING, description: 'Optional: JSON string of telemetry fields.' },
            confidence: { type: Type.NUMBER, description: 'Optional: confidence rating.' },
            status: { type: Type.STRING, description: 'Optional: status string.' }
         },
         required: ['action']
      }
    },
    {
      name: 'get_environment_info',
      description: 'Real-time environment awareness. Fetches live web sensors: battery, network status, OS, screen size, system time, dark mode preference, memory, and tab visibility.'
    }
  ]
},
{ googleSearch: {} }
];

export const establishNeuralLink = async () => {
  const ai = getClient();
  const store = useAIStore.getState();
  
  if (activeSession) {
    severNeuralLink();
  }
  
  store.setConnectionState('connecting');
  
  try {
    const envSensors = await getEnvironmentSensors();
    const storeState = useAIStore.getState();
    const screenCtx = {
        isDataPanelOpen: storeState.isDataPanelOpen,
        dataPanelTitle: storeState.dataPanelTitle,
        dataPanelContent: storeState.dataPanelContent,
        dataPanelType: storeState.dataPanelType,
        isImagePanelOpen: storeState.isImagePanelOpen
    };

    // We open a unified Live Session socket
    const sessionPromise = ai.live.connect({
      model: nexusConfig.models.liveVoice,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: nexusConfig.system.defaultVoice } },
        },
        systemInstruction: { parts: [{ text: getDynamicInstruction(screenCtx, envSensors) }] },
        tools: tools,
      },
      callbacks: {
        onopen: async () => {
          sessionPromise.then(s => { activeSession = s; });

          store.setConnectionState('connected');
          store.setSystemState('listening');
          
          audioManager.onPlaybackStateChange = (isPlaying) => {
             const currentStoreState = useAIStore.getState().systemState;
             if (isPlaying) {
                 useAIStore.getState().setSystemState('speaking');
             } else {
                 if (currentStoreState === 'speaking' || currentStoreState === 'thinking') {
                     useAIStore.getState().setSystemState('listening');
                 }
             }
          };

          audioManager.onSpeechStart = () => {
             useAIStore.getState().setSystemState('listening');
          };

          try {
            await audioManager.startRecording((base64PCM) => {
              if (activeSession) {
                activeSession.sendRealtimeInput({
                  audio: { data: base64PCM, mimeType: 'audio/pcm;rate=16000' }
                });
              }
            });
          } catch (e) {
            console.error("Hardware Lock Error (Microphone):", e);
            store.setErrorMessage('Microphone hardware locked or denied. Text mode is active.');
          }

          try {
            // Auto-start camera if globally enabled
            if (useAIStore.getState().isCameraActive) {
               await startVideoStream(sessionPromise);
            }
          } catch (e) {
            console.error("Hardware Lock Error (Camera):", e);
            useAIStore.getState().setCameraActive(false);
            store.setErrorMessage('Camera access denied. Optic link disabled.');
          }
        },
        onmessage: async (data: any) => {
          // Note: using any here as GenAI typing can have slight drifts with live updates
          const message = data as LiveServerMessage;
          
          if (message.serverContent?.modelTurn) {
             const parts = message.serverContent.modelTurn.parts;
             // Check if model returned audio
             const audioPart = parts?.find(p => p.inlineData?.mimeType?.startsWith('audio/'));
             
             if (audioPart && audioPart.inlineData?.data) {
                // Audio will automatically toggle 'speaking' via the audioManager boundary
                await audioManager.playPCM16(audioPart.inlineData.data);
             }
             
          }
          
          const toolCallMessage = (message as any).toolCall;
          if (toolCallMessage && toolCallMessage.functionCalls) {
              const calls = toolCallMessage.functionCalls;
              if (calls.length > 0) {
                  store.setSystemState('thinking');
                  
                  const functionResponses: any[] = [];
                  
                  for (const fnCall of calls) {
                      console.log("[Nexus] Received Tool Call:", fnCall);
                      
                      let functionResponse = { success: true } as any;

                      let parsedArgsStr = "";
                      try {
                          let args = fnCall.args || (fnCall as any).arguments || {};
                          if (typeof args === 'string') {
                              try { args = JSON.parse(args); } catch(e) { console.error("Could not parse args", e); }
                          }
                          parsedArgsStr = JSON.stringify(args);

                          console.log(`[Nexus] Executing '${fnCall.name}' with args:`, args);

                          if (fnCall.name === 'display_visual_panel') {
                              const { action, title, content, contentType, language } = args;
                              if (action === 'close') {
                                  store.setDataPanelState(false);
                                  store.setImagePanelOpen(false);
                                  store.addMessage({
                                    id: Date.now().toString(),
                                    role: 'model',
                                    text: `[DEBUG]: Closed visual panel.`
                                  });
                              } else {
                                  let contentStr = "";
                                  if (typeof content === 'object') contentStr = JSON.stringify(content, null, 2);
                                  else contentStr = String(content || "");
                                  
                                  store.setDataPanelState(true, String(title || "Information"), contentStr, String(contentType || "markdown"), String(language || "none"));
                                  
                                  store.addMessage({
                                    id: Date.now().toString(),
                                    role: 'model',
                                    text: `[DEBUG]: Opened display window for: ${title}`
                                  });
                              }
                          } 
                          else if (fnCall.name === 'render_hologram_image') {
                              const { prompt } = args;
                              store.setImagePanelOpen(true);
                              generateImageMessage(prompt);
                          }
                          else if (fnCall.name === 'execute_script') {
                              const { code } = args;
                              console.log("[Nexus Sandbox] Executing script in sandbox...", code);
                              
                              try {
                                  // Use a Web Worker for sandboxing execute_script instead of raw eval/new Function
                                  const workerContent = `
                                    // Block common globals to prevent malicious requests or storage access
                                    const window = undefined;
                                    const document = undefined;
                                    const fetch = undefined;
                                    const XMLHttpRequest = undefined;
                                    const localStorage = undefined;
                                    const sessionStorage = undefined;
                                    const indexedDB = undefined;
                                    const caches = undefined;
                                    
                                    // Math computation helpers (if needed by model)
                                    self.onmessage = async (e) => {
                                      try {
                                        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                                        const sandboxFn = new AsyncFunction(e.data.code);
                                        const result = await sandboxFn();
                                        self.postMessage({ success: true, result });
                                      } catch (error) {
                                        self.postMessage({ success: false, error: String(error) });
                                      }
                                    };
                                  `;

                                  const workerBlob = new Blob([workerContent], { type: 'application/javascript' });
                                  const workerUrl = URL.createObjectURL(workerBlob);
                                  
                                  let worker: Worker | null = null;
                                  let isWorkerBlocked = false;
                                  try {
                                      worker = new Worker(workerUrl);
                                  } catch (cspErr) {
                                      console.warn("[Nexus Sandbox] Blobed Worker CSP restriction detected. Activating main-thread safe executor fallback.");
                                      isWorkerBlocked = true;
                                  }

                                  let result: any;
                                  if (isWorkerBlocked || !worker) {
                                      // Main-thread safe sandbox execution with shadowed globals fallback
                                      const executor = async (codeStr: string) => {
                                          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                                          // Pass blocked globals names as function arguments to shadow them completely on invocation
                                          const sandboxFn = new AsyncFunction(
                                              "window", "document", "fetch", "XMLHttpRequest", 
                                              "localStorage", "sessionStorage", "indexedDB", "caches", 
                                              codeStr
                                          );
                                          return await sandboxFn(
                                              undefined, undefined, undefined, undefined, 
                                              undefined, undefined, undefined, undefined
                                          );
                                      };
                                      
                                      // 3 second threshold timeout
                                      const timeoutPromise = new Promise((_, reject) => 
                                          setTimeout(() => reject(new Error("Timeout: Script execution exceeded 3000ms.")), 3000)
                                      );
                                      result = await Promise.race([executor(code), timeoutPromise]);
                                  } else {
                                      const activeWorker = worker;
                                      result = await new Promise((resolve, reject) => {
                                          // 3 second timeout for script execution to prevent infinite loops
                                          const timeout = setTimeout(() => {
                                              activeWorker.terminate();
                                              reject(new Error("Timeout: Script execution exceeded 3000ms."));
                                          }, 3000);

                                          activeWorker.onmessage = (e) => {
                                              clearTimeout(timeout);
                                              if (e.data.success) {
                                                  resolve(e.data.result);
                                              } else {
                                                  reject(new Error(e.data.error));
                                              }
                                          };

                                          activeWorker.onerror = (e) => {
                                              clearTimeout(timeout);
                                              reject(new Error(e.message));
                                          };

                                          activeWorker.postMessage({ code });
                                      }).finally(() => {
                                          activeWorker.terminate();
                                          URL.revokeObjectURL(workerUrl);
                                      });
                                  }

                                  console.log("[Nexus Sandbox] Success:", result);
                                  functionResponse = { success: true, result: typeof result === 'object' ? JSON.stringify(result) : String(result) };
                                  
                                  store.addMessage({
                                    id: Date.now().toString() + "-exec",
                                    role: 'model',
                                    text: `[DEBUG]: Script sandbox executed successfully: ${functionResponse.result}`
                                  });
                              } catch (execError: any) {
                                  console.error("[Nexus Sandbox] Error:", execError);
                                  functionResponse = { error: String(execError) };
                              }
                          }
                          else if (fnCall.name === 'render_data_chart') {
                              const { title, chartData } = args;
                              store.setDataPanelState(true, String(title || "Data Chart"), String(chartData), "chart", "none");
                              store.addMessage({
                                id: Date.now().toString(),
                                role: 'model',
                                text: `[DEBUG]: Chart Rendered: ${title}`
                              });
                          }
                          else if (fnCall.name === 'append_chart_data') {
                              const { dataPoint } = args;
                              try {
                                  store.appendChartData(JSON.parse(dataPoint));
                                  store.addMessage({
                                    id: Date.now().toString() + "-append",
                                    role: 'model',
                                    text: `[DEBUG]: Chart data appended.`
                                  });
                              } catch (e) {
                                  console.error("Failed to append chart data:", e);
                                  functionResponse = { error: "JSON parse error on dataPoint" };
                              }
                          }
                          else if (fnCall.name === 'open_url') {
                              const { url } = args;
                              window.open(url, '_blank', 'noopener,noreferrer');
                              store.addMessage({
                                id: Date.now().toString(),
                                role: 'model',
                                text: `[DEBUG]: Opened URL: ${url}`
                              });
                          }
                          else if (fnCall.name === 'get_current_time') {
                              const timeString = new Date().toLocaleString();
                              functionResponse = { "current_time": timeString };
                              store.addMessage({
                                id: Date.now().toString(),
                                role: 'model',
                                text: `[DEBUG]: Time requested. Sent: ${timeString}`
                              });
                          }
                          else if (fnCall.name === 'search_wikipedia') {
                              const { query, language } = args;
                              const lang = language || 'en';
                              
                              store.addMessage({
                                id: Date.now().toString(),
                                role: 'model',
                                text: `[DEBUG]: Searching Wikipedia (${lang}) for: ${query}...`
                              });
                              
                              try {
                                  // First search to get exact title
                                  const searchRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`);
                                  const searchData = await searchRes.json();
                                  
                                  if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                                      const title = searchData.query.search[0].title;
                                      
                                      // Now get the extract
                                      const extractRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=&explaintext=&titles=${encodeURIComponent(title)}&format=json&origin=*`);
                                      const extractData = await extractRes.json();
                                      
                                      const pages = extractData.query.pages;
                                      const pageId = Object.keys(pages)[0];
                                      const extract = pages[pageId].extract;
                                      
                                      functionResponse = { success: true, title, extract: extract.substring(0, 500) + '...' };
                                  } else {
                                      functionResponse = { success: false, error: 'No results found on Wikipedia.' };
                                  }
                              } catch (e: any) {
                                  functionResponse = { success: false, error: e.message || 'Wikipedia query failed.' };
                              }
                          }
                          else if (fnCall.name === 'get_screen_context') {
                              const currentStore = useAIStore.getState();
                              const storeStateStr = {
                                  isDataPanelOpen: currentStore.isDataPanelOpen,
                                  dataPanelTitle: currentStore.dataPanelTitle,
                                  dataPanelType: currentStore.dataPanelType,
                                  dataPanelContentTruncated: currentStore.dataPanelContent.substring(0, 2000),
                                  isImagePanelOpen: currentStore.isImagePanelOpen,
                                  isCameraActive: currentStore.isCameraActive
                              };
                              functionResponse = { success: true, screen_context: storeStateStr };
                              currentStore.addMessage({
                                id: Date.now().toString(),
                                role: 'model',
                                text: `[DEBUG]: Screen context read by AI.`
                              });
                          }
                          else if (fnCall.name === 'toggle_camera') {
                              const currentStore = useAIStore.getState();
                              const isCurrentlyActive = currentStore.isCameraActive;
                              const wantsOpen = args.action === 'open';
                              if (isCurrentlyActive !== wantsOpen) {
                                  await toggleCameraSync();
                                  functionResponse = { success: true, status: wantsOpen ? 'Camera turned on' : 'Camera turned off' };
                                  currentStore.addMessage({
                                      id: Date.now().toString(),
                                      role: 'model',
                                      text: `[DEBUG]: Camera feed ${wantsOpen ? 'initiated' : 'terminated'}.`
                                  });
                              } else {
                                  functionResponse = { success: true, status: `Camera is already ${wantsOpen ? 'on' : 'off'}` };
                              }
                          }
                          else if (fnCall.name === 'toggle_home_assistant_entity') {
                              const { action } = args; // 'on', 'off', or 'toggle'
                              try {
                                  let act = (action || 'toggle').toLowerCase();
                                  if (act !== 'on' && act !== 'off') act = 'toggle';
                                  
                                  const result = await haService.toggleEntity(act as 'on' | 'off' | undefined);
                                  functionResponse = { success: true, message: `Home Assistant entity toggled ${act}.`, result };
                                  useAIStore.getState().addMessage({
                                    id: Date.now().toString(),
                                    role: 'model',
                                    text: `[DEBUG]: Home Assistant Entity ${act}.`
                                  });
                              } catch (e: any) {
                                  functionResponse = { success: false, error: e.message || 'Failed to toggle entity.' };
                              }
                          }
                          else if (fnCall.name === 'display_identified_objects') {
                              const { objects } = args;
                              if (Array.isArray(objects)) {
                                  const now = Date.now();
                                  const objectsWithTimestamp = objects.map((obj: any) => ({
                                      ...obj,
                                      timestamp: now
                                  }));
                                  store.setDetectedObjects(objectsWithTimestamp);
                                  functionResponse = { success: true, count: objects.length, status: "Detected objects synced with UI overlay." };
                                  store.addMessage({
                                      id: Date.now().toString(),
                                      role: 'model',
                                      text: `[DEBUG]: Detected and overlaid ${objects.length} objects: ${objects.map(o => o.name).join(', ')}.`
                                  });
                              } else {
                                  functionResponse = { success: false, error: "Missing objects list" };
                              }
                          }
                          else if (fnCall.name === 'isolate_object_view') {
                              const { action, objectId, objectName, diagnostics, mockAttributes, confidence, status } = args;
                              if (action === 'close') {
                                  store.setIsolatedObject(null);
                                  store.setIsolatedPanelOpen(false);
                                  functionResponse = { success: true, status: "Closed object isolation panel" };
                              } else {
                                  const targetId = String(objectId || "").toLowerCase();
                                  let found = store.detectedObjects.find(o => o.id.toLowerCase() === targetId);
                                  
                                  if (!found && objectName) {
                                      found = {
                                          id: targetId || "isolated-target",
                                          name: String(objectName),
                                          confidence: Number(confidence || 1.0),
                                          status: String(status || "ACTIVE"),
                                          diagnostics: String(diagnostics || ""),
                                          mockAttributes: String(mockAttributes || ""),
                                      };
                                  }

                                  if (found) {
                                      if (diagnostics) found.diagnostics = String(diagnostics);
                                      if (mockAttributes) found.mockAttributes = String(mockAttributes);
                                      if (status) found.status = String(status);
                                      
                                      store.setIsolatedObject(found);
                                      store.setIsolatedPanelOpen(true);
                                      functionResponse = { success: true, status: `Isolated object ${found.name}`, objectDetails: found };
                                      store.addMessage({
                                          id: Date.now().toString(),
                                          role: 'model',
                                          text: `[DEBUG]: Isolated object view opened: ${found.name}.`
                                      });
                                  } else {
                                      functionResponse = { success: false, error: `Object ID '${objectId}' was not found. Please provide an 'objectName' to construct detailed views.` };
                                  }
                              }
                          }
                          else if (fnCall.name === 'get_environment_info') {
                              const sensors = await getEnvironmentSensors();
                              functionResponse = { success: true, sensors };
                              useAIStore.getState().addMessage({
                                id: Date.now().toString() + "-env",
                                role: 'model',
                                text: `[DEBUG]: Evaluated environment sensor array.`
                              });
                          }
                      } catch(err) {
                          console.error("[Nexus] Tool execution logic error:", err);
                          functionResponse = { error: String(err) };
                      }
                      
                      const fnId = fnCall.id || "unknown-id";
                      console.log(`[Nexus] Tool Response Prepared for ${fnCall.name} (ID: ${fnId}):`, functionResponse);
                      
                      store.addMessage({
                        id: Date.now().toString() + "-tool",
                        role: 'model',
                        text: `[DEBUG]: Evaluated tool call: ${fnCall.name} (${parsedArgsStr})\n`
                      });

                      functionResponses.push({
                          id: fnId,
                          name: fnCall.name || "unknown",
                          response: functionResponse
                      });
                  }

                  // Send the responses back to continue the stream
                  sessionPromise.then(s => {
                     try {
                         console.log("[Nexus] Sending Tool Response back to server:", { functionResponses });
                         s.sendToolResponse({ functionResponses });
                     } catch (e) {
                         console.error('[Nexus] Failed to send tool response through SDK!', e);
                     }
                  });
              }
          }
          
          if (message.serverContent?.interrupted) {
            audioManager.interrupt();
            store.setSystemState('listening');
          }
          
          if (message.serverContent?.turnComplete) {
            if (!audioManager.isPlaying()) {
               store.setSystemState('listening');
            }
          }
        },
        onclose: () => {
          severNeuralLink(); // clean cleanup
        },
        onerror: (err) => {
          console.error("NEXUS Protocol Exception:", err);
          store.setErrorMessage(err.message || 'Connection lost.');
          severNeuralLink();
        }
      }
    });

    activeSession = await sessionPromise;
    
  } catch (error: any) {
    console.error("Link Init Failed:", error);
    store.setConnectionState('error');
    store.setErrorMessage(error.message);
  }
};

export const severNeuralLink = () => {
  audioManager.stopRecording();
  audioManager.interrupt();
  videoManager.stopCamera();
  
  if (activeSession) {
    try { activeSession.close(); } catch(e) {}
    activeSession = null;
  }
  
  const store = useAIStore.getState();
  store.setConnectionState('offline');
  store.setSystemState('idle');
  store.setErrorMessage(null);
  store.setDetectedObjects([]);
  store.setIsolatedObject(null);
  store.setIsolatedPanelOpen(false);
  // Store retains isCameraActive preference so next boot remembers it
};

// Start the video stream internally if active
const startVideoStream = async (sessionPromise: Promise<any>) => {
  try {
     const session = await sessionPromise;
     await videoManager.startCamera((base64JPEG) => {
         if (activeSession) {
            activeSession.sendRealtimeInput({
               video: { data: base64JPEG, mimeType: 'image/jpeg' }
            });
         } else {
            session.sendRealtimeInput({
               video: { data: base64JPEG, mimeType: 'image/jpeg' }
            });
         }
     });
  } catch (e) {
     console.error("Failed to start video:", e);
  }
};

// Handlers for dynamic UI toggling
export const toggleCameraSync = async () => {
   const store = useAIStore.getState();
   const nextState = !store.isCameraActive;
   store.setCameraActive(nextState);

   if (!nextState) {
       store.setDetectedObjects([]);
       store.setIsolatedObject(null);
       store.setIsolatedPanelOpen(false);
   }

   if (store.connectionState === 'connected' && activeSession) {
       if (nextState) {
           await startVideoStream(Promise.resolve(activeSession));
       } else {
           videoManager.stopCamera();
       }
   }
};
