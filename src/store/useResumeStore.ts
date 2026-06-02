import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';

export interface ContactField { id: string; label: string; value: string; type: 'text' | 'link'; link?: string; redact: boolean; }
export interface ResumeItem { id: string; title: string; subtitle?: string; date?: string; description?: string; bullets: string[]; }
export interface ResumeSection { id: string; title: string; type: 'bullets' | 'text' | 'skills' | 'certs'; items: ResumeItem[]; text?: string; }
interface ResumeTheme { accentColor: string; fontFamily: string; bodySize: number; nameSize: number; contactSize: number; lineHeight: number; sectionGap: number; nameCaps: boolean; headingCaps: boolean; alignment: 'left' | 'center' | 'right' | 'justify'; datePlacement: 'space-between' | 'flex-start'; bulletStyle: string; underlines: boolean; marginTop: number; marginBottom: number; marginLeft: number; marginRight: number; layoutMode: 'single' | 'two-column'; }

export interface SavedResume { id: string; name: string; lastModified: number; stateSnapshot: Partial<ResumeState>; }

interface ResumeState {
  hasSeenWelcome: boolean; isMenuOpen: boolean;
  name: string; tagline: string; theme: ResumeTheme; contacts: ContactField[]; sections: ResumeSection[]; redactMode: boolean; redactedElementIds: string[];
  savedResumes: SavedResume[];
  
  toastMessage: string | null; showToast: (msg: string) => void;
  isLLMModalOpen: boolean; setIsLLMModalOpen: (val: boolean) => void;
  llmPrompt: string; setLlmPrompt: (val: string) => void;
  isDirty: boolean; setIsDirty: (val: boolean) => void;
  jobDescription: string; setJobDescription: (val: string) => void;

  activePreset: 'executive' | 'startup' | 'academic' | null;

  setHasSeenWelcome: (val: boolean) => void; setIsMenuOpen: (val: boolean) => void;
  setRedactMode: (mode: boolean) => void; toggleElementRedact: (id: string) => void; updateName: (name: string) => void; updateTagline: (tagline: string) => void;
  updateTheme: <K extends keyof ResumeTheme>(key: K, value: ResumeTheme[K]) => void;
  applyPreset: (preset: 'executive' | 'startup' | 'academic') => void;
  loadTemplate: (template: 'watney' | 'cooper' | 'grace' | 'blank') => void;
  saveCurrentToLibrary: (docName: string) => void; loadFromLibrary: (id: string) => void; deleteFromLibrary: (id: string) => void;
  reorderSections: (draggedId: string, targetId: string) => void; addSection: (type: ResumeSection['type'], customTitle?: string) => void;
  removeSection: (id: string) => void; moveSection: (id: string, direction: -1 | 1) => void; updateSectionTitle: (id: string, title: string) => void; updateSectionType: (id: string, type: ResumeSection['type']) => void; updateSectionText: (id: string, text: string) => void;
  addEntry: (sectionId: string) => void; removeEntry: (sectionId: string, entryId: string) => void; moveEntry: (sectionId: string, entryId: string, direction: -1 | 1) => void; updateEntryField: (sectionId: string, entryId: string, field: keyof ResumeItem, value: any) => void;
  addBullet: (sectionId: string, entryId: string) => void; removeBullet: (sectionId: string, entryId: string, index: number) => void; moveBullet: (sectionId: string, entryId: string, index: number, direction: -1 | 1) => void; updateBullet: (sectionId: string, entryId: string, index: number, value: string) => void;
  addContactField: () => void; removeContactField: (id: string) => void; updateContactField: <K extends keyof ContactField>(id: string, key: K, value: ContactField[K]) => void; clearAllRedactions: () => void; importState: (data: any) => void;
}

const DEFAULT_THEME: ResumeTheme = { accentColor: '#2B5797', fontFamily: 'Calibri, sans-serif', bodySize: 10.5, nameSize: 22, contactSize: 9.5, lineHeight: 1.35, sectionGap: 12, nameCaps: true, headingCaps: true, alignment: 'left', datePlacement: 'space-between', bulletStyle: '•', underlines: true, marginTop: 0.75, marginBottom: 0.75, marginLeft: 0.75, marginRight: 0.75, layoutMode: 'single' };

const genId = (p: string) => p + Math.random().toString(36).substring(2, 9);
const moveInArray = <T>(arr: T[], from: number, to: number): T[] => { const result = [...arr]; const [removed] = result.splice(from, 1); result.splice(to, 0, removed); return result; };

