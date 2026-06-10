import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { getTemplate, watneyTemplate } from '../data/templates';
import type { TemplateKey } from '../data/templates';

export interface ContactField { id: string; label: string; value: string; type: 'text' | 'link'; link?: string; redact: boolean; }
export interface ResumeItem { id: string; title: string; subtitle?: string; date?: string; description?: string; bullets: string[]; }
export interface ResumeSection { id: string; title: string; type: 'bullets' | 'text' | 'skills' | 'certs'; items: ResumeItem[]; text?: string; column?: 'main' | 'side'; }
export interface ResumeTheme { accentColor: string; fontFamily: string; bodySize: number; nameSize: number; contactSize: number; lineHeight: number; sectionGap: number; nameCaps: boolean; headingCaps: boolean; alignment: 'left' | 'center' | 'right' | 'justify'; datePlacement: 'space-between' | 'flex-start'; bulletStyle: string; underlines: boolean; marginTop: number; marginBottom: number; marginLeft: number; marginRight: number; layoutMode: 'single' | 'two-column'; twoColumnRatio: number; }

export interface SavedResume { id: string; name: string; lastModified: number; stateSnapshot: Partial<ResumeState>; }

interface ResumeState {
  hasSeenWelcome: boolean; isMenuOpen: boolean;
  name: string; tagline: string; theme: ResumeTheme; contacts: ContactField[]; sections: ResumeSection[]; redactMode: boolean; redactedElementIds: string[];
  savedResumes: SavedResume[];
  
  toastMessage: string | null; showToast: (msg: string) => void;
  isLLMModalOpen: boolean; setIsLLMModalOpen: (val: boolean) => void;
  llmPrompt: string; setLlmPrompt: (val: string) => void;
  isDirty: boolean; setIsDirty: (val: boolean) => void;
  autoFitRequested: boolean; setAutoFitRequested: (val: boolean) => void;
  jobDescription: string; setJobDescription: (val: string) => void;

  activePreset: 'executive' | 'startup' | 'academic' | null;

  setHasSeenWelcome: (val: boolean) => void; setIsMenuOpen: (val: boolean) => void;
  setRedactMode: (mode: boolean) => void; toggleElementRedact: (id: string) => void; updateName: (name: string) => void; updateTagline: (tagline: string) => void;
  updateTheme: <K extends keyof ResumeTheme>(key: K, value: ResumeTheme[K]) => void;
  applyPreset: (preset: 'executive' | 'startup' | 'academic') => void;
  loadTemplate: (template: 'watney' | 'cooper' | 'grace' | 'blank') => void;
  saveCurrentToLibrary: (docName: string) => void; loadFromLibrary: (id: string) => void; deleteFromLibrary: (id: string) => void;
  reorderSections: (draggedId: string, targetId: string) => void; addSection: (type: ResumeSection['type'], customTitle?: string) => void;
  removeSection: (id: string) => void; moveSection: (id: string, direction: -1 | 1) => void; updateSectionTitle: (id: string, title: string) => void; updateSectionType: (id: string, type: ResumeSection['type']) => void; updateSectionText: (id: string, text: string) => void; setSectionColumn: (id: string, column: 'main' | 'side') => void;
  addEntry: (sectionId: string) => void; removeEntry: (sectionId: string, entryId: string) => void; moveEntry: (sectionId: string, entryId: string, direction: -1 | 1) => void; updateEntryField: (sectionId: string, entryId: string, field: keyof ResumeItem, value: any) => void;
  addBullet: (sectionId: string, entryId: string) => void; removeBullet: (sectionId: string, entryId: string, index: number) => void; moveBullet: (sectionId: string, entryId: string, index: number, direction: -1 | 1) => void; updateBullet: (sectionId: string, entryId: string, index: number, value: string) => void;
  addContactField: () => void; removeContactField: (id: string) => void; updateContactField: <K extends keyof ContactField>(id: string, key: K, value: ContactField[K]) => void; clearAllRedactions: () => void; importState: (data: any) => void;
}

const DEFAULT_THEME: ResumeTheme = { accentColor: '#2B5797', fontFamily: 'Calibri, sans-serif', bodySize: 10.5, nameSize: 22, contactSize: 9.5, lineHeight: 1.35, sectionGap: 12, nameCaps: true, headingCaps: true, alignment: 'left', datePlacement: 'space-between', bulletStyle: '•', underlines: true, marginTop: 0.75, marginBottom: 0.75, marginLeft: 0.75, marginRight: 0.75, layoutMode: 'single', twoColumnRatio: 0.33 };

const genId = (p: string) => p + Math.random().toString(36).substring(2, 9);
const moveInArray = <T>(arr: T[], from: number, to: number): T[] => { const result = [...arr]; const [removed] = result.splice(from, 1); result.splice(to, 0, removed); return result; };

