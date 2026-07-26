import { create } from 'zustand';

export type SystemState = 'idle' | 'listening' | 'speaking' | 'thinking';
export type ConnectionState = 'offline' | 'connecting' | 'connected' | 'error';
export type GroundingMode = 'none' | 'search' | 'maps';
export type ImageSize = '1K' | '2K' | '4K';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  isImage?: boolean;
}

export interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  boundingBox?: number[]; // [top, left, width, height] from 0 to 100
  status?: string;
  details?: string;
  diagnostics?: string;
  mockAttributes?: string; // JSON string of telemetry properties
  timestamp?: number;
  croppedImage?: string; // Base64 data URI of the captured video frame crop
}

export interface AIState {
  systemState: SystemState;
  connectionState: ConnectionState;
  errorMessage: string | null;
  isCameraActive: boolean;
  
  // Terminal Chat State
  isChatOpen: boolean;
  messages: ChatMessage[];
  groundingMode: GroundingMode;
  imageSize: ImageSize;
  
  // Image Viewer State
  isImagePanelOpen: boolean;
  latestGeneratedImage: string | null;
  
  // Data Panel State
  isDataPanelOpen: boolean;
  dataPanelTitle: string;
  dataPanelContent: string;
  dataPanelType: string;
  dataPanelLanguage?: string;
  
  // Home Assistant
  isHAPanelOpen: boolean;
  setHAPanelOpen: (isOpen: boolean) => void;

  // Spatial Object Tracking State
  detectedObjects: DetectedObject[];
  isolatedObject: DetectedObject | null;
  isIsolatedPanelOpen: boolean;
  photographedObjects: DetectedObject[];
  setDetectedObjects: (objects: DetectedObject[]) => void;
  setIsolatedObject: (obj: DetectedObject | null) => void;
  setIsolatedPanelOpen: (isOpen: boolean) => void;
  addPhotographedObject: (obj: DetectedObject) => void;
  deletePhotographedObject: (id: string) => void;
  clearPhotographedObjects: () => void;
  
  setSystemState: (state: SystemState) => void;
  setConnectionState: (state: ConnectionState) => void;
  setErrorMessage: (msg: string | null) => void;
  setCameraActive: (active: boolean) => void;
  
  setChatOpen: (isOpen: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, text: string) => void;
  setGroundingMode: (mode: GroundingMode) => void;
  setImageSize: (size: ImageSize) => void;

  setImagePanelOpen: (isOpen: boolean) => void;
  setLatestGeneratedImage: (url: string | null) => void;

  setDataPanelState: (isOpen: boolean, title?: string, content?: string, type?: string, language?: string) => void;
  appendChartData: (dataPoint: any) => void;
}

export const useAIStore = create<AIState>((set) => ({
  systemState: 'idle',
  connectionState: 'offline',
  errorMessage: null,
  isCameraActive: false,
  
  isChatOpen: false,
  messages: [],
  groundingMode: 'none',
  imageSize: '1K',
  
  isImagePanelOpen: false,
  latestGeneratedImage: null,
  
  isDataPanelOpen: false,
  dataPanelTitle: '',
  dataPanelContent: '',
  dataPanelType: 'article',
  dataPanelLanguage: '',
  isHAPanelOpen: false,

  // Spatial Object Tracking State
  detectedObjects: [],
  isolatedObject: null,
  isIsolatedPanelOpen: false,
  photographedObjects: [],
  setDetectedObjects: (detectedObjects) => set({ detectedObjects }),
  setIsolatedObject: (isolatedObject) => set({ isolatedObject }),
  setIsolatedPanelOpen: (isIsolatedPanelOpen) => set({ isIsolatedPanelOpen }),
  addPhotographedObject: (obj) => set((state) => {
    // Avoid double entries for the same ID while appending modern intelligence crops
    const filtered = state.photographedObjects.filter((o) => o.id !== obj.id);
    return { photographedObjects: [obj, ...filtered] };
  }),
  deletePhotographedObject: (id) => set((state) => ({
    photographedObjects: state.photographedObjects.filter((o) => o.id !== id)
  })),
  clearPhotographedObjects: () => set({ photographedObjects: [] }),
  
  setSystemState: (systemState: SystemState) => set({ systemState }),
  setConnectionState: (connectionState: ConnectionState) => set({ connectionState }),
  setErrorMessage: (errorMessage: string | null) => set({ errorMessage }),
  setCameraActive: (isCameraActive: boolean) => set({ isCameraActive }),
  
  setChatOpen: (isChatOpen: boolean) => set({ isChatOpen }),
  addMessage: (msg: ChatMessage) => set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id: string, text: string) => set((state) => ({
    messages: state.messages.map(m => m.id === id ? { ...m, text: m.text + text } : m)
  })),
  setGroundingMode: (groundingMode: GroundingMode) => set({ groundingMode }),
  setImageSize: (imageSize: ImageSize) => set({ imageSize }),

  setImagePanelOpen: (isImagePanelOpen: boolean) => set({ isImagePanelOpen }),
  setLatestGeneratedImage: (latestGeneratedImage: string | null) => set({ latestGeneratedImage }),
  setHAPanelOpen: (isHAPanelOpen: boolean) => set({ isHAPanelOpen }),

  setDataPanelState: (isDataPanelOpen, title, content, type, language) => set((state) => ({
      isDataPanelOpen,
      dataPanelTitle: title !== undefined ? title : state.dataPanelTitle,
      dataPanelContent: content !== undefined ? content : state.dataPanelContent,
      dataPanelType: type !== undefined ? type : state.dataPanelType,
      dataPanelLanguage: language !== undefined ? language : state.dataPanelLanguage
  })),
  appendChartData: (dataPoint: any) => set((state) => {
      if (state.dataPanelType !== 'chart') return state;
      try {
          const chartData = JSON.parse(state.dataPanelContent);
          if (Array.isArray(chartData.data)) {
              chartData.data.push(dataPoint);
              // keep max 50 points to prevent memory leak
              if (chartData.data.length > 50) {
                  chartData.data.shift();
              }
              return { dataPanelContent: JSON.stringify(chartData) };
          }
      } catch (e) {
          // ignore parsing error
      }
      return state;
  }),
}));
