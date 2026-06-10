import type { ContactField, ResumeSection, ResumeTheme } from '../../store/useResumeStore';

export type TemplateKey = 'watney' | 'grace' | 'cooper' | 'blank';
export interface ResumeTemplate {
  key: TemplateKey;
  label: string;
  blurb: string;
  name: string;
  tagline: string;
  contacts: ContactField[];
  sections: ResumeSection[];
  themeOverride?: Partial<ResumeTheme>;
}