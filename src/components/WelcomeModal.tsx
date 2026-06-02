import { useResumeStore } from '../store/useResumeStore';
import { Zap, Target, FileText, Upload, Plus, Lock } from 'lucide-react';

interface WelcomeModalProps {
  onImport: () => void;
}

export default function WelcomeModal({ onImport }: WelcomeModalProps) {
  const { hasSeenWelcome, setHasSeenWelcome, loadTemplate } = useResumeStore();

  if (hasSeenWelcome) return null;

  const handleStart = (template: 'blank' | 'watney' | 'cooper' | 'grace') => {
    loadTemplate(template);
    setHasSeenWelcome(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-12">
      <div className="bg-[#18181A] border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div className="flex flex-col md:flex-row h-full">
          <div className="md:w-5/12 bg-zinc-900/50 p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800">
            <div>
              <div className="flex items-baseline gap-3 mb-6 select-none">
                <h1 className="text-4xl font-black text-white tracking-tight">Svalekh</h1>
                <span className="text-2xl text-zinc-500 font-serif tracking-widest">स्वलेख</span>
              </div>
              <p className="text-lg text-zinc-300 font-medium leading-snug mb-4">
                Your Personal Mark.<br/>Your Private Data.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Stop uploading your career history to third-party data-harvesters. Build, ATS-optimize, and export your resume entirely on your own machine.
              </p>
            </div>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-3 text-zinc-400">
                <Lock className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Absolute Privacy</h3>
                  <p className="text-xs mt-1 leading-relaxed">Zero database. Zero data collection. Everything processes locally in your browser.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-zinc-400">
                <Zap className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Zero Latency</h3>
                  <p className="text-xs mt-1 leading-relaxed">Instant real-time layout rendering and native PDF/DOCX generation without server lag.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-zinc-400">
                <Target className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Local ATS Intelligence</h3>
                  <p className="text-xs mt-1 leading-relaxed">Integrated keyword scanner validates your alignment with job descriptions entirely offline.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-7/12 p-8 md:p-10 flex flex-col justify-center bg-[#18181A]">
            <h2 className="text-xl font-bold text-white mb-6">Initialize Your Canvas</h2>
            
            <div className="space-y-3 mb-8">
              <button 
                onClick={() => handleStart('blank')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-500 transition-all group text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <div className="bg-zinc-700 p-2.5 rounded-lg group-hover:bg-zinc-600 transition-colors">
                  <Plus className="w-5 h-5 text-zinc-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Start from Scratch</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Open a clean, empty workspace.</p>
                </div>
              </button>

              <button 
                onClick={() => {
                  onImport();
                  setHasSeenWelcome(true);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-transparent hover:bg-zinc-800/30 hover:border-zinc-600 transition-all group text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <div className="bg-zinc-800 p-2.5 rounded-lg group-hover:bg-zinc-700 transition-colors">
                  <Upload className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Import Backup Data</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Load an existing JSON backup file.</p>
                </div>
              </button>
            </div>

            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Or Load a Layout Preset</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => handleStart('watney')}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 transition-all flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <FileText className="w-5 h-5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Executive</span>
              </button>

              <button 
                onClick={() => handleStart('cooper')}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 transition-all flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <FileText className="w-5 h-5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Startup</span>
              </button>

              <button 
                onClick={() => handleStart('grace')}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 transition-all flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <FileText className="w-5 h-5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Academic</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}