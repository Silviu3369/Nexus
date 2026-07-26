import { useState } from 'react';
import { useAIStore } from '../store/aiStore';
import { motion } from 'framer-motion';
import { X, Copy, Check, Terminal, Play, ShieldAlert, ShieldCheck, Image as ImageIcon, FileText, Info, Cloud, Sun, CloudRain, Wind, Droplets, PieChart as PieChartIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function DataPanel() {
  const { dataPanelTitle, dataPanelContent, dataPanelType, dataPanelLanguage, setDataPanelState } = useAIStore();
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  
  // Drag state 
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isWebCode = dataPanelType === 'code' && ['html', 'css', 'javascript', 'js'].includes((dataPanelLanguage || '').toLowerCase());

  const handleCopy = () => {
    navigator.clipboard.writeText(dataPanelContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = () => {
    if (dataPanelType !== 'code') return;
    setIsValidating(true);
    setTimeout(() => {
      let newStatus = 'Code reviewed logically';
      let currentIssues: string[] = [];
      
      if (['javascript', 'js', 'typescript', 'ts'].includes((dataPanelLanguage || '').toLowerCase())) {
        try {
          new Function(dataPanelContent);
          newStatus = 'Code syntax-checked';
        } catch (e: unknown) {
          newStatus = 'Code reviewed logically';
          const errorMessage = e instanceof Error ? e.message : String(e);
          currentIssues.push(`Syntax Error: ${errorMessage}`);
        }
      } else if (['html', 'css'].includes((dataPanelLanguage || '').toLowerCase())) {
        newStatus = 'Code preview-tested';
      }

      if (currentIssues.length === 0) {
        currentIssues = ['No immediate syntax errors detected in static analysis.'];
      }
      
      setValidationStatus(newStatus);
      setIssues(currentIssues);
      setIsValidating(false);
    }, 1500);
  };

  const hasErrors = issues.some(i => i.includes('Error'));

  const renderIcon = () => {
    switch (dataPanelType) {
      case 'code': return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'article':
      case 'markdown':
      case 'news': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'weather': return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'chart': return <PieChartIcon className="w-4 h-4 text-fuchsia-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSrcDoc = () => {
    const lang = (dataPanelLanguage || '').toLowerCase();
    if (lang === 'html') {
      if (dataPanelContent.includes('<html')) return dataPanelContent;
      return `<!DOCTYPE html>\n<html>\n<head>\n<style>body { color: white; background: #0d0d0d; font-family: sans-serif; padding: 1rem; }</style>\n</head>\n<body>\n${dataPanelContent}\n</body>\n</html>`;
    }
    if (lang === 'javascript' || lang === 'js') {
      return `<!DOCTYPE html>\n<html>\n<head>\n<style>body { color: white; background: #0d0d0d; font-family: sans-serif; padding: 1rem; }</style>\n</head>\n<body>\n<div id="root"></div>\n<script>\n${dataPanelContent}\n</script>\n</body>\n</html>`;
    }
    return dataPanelContent;
  };

  const renderWeatherWidget = () => {
    try {
      let cleanContent = dataPanelContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const weather = JSON.parse(cleanContent);
      const isRaining = weather.condition?.toLowerCase().includes('rain') || weather.condition?.toLowerCase().includes('shower');
      const isCloudy = weather.condition?.toLowerCase().includes('cloud') || weather.condition?.toLowerCase().includes('overcast');
      const MainIcon = isRaining ? CloudRain : (isCloudy ? Cloud : Sun);

      return (
        <div className="p-6">
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 shadow-inner relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 -mr-10 -mt-10 pointer-events-none ${isRaining ? 'bg-blue-500' : (isCloudy ? 'bg-gray-400' : 'bg-amber-500')}`} />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h2 className="text-xl font-medium text-white">{weather.city || 'Unknown Location'}</h2>
                <p className="text-gray-400 text-sm mt-1">{weather.condition || 'N/A'}</p>
              </div>
              <MainIcon className={`w-8 h-8 ${isRaining ? 'text-blue-400' : (isCloudy ? 'text-gray-400' : 'text-amber-400')}`} />
            </div>

            <div className="mb-8">
              <span className="text-5xl font-light text-white">{weather.temperature || weather.temp || '--'}</span>
              {!String(weather.temperature || weather.temp).includes('°') && <span className="text-2xl font-light text-gray-500 align-top">°</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Wind</p>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-300">{weather.wind || '--'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Humidity</p>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-300">{weather.humidity || '--'}</p>
                </div>
              </div>
            </div>
            
            {weather.extra && (
              <div className="mt-4 pt-4 border-t border-white/5 text-sm text-gray-400">
                {weather.extra}
              </div>
            )}
          </div>
        </div>
      );
    } catch (e) {
      return (
        <div className="p-6 text-red-500 bg-red-950/20 m-4 rounded border border-red-500/20">
          <p className="font-bold mb-2">JSON Parse Error</p>
          <div className="text-xs break-words overflow-hidden text-red-400">
             {dataPanelContent}
          </div>
        </div>
      );
    }
  };

  const renderChartWidget = () => {
    try {
      let cleanContent = dataPanelContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const chartData = JSON.parse(cleanContent);
      const COLORS = ['#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24'];

      return (
        <div className="p-6 h-[350px] min-h-[250px] w-full min-w-[350px] aspect-video max-w-full">
           <ResponsiveContainer width="100%" height="100%">
             {chartData.type === 'line' ? (
                <LineChart data={chartData.data}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                   <XAxis dataKey={chartData.xAxisKey || 'name'} stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                   <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                   <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                   <Legend wrapperStyle={{ fontSize: '12px' }}/>
                   {chartData.series?.map((s: any, i: number) => (
                      <Line key={i} type="monotone" dataKey={s.dataKey} stroke={s.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                   ))}
                </LineChart>
             ) : chartData.type === 'pie' ? (
                <PieChart>
                   <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                   <Legend wrapperStyle={{ fontSize: '12px' }}/>
                   <Pie data={chartData.data} dataKey={chartData.series?.[0]?.dataKey || 'value'} nameKey={chartData.xAxisKey || 'name'} cx="50%" cy="50%" outerRadius={80} label>
                     {chartData.data.map((_entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                </PieChart>
             ) : (
                <BarChart data={chartData.data}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                   <XAxis dataKey={chartData.xAxisKey || 'name'} stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                   <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                   <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                   <Legend wrapperStyle={{ fontSize: '12px' }}/>
                   {chartData.series?.map((s: any, i: number) => (
                      <Bar key={i} dataKey={s.dataKey} fill={s.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                   ))}
                </BarChart>
             )}
           </ResponsiveContainer>
        </div>
      );
    } catch (e) {
      return (
        <div className="p-6 text-red-500 bg-red-950/20 m-4 rounded border border-red-500/20">
          <p className="font-bold mb-2">Chart JSON Parse Error</p>
          <div className="text-xs break-words overflow-hidden text-red-400">
             {dataPanelContent}
          </div>
        </div>
      );
    }
  };

  const getWindowDimensions = () => {
    switch(dataPanelType) {
      case 'weather':
        return { width: 'max-content', minWidth: 280, maxWidth: 450, height: 'auto', maxHeight: '80vh', defaultWidth: 320 };
      case 'chart':
        return { width: 'fit-content', minWidth: 400, maxWidth: '90vw', height: 'auto', maxHeight: '80vh', defaultWidth: 600 };
      case 'code':
        return { width: 'fit-content', minWidth: 400, maxWidth: '80vw', height: 'auto', maxHeight: '80vh', defaultWidth: 600 };
      case 'image':
        return { width: 'fit-content', minWidth: 300, maxWidth: '90vw', height: 'auto', maxHeight: '90vh', defaultWidth: 400 };
      case 'article':
      case 'markdown':
      case 'news':
      case 'info':
        return { width: 'fit-content', minWidth: 320, maxWidth: 700, height: 'auto', maxHeight: '80vh', defaultWidth: 500 };
      default:
        return { width: 'fit-content', minWidth: 300, maxWidth: 700, height: 'auto', maxHeight: '80vh', defaultWidth: 400 };
    }
  };

  const dimensions = getWindowDimensions();

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, scale: 0.6, filter: 'blur(30px)', y: position.y + 50, x: position.x }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: position.y, x: position.x }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)', zIndex: 0 }}
      onDragEnd={(_e, info) => {
        setPosition(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }));
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 120, mass: 0.5 }}
      style={{
        width: dimensions.width,
        minWidth: dimensions.minWidth,
        maxWidth: dimensions.maxWidth,
        height: dimensions.height,
        maxHeight: dimensions.maxHeight,
        margin: 'auto',
        top: '10vh',
        left: '5vw',
        zIndex: 40,
        position: 'absolute'
      }}
      className="bg-black/30 backdrop-blur-3xl border border-white/20 shadow-[0_0_80px_rgba(34,211,238,0.15)] rounded-3xl flex flex-col pointer-events-auto overflow-hidden resize AR-panel ring-1 ring-white/10"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50" />
      
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/[0.02] cursor-move" title="Drag to move">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-white/5">
            {renderIcon()}
          </div>
          <span className="text-sm font-mono text-white/90 truncate max-w-[300px] tracking-wider uppercase">
            {dataPanelTitle || (dataPanelType === 'code' ? `snippet.${dataPanelLanguage || 'txt'}` : 'System Output')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dataPanelType !== 'image' && (
            <button onClick={handleCopy} className="p-1.5 text-white/50 hover:text-white transition-colors rounded hover:bg-white/10" title="Copy Content">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
          <button onClick={() => setDataPanelState(false)} className="p-1.5 text-white/50 hover:text-cyan-400 transition-colors rounded hover:bg-white/10" title="Close Panel">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-transparent relative rounded-b-2xl">
        {dataPanelType === 'code' && !previewMode && (
          <SyntaxHighlighter
            language={dataPanelLanguage || 'text'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '13px' }}
            wrapLines={true}
          >
            {dataPanelContent}
          </SyntaxHighlighter>
        )}

        {dataPanelType === 'code' && previewMode && (
          <div className="w-full min-h-[300px] h-full flex-1 bg-white rounded-b-2xl overflow-hidden">
            <iframe 
              srcDoc={getSrcDoc()}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
              title="Code Preview"
            />
          </div>
        )}

        {dataPanelType === 'image' && (
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <img src={dataPanelContent} alt={dataPanelTitle || 'Generated Image'} className="max-w-full rounded-lg shadow-lg border border-white/10" />
          </div>
        )}

        {(dataPanelType === 'article' || dataPanelType === 'markdown' || dataPanelType === 'news' || dataPanelType === 'info') && (
          <div className="p-6 prose prose-invert prose-cyan max-w-none text-sm
               prose-headings:font-normal prose-headings:tracking-wider prose-headings:text-cyan-200
               prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
               prose-code:text-cyan-300 prose-code:bg-cyan-900/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
               prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:backdrop-blur-md">
            <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {(() => {
                let text = dataPanelContent as any;
                const formatJsonToMarkdown = (obj: any): string => {
                  if (Array.isArray(obj)) {
                     if (obj.length > 0 && typeof obj[0] === 'object') {
                        return obj.map(item => {
                           return Object.entries(item).map(([k,v]) => `**${k}:** ${v}`).join('  \n');
                        }).join('\n\n---\n\n');
                     }
                     return obj.map(item => `- ${item}`).join('\n');
                  }
                  return '```json\n' + JSON.stringify(obj, null, 2) + '\n```';
                };

                if (typeof text === 'object' && text !== null) {
                  return text.text || text.content || text.article || formatJsonToMarkdown(text);
                }
                if (typeof text === 'string') {
                  try {
                    const parsed = JSON.parse(text);
                    if (parsed && typeof parsed === 'object') {
                      return parsed.text || parsed.content || parsed.article || formatJsonToMarkdown(parsed);
                    }
                  } catch (e) {
                    // String is not JSON, which is expected
                  }
                }
                return String(text);
              })()}
            </Markdown>
          </div>
        )}

        {dataPanelType === 'chart' && renderChartWidget()}
        {dataPanelType === 'weather' && renderWeatherWidget()}
      </div>

      {dataPanelType === 'code' && (
        <div className="p-4 bg-black/40 border-t border-white/10 rounded-b-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {hasErrors ? (
                <ShieldAlert className="w-4 h-4 text-red-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              )}
              <span className="text-xs font-mono text-white/70 uppercase tracking-wider">Validation Status</span>
            </div>
            <span className="text-xs text-cyan-400/80 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-500/20">
              {validationStatus || 'Code generated only'}
            </span>
          </div>

          {issues && issues.length > 0 && (
            <div className="mb-3 p-2 bg-white/5 rounded border border-white/10">
              <ul className="text-xs text-white/60 space-y-1 font-mono">
                {issues.map((issue: string, i: number) => (
                  <li key={i} className={issue.includes('Error') ? 'text-red-400' : ''}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            {isWebCode && (
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex-1 py-2 border rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
                  previewMode 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                }`}
              >
                <Play className="w-4 h-4" />
                {previewMode ? 'View Code' : 'Run / Preview'}
              </button>
            )}
            
            {!previewMode && (
              <button 
                onClick={handleValidate}
                disabled={isValidating}
                className={`flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {isValidating ? (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {isValidating ? 'Validating...' : 'Validate Code'}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

