import * as pdfjsLib from 'pdfjs-dist';
import type { ResumeSection, ContactField } from '../store/useResumeStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const DATE_PATTERN = /(?:\d{1,2}\/\d{4}|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})\s*[-\u2013\u2014]\s*(?:\d{1,2}\/\d{4}|\d{4}|[Pp]resent|[Cc]urrent|[Oo]ngoing|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\b\d{1,2}\/\d{4}\b|\b(?:19|20)\d{2}\b|\b[Pp]resent\b|\b[Cc]urrent\b/i;

function extractDate(line: string) {
  const m = line.match(DATE_PATTERN);
  if (!m) return { text: line.trim(), date: '' };
  const date = m[0].trim();
  let rest = line.replace(m[0], '').trim();
  rest = rest.replace(/[\s,|]+$/, '').replace(/^[\s,|]+/, '').trim();
  return { text: rest, date: date };
}

function isHeader(line: string) {
  const c = line.replace(/[^a-zA-Z\s&\-\/]/g, '').trim();
  const upperC = c.toUpperCase();
  if (DATE_PATTERN.test(line)) return false;
  const exactHeaders = ['SKILLS', 'EDUCATION', 'EXPERIENCE', 'PROJECTS', 'RESEARCH', 'CERTIFICATIONS', 'PUBLICATIONS', 'SUMMARY', 'PROFILE', 'OBJECTIVE', 'AWARDS', 'HONORS', 'LANGUAGES', 'INTERESTS', 'TRAINING', 'PROJECTS & RESEARCH', 'PROJECTS AND RESEARCH'];
  if (exactHeaders.includes(upperC)) return true;
  const words = c.split(/\s+/).filter(Boolean);
  if (c.length < 4 || c.length >= 40) return false;
  if (c !== c.toUpperCase() || !/[A-Z]/.test(c)) return false;
  if (words.length === 1 && c.length < 8) return false;
  if (words.length > 6) return false;
  return true;
}

function isSkillsHeader(line: string) { return /^(skills?|technical\s*skills?|core\s*skills?|competenc)/.test(line.replace(/[^a-zA-Z\s&\-]/g, '').trim().toLowerCase()); }
function isCertsHeader(line: string) { return /^(certific|licenses?|credentials)/.test(line.replace(/[^a-zA-Z\s&\-]/g, '').trim().toLowerCase()); }
function isBullet(line: string) { return /^[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25A0\u2212\u00B7\u27A4 \-\*]\s/.test(line) || /^\d+[\.\)]\s/.test(line); }
function cleanBullet(line: string) { return line.replace(/^[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25A0\u2212\u00B7\u27A4 \-\*\d\.\)\s]+/, '').trim(); }

function looksLikeContact(line: string) {
  return /@/.test(line) || /github\.com|linkedin\.com/i.test(line) || /^\+?\d[\d\s\-\(\)]{7,}$/.test(line.trim()) || /^https?:\/\//i.test(line.trim()) || /^[a-z0-9\-]+\.[a-z]{2,}(\/.*)?$/i.test(line.trim());
}

const genId = (p: string) => p + Math.random().toString(36).substring(2, 9);

