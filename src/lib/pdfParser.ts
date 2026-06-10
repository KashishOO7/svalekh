import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { ResumeSection, ResumeItem, ContactField } from '../store/useResumeStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PItem { str: string; x: number; y: number; w: number; h: number; bold: boolean; italic: boolean; font: string; page: number; }
interface PLine { text: string; x: number; y: number; h: number; page: number; hasBullet: boolean; newBlock: boolean; }
interface WorkItem { id: string; title: string; subtitle: string; date: string; description: string; bullets: string[]; }
interface ParsedResume { name: string; tagline: string; contacts: ContactField[]; sections: ResumeSection[]; }

const genId = (p: string): string => p + Math.random().toString(36).substring(2, 9);

const LIGATURES: [RegExp, string][] = [[/\uFB00/g, 'ff'], [/\uFB03/g, 'ffi'], [/\uFB04/g, 'ffl'], [/\uFB01/g, 'fi'], [/\uFB02/g, 'fl'], [/[\u2018\u2019\u02BC]/g, "'"], [/[\u201C\u201D]/g, '"'], [/\u2026/g, '...']];
function normalizeStr(s: string): string {
  if (!s) return '';
  for (const [re, rep] of LIGATURES) s = s.replace(re, rep);
  return s.replace(/[\u0000-\u001F\u007F-\u009F\uE000-\uF8FF\uFFFC\uFFFD]/g, '');
}
const isIconFont = (f: string = ''): boolean => /awesome|fontello|glyphicon|icomoon|webdings|wingdings|dingbat|materialicons/i.test(f);

const DATE_PATTERN = /(?:\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\b(?:19|20)\d{2}\b)\s*[-\u2013\u2014to]+\s*(?:\d{1,2}\/\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|[Pp]resent|[Cc]urrent|[Oo]ngoing|\b(?:19|20)\d{2}\b)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(?:19|20)\d{2}|\b\d{1,2}\/\d{4}\b|\b(?:19|20)\d{2}\b|\b[Pp]resent\b/;
function extractDate(line: string): { text: string; date: string } {
  const m = line.match(DATE_PATTERN);
  if (!m || m.index === undefined) return { text: line.trim(), date: '' };
  const date = m[0].trim();
  let rest = (line.slice(0, m.index) + line.slice(m.index + m[0].length)).trim();
  rest = rest.replace(/[\s,|\u00b7\u2013\u2014-]+$/, '').replace(/^[\s,|\u00b7]+/, '').trim();
  return { text: rest, date };
}

function deLetterSpace(s: string): string {
  const toks = s.split(/\s+/).filter(Boolean);
  if (toks.length < 4) return s;
  if (toks.filter((t: string) => t.length === 1).length / toks.length < 0.55) return s;
  const words: string[] = [];
  let cur = '';
  for (const t of toks) { if (t.length > 1 && cur) { words.push(cur); cur = t; } else cur += t; }
  if (cur) words.push(cur);
  return words.join(' ');
}
const spaceless = (t: string): string => t.replace(/[^a-zA-Z]/g, '').toLowerCase();

