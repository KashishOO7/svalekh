import { useResumeStore } from '../store/useResumeStore';
import { Zap, Target, FileText, Upload, Plus, Lock, X } from 'lucide-react';
import { TEMPLATE_LIST } from '../data/templates';

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
      <div className="relative bg-[#18181A] border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[95vh] animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={() => setHasSeenWelcome(true)}
          title="Close"
          aria-label="Close guide"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <X className="w-4 h-4" />
        </button>

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
              <p className="text-base text-zinc-400 leading-relaxed">
                Stop uploading your career history to third-party data-harvesters. Build, ATS-optimize, and export your resume entirely on your own machine.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-3 text-zinc-400">
                  <Lock className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Absolute Privacy</h3>
                    <p className="text-sm mt-1.5 text-zinc-400 leading-relaxed">Zero database. Zero data collection. Everything processes locally in your browser.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-zinc-400">
                  <Zap className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Zero Latency</h3>
                    <p className="text-sm mt-1.5 text-zinc-400 leading-relaxed">Instant real-time layout rendering and native PDF/DOCX generation without server lag.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-zinc-400">
                  <Target className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">Local ATS Intelligence</h3>
                    <p className="text-sm mt-1.5 text-zinc-400 leading-relaxed">Integrated keyword scanner validates your alignment with job descriptions entirely offline.</p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/KashishOO7/svalekh"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors group/gh w-fit outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4" fill="currentColor"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56v-2c-3.34.7-4.04-1.4-4.04-1.4-.55-1.36-1.34-1.72-1.34-1.72-1.09-.72.08-.71.08-.71 1.2.08 1.83 1.2 1.83 1.2 1.07 1.78 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.29-5.47-1.29-5.47-5.74 0-1.27.47-2.3 1.23-3.11-.12-.29-.53-1.47.12-3.05 0 0 1-.31 3.3 1.18a11.6 11.6 0 0 1 6 0c2.28-1.49 3.29-1.18 3.29-1.18.65 1.58.24 2.76.12 3.05.77.81 1.23 1.84 1.23 3.11 0 4.46-2.81 5.44-5.49 5.73.43.36.81 1.07.81 2.16v3.2c0 .31.21.68.82.56A12.01 12.01 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z"/></svg>
              <span className="border-b border-transparent group-hover/gh:border-zinc-400">Open source - view on GitHub</span>
            </a>
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
                  <h3 className="text-sm font-bold text-zinc-200">Import a Résumé</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Load a JSON backup or a text-based PDF.</p>
                </div>
              </button>
            </div>

            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Or start from an example résumé</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATE_LIST.filter((t) => t.key !== 'blank').map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleStart(t.key)}
                  title={`Load the ${t.label} example`}
                  className="group relative p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-600 transition-all flex flex-col gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                      style={{ backgroundColor: t.themeOverride?.accentColor || '#52525b' }}
                    />
                    <span className="text-sm font-bold text-zinc-100 leading-tight">{t.label}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{t.blurb}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                    <FileText className="w-3 h-3" />
                    {t.themeOverride?.layoutMode === 'two-column' ? 'Two-column' : 'Single column'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-8 border-t border-zinc-800 pt-5">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">How it works</h3>
              <ol className="space-y-3 text-sm text-zinc-400 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-zinc-600 font-bold">1.</span>
                  <span><span className="text-zinc-200 font-semibold">Pick a starting point</span> above - a template, a blank canvas, or import a PDF / JSON backup.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-600 font-bold">2.</span>
                  <span><span className="text-zinc-200 font-semibold">Click any text to edit it</span> inline. Hover a section, entry, or line and its move / delete / type controls appear in the margin beside it.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-600 font-bold">3.</span>
                  <span><span className="text-zinc-200 font-semibold">Use the left sidebar</span> for fonts, spacing, the two-column split and the live ATS score - and <span className="text-zinc-200 font-semibold">Magic Fit</span> to auto-fit onto one page.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-600 font-bold">4.</span>
                  <span><span className="text-zinc-200 font-semibold">Redact</span> sensitive text (it is stripped from every export), then export to PDF / DOC / HTML - or save a JSON backup. Nothing ever leaves your browser.</span>
                </li>
              </ol>
              <p className="mt-4 text-xs text-zinc-500">
                Reopen this any time from the <span className="text-zinc-400 font-semibold">Guide</span> button at the top of the sidebar.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}