function parseResumeText(text: string) {
  const result: { name: string; tagline: string; contacts: ContactField[]; sections: ResumeSection[] } = { name: '', tagline: '', contacts: [], sections: [] };
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const lines: string[] = [];

  rawLines.forEach(l => {
    if (l.indexOf('\t') !== -1) {
      const parts = l.split('\t'); const left = parts[0].trim(); const right = parts.slice(1).join(' ').trim();
      if (isHeader(left)) { lines.push(left); if (right) lines.push(right); } else { lines.push(left + ' ' + right); }
    } else {
      let matchedHeader = false;
      const exactHeaders = ['SKILLS', 'EDUCATION', 'EXPERIENCE', 'CERTIFICATIONS', 'PUBLICATIONS', 'PROJECTS & RESEARCH', 'SUMMARY'];
      for (let i = 0; i < exactHeaders.length; i++) {
        const h = exactHeaders[i];
        if (l.toUpperCase().startsWith(h) && l.length > h.length && /[a-zA-Z0-9]/.test(l.charAt(h.length))) {
          lines.push(l.substring(0, h.length)); lines.push(l.substring(h.length).trim()); matchedHeader = true; break;
        }
      }
      if (!matchedHeader) lines.push(l);
    }
  });

  if (!lines.length) return result;
  result.name = lines[0];
  
  let firstHeaderIdx = -1;
  for (let h = 1; h < lines.length; h++) {
    if (isHeader(lines[h])) {
      firstHeaderIdx = h;
      break;
    }
  }
  if (firstHeaderIdx === -1) firstHeaderIdx = lines.length;

  for (let j = 1; j < firstHeaderIdx && j < 6; j++) {
    const line = lines[j];
    if (looksLikeContact(line)) {
      line.split(/\s*[\u00b7\|]\s*/).filter(Boolean).forEach(p => {
        let label = 'Info';
        if (/@/.test(p)) label = 'Email'; else if (/github/i.test(p)) label = 'GitHub'; else if (/linkedin/i.test(p)) label = 'LinkedIn'; else if (/^\+?\d/.test(p)) label = 'Phone'; else if (/https?:\/\//i.test(p)) label = 'Website';
        result.contacts.push({ id: genId('c'), label, value: p.trim(), type: 'text', redact: false });
      });
    } else if (!result.tagline && line.length > 10 && !isHeader(line)) {
      result.tagline = line;
    }
  }

  let curSec: ResumeSection | null = null;
  let curItem: any = null;

  for (let i = (firstHeaderIdx === lines.length ? 1 : firstHeaderIdx); i < lines.length; i++) {
    const ln = lines[i];
    if (isHeader(ln)) {
      if (curSec) { if (curItem && (curItem.title || curItem.bullets.length)) curSec.items.push(curItem); result.sections.push(curSec); }
      curSec = { id: genId('s'), title: ln.replace(/[^a-zA-Z\s&\-\/]/g, '').trim(), type: 'bullets', items: [] };
      curItem = null;

      if (isSkillsHeader(ln)) { curSec.type = 'skills'; const skillLines = []; while (i + 1 < lines.length && !isHeader(lines[i + 1])) { i++; skillLines.push(lines[i]); } curSec.text = skillLines.join(', '); }
      if (isCertsHeader(ln)) { curSec.type = 'certs'; const certLines = []; while (i + 1 < lines.length && !isHeader(lines[i + 1])) { i++; certLines.push(lines[i]); } curSec.text = certLines.join('<br>'); }
      continue;
    }

    if (!curSec || curSec.type === 'skills' || curSec.type === 'certs') continue;

    if (isBullet(ln)) {
      if (!curItem) curItem = { id: genId('e'), title: '', date: '', subtitle: '', description: '', bullets: [] };
      curItem.bullets.push(cleanBullet(ln));
    } else {
      const extracted = extractDate(ln);
    const isAllCaps = ln === ln.toUpperCase() && /[A-Z]/.test(ln) && ln.length > 5 && !DATE_PATTERN.test(ln);

    if (curItem && !extracted.date && !isHeader(ln) && !isAllCaps && curItem.bullets.length > 0 && !looksLikeContact(ln)) {
      curItem.bullets[curItem.bullets.length - 1] += ' ' + ln;
      continue;
    }

    if (!extracted.text && extracted.date) {
      if (curItem && !curItem.date) {
        curItem.date = extracted.date;
      }
      continue;
    }

    let shouldStartNew = !curItem || !!extracted.date || (!!curItem.title && curItem.bullets.length > 0) || isAllCaps;

    if (shouldStartNew) {
      if (curItem && (curItem.title || curItem.bullets.length)) curSec.items.push(curItem);
      curItem = { id: genId('e'), title: extracted.text, date: extracted.date, subtitle: '', description: '', bullets: [] };
    } else if (!curItem.title) {
      curItem.title = extracted.text;
    } else if (!curItem.subtitle && curItem.bullets.length === 0) {
      curItem.subtitle = extracted.text;
    } else {
      curItem.bullets.push(ln);
    }
    }
  }

if (curSec) { 
    if (curItem && (curItem.title || curItem.bullets.length)) curSec.items.push(curItem); 
    result.sections.push(curSec); 
  }
  result.sections = result.sections.map(sec => {
    if (sec.type === 'bullets') {
      sec.items = sec.items.map(item => ({
        ...item,
        bullets: item.bullets.filter((b: string) => b.trim().length > 0)
      }));
      sec.items = sec.items.filter(item => 
        item.title.trim() || item.subtitle?.trim() || item.description?.trim() || item.bullets.length > 0
      );
    }
    return sec;
  }).filter(sec => 
    sec.type === 'bullets' ? sec.items.length > 0 : (sec.text && sec.text.trim().length > 0)
  );

  return result;
}

export const parsePDFFile = async (file: File) => {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const pg = await pdf.getPage(i);
    const content = await pg.getTextContent();
    const rawItems = content.items.filter((item: any) => item.str.trim() !== '' || item.str.length > 0).map((item: any) => ({ str: item.str, x: item.transform[4], y: item.transform[5], height: item.transform[3], width: item.width }));
    if (rawItems.length === 0) continue;
    rawItems.sort((a: any, b: any) => b.y - a.y);

    const lines: any[][] = [];
    let currentLine = [rawItems[0]];
    let currentY = rawItems[0].y;
    let maxH = rawItems[0].height;

    for (let j = 1; j < rawItems.length; j++) {
      const item = rawItems[j];
      if (Math.abs(item.y - currentY) < (Math.max(item.height, maxH) * 0.4)) { currentLine.push(item); maxH = Math.max(maxH, item.height); } 
      else { lines.push(currentLine); currentLine = [item]; currentY = item.y; maxH = item.height; }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    lines.forEach((line: any[]) => {
      line.sort((a, b) => a.x - b.x);
      let lineText = ''; let lastItem: any = null;
      line.forEach(item => {
        if (lastItem === null) { lineText += item.str; } 
        else {
          const actualGap = item.x - (lastItem.x + lastItem.width);
          if (actualGap > (Math.max(item.height, lastItem.height) * 1.5)) { 
            lineText += ' \t ' + item.str; 
          } 
          
          else if (actualGap > 0.25 || lastItem.str.endsWith(' ') || item.str.startsWith(' ')) {
            if (!lineText.endsWith(' ')) lineText += ' ';
            lineText += item.str.trim();
          }
        }
        lastItem = item;
      });
      text += lineText.trim() + '\n';
    });
  }

  text = text.replace(/(?:[A-Z][ \t]){2,}[A-Z]/g, (match) => {
    return match.split(/\s{2,}/).map(word => word.replace(/[ \t]+/g, '')).join(' ');
  });

  text = text.replace(/([A-Z]{2,}[A-Z\-\s&]*[A-Z])([A-Z][a-z])/g, '$1\n$2');

  return parseResumeText(text.trim());
};