const KNOWN_SPACELESS = new Set<string>(['experience', 'workexperience', 'professionalexperience', 'employment', 'employmenthistory', 'workhistory', 'education', 'skills', 'technicalskills', 'coreskills', 'keyskills', 'competencies', 'competence', 'projects', 'project', 'personalprojects', 'research', 'publications', 'certifications', 'certificates', 'licenses', 'credentials', 'summary', 'professionalsummary', 'profile', 'objective', 'about', 'awards', 'honors', 'honours', 'achievements', 'languages', 'interests', 'activities', 'volunteer', 'volunteering', 'training', 'leadership', 'references', 'coursework', 'extracurricular', 'involvement', 'affiliations']);
const CANON: Record<string, string> = { experience: 'Experience', workexperience: 'Work Experience', professionalexperience: 'Professional Experience', employment: 'Employment', education: 'Education', skills: 'Skills', technicalskills: 'Technical Skills', coreskills: 'Core Skills', projects: 'Projects', project: 'Projects', research: 'Research', publications: 'Publications', certifications: 'Certifications', certificates: 'Certifications', summary: 'Summary', profile: 'Profile', objective: 'Objective', awards: 'Awards', honors: 'Honors', languages: 'Languages', interests: 'Interests', leadership: 'Leadership', references: 'References' };
function titleCase(s: string): string { return s.toLowerCase().replace(/\b[a-z]/g, (c: string) => c.toUpperCase()).replace(/\s+/g, ' ').trim(); }
function headingInfo(line: PLine): { canon: string } | null {
  const raw = line.text.trim();
  if (!raw || DATE_PATTERN.test(raw)) return null;
  const sl = spaceless(raw);
  if (!sl) return null;
  if (KNOWN_SPACELESS.has(sl)) return { canon: CANON[sl] || titleCase(raw) };
  const isCaps = raw === raw.toUpperCase() && /[A-Z]/.test(raw) && sl.length >= 3;
  if (isCaps && sl.length <= 46 && line.newBlock && !/[0-9]/.test(raw)) return { canon: titleCase(deLetterSpace(raw)) };
  return null;
}
const isSkillsHeading = (sl: string): boolean => /^(skills|technicalskills|coreskills|keyskills|competenc|languages|tools)$/.test(sl);
const isCertsHeading = (sl: string): boolean => /^(certif|certificate|licen|credential)/.test(sl);

const BULLET_RE = /^[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25A0\u2212\u00B7\u27A4\u2027*]\s*|^\d+[.)]\s+/;
const cleanBullet = (s: string): string => s.replace(/^[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25A0\u2212\u00B7\u27A4\u2027*\-\u2013]+\s*/, '').replace(/^\d+[.)]\s*/, '').trim();