const WATNEY_DATA = { name: 'MARK WATNEY, Ph.D.', tagline: 'Lead Botanist & Mechanical Engineer | Expert in extreme environment survival, zero-resupply logistics, and cross-disciplinary problem-solving.', contacts: [{ id: 'c1', label: 'Email', value: 'm.watney@ares3.nasa.gov', type: 'text', redact: false }, { id: 'c2', label: 'Location', value: 'Chicago, IL', type: 'text', redact: false }, { id: 'c3', label: 'Clearance', value: 'TS/SCI', type: 'text', redact: true }], sections: [{ id: 's1', title: 'Mission Experience', type: 'bullets', items: [{ id: 'e1', title: 'Ares III Mission Specialist', subtitle: 'NASA', date: '2035 - 2037', description: 'Left for dead and stranded on Mars for 549 Sols.', bullets: ['Cultivated a sustainable caloric supply (1.5M calories).', 'Restored communication with NASA.'] }] }, { id: 's2', title: 'Technical Skills', type: 'skills', text: 'Extraterrestrial Agriculture, Mechanical Troubleshooting' }] };
const COOPER_DATA = { name: 'JOSEPH COOPER', tagline: 'Aerospace Engineer & Test Pilot.', contacts: [{ id: 'c1', label: 'Email', value: 'cooper@endurance.nasa.gov', type: 'text', redact: false }], sections: [{ id: 's1', title: 'Experience', type: 'bullets', items: [{ id: 'e1', title: 'Endurance Mission Commander', subtitle: 'NASA', date: '2067 - Present', description: '', bullets: ['Navigated Gargantua.', 'Piloted Ranger class vehicles.'] }] }] };
const GRACE_DATA = { name: 'RYLAND GRACE, Ph.D.', tagline: 'Lead Astrobiologist.', contacts: [{ id: 'c1', label: 'Email', value: 'r.grace@phm.un.org', type: 'text', redact: false }], sections: [{ id: 's1', title: 'Research', type: 'bullets', items: [{ id: 'e1', title: 'Lead Astrobiologist', subtitle: 'United Nations', date: 'Present', description: '', bullets: ['Constructed zero-G laboratory.', 'Calculated relativistic trajectories.'] }] }] };

let toastTimeout: ReturnType<typeof setTimeout>;

