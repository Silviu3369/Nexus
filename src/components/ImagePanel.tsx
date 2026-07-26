import { useAIStore } from '../store/aiStore';
import { motion } from 'framer-motion';
import { Focus, Download, AlertTriangle } from 'lucide-react';

export const ImagePanel = () => {
  const { latestGeneratedImage, setImagePanelOpen } = useAIStore();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, x: 100, filter: 'blur(30px)' }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, x: 50, filter: 'blur(20px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
      className="absolute top-1/2 -translate-y-1/2 left-8 w-[fit-content] md:w-auto max-w-[80vw] md:max-w-[50vw] h-[fit-content] max-h-[85vh] bg-black/30 backdrop-blur-3xl border border-white/20 rounded-3xl z-20 flex flex-col font-mono shadow-[0_0_80px_rgba(192,132,252,0.15)] overflow-hidden ring-1 ring-white/10 AR-panel"
    >
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-gradient-to-r from-purple-950/20 to-transparent shrink-0">
         <div className="flex items-center space-x-3 text-purple-300">
           <Focus className="w-4 h-4" />
           <span className="text-[10px] uppercase tracking-widest">Display // Visual Matrix</span>
         </div>
         <div className="flex space-x-3 text-white/30">
            <button onClick={() => setImagePanelOpen(false)} className="hover:text-red-400 transition-colors uppercase text-[9px] tracking-widest border border-white/10 px-2 py-0.5 rounded backdrop-blur bg-white/5">
              Close [X]
            </button>
         </div>
      </div>

      <div className="p-4 flex flex-col items-center justify-center min-h-[300px] flex-1 overflow-hidden relative">
        {latestGeneratedImage ? (
          <div className="relative group w-full h-full flex justify-center items-center rounded-lg overflow-hidden border border-white/10 bg-black/40">
            <img 
              src={latestGeneratedImage} 
              className="max-w-full max-h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              alt="AI Holographic Render"
              referrerPolicy="no-referrer"
            />
            {/* Overlay Grid */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwIDBMMCAwTDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] opacity-30 z-10 mix-blend-overlay pointer-events-none" />
            
            {/* Download Bar Always Intact & Visible */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 flex justify-between items-center opacity-90 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
               <span className="text-[10px] text-white/90 uppercase tracking-widest ml-1 font-semibold drop-shadow-md">Integrity: 100%</span>
               <a href={latestGeneratedImage} download="nexus_render.jpg" className="p-2.5 bg-purple-600/60 backdrop-blur-md text-white rounded hover:bg-purple-500 hover:scale-105 transition-all pointer-events-auto shadow-lg mr-1 ring-1 ring-white/20">
                 <Download className="w-4 h-4" />
               </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3 opacity-40">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-xs text-white uppercase tracking-widest">Signal Lost</p>
            <p className="text-[9px] text-white/50 uppercase tracking-widest max-w-[200px]">Awaiting optical payload stream from Main Frame.</p>
          </div>
        )}
      </div>
      
    </motion.div>
  );
};
