import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from 'zustand';
import { useResumeStore, calculateATSScore } from './store/useResumeStore';
import RichTextEditor from './components/RichTextEditor';
import ImportModal from './components/ImportModal';
import WelcomeModal from './components/WelcomeModal';
import { Undo2, Redo2, Printer, ArrowUp, ArrowDown, Plus, Trash2, EyeOff, Sparkles, SlidersHorizontal, Layers, Contact2, Repeat, X, Wand2, Database, Eye, Code, Bot, Menu, FolderOpen, Save, Copy, Target, FileText, Columns, HelpCircle } from 'lucide-react';

export default function App() {
  const state = useResumeStore();
  const { undo, redo, clear } = useResumeStore.temporal.getState();
  const pastStates = useStore(useResumeStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useResumeStore.temporal, (s) => s.futureStates);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFitting, setIsFitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sectionToAdd, setSectionToAdd] = useState<{title: string, type: any}>({title: 'Experience', type: 'bullets'});
  const [llmPromptType, setLlmPromptType] = useState('enhance');
  const [isJobMatcherOpen, setIsJobMatcherOpen] = useState(false);
  const [matchScore, setMatchScore] = useState<{score: number, matched: string[], missing: string[]} | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const twoColRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);
  const liveRatioRef = useRef<number | null>(null);
  const [liveRatio, setLiveRatio] = useState<number | null>(null);
  const onResizeHandleDown = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    resizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!resizingRef.current || !twoColRef.current) return;
      const rect = twoColRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const r = Math.min(0.5, Math.max(0.2, (e.clientX - rect.left) / rect.width));
      liveRatioRef.current = r;
      setLiveRatio(r);
    };
    const up = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (liveRatioRef.current != null) {
        const committed = Number(liveRatioRef.current.toFixed(3));
        useResumeStore.getState().updateTheme('twoColumnRatio', committed);
        console.log('[TwoCol] committed ratio', committed);
      }
      liveRatioRef.current = null;
      setLiveRatio(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const atsAnalysis = useMemo(
    () => calculateATSScore(state),
    [state.name, state.tagline, state.contacts, state.sections],
  );

  const themeRef = useRef(state.theme); themeRef.current = state.theme;
  const fitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const PX_PER_IN = 96;

  const measureFit = () => {
    const el = document.getElementById('resume-print-target');
    const t = themeRef.current;
    const paddingPx = (t.marginTop + t.marginBottom) * PX_PER_IN;
    const printable = (11 - t.marginTop - t.marginBottom) * PX_PER_IN;
    const contentHeight = el ? el.scrollHeight - paddingPx : 0;
    return { el, printable, contentHeight };
  };

  const cleanName = () => state.name.replace(/<[^>]*>?/gm, '').trim();
  const fileBase = () => (cleanName().replace(/\s+/g, '_') || 'svalekh');

  const BLOCK_CHAR = '\u2588';
  const blocksForExport = (text: string) => {
    const len = (text || '').replace(/\s+/g, '').length;
    return BLOCK_CHAR.repeat(Math.min(Math.max(len, 2), 60));
  };
  const maskRedactedClone = (root: HTMLElement) => {
    const marks = root.querySelectorAll('mark[data-redacted]');
    marks.forEach((m) => { (m as HTMLElement).textContent = blocksForExport(m.textContent || ''); });
    console.log('[Redact][export] masked', marks.length, 'inline redaction(s) before serializing export');
    return marks.length;
  };

  useEffect(() => {
    const recalc = () => {
      if (canvasRef.current) {
        const padding = 48;
        const available = canvasRef.current.clientWidth - padding;
        setPreviewScale(Math.min(1, available / 816));
      }
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImportOpen(false);
        state.setIsLLMModalOpen(false);
        setIsJobMatcherOpen(false);
        if (!state.hasSeenWelcome && state.isDirty) {
          state.setHasSeenWelcome(true);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const handlePrint = () => { setPreviewMode(true); setTimeout(() => { window.print(); setPreviewMode(false); }, 100); };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ name: state.name, tagline: state.tagline, theme: state.theme, contacts: state.contacts, sections: state.sections }, null, 2));
    const downloadAnchor = document.createElement('a'); downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", "svalekh-backup.json"); document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove();
    state.showToast("Backup Saved Successfully!");
  };

  const exportDOCX = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume Export</title></head><body>";
    const footer = "</body></html>";
    const target = document.getElementById('resume-print-target');
    if (!target) return;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
    maskRedactedClone(clone);
    const sourceHTML = header + clone.innerHTML + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileBase()}_Resume.doc`;
    link.click();
    state.showToast("DOCX Exported Successfully!");
  };

  const exportHTML = () => {
    const target = document.getElementById('resume-print-target');
    if (!target) return;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
    maskRedactedClone(clone);
    const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${cleanName()} - Resume</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;600&family=Lato:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"><style>body { background-color: #52525b; display: flex; justify-content: center; padding: 2rem; font-family: ${state.theme.fontFamily}; } .resume-container { background: white; width: 8.5in; min-height: 11in; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); padding-top: ${state.theme.marginTop}in; padding-bottom: ${state.theme.marginBottom}in; padding-left: ${state.theme.marginLeft}in; padding-right: ${state.theme.marginRight}in; text-align: ${state.theme.alignment}; } mark[data-redacted], .is-redacted, .is-redacted * { background-color: #000000 !important; color: #000000 !important; text-shadow: none !important; }</style></head><body><div class="resume-container">${clone.innerHTML}</div></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `${fileBase()}_Resume.html`; a.click(); URL.revokeObjectURL(url);
    state.showToast("Webpage Exported Successfully!");
  };

  const runJobMatch = () => {
    if (!state.jobDescription.trim()) {
      window.alert("Please paste a job description first to scan for keywords.");
      return;
    }
    const strip = (html: string) => html.replace(/<[^>]*>?/gm, '').toLowerCase().trim();
    const resumeText = state.sections.map(s => strip(s.text || '') + ' ' + s.items?.map(i => strip(i.title) + ' ' + strip(i.description || '') + ' ' + i.bullets.map(strip).join(' ')).join(' ')).join(' ');
    
    const rawKeywords = state.jobDescription.match(/\b([A-Z][a-zA-Z0-9.\-#]+|management|agile|react|python|sales|marketing|data)\b/gi) || [];
    const stopWords = new Set(["the", "and", "must", "have", "with", "experience", "background", "environments", "for", "in", "of", "a", "an", "to", "or", "is", "are", "be", "will", "this", "that", "it", "from", "on", "as", "by", "not", "we", "you", "they", "their", "our", "all", "any", "can", "do", "how", "what", "which", "who", "why"]);
    
    const uniqueKeywords = Array.from(new Set(rawKeywords.map(k => k.toLowerCase()))).filter(k => k.length > 2 && !stopWords.has(k));
    
    const matched: string[] = [];
    const missing: string[] = [];
    uniqueKeywords.forEach(kw => { if (resumeText.includes(kw)) matched.push(kw); else missing.push(kw); });

    setMatchScore({ score: uniqueKeywords.length ? Math.round((matched.length / uniqueKeywords.length) * 100) : 0, matched, missing });
  };

  const copyLLMPrompt = () => {
    const strip = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();
    let text = "";
    if (llmPromptType === 'enhance') text = `Please act as an expert Executive Recruiter. Review my resume content below and provide 3 specific suggestions to replace weak verbs with stronger action verbs, and quantify metrics where possible. Do not invent details.\n\n`;
    else if (llmPromptType === 'ats') text = `Please act as an ATS (Applicant Tracking System). Analyze the following resume content against standard industry keywords. Provide a readability score (0-100) and list missing keywords. Do not invent details.\n\n`;
    else if (llmPromptType === 'summary') text = `Please act as an expert Resume Writer. Rewrite my professional summary to be more impactful, concise, and metric-driven based on my experience below.\n\n`;
    
    text += `TITLE: [CANDIDATE_NAME]\nSUMMARY: ${strip(state.tagline)}\n\n`;
    state.sections.forEach(sec => {
      text += `--- ${strip(sec.title).toUpperCase()} ---\n`;
      if (sec.type === 'bullets') { sec.items.forEach(item => { text += `Role: ${strip(item.title)} | ${item.date ? strip(item.date) : ''}\n`; if (item.subtitle) text += `Org: ${strip(item.subtitle)}\n`; if (item.description) text += `Context: ${strip(item.description)}\n`; item.bullets.forEach(b => { text += `- ${strip(b)}\n`; }); text += '\n'; }); } else { if (sec.text) text += `${strip(sec.text)}\n\n`; }
    });
    state.setLlmPrompt(text);
  };

  const handleMagicFit = () => {
    if (isFitting || fitIntervalRef.current) return;
    const temporal = useResumeStore.temporal.getState();

    let gap = state.theme.sectionGap;
    let lh = state.theme.lineHeight;
    let fs = state.theme.bodySize;

    const initial = measureFit();
    const shrinking = initial.contentHeight > initial.printable;

    if (!shrinking && fs >= 10.5 && lh >= 1.35 && gap >= 12) { state.showToast("Already fits on one page."); return; }

    setIsFitting(true);
    temporal.pause();
    let lastGrow: '' | 'fs' | 'lh' | 'gap' = '';
    let iterations = 0;

    const finish = (msg?: string) => {
      if (fitIntervalRef.current) { clearInterval(fitIntervalRef.current); fitIntervalRef.current = null; }
      temporal.resume();
      setIsFitting(false);
      if (msg) state.showToast(msg);
    };

    fitIntervalRef.current = setInterval(() => {
      if (++iterations > 200) return finish("Layout adjusted.");
      const { contentHeight, printable } = measureFit();
      if (shrinking) {
        if (contentHeight <= printable) return finish("Compressed to one page.");
        if (gap > 6) { gap -= 1; state.updateTheme('sectionGap', gap); }
        else if (lh > 1.15) { lh = +(lh - 0.05).toFixed(2); state.updateTheme('lineHeight', lh); }
        else if (fs > 9) { fs = +(fs - 0.25).toFixed(2); state.updateTheme('bodySize', fs); }
        else return finish("Maximum safe compression reached — consider trimming content.");
      } else {
        if (contentHeight > printable) {
          if (lastGrow === 'fs') { fs = +(fs - 0.25).toFixed(2); state.updateTheme('bodySize', fs); }
          else if (lastGrow === 'lh') { lh = +(lh - 0.05).toFixed(2); state.updateTheme('lineHeight', lh); }
          else if (lastGrow === 'gap') { gap -= 1; state.updateTheme('sectionGap', gap); }
          return finish("Expanded to fill the page.");
        }
        if (fs < 10.5) { fs = +(fs + 0.25).toFixed(2); state.updateTheme('bodySize', fs); lastGrow = 'fs'; }
        else if (lh < 1.35) { lh = +(lh + 0.05).toFixed(2); state.updateTheme('lineHeight', lh); lastGrow = 'lh'; }
        else if (gap < 12) { gap += 1; state.updateTheme('sectionGap', gap); lastGrow = 'gap'; }
        else return finish("Spacing balanced.");
      }
    }, 120);
  };

  useEffect(() => {
    const el = document.getElementById('resume-print-target');
    if (!el) return;
    const recompute = () => {
      const t = themeRef.current;
      const printable = (11 - t.marginTop - t.marginBottom) * PX_PER_IN;
      const paddingTopPx = t.marginTop * PX_PER_IN;
      const paddingPx = (t.marginTop + t.marginBottom) * PX_PER_IN;
      if (printable <= 0) { setPageBreaks([]); return; }
      const contentHeight = el.scrollHeight - paddingPx;
      const pages = Math.max(1, Math.ceil(contentHeight / printable));
      const breaks: number[] = [];
      for (let k = 1; k < pages; k++) breaks.push(paddingTopPx + k * printable);
      setPageBreaks(breaks);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!state.autoFitRequested) return;
    const id = setTimeout(() => {
      const { contentHeight, printable } = measureFit();
      if (printable > 0 && contentHeight > printable + 8) {
        state.showToast("Imported. Runs past one page — click Magic Fit to compress when ready.");
      }
      state.setAutoFitRequested(false);
    }, 400);
    return () => clearTimeout(id);
  }, [state.autoFitRequested]);

  const confirmDeleteSection = (id: string) => { if (window.confirm("Delete this entire section? This action cannot be undone.")) { state.removeSection(id); state.showToast("Section Deleted"); } };
  
  const confirmStartNew = () => {
    if (state.isDirty && !window.confirm("You have unsaved changes. Starting over will replace your current canvas. Proceed?")) return;
    state.setHasSeenWelcome(false); clear(); 
  };

  const handleSaveLibrary = () => {
    const name = prompt("Name this resume (using an existing name overwrites that saved copy):");
    if (name) { state.saveCurrentToLibrary(name); state.showToast("Saved to My Documents!"); }
  };

  const handleLoadFromLibrary = (id: string) => { state.loadFromLibrary(id); clear(); state.showToast("Document Loaded"); };
  const colOf = (s: any): 'main' | 'side' => s.column ? s.column : ((s.type === 'skills' || s.type === 'certs') ? 'side' : 'main');
  const sideSections = state.sections.filter((s) => colOf(s) === 'side');
  const mainSections = state.sections.filter((s) => colOf(s) === 'main');
  const hasSidebarContent = sideSections.length > 0;
  const isTwoColumn = state.theme.layoutMode === 'two-column' && hasSidebarContent;
  const sideRatio = liveRatio ?? Math.min(0.5, Math.max(0.2, state.theme.twoColumnRatio ?? 0.33));

  const renderSection = (section: any) => {
    const anchorRight = isTwoColumn && colOf(section) === 'main';
    return (
    <div key={section.id} className="relative group/section w-full border-l-2 border-transparent hover:border-zinc-300 pl-2 -ml-2 transition-colors cursor-default" style={{ textAlign: state.theme.alignment as any }}>
      <div className="relative w-full mb-1 group/edit group/sechead" style={{ color: 'var(--accent)', textTransform: state.theme.headingCaps ? 'uppercase' : 'none', fontSize: `${state.theme.bodySize * 1.1}pt` }}>
        <div className={`absolute ${anchorRight ? 'left-full pl-2' : 'right-full pr-2'} top-0 opacity-0 pointer-events-none group-hover/sechead:opacity-100 group-hover/sechead:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity print:hidden z-40`}>
         <div className="flex flex-col gap-0.5 bg-white/95 p-0.5 border border-zinc-200 shadow-lg rounded-lg">
          <button title="Move section up" aria-label="Move section up" onClick={() => state.moveSection(section.id, -1)} className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded outline-none"><ArrowUp size={12}/></button>
          <button title="Move section down" aria-label="Move section down" onClick={() => state.moveSection(section.id, 1)} className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded outline-none"><ArrowDown size={12}/></button>
          <div className="relative group/switcher">
            <button title="Change section type" aria-label="Change section type" className="p-1 w-full flex justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded outline-none"><Repeat size={12}/></button>
            <div className={`absolute ${anchorRight ? 'right-full pr-2' : 'left-full pl-2'} top-0 hidden group-hover/switcher:flex z-50`}>
             <div className="flex flex-col bg-white border shadow-lg rounded p-1 gap-1 w-24">
               <button onClick={() => state.updateSectionType(section.id, 'bullets')} className="text-[10px] text-left px-2 py-1 hover:bg-zinc-100 rounded">Bullets</button>
               <button onClick={() => state.updateSectionType(section.id, 'skills')} className="text-[10px] text-left px-2 py-1 hover:bg-zinc-100 rounded">Skills</button>
               <button onClick={() => state.updateSectionType(section.id, 'text')} className="text-[10px] text-left px-2 py-1 hover:bg-zinc-100 rounded">Paragraph</button>
               <button onClick={() => state.updateSectionType(section.id, 'certs')} className="text-[10px] text-left px-2 py-1 hover:bg-zinc-100 rounded">Certs</button>
             </div>
            </div>
          </div>
          {state.theme.layoutMode === 'two-column' && (
            <button title="Move section to other column" aria-label="Move section to other column" onClick={() => state.setSectionColumn(section.id, colOf(section) === 'side' ? 'main' : 'side')} className="p-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded outline-none"><Columns size={12}/></button>
          )}
          <button title="Delete section" aria-label="Delete section" onClick={() => confirmDeleteSection(section.id)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded outline-none mt-0.5 border-t border-zinc-100 pt-1"><Trash2 size={12}/></button>
         </div>
        </div>
        <RichTextEditor previewMode={previewMode} id={`section-title-${section.id}`} content={section.title} onChange={(html) => state.updateSectionTitle(section.id, html.replace(/<[^>]*>?/gm, ''))} className="w-full font-bold tracking-widest bg-transparent outline-none hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" />
        <div style={{ borderBottom: state.theme.underlines ? '1.5px solid var(--accent)' : 'none', marginTop: '-2px' }}></div>
      </div>

      {section.type === 'bullets' && (
        <div className="flex flex-col gap-2 w-full mt-2">
          {section.items?.map((item: any) => (
            <div key={item.id} className="relative group/item w-full flex flex-col" style={{ textAlign: state.theme.alignment as any }}>
              {!previewMode && (
                <div className={`absolute ${anchorRight ? 'left-full pl-2' : 'right-full pr-2'} top-0 opacity-0 pointer-events-none group-hover/item:opacity-100 group-hover/item:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity flex print:hidden z-30`}><button title="Delete this entry" aria-label="Delete entry" onClick={() => { if(window.confirm("Delete this entry? This action cannot be undone.")) state.removeEntry(section.id, item.id); }} className="p-1 text-red-500 hover:text-red-700 bg-white/95 border border-zinc-200 rounded shadow-sm outline-none"><Trash2 size={12}/></button></div>
              )}
              <div className={`flex items-baseline w-full ${state.theme.datePlacement === 'space-between' ? 'justify-between' : 'justify-start gap-4'}`}>
                <div className="font-bold text-zinc-900 bg-transparent flex-1" style={{ textAlign: state.theme.alignment === 'right' ? 'right' : 'left' }}>
                   {(item.title && item.title.replace(/<[^>]*>?/gm, '').trim())
                     ? <RichTextEditor previewMode={previewMode} id={`title-${item.id}`} content={item.title} onChange={(html) => state.updateEntryField(section.id, item.id, 'title', html)} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" />
                     : (!previewMode && <button onClick={() => state.updateEntryField(section.id, item.id, 'title', 'Untitled')} className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 print:hidden px-1 border border-dashed rounded">+ Add Title</button>)}
                </div>
                {item.date !== undefined ? (
                  <div className={`text-zinc-500 shrink-0 relative group/date flex flex-col justify-start pr-6 -mr-6 print:pr-0 print:mr-0 min-w-fit ${state.theme.datePlacement === 'space-between' ? 'text-right' : 'text-left'}`}>
                    {!previewMode && (
                      <button onClick={() => state.updateEntryField(section.id, item.id, 'date', undefined)} className="absolute right-1 -top-1 opacity-0 pointer-events-none group-hover/date:opacity-100 group-hover/date:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto flex items-center justify-center text-zinc-400 hover:text-red-500 print:hidden z-10 bg-white rounded-full shadow border h-5 w-5 transition-opacity outline-none" title="Remove date" aria-label="Remove date"><X size={11}/></button>
                    )}
                    <div className="pr-6 print:pr-0"><RichTextEditor previewMode={previewMode} id={`date-${item.id}`} content={item.date} onChange={(html) => state.updateEntryField(section.id, item.id, 'date', html)} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" /></div>
                  </div>
                ) : (
                  !previewMode && <button onClick={() => state.updateEntryField(section.id, item.id, 'date', 'Timeline')} className="text-[9px] font-semibold text-zinc-400 hover:text-zinc-600 print:hidden ml-2 px-1 border border-dashed rounded">+ Date</button>
                )}
              </div>
              
              {item.subtitle !== undefined ? (
                <div className="text-zinc-600 italic bg-transparent w-full relative group/subtitle flex flex-col justify-start pl-6 -ml-6 print:pl-0 print:ml-0" style={{ textAlign: state.theme.alignment === 'right' ? 'right' : 'left' }}>
                    {!previewMode && (
                      <button onClick={() => state.updateEntryField(section.id, item.id, 'subtitle', undefined)} className="absolute left-1 top-1 opacity-0 pointer-events-none group-hover/subtitle:opacity-100 group-hover/subtitle:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto flex items-center justify-center text-zinc-400 hover:text-red-500 print:hidden z-10 bg-white rounded-full shadow border h-5 w-5 transition-opacity outline-none" title="Remove subtitle" aria-label="Remove subtitle"><X size={11}/></button>
                    )}
                    <RichTextEditor previewMode={previewMode} id={`subtitle-${item.id}`} content={item.subtitle} onChange={(html) => state.updateEntryField(section.id, item.id, 'subtitle', html)} className="w-full hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" />
                </div>
              ) : (
                !previewMode && (
                  <div className="w-full" style={{ textAlign: state.theme.alignment === 'right' ? 'right' : 'left' }}><button onClick={() => state.updateEntryField(section.id, item.id, 'subtitle', 'Organization')} className="text-[9px] font-semibold text-zinc-400 hover:text-zinc-600 print:hidden mt-0.5 px-1 border border-dashed rounded">+ Subtitle</button></div>
                )
              )}

              {item.description !== undefined ? (
                <div className="text-zinc-800 bg-transparent w-full relative group/desc flex flex-col justify-start pl-6 -ml-6 print:pl-0 print:ml-0 mt-1" style={{ textAlign: state.theme.alignment === 'right' ? 'right' : 'left' }}>
                    {!previewMode && (
                      <button onClick={() => state.updateEntryField(section.id, item.id, 'description', undefined)} className="absolute left-1 top-1 opacity-0 pointer-events-none group-hover/desc:opacity-100 group-hover/desc:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto flex items-center justify-center text-zinc-400 hover:text-red-500 print:hidden z-10 bg-white rounded-full shadow border h-5 w-5 transition-opacity outline-none" title="Remove paragraph" aria-label="Remove paragraph"><X size={11}/></button>
                    )}
                    <RichTextEditor previewMode={previewMode} id={`desc-${item.id}`} content={item.description} onChange={(html) => state.updateEntryField(section.id, item.id, 'description', html)} className="w-full hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" />
                </div>
              ) : null}

              <div className="mt-1 flex flex-col relative w-full" style={{ gap: '3px', paddingLeft: state.theme.alignment === 'right' ? '0' : '1.25rem', paddingRight: state.theme.alignment === 'right' ? '1.25rem' : '0' }}>
                {item.bullets?.map((bullet: any, bIdx: number) => {
                  const bulletEmpty = !bullet || !String(bullet).replace(/<[^>]*>?/gm, '').trim();
                  if (bulletEmpty && previewMode) return null;
                  return (
                  <div key={bIdx} className={`relative group/bullet w-full flex items-start pr-12 -mr-12 print:pr-0 print:mr-0 ${bulletEmpty ? 'print:hidden' : ''}`} style={{ justifyContent: state.theme.alignment === 'right' ? 'flex-end' : 'flex-start' }}>
                    {state.theme.alignment !== 'right' && ( <span className="absolute -left-4 top-[0.15em] text-zinc-800 select-none font-bold text-[0.95em]">{state.theme.bulletStyle}</span> )}
                    {!previewMode && (
                      <div className="absolute right-0 top-0 opacity-0 pointer-events-none group-hover/bullet:opacity-100 group-hover/bullet:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity flex gap-1 p-0.5 print:hidden z-30 bg-white shadow-sm border rounded">
                        <button title="Move line up" aria-label="Move line up" onClick={() => state.moveBullet(section.id, item.id, bIdx, -1)} className="p-1 text-zinc-500 hover:text-zinc-800 outline-none focus:ring-1 focus:ring-zinc-800 rounded"><ArrowUp size={10}/></button>
                        <button title="Move line down" aria-label="Move line down" onClick={() => state.moveBullet(section.id, item.id, bIdx, 1)} className="p-1 text-zinc-500 hover:text-zinc-800 outline-none focus:ring-1 focus:ring-zinc-800 rounded"><ArrowDown size={10}/></button>
                        <button title="Delete line" aria-label="Delete line" onClick={() => { if(window.confirm("Delete this bullet?")) state.removeBullet(section.id, item.id, bIdx); }} className="p-1 text-red-500 hover:text-red-700 outline-none focus:ring-1 focus:ring-red-500 rounded"><Trash2 size={10}/></button>
                      </div>
                    )}
                    <RichTextEditor previewMode={previewMode} id={`bullet-${section.id}-${item.id}-${bIdx}`} content={bullet} onChange={(html) => state.updateBullet(section.id, item.id, bIdx, html)} className="w-full pr-12 print:pr-0 hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" />
                    {state.theme.alignment === 'right' && ( <span className="absolute -right-4 top-[0.15em] text-zinc-800 select-none font-bold text-[0.95em]">{state.theme.bulletStyle}</span> )}
                  </div>
                  );
                })}
                {!previewMode && (
                  <div className="flex gap-2 print:hidden mt-1 w-full" style={{ justifyContent: state.theme.alignment === 'right' ? 'flex-end' : 'flex-start' }}>
                    <button onClick={() => state.addBullet(section.id, item.id)} className="w-fit text-zinc-600 hover:text-zinc-900 text-[10px] font-semibold flex items-center gap-0.5 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 transition-colors"><Plus size={10}/> Add Line</button>
                    {item.description === undefined && ( <button onClick={() => state.updateEntryField(section.id, item.id, 'description', 'Enter paragraph...')} className="w-fit text-zinc-600 hover:text-zinc-900 text-[10px] font-semibold flex items-center gap-0.5 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 transition-colors"><Plus size={10}/> Add Paragraph</button> )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!previewMode && ( <button onClick={() => state.addEntry(section.id)} className="w-full border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-800 text-xs py-1.5 rounded transition-all hover:bg-zinc-50 print:hidden flex justify-center items-center gap-1 mt-1"><Plus size={13}/> Append Entry</button> )}
        </div>
      )}

      {section.type === 'skills' && ( <div className="text-zinc-800 w-full text-inherit mt-2" style={{ textAlign: state.theme.alignment as any }}><RichTextEditor previewMode={previewMode} id={`skills-${section.id}`} content={section.text || ''} onChange={(html) => state.updateSectionText(section.id, html)} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" /></div> )}
      {section.type === 'text' && ( <div className="text-zinc-800 w-full text-inherit mt-2" style={{ textAlign: state.theme.alignment as any }}><RichTextEditor previewMode={previewMode} id={`text-${section.id}`} content={section.text || ''} onChange={(html) => state.updateSectionText(section.id, html)} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" /></div> )}
      {section.type === 'certs' && ( <div className="text-zinc-800 w-full text-inherit mt-2" style={{ textAlign: state.theme.alignment as any }}><RichTextEditor previewMode={previewMode} id={`certs-${section.id}`} content={section.text || ''} onChange={(html) => state.updateSectionText(section.id, html)} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" /></div> )}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex print:bg-white print:block overflow-hidden relative" style={{ '--accent': state.theme.accentColor, fontFamily: state.theme.fontFamily, fontSize: `${state.theme.bodySize}pt`, lineHeight: state.theme.lineHeight } as React.CSSProperties}>
      <WelcomeModal onImport={() => setIsImportOpen(true)} />
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {state.toastMessage && ( <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-zinc-100 px-5 py-2.5 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 text-sm font-semibold border border-zinc-800"> <Sparkles size={16} className="text-zinc-400" /> {state.toastMessage} </div> )}

      {isJobMatcherOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-[#18181A] border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl text-zinc-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Target className="text-zinc-400" size={24}/> Local Job Scanner</h2>
              <button onClick={() => setIsJobMatcherOpen(false)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 p-1.5 rounded-md hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-500 outline-none"><X size={18}/></button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Paste a job description below. We will locally scan your resume for keyword alignment.</p>
            <textarea placeholder="Paste job description here..." className="w-full flex-1 bg-[#09090B] border border-zinc-800 rounded-lg p-3 text-[13px] text-zinc-300 focus:outline-none focus:border-zinc-500 resize-none min-h-[150px] mb-4" value={state.jobDescription} onFocus={(e) => e.target.select()} onChange={(e) => state.setJobDescription(e.target.value)} />
            
            {matchScore && (
              <div className="mb-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl font-black text-white">{matchScore.score}%</div>
                  <div className="text-sm text-zinc-400">Match Rate Based on Extracted Keywords</div>
                </div>
                <div className="flex gap-4 text-[12px]">
                  <div className="flex-1">
                    <span className="text-emerald-400 font-bold block mb-1">Found ({matchScore.matched.length}):</span>
                    <div className="flex flex-wrap gap-1">{matchScore.matched.slice(0,10).map(k => <span key={k} className="bg-emerald-900/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-900/50">{k}</span>)}{matchScore.matched.length > 10 && '...'}</div>
                  </div>
                  <div className="flex-1">
                    <span className="text-red-400 font-bold block mb-1">Missing ({matchScore.missing.length}):</span>
                    <div className="flex flex-wrap gap-1">{matchScore.missing.slice(0,10).map(k => <span key={k} className="bg-red-900/20 text-red-300 px-1.5 py-0.5 rounded border border-red-900/50">{k}</span>)}{matchScore.missing.length > 10 && '...'}</div>
                  </div>
                </div>
              </div>
            )}
            
            <button onClick={runJobMatch} className="bg-zinc-200 hover:bg-white text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-zinc-400 outline-none">Scan Resume Content</button>
          </div>
        </div>
      )}

      {state.isLLMModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-[#18181A] border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl text-zinc-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bot className="text-zinc-400" size={24}/> AI Prompt Generator</h2>
              <button onClick={() => state.setIsLLMModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 p-1.5 rounded-md hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-500 outline-none"><X size={18}/></button>
            </div>
            <div className="text-sm text-zinc-400 mb-4">
              Copy the prompt below and paste it into your preferred private or public AI (e.g., local LLaMA, ChatGPT, or Claude). We do not link to third-party services to protect your privacy.
            </div>
            <div className="flex gap-2 mb-3 items-center">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Goal:</label>
              <select value={llmPromptType} onChange={(e) => { setLlmPromptType(e.target.value); copyLLMPrompt(); }} className="bg-[#09090B] text-zinc-200 rounded p-1.5 text-sm border border-zinc-800 outline-none focus:border-zinc-500 font-semibold">
                <option value="enhance">Enhance Bullets & Action Verbs</option>
                <option value="ats">ATS Keyword Gap Analysis</option>
                <option value="summary">Rewrite Professional Summary</option>
              </select>
            </div>
            <textarea className="w-full flex-1 bg-[#09090B] border border-zinc-800 rounded-lg p-4 text-[13px] text-zinc-300 font-mono focus:outline-none focus:border-zinc-500 resize-none min-h-[300px]" value={state.llmPrompt} onFocus={(e) => e.target.select()} onChange={(e) => state.setLlmPrompt(e.target.value)} />
            <div className="flex justify-end items-center mt-5 pt-4 border-t border-zinc-800/50">
              <button onClick={() => { navigator.clipboard.writeText(state.llmPrompt); state.showToast("Prompt Copied!"); }} className="bg-zinc-200 hover:bg-white text-zinc-950 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-zinc-400 outline-none"><Copy size={16}/> Copy to Clipboard</button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed top-0 w-full bg-[#18181A] border-b border-zinc-800 text-white p-3 flex justify-between items-center z-50 shadow-md print:hidden">
        <h2 className="font-bold flex items-center gap-2"><Sparkles size={16} className="text-zinc-400" /> Svalekh</h2>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-zinc-800 rounded"><Menu size={18}/></button>
      </div>

      {previewMode && (
        <button onClick={() => setPreviewMode(false)} className="fixed bottom-6 right-6 z-50 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 print:hidden animate-bounce border border-zinc-600">
          <EyeOff size={18} /> Exit Preview
        </button>
      )}

      {!previewMode && (
        <div className={`w-[340px] bg-[#18181A] p-5 h-screen overflow-y-auto flex flex-col gap-5 text-zinc-300 print:hidden border-r border-zinc-800 shrink-0 fixed md:sticky top-0 z-40 transition-transform duration-300 ease-in-out scrollbar-none ${mobileMenuOpen ? 'translate-x-0 pt-16' : '-translate-x-full md:translate-x-0'}`}>
          <div className="hidden md:block">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800/50 pb-2"><h2 className="font-bold text-white text-base tracking-wide flex items-center gap-2"><Sparkles size={16} className="text-zinc-400" /> Svalekh</h2><button onClick={() => state.setHasSeenWelcome(false)} title="Open the guide & home screen" aria-label="Open the guide" className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded px-1.5 py-1 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><HelpCircle size={13} /> Guide</button></div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => pastStates.length > 0 && undo()} className={`flex-1 flex justify-center items-center gap-1.5 bg-[#09090B] p-2 rounded text-xs transition-colors border border-zinc-800 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${pastStates.length === 0 ? 'opacity-50 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-900 text-zinc-300'}`}><Undo2 size={13} /> Undo</button>
              <button onClick={() => futureStates.length > 0 && redo()} className={`flex-1 flex justify-center items-center gap-1.5 bg-[#09090B] p-2 rounded text-xs transition-colors border border-zinc-800 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${futureStates.length === 0 ? 'opacity-50 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-900 text-zinc-300'}`}>Redo <Redo2 size={13} /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setMobileMenuOpen(false); setPreviewMode(true); }} className="flex justify-center items-center gap-1.5 bg-[#09090B] hover:bg-zinc-900 text-zinc-300 p-2 rounded text-xs font-semibold transition-all border border-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"><Eye size={13} /> Preview</button>
            <button onClick={handlePrint} className="flex justify-center items-center gap-1.5 bg-zinc-200 hover:bg-white text-zinc-950 p-2 rounded text-xs font-semibold transition-all shadow-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"><Printer size={13} /> Print PDF</button>
          </div>

          <div className="border-t border-zinc-800/50 pt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5"><FolderOpen size={12}/> My Documents</h3>
              <button onClick={handleSaveLibrary} className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-1 rounded flex items-center gap-1 hover:bg-zinc-700 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><Save size={10}/> Save Copy</button>
            </div>
            {state.savedResumes.length > 0 && (
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                {state.savedResumes.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center bg-[#09090B] p-1.5 rounded text-[10px] border border-zinc-800 group relative">
                    <button onClick={() => handleLoadFromLibrary(doc.id)} className="flex-1 text-left truncate text-zinc-300 hover:text-white outline-none focus-visible:underline">{doc.name}</button>
                    <button onClick={() => state.deleteFromLibrary(doc.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 px-1 outline-none focus-visible:opacity-100"><Trash2 size={10}/></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={confirmStartNew} className="w-full p-1.5 text-[10px] border border-zinc-800 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500">Start New or Load Demo</button>
          </div>

          <div className="border-t border-zinc-800/50 pt-4">
             <div className="flex items-center justify-between bg-[#09090B] p-2.5 rounded border border-zinc-800 mb-2">
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase font-bold text-zinc-600">Live ATS Score</span>
                 <span className={`font-black text-xl ${atsAnalysis.score >= 80 ? 'text-emerald-400' : atsAnalysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{atsAnalysis.score} / 100</span>
               </div>
               <div className="text-[9px] text-zinc-500 flex flex-col gap-1 max-w-[140px] leading-tight">
                 {atsAnalysis.advice.length === 0 ? <span className="text-emerald-500">Looking great!</span> : atsAnalysis.advice.slice(0, 2).map((adv, i) => <span key={i}>• {adv}</span>)}
               </div>
             </div>
             <button onClick={() => setIsJobMatcherOpen(true)} className="flex justify-center items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 p-2 rounded text-[11px] font-semibold transition-colors w-full outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><Target size={13} /> Open Job Scanner</button>
          </div>

          <div className="border-t border-zinc-800/50 pt-4 flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1"><EyeOff size={12}/> Masking & Redactions</h3>
            <button onClick={() => state.setRedactMode(!state.redactMode)} className={`w-full p-2 text-xs rounded font-semibold border transition-all outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${state.redactMode ? 'bg-zinc-200 text-zinc-900 border-zinc-300 font-bold animate-pulse' : 'bg-[#09090B] border-zinc-800 text-zinc-400 hover:bg-zinc-900'}`}>{state.redactMode ? 'Click any block to mask it' : 'Enable Manual Redact Mode'}</button>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-800/50 pt-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5"><SlidersHorizontal size={12}/> Layout Engine V2</h3>
              <button onClick={handleMagicFit} disabled={isFitting} className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 px-2 py-0.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500">{isFitting ? 'Fitting...' : <><Wand2 size={10}/> Magic Fit</>}</button>
            </div>
            
            <div className="flex bg-[#09090B] border border-zinc-800 rounded p-1 mb-1">
               <button onClick={() => state.updateTheme('layoutMode', 'single')} className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${state.theme.layoutMode !== 'two-column' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}>Single</button>
               <button onClick={() => state.updateTheme('layoutMode', 'two-column')} className={`flex-1 flex justify-center items-center gap-1 text-[10px] font-bold py-1.5 rounded transition-all outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${state.theme.layoutMode === 'two-column' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}><Columns size={10}/> Two Column</button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button onClick={() => state.applyPreset('executive')} className="bg-[#09090B] hover:bg-zinc-800 text-[10px] p-1.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 text-zinc-300">👔 Exec</button>
              <button onClick={() => state.applyPreset('startup')} className="bg-[#09090B] hover:bg-zinc-800 text-[10px] p-1.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 text-zinc-300">🚀 Startup</button>
              <button onClick={() => state.applyPreset('academic')} className="bg-[#09090B] hover:bg-zinc-800 text-[10px] p-1.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 text-zinc-300">🎓 Academic</button>
            </div>

            <div className="flex justify-between items-center text-xs"><label className="text-zinc-400">Typography</label><select value={state.theme.fontFamily} onChange={(e) => state.updateTheme('fontFamily', e.target.value)} className="bg-[#09090B] text-zinc-300 rounded p-1 text-xs border border-zinc-800 outline-none w-36 focus-visible:ring-1 focus-visible:ring-zinc-500"><option value="Calibri, sans-serif">Calibri</option><option value="Garamond, serif">Garamond</option><option value="'Inter', sans-serif">Inter</option><option value="'Lato', sans-serif">Lato</option><option value="'Merriweather', serif">Merriweather</option><option value="'Fira Code', monospace">Fira Code</option></select></div>
            <div className="flex flex-col gap-1 text-xs"><div className="flex justify-between text-zinc-400"><span>Body Size</span><span className="text-zinc-500">{state.theme.bodySize.toFixed(1)}pt</span></div><input type="range" min="8" max="12" step="0.5" value={state.theme.bodySize} onChange={(e) => state.updateTheme('bodySize', parseFloat(e.target.value))} className="w-full accent-zinc-500 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 rounded" /></div>
            <div className="flex flex-col gap-1 text-xs"><div className="flex justify-between text-zinc-400"><span>Contact Size</span><span className="text-zinc-500">{state.theme.contactSize?.toFixed(1)}pt</span></div><input type="range" min="7" max="14" step="0.5" value={state.theme.contactSize || 9.5} onChange={(e) => state.updateTheme('contactSize', parseFloat(e.target.value))} className="w-full accent-zinc-500 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 rounded" /></div>
            <div className="flex flex-col gap-1 text-xs"><div className="flex justify-between text-zinc-400"><span>Line Height</span><span className="text-zinc-500">{state.theme.lineHeight.toFixed(2)}</span></div><input type="range" min="1.1" max="1.8" step="0.05" value={state.theme.lineHeight} onChange={(e) => state.updateTheme('lineHeight', parseFloat(e.target.value))} className="w-full accent-zinc-500 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 rounded" /></div>
            <div className="flex flex-col gap-1 text-xs"><div className="flex justify-between text-zinc-400"><span>Section Spacing</span><span className="text-zinc-500">{state.theme.sectionGap}px</span></div><input type="range" min="2" max="24" step="1" value={state.theme.sectionGap} onChange={(e) => state.updateTheme('sectionGap', parseInt(e.target.value))} className="w-full accent-zinc-500 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 rounded" /></div>
          </div>

          <div className="flex flex-col gap-2 border-t border-zinc-800/50 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1"><Contact2 size={12}/> Contact Rows</h3>
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {state.contacts.map((contact) => (
                <div key={contact.id} className="bg-[#09090B] border border-zinc-800 p-2 rounded-lg flex flex-col gap-1.5 relative group/card focus-within:ring-1 focus-within:ring-zinc-500">
                  <button title="Remove contact field" aria-label="Remove contact field" onClick={() => state.removeContactField(contact.id)} className="absolute top-1 right-1 opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto group-focus-within/card:opacity-100 group-focus-within/card:pointer-events-auto text-zinc-600 hover:text-red-400 transition-all outline-none p-0.5"><Trash2 size={12}/></button>
                  <div className="flex gap-1.5">
                    <input type="text" value={contact.label} onFocus={(e) => e.target.select()} onChange={(e) => state.updateContactField(contact.id, 'label', e.target.value)} placeholder="Label" className="bg-[#18181A] border border-zinc-800 text-zinc-300 text-[10px] p-1 rounded w-16 outline-none" />
                    <input type="text" value={contact.value} onFocus={(e) => e.target.select()} onChange={(e) => state.updateContactField(contact.id, 'value', e.target.value)} placeholder="Value" className="bg-[#18181A] border border-zinc-800 text-zinc-300 text-[10px] p-1 rounded flex-1 outline-none" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => state.addContactField()} className="w-full text-center py-1 border border-dashed border-zinc-700 text-[10px] text-zinc-400 rounded hover:bg-zinc-800 transition-colors flex justify-center items-center gap-1 outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><Plus size={10}/> Add Info Field</button>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-zinc-800/50 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1"><Layers size={12}/> Insert Section</h3>
            <div className="flex gap-1.5">
              <select className="bg-[#09090B] text-zinc-300 rounded p-1.5 text-[11px] border border-zinc-800 outline-none flex-1 font-semibold focus-visible:ring-1 focus-visible:ring-zinc-500" onChange={(e) => { const [title, type] = e.target.value.split('|'); setSectionToAdd({ title, type }); }}>
                <optgroup label="Blocks"><option value="Experience|bullets">💼 Experience</option><option value="Education|bullets">🎓 Education</option></optgroup>
                <optgroup label="Grids"><option value="Technical Skills|skills">⚡ Skills</option></optgroup>
                <optgroup label="Freeform"><option value="Summary|text">📝 Summary</option></optgroup>
              </select>
              <button onClick={() => { state.addSection(sectionToAdd.type, sectionToAdd.title); state.showToast(`Added ${sectionToAdd.title}`); }} className="bg-zinc-200 hover:bg-white text-zinc-950 px-3 py-1.5 text-[11px] font-bold rounded flex items-center justify-center gap-1 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"><Plus size={12}/> Add</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-zinc-800/50 pt-4 mt-auto">
            <button onClick={() => { copyLLMPrompt(); state.setIsLLMModalOpen(true); }} className="flex justify-center items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 p-2 rounded text-[11px] font-semibold transition-colors w-full outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><Bot size={13} /> Copy ATS Prompt (No PII)</button>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={exportHTML} className="flex justify-center items-center gap-1.5 bg-[#09090B] hover:bg-zinc-900 border border-zinc-800 text-zinc-400 p-2 rounded text-[11px] font-semibold transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><Code size={13} /> Web</button>
              <button onClick={exportJSON} className="flex justify-center items-center gap-1.5 bg-[#09090B] hover:bg-zinc-900 border border-zinc-800 text-zinc-400 p-2 rounded text-[11px] font-semibold transition-colors outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><Database size={13} /> Data</button>
              <button onClick={exportDOCX} className="flex justify-center items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 p-2 rounded text-[11px] transition-colors font-bold outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"><FileText size={13}/> DOCX</button>
            </div>
          </div>
        </div>
      )}
      <div ref={canvasRef} className={`flex-1 flex justify-center items-start overflow-y-auto h-screen print:h-auto print:overflow-visible print:bg-white print:p-0 print:block relative transition-all duration-300 ${(mobileMenuOpen || state.isLLMModalOpen) ? 'opacity-20 pointer-events-none' : 'opacity-100'} ${previewMode ? 'p-0 md:p-6' : 'pt-20 md:p-6 md:pt-6'}`}>
        
        <style type="text/css" media="print">
          {`@page { size: letter; margin: ${state.theme.marginTop}in ${state.theme.marginRight}in ${state.theme.marginBottom}in ${state.theme.marginLeft}in !important; }`}
        </style>
        <div
          className="print:transform-none print:!mb-0"
          style={{
            width: '816px',
            transformOrigin: 'top center',
            transform: `scale(${previewScale})`,
            marginBottom: previewScale < 1 ? `${(previewScale - 1) * 100}%` : undefined,
          }}
        >
        <div id="resume-print-target" className="w-[816px] h-fit bg-white relative shadow-2xl print:shadow-none" style={{ paddingTop: `${state.theme.marginTop}in`, paddingBottom: `${state.theme.marginBottom}in`, paddingLeft: `${state.theme.marginLeft}in`, paddingRight: `${state.theme.marginRight}in`, textAlign: state.theme.alignment as any }}>
          {pageBreaks.map((y, i) => (
            <div key={`pb-${i}`} className="print:hidden pointer-events-none absolute left-0 right-0 z-20" style={{ top: `${y}px` }}>
              <div className="border-t-2 border-dashed border-red-400/70" />
              <span className="absolute right-1 -top-[14px] text-[9px] font-semibold text-red-500/80 bg-white/85 px-1 rounded">Page {i + 2}</span>
            </div>
          ))}

          <div className="mb-4 pb-2 relative w-full flex flex-col group/header" style={{ borderBottom: `${state.theme.underlines ? '2.5px solid var(--accent)' : 'none'}`, alignItems: state.theme.alignment === 'center' ? 'center' : state.theme.alignment === 'right' ? 'flex-end' : 'flex-start' }}>
            <div className={`font-black tracking-widest text-zinc-900 leading-none mb-1 w-full ${state.redactedElementIds.includes('global-name-header') ? 'is-redacted' : ''} ${state.redactedElementIds.includes('global-name-header') && state.redactMode ? 'redact-active-block' : ''}`} style={{ fontSize: `${state.theme.nameSize}pt`, textTransform: state.theme.nameCaps ? 'uppercase' : 'none', textAlign: state.theme.alignment as any, wordBreak: 'break-word', overflowWrap: 'anywhere' }} onClick={() => state.redactMode && state.toggleElementRedact('global-name-header')}>
              {state.redactedElementIds.includes('global-name-header')
                ? <span className="select-none" aria-label="redacted name">{'█'.repeat(Math.min(Math.max(cleanName().length, 3), 40))}</span>
                : <RichTextEditor previewMode={previewMode} id="editor-name" content={state.name} onChange={(html) => state.updateName(html.replace(/<\/(p|div)>|<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim())} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" />}
            </div>
            <div className="text-zinc-600 italic w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}><RichTextEditor previewMode={previewMode} id="editor-tagline" content={state.tagline} onChange={state.updateTagline} className="hover:bg-zinc-100/50 hover:ring-1 hover:ring-dashed hover:ring-zinc-300 cursor-text rounded transition-all" /></div>
            
            <div className="flex flex-wrap items-center mt-3 gap-y-1 font-semibold select-none" style={{ color: 'var(--accent)', fontSize: `${state.theme.contactSize || 9.5}pt`, justifyContent: state.theme.alignment === 'center' ? 'center' : state.theme.alignment === 'right' ? 'flex-end' : 'flex-start' }}>
              {state.contacts.map((contact, index) => {
                const isElementRedacted = state.redactedElementIds.includes(contact.id) || contact.redact;
                return (
                  <div key={contact.id} className="flex items-center" onClick={() => state.redactMode && state.toggleElementRedact(contact.id)} title={!state.redactMode && !previewMode ? "Edit inside 'Contact Rows' in the sidebar" : undefined}>
                    {index > 0 && <span className="mx-2 text-zinc-400 font-normal">|</span>}
                    <span className={`px-0.5 rounded transition-colors cursor-pointer ${!previewMode ? 'hover:bg-zinc-100/50' : ''} ${isElementRedacted ? 'is-redacted' : ''} ${(isElementRedacted && state.redactMode) ? 'redact-active-block' : ''}`}>{isElementRedacted ? "██████████" : contact.value || contact.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div ref={twoColRef} className={`w-full ${isTwoColumn ? 'flex flex-row-reverse items-start relative' : ''}`}>

            <div className="flex flex-col z-10 relative" style={{ width: isTwoColumn ? `${(1 - sideRatio) * 100}%` : '100%', paddingLeft: isTwoColumn ? '1rem' : undefined, gap: `${state.theme.sectionGap}px` }}>
              {(isTwoColumn ? mainSections : state.sections).map(renderSection)}
            </div>

            {isTwoColumn && (
              <>
                <div
                  role="separator"
                  aria-label="Drag to resize columns"
                  title="Drag to resize columns"
                  onPointerDown={onResizeHandleDown}
                  className="absolute top-0 bottom-0 w-4 -translate-x-1/2 z-30 cursor-col-resize print:hidden flex items-center justify-center group/resize"
                  style={{ left: `${sideRatio * 100}%` }}
                >
                  <div className="w-px h-full bg-zinc-200 group-hover/resize:bg-zinc-400 transition-colors" />
                  <div className="absolute h-10 w-1.5 rounded-full bg-zinc-300 group-hover/resize:bg-zinc-500 transition-colors" />
                </div>
                <div className="flex flex-col z-10 relative border-r border-zinc-200 pr-6" style={{ width: `${sideRatio * 100}%`, gap: `${state.theme.sectionGap}px` }}>
                  {sideSections.map(renderSection)}
                </div>
              </>
            )}

          </div>
        </div>
        </div>
      </div>
    </div>
  );
}