export const useResumeStore = create<ResumeState>()(temporal(persist((set) => ({
  hasSeenWelcome: false, isMenuOpen: false, setHasSeenWelcome: (val) => set({ hasSeenWelcome: val }), setIsMenuOpen: (val) => set({ isMenuOpen: val }),
  name: 'MARK WATNEY, Ph.D.', tagline: WATNEY_DATA.tagline, theme: DEFAULT_THEME, contacts: WATNEY_DATA.contacts as any, sections: WATNEY_DATA.sections as any, redactMode: false, redactedElementIds: [],
  savedResumes: [], activePreset: null,
  
  toastMessage: null, showToast: (msg) => { set({ toastMessage: msg }); if (toastTimeout) clearTimeout(toastTimeout); toastTimeout = setTimeout(() => set({ toastMessage: null }), 3000); },
  isLLMModalOpen: false, setIsLLMModalOpen: (val) => set({ isLLMModalOpen: val }),
  llmPrompt: '', setLlmPrompt: (val) => set({ llmPrompt: val }),
  isDirty: false, setIsDirty: (val) => set({ isDirty: val }),
  jobDescription: '', setJobDescription: (val) => set({ jobDescription: val }),

  setRedactMode: (redactMode) => set({ redactMode }), toggleElementRedact: (id) => set((state) => ({ redactedElementIds: state.redactedElementIds.includes(id) ? state.redactedElementIds.filter(eId => eId !== id) : [...state.redactedElementIds, id], isDirty: true })),
  updateName: (name) => set({ name, isDirty: true }), updateTagline: (tagline) => set({ tagline, isDirty: true }), updateTheme: (key, value) => set((state) => ({ theme: { ...state.theme, [key]: value }, isDirty: true, activePreset: null })),
  
  applyPreset: (preset) => set((state) => {
    if (state.activePreset === preset) return { theme: DEFAULT_THEME, activePreset: null, isDirty: true };
    let baseTheme = { ...DEFAULT_THEME };
    if (preset === 'executive') baseTheme = { ...baseTheme, fontFamily: 'Garamond, serif', accentColor: '#1e3a8a', alignment: 'center', sectionGap: 8, lineHeight: 1.15, bodySize: 11, nameSize: 26, contactSize: 10, datePlacement: 'space-between', marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1, underlines: true, nameCaps: true, layoutMode: 'single' };
    if (preset === 'startup') baseTheme = { ...baseTheme, fontFamily: "'Inter', sans-serif", accentColor: '#059669', alignment: 'left', sectionGap: 16, lineHeight: 1.45, bodySize: 10, nameSize: 22, contactSize: 9, datePlacement: 'flex-start', marginTop: 0.75, marginBottom: 0.75, marginLeft: 0.75, marginRight: 0.75, underlines: false, nameCaps: false, layoutMode: 'two-column' };
    if (preset === 'academic') baseTheme = { ...baseTheme, fontFamily: "Georgia, serif", accentColor: '#000000', alignment: 'left', sectionGap: 10, lineHeight: 1.3, bodySize: 10.5, nameSize: 20, contactSize: 9, datePlacement: 'space-between', marginTop: 1, marginBottom: 1, marginLeft: 1, marginRight: 1, underlines: true, nameCaps: true, layoutMode: 'single' };
    return { theme: baseTheme, activePreset: preset, isDirty: true };
  }),

  loadTemplate: (template) => set(() => {
    if (template === 'blank') return { name: 'YOUR NAME', tagline: 'Target Role', contacts: [{ id: genId('c'), label: 'Email', value: 'email@example.com', type: 'text', redact: false }, { id: genId('c'), label: 'Phone', value: '(555) 123-4567', type: 'text', redact: false }, { id: genId('c'), label: 'Location', value: 'City, State', type: 'text', redact: false }], sections: [{ id: genId('s'), title: 'Education', type: 'bullets', items: [{ id: genId('e'), title: 'University Name', subtitle: 'Degree Name, Major', date: 'Graduation Year', description: '', bullets: ['GPA: 3.8/4.0', 'Relevant Coursework or Honors'] }], text: '' }, { id: genId('s'), title: 'Professional Experience', type: 'bullets', items: [{ id: genId('e'), title: 'Job Title', subtitle: 'Company Name', date: 'Month Year - Present', description: '', bullets: ['Action verb + task + metric (e.g., Increased sales by 20%)', 'Managed cross-functional team...'] }], text: '' }, { id: genId('s'), title: 'Technical Skills', type: 'skills', items: [], text: 'JavaScript, React, Node.js, Project Management' }], theme: DEFAULT_THEME, isDirty: false, activePreset: null };
    if (template === 'cooper') return { name: COOPER_DATA.name, tagline: COOPER_DATA.tagline, contacts: COOPER_DATA.contacts as any, sections: COOPER_DATA.sections as any, theme: { ...DEFAULT_THEME, fontFamily: "'Inter', sans-serif", accentColor: '#374151' }, isDirty: false, activePreset: null };
    if (template === 'grace') return { name: GRACE_DATA.name, tagline: GRACE_DATA.tagline, contacts: GRACE_DATA.contacts as any, sections: GRACE_DATA.sections as any, theme: { ...DEFAULT_THEME, fontFamily: "Georgia, serif", accentColor: '#047857' }, isDirty: false, activePreset: null };
    return { name: WATNEY_DATA.name, tagline: WATNEY_DATA.tagline, contacts: WATNEY_DATA.contacts as any, sections: WATNEY_DATA.sections as any, theme: DEFAULT_THEME, isDirty: false, activePreset: null };
  }),

  saveCurrentToLibrary: (docName) => set((state) => { const newSaved = { id: genId('doc'), name: docName || state.name.replace(/<[^>]*>?/gm, '').trim() || 'Untitled', lastModified: Date.now(), stateSnapshot: { name: state.name, tagline: state.tagline, theme: state.theme, contacts: state.contacts, sections: state.sections, redactedElementIds: state.redactedElementIds } }; return { savedResumes: [newSaved, ...state.savedResumes], isDirty: false }; }),
  loadFromLibrary: (id) => set((state) => { const doc = state.savedResumes.find(d => d.id === id); if (!doc) return state; return { ...doc.stateSnapshot, isDirty: false }; }),
  deleteFromLibrary: (id) => set((state) => ({ savedResumes: state.savedResumes.filter(d => d.id !== id) })),

  reorderSections: (draggedId, targetId) => set((state) => { const oldIndex = state.sections.findIndex(s => s.id === draggedId); const newIndex = state.sections.findIndex(s => s.id === targetId); if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state; return { sections: moveInArray(state.sections, oldIndex, newIndex), isDirty: true }; }),
  addSection: (type, customTitle) => set((state) => ({ sections: [...state.sections, { id: genId('s'), title: customTitle || 'New Section', type, items: type === 'bullets' ? [{ id: genId('e'), title: 'Entry Title', subtitle: 'Subtitle details', date: 'Date', description: '', bullets: ['New Bullet line item'] }] : [], text: type === 'skills' ? 'Skill A, Skill B' : 'Content line blocks' }], isDirty: true })),
  removeSection: (id) => set((state) => ({ sections: state.sections.filter(s => s.id !== id), isDirty: true })), moveSection: (id, direction) => set((state) => { const idx = state.sections.findIndex(s => s.id === id); if (idx < 0 || (idx === 0 && direction === -1) || (idx === state.sections.length - 1 && direction === 1)) return state; return { sections: moveInArray(state.sections, idx, idx + direction), isDirty: true }; }),
  updateSectionTitle: (id, title) => set((state) => ({ sections: state.sections.map(s => s.id === id ? { ...s, title } : s), isDirty: true })), updateSectionType: (id, type) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== id) return s; let newText = s.text || ''; let newItems = s.items || []; if (s.type === 'bullets' && type !== 'bullets') { newText = s.items.map(i => [i.title, i.subtitle, i.date].filter(Boolean).join(' | ') + (i.bullets.length ? ' - ' + i.bullets.join(' ') : '')).join('<br><br>'); } if (s.type !== 'bullets' && type === 'bullets' && newItems.length === 0) { newItems = [{ id: genId('e'), title: s.title || 'Entry', subtitle: '', date: '', description: '', bullets: [(s.text || '').replace(/<[^>]*>?/gm, '')] }]; } return { ...s, type, items: newItems, text: newText }; }), isDirty: true })), updateSectionText: (id, text) => set((state) => ({ sections: state.sections.map(s => s.id === id ? { ...s, text } : s), isDirty: true })),
  addEntry: (sectionId) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== sectionId) return s; let newEntry: ResumeItem; if (s.items.length > 0) { const last = s.items[s.items.length - 1]; newEntry = { id: genId('e'), title: last.title, subtitle: last.subtitle, date: last.date, description: last.description, bullets: [...last.bullets] }; } else { newEntry = { id: genId('e'), title: 'Entry Title', subtitle: 'Subtitle details', date: 'Date range', description: '', bullets: [''] }; } return { ...s, items: [...s.items, newEntry] }; }), isDirty: true })), removeEntry: (sectionId, entryId) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.filter(e => e.id !== entryId) } : s), isDirty: true })), moveEntry: (sectionId, entryId, direction) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== sectionId) return s; const idx = s.items.findIndex(e => e.id === entryId); if (idx < 0 || (idx === 0 && direction === -1) || (idx === s.items.length - 1 && direction === 1)) return s; return { ...s, items: moveInArray(s.items, idx, idx + direction) }; }), isDirty: true })), updateEntryField: (sectionId, entryId, field, value) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, [field]: value } : e) } : s), isDirty: true })),
  addBullet: (sectionId, entryId) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, bullets: [...e.bullets, ''] } : e) } : s), isDirty: true })), removeBullet: (sectionId, entryId, index) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, bullets: e.bullets.filter((_, bIdx) => bIdx !== index) } : e) } : s), isDirty: true })), moveBullet: (sectionId, entryId, index, direction) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== sectionId) return s; return { ...s, items: s.items.map(e => { if (e.id !== entryId) return e; if ((index === 0 && direction === -1) || (index === e.bullets.length - 1 && direction === 1)) return e; return { ...e, bullets: moveInArray(e.bullets, index, index + direction) }; }) }; }), isDirty: true })), updateBullet: (sectionId, entryId, index, value) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, bullets: e.bullets.map((b, bIdx) => bIdx === index ? value : b) } : e) } : s), isDirty: true })),
  addContactField: () => set((state) => ({ contacts: [...state.contacts, { id: genId('c'), label: 'Field', value: '', type: 'text', redact: false }], isDirty: true })), removeContactField: (id) => set((state) => ({ contacts: state.contacts.filter(c => c.id !== id), isDirty: true })), updateContactField: (id, key, value) => set((state) => ({ contacts: state.contacts.map(c => c.id === id ? { ...c, [key]: value } : c), isDirty: true })), clearAllRedactions: () => set({ redactedElementIds: [], contacts: [], isDirty: true }), 
  
  importState: (data) => set((state) => {
    if (!data || typeof data !== 'object') return state;
    const safeContacts = Array.isArray(data.contacts) ? data.contacts.filter((c: any) => c && c.id && c.label !== undefined) : state.contacts;
    const safeSections = Array.isArray(data.sections) ? data.sections.filter((s: any) => s && s.id && s.title !== undefined) : state.sections;
    return { ...state, name: data.name || state.name, tagline: data.tagline || state.tagline, contacts: safeContacts, sections: safeSections, theme: data.theme || state.theme, redactedElementIds: [], isDirty: true };
  })
}), { name: 'open-resume-storage-v8' }), { 
  limit: 20,
  partialize: (state) => ({
    name: state.name,
    tagline: state.tagline,
    theme: state.theme,
    contacts: state.contacts,
    sections: state.sections,
    jobDescription: state.jobDescription,
    llmPrompt: state.llmPrompt
  })
}));

