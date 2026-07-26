import React, { useState, useRef, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { sendChatMessage, generateImageMessage } from '../services/chatService';
import { Send, Map, Search, Image as ImageIcon, TerminalSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChatPanel = () => {
  const { setChatOpen, messages, groundingMode, setGroundingMode, imageSize, setImageSize } = useAIStore();
  const [input, setInput] = useState('');
  const [isImageMode, setIsImageMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isImageMode) {
      generateImageMessage(input);
    } else {
      sendChatMessage(input);
    }
    setInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -100, y: 0, scale: 0.8, filter: 'blur(30px)' }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -50, scale: 0.9, filter: 'blur(20px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
      className="absolute right-4 bottom-4 w-80 md:w-[400px] h-[fit-content] max-h-[90vh] bg-black/30 backdrop-blur-3xl border border-white/20 rounded-3xl z-30 flex flex-col font-mono shadow-[0_0_60px_rgba(34,211,238,0.15)] overflow-hidden ring-1 ring-white/10 AR-panel"
    >
      {/* Shell Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40">
         <div className="flex items-center space-x-3">
           <TerminalSquare className="w-4 h-4 text-cyan-400" />
           <span className="text-[10px] uppercase tracking-widest text-cyan-200">root@nexus:~/terminal</span>
         </div>
         <div className="flex space-x-2">
           <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 hover:bg-red-500 cursor-pointer transition-colors" onClick={() => setChatOpen(false)} />
           <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
         </div>
      </div>

      {/* Terminal View area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide text-xs" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center opacity-40">
            <p className="font-mono tracking-widest text-cyan-400/50 uppercase">
              $ bash init --link_to_core <br /> [ waiting for input... ]
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 200, delay: idx * 0.05 }}
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'text-cyan-300' : 'text-gray-300'}`}
          >
            <span className="text-[9px] tracking-widest uppercase mb-1 opacity-50 flex items-center">
              {msg.role === 'user' ? (
                <><span className="text-emerald-400 mr-2">➜</span> operator:~$</>
              ) : (
                <><span className="text-cyan-400 mr-2">⚡</span> nexus:~/sys$</>
              )}
            </span>
            <div className="pl-4 border-l-2 border-white/5">
               <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
               {msg.imageUrl && (
                 <span className="text-purple-400 text-[10px] mt-2 block opacity-70">
                   [ Render payload transferred to Main Display Board... ]
                 </span>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Terminal Input Controls */}
      <div className="p-3 bg-black/60 border-t border-white/10 backdrop-blur-xl">
        
        <div className="flex items-center justify-between mb-3 text-[9px] uppercase tracking-widest">
          {/* Mode Switchers */}
          <div className="flex space-x-1">
            <button 
              onClick={() => setIsImageMode(false)}
              className={`px-3 py-1.5 rounded transition-all ${!isImageMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-white/30 hover:text-white/70 border border-transparent'}`}
            >
              $ text
            </button>
            <button 
              onClick={() => setIsImageMode(true)}
              className={`px-3 py-1.5 rounded transition-all flex items-center space-x-2 ${isImageMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-white/30 hover:text-white/70 border border-transparent'}`}
            >
              <ImageIcon className="w-3 h-3" /> <span>$ img</span>
            </button>
          </div>

          {!isImageMode ? (
            <div className="flex space-x-1">
               <button 
                onClick={() => setGroundingMode(groundingMode === 'search' ? 'none' : 'search')}
                className={`flex items-center px-2 py-1 rounded transition-colors ${groundingMode === 'search' ? 'bg-blue-600/30 text-blue-200' : 'text-white/30'}`}
               >
                 <Search className="w-3 h-3 mr-1" /> [WEB]
               </button>
               <button 
                onClick={() => setGroundingMode(groundingMode === 'maps' ? 'none' : 'maps')}
                className={`flex items-center px-2 py-1 rounded transition-colors ${groundingMode === 'maps' ? 'bg-emerald-600/30 text-emerald-200' : 'text-white/30'}`}
               >
                 <Map className="w-3 h-3 mr-1" /> [MAP]
               </button>
            </div>
          ) : (
             <select 
               className="bg-purple-950/40 text-purple-200 outline-none border border-purple-500/30 rounded px-2 py-1 cursor-pointer appearance-none text-center"
               value={imageSize}
               onChange={(e) => setImageSize(e.target.value as any)}
             >
               <option className="bg-black text-white" value="1K">1K</option>
               <option className="bg-black text-white" value="2K">2K</option>
               <option className="bg-black text-white" value="4K">4K</option>
             </select>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-center w-full">
          <span className={`absolute left-3 text-xs ${isImageMode ? 'text-purple-500' : 'text-cyan-500'}`}>&gt;</span>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isImageMode ? "execute_render --prompt=\"...\"" : "exec_sys_command \"...\""}
            className={`w-full bg-black/40 border-b border-white/10 focus:border-cyan-400 py-3 pl-8 pr-10 text-xs text-cyan-50 outline-none transition-all placeholder:text-white/10 placeholder:tracking-widest font-mono`}
          />
          <button 
            type="submit" 
            className={`absolute right-2 p-1.5 rounded-md transition-colors ${isImageMode ? 'text-purple-400 hover:bg-purple-500/20' : 'text-cyan-400 hover:bg-cyan-500/20'}`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </motion.div>
  );
};
