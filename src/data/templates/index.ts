import type { ResumeTemplate, TemplateKey } from './types';
import { watneyTemplate } from './watney';
import { graceTemplate } from './grace';
import { cooperTemplate } from './cooper';
import { blankTemplate } from './blank';

export type { ResumeTemplate, TemplateKey } from './types';
export { watneyTemplate, graceTemplate, cooperTemplate, blankTemplate };

export const TEMPLATES: Record<TemplateKey, ResumeTemplate> = {
  watney: watneyTemplate,
  grace: graceTemplate,
  cooper: cooperTemplate,
  blank: blankTemplate,
};

export const TEMPLATE_LIST: ResumeTemplate[] = [watneyTemplate, graceTemplate, cooperTemplate, blankTemplate];

export const getTemplate = (key: TemplateKey): ResumeTemplate => TEMPLATES[key] ?? blankTemplate;