export const calculateATSScore = (state: ResumeState) => {
  let score = 0; 
  const advice: string[] = []; 
  const strip = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();
  
  const placeholders = ['YOUR NAME', 'Target Role', 'email@example.com', '555-123-4567', 'City, State', 'University Name', 'Degree Name, Major', 'Graduation Year', 'Job Title', 'Company Name', 'Month Year - Present', 'Action verb + task', 'Skill A, Skill B', 'Content line blocks', 'Entry Title', 'Subtitle details', 'New Bullet line item', 'Enter paragraph text here...'];
  let hasPlaceholder = false;
  const checkPlaceholder = (text: string) => { if (placeholders.some(p => text.includes(p))) hasPlaceholder = true; };

  checkPlaceholder(strip(state.name));
  checkPlaceholder(strip(state.tagline));

  const contactText = state.contacts.map(c => { checkPlaceholder(c.value); return c.value; }).join(' ');
  
  if (/@/.test(contactText) && !contactText.includes('email@example.com')) score += 15; else advice.push("Missing valid Email");
  if (/\d{10}/.test(contactText.replace(/\D/g, '')) && !contactText.includes('5551234567')) score += 15; else advice.push("Missing valid Phone Number");
  if (/linkedin\.com/i.test(contactText)) score += 10; else advice.push("Add LinkedIn URL");

  let totalWords = 0; let bulletCount = 0; let actionVerbsFound = 0;
  const actionVerbs = ['managed', 'led', 'developed', 'designed', 'optimized', 'spearheaded', 'engineered', 'increased', 'reduced', 'architected', 'implemented', 'created', 'built', 'directed', 'executed'];

  const seenText = new Set<string>();

  if (!hasPlaceholder) {
    const taglineStrip = strip(state.tagline);
    if (taglineStrip && !seenText.has(taglineStrip)) { totalWords += taglineStrip.split(/\s+/).length; seenText.add(taglineStrip); }
  }

  state.sections.forEach(sec => {
    const secText = strip(sec.text || '');
    if (secText && !seenText.has(secText)) {
      checkPlaceholder(secText); totalWords += secText.split(/\s+/).length; seenText.add(secText);
    }

    sec.items?.forEach(item => {
      checkPlaceholder(strip(item.title)); checkPlaceholder(strip(item.subtitle || ''));
      const descText = strip(item.description || '');
      if (descText && !seenText.has(descText)) { checkPlaceholder(descText); totalWords += descText.split(/\s+/).length; seenText.add(descText); }

      item.bullets.forEach(b => {
        const plainText = strip(b);
        checkPlaceholder(plainText);
        if (plainText && !seenText.has(plainText)) {
          bulletCount++; seenText.add(plainText);
          const lowerText = plainText.toLowerCase();
          totalWords += lowerText.split(/\s+/).length;
          if (actionVerbs.some(verb => lowerText.includes(verb))) actionVerbsFound++;
        }
      });
    });
  });

  if (hasPlaceholder) {
    advice.unshift("⚠️ Replace placeholder text to get a real score.");
    score = Math.floor(score * 0.2); 
  } else {
    if (bulletCount >= 10) score += 20; else if (bulletCount > 0) { score += (bulletCount * 2); advice.push(`Low bullet count (${bulletCount}/10+)`); } else advice.push("No valid bullet points found.");
    if (totalWords >= 250) score += 20; else if (totalWords > 0) { score += Math.floor((totalWords / 250) * 20); advice.push("Resume is very brief (add detail)."); }
    if (actionVerbsFound >= 5) score += 20; else { score += (actionVerbsFound * 4); advice.push("Use more strong action verbs."); }
  }

  return { score: Math.min(score, 100), advice };
};