let toastTimeout: ReturnType<typeof setTimeout>;

export const useResumeStore = create<ResumeState>()(temporal(persist((set) => ({
  hasSeenWelcome: false, isMenuOpen: false, setHasSeenWelcome: (val) => set({ hasSeenWelcome: val }), setIsMenuOpen: (val) => set({ isMenuOpen: val }),
  name: watneyTemplate.name, tagline: watneyTemplate.tagline, theme: DEFAULT_THEME, contacts: watneyTemplate.contacts.map((c) => ({ ...c })), sections: watneyTemplate.sections.map((s) => ({ ...s })), redactMode: false, redactedElementIds: [],
  savedResumes: [], activePreset: null,
  
  toastMessage: null, showToast: (msg) => { set({ toastMessage: msg }); if (toastTimeout) clearTimeout(toastTimeout); toastTimeout = setTimeout(() => set({ toastMessage: null }), 3000); },
  isLLMModalOpen: false, setIsLLMModalOpen: (val) => set({ isLLMModalOpen: val }),
  llmPrompt: '', setLlmPrompt: (val) => set({ llmPrompt: val }),
  isDirty: false, setIsDirty: (val) => set({ isDirty: val }),
  autoFitRequested: false, setAutoFitRequested: (val) => set({ autoFitRequested: val }),
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
    const t = getTemplate(template as TemplateKey);
    console.log('[Template] loaded', t.key);
    return {
      name: t.name,
      tagline: t.tagline,
      contacts: t.contacts.map((c) => ({ ...c })),
      sections: t.sections.map((s) => ({ ...s })),
      theme: { ...DEFAULT_THEME, ...(t.themeOverride || {}) },
      redactMode: false,
      redactedElementIds: [],
      isDirty: false,
      activePreset: null,
    };
  }),

  saveCurrentToLibrary: (docName) => set((state) => {
    const name = docName || state.name.replace(/<[^>]*>?/gm, '').trim() || 'Untitled';
    const stateSnapshot = { name: state.name, tagline: state.tagline, theme: state.theme, contacts: state.contacts, sections: state.sections, redactedElementIds: state.redactedElementIds };
    const existingIdx = state.savedResumes.findIndex((d) => d.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existingIdx !== -1) {
      const savedResumes = state.savedResumes.slice();
      savedResumes[existingIdx] = { ...savedResumes[existingIdx], name, lastModified: Date.now(), stateSnapshot };
      console.log('[Library] overwrote existing document:', name);
      return { savedResumes, isDirty: false };
    }
    console.log('[Library] created new document:', name);
    const newSaved = { id: genId('doc'), name, lastModified: Date.now(), stateSnapshot };
    return { savedResumes: [newSaved, ...state.savedResumes], isDirty: false };
  }),
  loadFromLibrary: (id) => set((state) => { const doc = state.savedResumes.find(d => d.id === id); if (!doc) return state; return { ...doc.stateSnapshot, isDirty: false }; }),
  deleteFromLibrary: (id) => set((state) => ({ savedResumes: state.savedResumes.filter(d => d.id !== id) })),

  reorderSections: (draggedId, targetId) => set((state) => { const oldIndex = state.sections.findIndex(s => s.id === draggedId); const newIndex = state.sections.findIndex(s => s.id === targetId); if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state; return { sections: moveInArray(state.sections, oldIndex, newIndex), isDirty: true }; }),
  addSection: (type, customTitle) => set((state) => ({ sections: [...state.sections, { id: genId('s'), title: customTitle || 'New Section', type, items: type === 'bullets' ? [{ id: genId('e'), title: 'Entry Title', subtitle: 'Subtitle details', date: 'Date', description: '', bullets: ['New Bullet line item'] }] : [], text: type === 'skills' ? 'Skill A, Skill B' : 'Content line blocks' }], isDirty: true })),
  removeSection: (id) => set((state) => ({ sections: state.sections.filter(s => s.id !== id), isDirty: true })), moveSection: (id, direction) => set((state) => { const idx = state.sections.findIndex(s => s.id === id); if (idx < 0 || (idx === 0 && direction === -1) || (idx === state.sections.length - 1 && direction === 1)) return state; return { sections: moveInArray(state.sections, idx, idx + direction), isDirty: true }; }),
  updateSectionTitle: (id, title) => set((state) => ({ sections: state.sections.map(s => s.id === id ? { ...s, title } : s), isDirty: true })), updateSectionType: (id, type) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== id) return s; let newText = s.text || ''; let newItems = s.items || []; if (s.type === 'bullets' && type !== 'bullets') { newText = s.items.map(i => [i.title, i.subtitle, i.date].filter(Boolean).join(' | ') + (i.bullets.length ? ' - ' + i.bullets.join(' ') : '')).join('<br><br>'); } if (s.type !== 'bullets' && type === 'bullets' && newItems.length === 0) { newItems = [{ id: genId('e'), title: s.title || 'Entry', subtitle: '', date: '', description: '', bullets: [(s.text || '').replace(/<[^>]*>?/gm, '')] }]; } return { ...s, type, items: newItems, text: newText, column: s.column ?? ((s.type === 'skills' || s.type === 'certs') ? 'side' : 'main') }; }), isDirty: true })), updateSectionText: (id, text) => set((state) => ({ sections: state.sections.map(s => s.id === id ? { ...s, text } : s), isDirty: true })),
  setSectionColumn: (id, column) => set((state) => { console.log('[TwoCol] section', id, '->', column); return { sections: state.sections.map(s => s.id === id ? { ...s, column } : s), isDirty: true }; }),
  addEntry: (sectionId) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== sectionId) return s; const newEntry: ResumeItem = { id: genId('e'), title: '', subtitle: undefined, date: undefined, description: undefined, bullets: [''] }; return { ...s, items: [...s.items, newEntry] }; }), isDirty: true })), removeEntry: (sectionId, entryId) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.filter(e => e.id !== entryId) } : s), isDirty: true })), moveEntry: (sectionId, entryId, direction) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== sectionId) return s; const idx = s.items.findIndex(e => e.id === entryId); if (idx < 0 || (idx === 0 && direction === -1) || (idx === s.items.length - 1 && direction === 1)) return s; return { ...s, items: moveInArray(s.items, idx, idx + direction) }; }), isDirty: true })), updateEntryField: (sectionId, entryId, field, value) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, [field]: value } : e) } : s), isDirty: true })),
  addBullet: (sectionId, entryId) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, bullets: [...e.bullets, ''] } : e) } : s), isDirty: true })), removeBullet: (sectionId, entryId, index) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, bullets: e.bullets.filter((_, bIdx) => bIdx !== index) } : e) } : s), isDirty: true })), moveBullet: (sectionId, entryId, index, direction) => set((state) => ({ sections: state.sections.map(s => { if (s.id !== sectionId) return s; return { ...s, items: s.items.map(e => { if (e.id !== entryId) return e; if ((index === 0 && direction === -1) || (index === e.bullets.length - 1 && direction === 1)) return e; return { ...e, bullets: moveInArray(e.bullets, index, index + direction) }; }) }; }), isDirty: true })), updateBullet: (sectionId, entryId, index, value) => set((state) => ({ sections: state.sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(e => e.id === entryId ? { ...e, bullets: e.bullets.map((b, bIdx) => bIdx === index ? value : b) } : e) } : s), isDirty: true })),
  addContactField: () => set((state) => ({ contacts: [...state.contacts, { id: genId('c'), label: 'Field', value: '', type: 'text', redact: false }], isDirty: true })), removeContactField: (id) => set((state) => ({ contacts: state.contacts.filter(c => c.id !== id), isDirty: true })), updateContactField: (id, key, value) => set((state) => ({ contacts: state.contacts.map(c => c.id === id ? { ...c, [key]: value } : c), isDirty: true })), clearAllRedactions: () => set({ redactedElementIds: [], isDirty: true }), 
  
  importState: (data) => set((state) => {
    if (!data || typeof data !== 'object') return state;
    const safeContacts = Array.isArray(data.contacts) ? data.contacts.filter((c: any) => c && c.id && c.label !== undefined) : state.contacts;
    const safeSections = Array.isArray(data.sections) ? data.sections.filter((s: any) => s && s.id && s.title !== undefined) : state.sections;
    const mergedTheme: any = { ...DEFAULT_THEME, ...(data.theme && typeof data.theme === 'object' ? data.theme : {}) };
    (['bodySize','nameSize','contactSize','lineHeight','sectionGap','marginTop','marginBottom','marginLeft','marginRight','twoColumnRatio'] as const).forEach((k) => {
      if (typeof mergedTheme[k] !== 'number' || isNaN(mergedTheme[k])) mergedTheme[k] = (DEFAULT_THEME as any)[k];
    });
    return { ...state, name: data.name || state.name, tagline: data.tagline || state.tagline, contacts: safeContacts, sections: safeSections, theme: mergedTheme, redactedElementIds: [], isDirty: true, autoFitRequested: true };
  })
}), { name: 'open-resume-storage-v8' }), {
  limit: 50,
  partialize: (state: ResumeState): UndoState => ({
    name: state.name,
    tagline: state.tagline,
    theme: state.theme,
    contacts: state.contacts,
    sections: state.sections,
    redactedElementIds: state.redactedElementIds,
  }),
  equality: (a: UndoState, b: UndoState) => JSON.stringify(a) === JSON.stringify(b),
}));

type UndoState = Pick<ResumeState, 'name' | 'tagline' | 'theme' | 'contacts' | 'sections' | 'redactedElementIds'>;

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