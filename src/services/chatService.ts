import { GoogleGenAI } from '@google/genai';
import { useAIStore } from '../store/aiStore';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API Token absent.');
  }
  return new GoogleGenAI({ apiKey });
};

export const sendChatMessage = async (userText: string) => {
  const ai = getClient();
  const store = useAIStore.getState();
  const { groundingMode } = store;

  const id = Date.now().toString();
  store.addMessage({ id, role: 'user', text: userText });
  
  const modelId = Date.now().toString() + "_model";
  store.addMessage({ id: modelId, role: 'model', text: '' });
  store.setSystemState('thinking');

  try {
    // Generate context formatted contents (just very naive mapping for this example)
    const history = store.messages.filter(m => !m.isImage).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    // Append current
    history.push({ role: 'user', parts: [{ text: userText }] });

    let runStream = async (chatHistory: any[]) => {
      let toolsConfig: any[] = [
        {
          functionDeclarations: [
            {
              name: 'display_visual_panel',
              description: 'Controls the visual interactive panel on the left side of the screen. Use this to display rich content (weather, news, code, formulas, articles) or to close the panel when requested.',
              parameters: {
                 type: 'OBJECT',
                 properties: {
                     action: { type: 'STRING', description: 'Must be "open" to display content, or "close" to hide the panel.' },
                     title: { type: 'STRING', description: 'Title of the content. Omit if action is "close".' },
                     content: { type: 'STRING', description: 'The payload data. Omit if action is "close".' },
                     contentType: { type: 'STRING', description: 'Type of content: "code", "markdown", "weather", "news". Omit if action is "close".' },
                     language: { type: 'STRING', description: 'Programming language if contentType is "code". Otherwise omit.' }
                 },
                 required: ['action']
              }
            },
            {
              name: 'render_hologram_image',
              description: 'Generates an image and displays it on the left panel based on a prompt.',
              parameters: {
                 type: 'OBJECT',
                 properties: { prompt: { type: 'STRING', description: 'Image generation prompt.' } },
                 required: ['prompt']
              }
            },
            {
              name: 'execute_script',
              description: 'Executes JavaScript code in a secure local sandbox. If you need to perform calculations, heavy string manipulation, or statistical analysis, run JavaScript here. The code MUST explicitly return the final value (e.g. `return 2 + 2;`). Supports async code.',
              parameters: {
                 type: 'OBJECT',
                 properties: { code: { type: 'STRING', description: 'The JavaScript code to execute. Must contain a return statement.' } },
                 required: ['code']
              }
            },
            {
              name: 'render_data_chart',
              description: 'Displays a data visualization chart (bar, line, or pie). Use this when the user asks for a comparison, statistics, or graphical representation of data.',
              parameters: {
                 type: 'OBJECT',
                 properties: {
                     title: { type: 'STRING', description: 'The title of the chart.' },
                     chartData: { type: 'STRING', description: 'A JSON string representing the chart. Format: {"type": "bar"|"line"|"pie", "data": [{"name": "A", "val": 10}, {"name": "B", "val": 20}], "xAxisKey": "name", "series": [{"dataKey": "val"}]}' }
                 },
                 required: ['title', 'chartData']
              }
            }
          ]
        }
      ];

      if (groundingMode === 'search') {
        toolsConfig.push({ googleSearch: {} });
      } else if (groundingMode === 'maps') {
        toolsConfig.push({ googleMaps: {} });
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: chatHistory,
        config: {
          systemInstruction: { parts: [{ text: (await import('../config/nexusConfig')).getDynamicInstruction({
              isDataPanelOpen: store.isDataPanelOpen,
              dataPanelTitle: store.dataPanelTitle,
              dataPanelContent: store.dataPanelContent,
              dataPanelType: store.dataPanelType,
              isImagePanelOpen: store.isImagePanelOpen
          }) }] },
          tools: toolsConfig
        }
      });

      let hasFunctionCall = false;
      let functionResponses: any[] = [];
      let modelParts: any[] = [];

      for await (const chunk of responseStream) {
        if (chunk.text && !hasFunctionCall) {
          store.updateMessage(modelId, chunk.text);
        }

        if (chunk.candidates?.[0]?.content?.parts) {
           modelParts.push(...chunk.candidates[0].content.parts.map(p => JSON.parse(JSON.stringify(p))));
        }
        
        let calls = chunk.functionCalls;
        if (calls && calls.length > 0) {
          hasFunctionCall = true;
          for (const fnCall of calls) {
            let functionResponse = { success: true } as any;
            try {
              let args = fnCall.args || {};
              if (fnCall.name === 'display_visual_panel') {
                   const { action, title, content, contentType, language } = args;
                   if (action === 'close') {
                       store.setDataPanelState(false);
                   } else {
                       let contentStr = "";
                       if (typeof content === 'object') contentStr = JSON.stringify(content, null, 2);
                       else contentStr = String(content || "");
                       
                       store.setDataPanelState(true, String(title || "Information"), contentStr, String(contentType || "markdown"), String(language || "none"));
                       store.updateMessage(modelId, `\n[ SYS: Window Opened: ${title} ]\n`);
                   }
              } 
              else if (fnCall.name === 'render_hologram_image') {
                  const { prompt } = args;
                  store.setImagePanelOpen(true);
                  if (typeof prompt === 'string') generateImageMessage(prompt);
              }
              else if (fnCall.name === 'execute_script') {
                  const { code } = args as any;
                  console.log("[Nexus Sandbox] Executing script in sandbox...", code);
                  try {
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
                          
                          const timeoutPromise = new Promise((_, reject) => 
                              setTimeout(() => reject(new Error("Timeout: Script execution exceeded 3000ms.")), 3000)
                          );
                          result = await (Promise.race([executor(code), timeoutPromise]) as Promise<any>);
                      } else {
                          const activeWorker = worker;
                          result = await new Promise((resolve, reject) => {
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
                      store.updateMessage(modelId, `\n[ SYS: Script Execution Result: ${functionResponse.result} ]\n`);
                  } catch (execError: any) {
                      console.error("[Nexus Sandbox] Error:", execError);
                      functionResponse = { error: String(execError) };
                      store.updateMessage(modelId, `\n[ SYS_ERROR: Script Sandbox failed: ${execError.message || execError} ]\n`);
                  }
              }
              else if (fnCall.name === 'render_data_chart') {
                  const { title, chartData } = args;
                  store.setDataPanelState(true, String(title || "Data Chart"), String(chartData), "chart", "none");
                  store.updateMessage(modelId, `\n[ SYS: Rendered Chart: ${title} ]\n`);
              }
            } catch(err) {
              functionResponse = { error: String(err) };
            }
            
            functionResponses.push({
              name: fnCall.name,
              id: fnCall.id || "fn_id_" + Date.now(),
              response: functionResponse
            });
          }
        }
      }

      if (hasFunctionCall && functionResponses.length > 0) {
        let nextHistory = [...chatHistory, { 
           role: 'model', 
           parts: modelParts 
        }];
        nextHistory.push({
          role: 'user',
          parts: functionResponses.map(fr => ({
            functionResponse: fr
          }))
        });
        await runStream(nextHistory);
      }
    };

    await runStream(history);

    store.setSystemState('idle');
  } catch (error: any) {
    console.error("Chat Error:", error);
    store.updateMessage(modelId, "\n[SYS_ERROR]: " + error.message);
    store.setSystemState('idle');
  }
};

export const generateImageMessage = async (prompt: string) => {
  const ai = getClient();
  const store = useAIStore.getState();

  const id = Date.now().toString();
  store.addMessage({ id, role: 'user', text: prompt });
  
  const modelId = Date.now().toString() + "_model";
  store.addMessage({ id: modelId, role: 'model', text: '[ Generating Optical Render... ]' });
  store.setSystemState('thinking');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/jpeg;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (imageUrl) {
      useAIStore.setState(state => ({
        messages: state.messages.map(m => m.id === modelId ? { ...m, text: 'Render complete.', imageUrl, isImage: true } : m)
      }));
      store.setLatestGeneratedImage(imageUrl);
      store.setImagePanelOpen(true);
    } else {
      store.updateMessage(modelId, "\n[ Error: Render failed ]");
    }
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    store.updateMessage(modelId, "\n[SYS_ERROR]: " + error.message);
  } finally {
    store.setSystemState('idle');
  }
};
