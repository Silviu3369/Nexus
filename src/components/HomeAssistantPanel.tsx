import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Server, Lightbulb, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { haService } from '../services/haService';

interface HomeAssistantPanelProps {
  onClose: () => void;
}

export function HomeAssistantPanel({ onClose }: HomeAssistantPanelProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [entityId, setEntityId] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentState, setCurrentState] = useState<string | null>(null);

  useEffect(() => {
    const config = haService.getConfig();
    setUrl(config.url);
    setToken(config.token);
    setEntityId(config.entityId);
    
    if (config.url && config.token && config.entityId) {
      testConnection(config.url, config.token, config.entityId);
    }
  }, []);

  const testConnection = async (testUrl: string, testToken: string, testEntity: string) => {
    setStatus('testing');
    try {
      // Temporarily save to use the service
      haService.saveConfig(testUrl, testToken, testEntity);
      const data = await haService.getEntityState();
      setStatus('success');
      setCurrentState(data.state);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Connection failed');
    }
  };

  const handleSave = () => {
    haService.saveConfig(url, token, entityId);
    testConnection(url, token, entityId);
  };

  const handleToggle = async () => {
    try {
      await haService.toggleEntity();
      // Re-fetch state after a short delay
      setTimeout(async () => {
        const data = await haService.getEntityState();
        setCurrentState(data.state);
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className="absolute right-8 top-28 w-96 bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl overflow-hidden z-40 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
      drag
      dragMomentum={false}
      dragConstraints={{ left: -1000, right: 0, top: -100, bottom: 500 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-cyan-950/20">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs text-cyan-300 font-bold tracking-widest uppercase">Home Assistant Uplink</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4 font-mono text-xs">
        
        {/* Warning about Insecure Content */}
        <div className="p-3 bg-orange-950/40 border border-orange-500/30 rounded-lg text-orange-200/80 flex space-x-3">
          <AlertTriangle className="w-8 h-8 text-orange-400 shrink-0" />
          <p className="leading-relaxed">
            Asigură-te că ai permis <strong>Insecure Content</strong> în browser. Dacă HA-ul tău e pe `http://` iar noi suntem pe `https://`, browserul va bloca cererea.
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-cyan-500/70 mb-1">LOCAL URL</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.100:8123"
              className="w-full bg-black/50 border border-cyan-900/50 rounded-md p-2 text-cyan-100 placeholder-cyan-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-500/70 mb-1">LONG-LIVED ACCESS TOKEN</label>
            <input 
              type="password" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ey..."
              className="w-full bg-black/50 border border-cyan-900/50 rounded-md p-2 text-cyan-100 placeholder-cyan-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-500/70 mb-1">ENTITY ID (ESP8266)</label>
            <input 
              type="text" 
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="light.esp8266_led"
              className="w-full bg-black/50 border border-cyan-900/50 rounded-md p-2 text-cyan-100 placeholder-cyan-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-cyan-950/50 border border-cyan-500/50 text-cyan-300 py-2 rounded-md hover:bg-cyan-900/50 transition-colors uppercase tracking-widest font-bold flex justify-center items-center space-x-2"
        >
          <LinkIcon className="w-4 h-4" />
          <span>Connect & Test</span>
        </button>

        {/* Status Area */}
        <div className="pt-2 border-t border-cyan-900/30">
          {status === 'testing' && <p className="text-cyan-500 text-center animate-pulse">Testing connection...</p>}
          {status === 'error' && (
            <div className="text-red-400 text-center p-2 bg-red-950/20 rounded border border-red-900/30">
              Connection Failed. <br/> {errorMessage}
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Uplink Established</span>
              </div>
              
              <div className="flex items-center justify-between w-full p-2 bg-black/40 rounded border border-white/5">
                <div className="flex items-center space-x-2">
                  <Lightbulb className={`w-4 h-4 ${currentState === 'on' ? 'text-yellow-400' : 'text-gray-600'}`} />
                  <span className="text-white/60">State: <span className="text-white uppercase">{currentState}</span></span>
                </div>
                <button 
                  onClick={handleToggle}
                  className="px-3 py-1 bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/30 rounded text-cyan-300 transition-colors"
                >
                  TOGGLE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