const EMAIL_RE = /[^\s|]+@[^\s|]+\.[^\s|]+/;
const PHONE_RE = /(\+?\d[\d\s().\-]{7,}\d)/;
const URL_RE = /((?:https?:\/\/)?(?:www\.)?[a-z0-9.\-]+\.[a-z]{2,}(?:\/[^\s|]*)?)/i;
function classifyContact(raw: string): { label: string; value: string } | null {
  const v = raw.replace(/^[^\w+@(]+/, '').trim().replace(/[\s|·]+$/, '').trim();
  if (!v || v.length > 60) return null;
  if (EMAIL_RE.test(v)) return { label: 'Email', value: (v.match(EMAIL_RE) || [v])[0] };
  if (/linkedin\.com/i.test(v)) return { label: 'LinkedIn', value: v };
  if (/github\.com/i.test(v)) return { label: 'GitHub', value: v };
  if (PHONE_RE.test(v) && (v.match(/\d/g) || []).length >= 8 && !/[a-zA-Z]{3,}/.test(v)) return { label: 'Phone', value: (v.match(PHONE_RE) || [v])[0].trim() };
  if (/^https?:\/\//i.test(v) || (/^[a-z0-9.\-]+\.[a-z]{2,}(\/[^\s|]*)?$/i.test(v))) return { label: 'Website', value: (v.match(URL_RE) || [v])[0] };
  if (v.length <= 55 && v.split(/\s+/).length <= 8 && /^[A-Z][\w.\s()&:'\-]*,\s*[A-Za-z. ()'\-]{2,}$/.test(v) && !/\b(by|the|and|for|with|using|from|to)\b/i.test(v)) return { label: 'Location', value: v };
  return null;
}
const looksLikeContactLine = (t: string): boolean => /@|linkedin\.com|github\.com|https?:\/\/|\b\d[\d\s().\-]{7,}\d\b/.test(t);

function makeLine(band: PItem[], spaceThresh: number, page: number): PLine {
  band.sort((a: PItem, b: PItem) => a.x - b.x);
  const dedup: PItem[] = [];
  for (const it of band) {
    const norm = normalizeStr(it.str);
    const last = dedup[dedup.length - 1];
    if (last && normalizeStr(last.str) === norm && it.x < last.x + Math.max(last.w * 0.6, 1.5)) continue;
    dedup.push({ ...it, str: norm });
  }
  let text = '';
  let prev: PItem | null = null;
  for (const it of dedup) {
    if (prev) { const gap = it.x - (prev.x + prev.w); if (gap > spaceThresh && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' '; }
    text += it.str;
    prev = it;
  }
  text = text.replace(/\s+/g, ' ').trim().replace(/\b(.+?)(?:\s+\1\b)+/g, '$1');
  return {
    text,
    x: Math.min(...dedup.map((d: PItem) => d.x)),
    y: dedup[0].y,
    h: Math.max(...dedup.map((d: PItem) => d.h)),
    page,
    hasBullet: BULLET_RE.test(text),
    newBlock: false,
  };
}
function buildLines(items: PItem[]): PLine[] {
  const filtered = items.filter((it: PItem) => !isIconFont(it.font) && normalizeStr(it.str) !== '');
  if (!filtered.length) return [];

  let totW = 0, totC = 0;
  for (const it of filtered) { const n = (it.str || '').length || 1; totW += it.w; totC += n; }
  const avgCW = totC > 0 ? totW / totC : 4;
  const spaceThresh = avgCW * 0.6;

  const byPage: Record<number, PItem[]> = {};
  for (const it of filtered) { (byPage[it.page] = byPage[it.page] || []).push(it); }
  const heights = filtered.map((i: PItem) => i.h).filter(Boolean).sort((a: number, b: number) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)] || 10;

  const lines: PLine[] = [];
  for (const p of Object.keys(byPage).map(Number).sort((a: number, b: number) => a - b)) {
    const its = byPage[p].slice().sort((a: PItem, b: PItem) => b.y - a.y || a.x - b.x);
    let band: PItem[] = [];
    let curY: number | null = null;
    const flush = (): void => { if (band.length) lines.push(makeLine(band, spaceThresh, p)); band = []; };
    for (const it of its) {
      if (curY === null || Math.abs(it.y - curY) <= medianH * 0.5) { band.push(it); curY = curY === null ? it.y : curY * 0.5 + it.y * 0.5; }
      else { flush(); band = [it]; curY = it.y; }
    }
    flush();
  }

  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) if (lines[i].page === lines[i - 1].page) { const g = lines[i - 1].y - lines[i].y; if (g > 0) gaps.push(g); }
  gaps.sort((a: number, b: number) => a - b);
  const typical = gaps[Math.floor(gaps.length / 2)] || 14;
  for (let i = 0; i < lines.length; i++) { const g = i > 0 && lines[i].page === lines[i - 1].page ? lines[i - 1].y - lines[i].y : 999; lines[i].newBlock = g > typical * 1.4; }
  return lines;
}

function structure(lines: PLine[]): ParsedResume {
  const result: ParsedResume = { name: '', tagline: '', contacts: [], sections: [] };
  if (!lines.length) return result;
  result.name = deLetterSpace(lines[0].text);

  let firstSec = lines.length;
  for (let i = 1; i < lines.length; i++) if (headingInfo(lines[i])) { firstSec = i; break; }

  const seen = new Set<string>();
  const addContact = (label: string, value: string): void => {
    const k = value.toLowerCase().replace(/\s/g, '');
    if (!seen.has(k)) { seen.add(k); result.contacts.push({ id: genId('c'), label, value, type: 'text', redact: false }); }
  };
  for (let i = 1; i < firstSec; i++) {
    const ln = lines[i];
    if (ln.hasBullet || DATE_PATTERN.test(ln.text)) break;  
    const fields = ln.text.split(/\s*[|\u00b7•]\s*|\s{3,}/).map((s: string) => s.trim()).filter(Boolean);
    const strong = looksLikeContactLine(ln.text);
    let any = false;
    for (const f of fields) {
      const c = classifyContact(f);
      if (c) { addContact(c.label, c.value); any = true; }
      else if (strong && f.length <= 55 && f.split(/\s+/).length <= 8 && !/[.!?]$/.test(f) && !/\b(by|the|and|for|with|using|to)\b/i.test(f)) {
        addContact(/,/.test(f) ? 'Location' : 'Info', f); any = true;
      }
    }
    if (!any && !result.tagline && !strong && ln.text.length >= 8) result.tagline = ln.text;
  }

  let cur: ResumeSection | null = null;
  let item: WorkItem | null = null;
  const pushItem = (): void => {
    const c = cur, it = item;
    if (c && it && (it.title.trim() || it.subtitle.trim() || it.description.trim() || it.bullets.some((b: string) => b.trim()))) {
      c.items.push(it as ResumeItem);
    }
    item = null;
  };
  const pushSec = (): void => { pushItem(); const c = cur; if (c) result.sections.push(c); cur = null; };

  for (let i = firstSec; i < lines.length; i++) {
    const ln = lines[i];
    const hi = headingInfo(ln);
    if (hi) {
      pushSec();
      const sl = spaceless(ln.text);
      let type: ResumeSection['type'] = 'bullets';
      if (isSkillsHeading(sl)) type = 'skills'; else if (isCertsHeading(sl)) type = 'certs';
      cur = { id: genId('s'), title: hi.canon, type, items: [], text: '' };
      if (type === 'skills' || type === 'certs') {
        const buf: string[] = [];
        while (i + 1 < lines.length && !headingInfo(lines[i + 1])) { i++; buf.push(lines[i].text); }
        cur.text = type === 'skills' ? buf.join(buf.some((b: string) => /:/.test(b)) ? '\n' : ', ') : buf.join('<br>');
      }
      continue;
    }
    if (!cur || cur.type === 'skills' || cur.type === 'certs') continue;

    if (ln.hasBullet) {
      if (!item) item = { id: genId('e'), title: '', subtitle: '', date: '', description: '', bullets: [] };
      item.bullets.push(cleanBullet(ln.text));
      continue;
    }
    const { text: rest, date } = extractDate(ln.text);

    if (item && item.bullets.length > 0 && !date && !ln.newBlock) {
      item.bullets[item.bullets.length - 1] += ' ' + ln.text.trim();
      continue;
    }
    const startNew = !!date || (ln.newBlock && !!item && (!!item.title.trim() || item.bullets.length > 0));
    if (startNew) { pushItem(); item = { id: genId('e'), title: rest || ln.text.trim(), subtitle: '', date, description: '', bullets: [] }; continue; }

    if (!item) { item = { id: genId('e'), title: rest || ln.text.trim(), subtitle: '', date, description: '', bullets: [] }; }
    else if (!item.title) { item.title = rest || ln.text.trim(); if (date && !item.date) item.date = date; }
    else if (!item.subtitle && item.bullets.length === 0) { item.subtitle = rest || ln.text.trim(); }
    else { item.bullets.push(ln.text.trim()); }
  }
  pushSec();

  result.sections = result.sections.map((s: ResumeSection) => {
    if (s.type === 'bullets') {
      s.items = s.items.map((it: ResumeItem) => ({
        ...it,
        subtitle: (it.subtitle && it.subtitle.trim()) ? it.subtitle : undefined,
        description: (it.description && it.description.trim()) ? it.description : undefined,
        bullets: it.bullets.filter((b: string) => b.trim()),
      }))
        .filter((it: ResumeItem) => it.title.trim() || it.subtitle?.trim() || it.description?.trim() || it.bullets.length > 0);
    }
    return s;
  }).filter((s: ResumeSection) => (s.type === 'bullets' ? s.items.length > 0 : !!(s.text && s.text.trim().length > 0)));

  return result;
}

export const parsePDFFile = async (file: File): Promise<ParsedResume> => {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const items: PItem[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const styles: Record<string, { fontFamily?: string }> = (content as any).styles || {};
    for (const raw of content.items as any[]) {
      if (typeof raw.str !== 'string' || raw.str === '') continue;
      const tr: number[] = raw.transform || [1, 0, 0, 1, 0, 0];
      const fam: string = (styles[raw.fontName]?.fontFamily || raw.fontName || '').toString();
      const lower = fam.toLowerCase();
      items.push({
        str: raw.str,
        x: tr[4], y: tr[5],
        w: raw.width || 0,
        h: raw.height || Math.abs(tr[3]) || 10,
        bold: /bold|black|heavy|semibold/.test(lower),
        italic: /italic|oblique/.test(lower),
        font: fam,
        page: p - 1,
      });
    }
  }

  if (!items.length) throw new Error('NO_TEXT_LAYER');
  return structure(buildLines(items));
};