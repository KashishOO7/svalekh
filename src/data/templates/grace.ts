import type { ResumeTemplate } from './types';

export const graceTemplate: ResumeTemplate = {
  key: 'grace',
  label: 'Ryland Grace',
  blurb: 'Project Hail Mary — molecular biologist & reluctant interstellar first responder.',
  name: 'RYLAND GRACE, Ph.D.',
  tagline:
    'Molecular biologist turned science teacher turned interstellar first responder — improvised exobiology, crisis engineering, and cross-species collaboration.',
  contacts: [
    { id: 'g-c1', label: 'Email', value: 'r.grace@phm.un.org', type: 'text', redact: false },
    { id: 'g-c2', label: 'Location', value: 'Earth (current: Tau Ceti)', type: 'text', redact: false },
    { id: 'g-c3', label: 'Status', value: 'Presumed lost', type: 'text', redact: true },
  ],
  sections: [
    {
      id: 'g-s1',
      title: 'Experience',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'g-e1',
          title: 'Science Specialist & Commander (Sole Survivor)',
          subtitle: 'Project Hail Mary — United Nations',
          date: 'Present',
          description: 'Sole survivor of a last-ditch interstellar mission to halt the Astrophage-driven dimming of the Sun.',
          bullets: [
            'Identified Astrophage as the microorganism draining the Sun’s output and modeled the resulting extinction timeline.',
            'Recovered from coma-induced amnesia and independently reconstructed the full mission objective, vehicle, and controls.',
            'Established first contact and a working scientific partnership with an Eridian engineer across a total language barrier.',
            'Engineered and propagated Taumoeba, a predator strain neutralizing Astrophage, securing the survival of two star systems.',
          ],
        },
        {
          id: 'g-e2',
          title: 'Junior High School Science Teacher',
          subtitle: 'Public School District',
          date: 'Prior',
          description: '',
          bullets: [
            'Translated graduate-level science into hands-on lessons; repeatedly named students’ favorite teacher.',
            'Sustained a rigorous, curiosity-first lab culture on a minimal budget.',
          ],
        },
        {
          id: 'g-e3',
          title: 'Molecular Biology Researcher',
          subtitle: 'University Laboratory',
          date: 'Prior',
          description: '',
          bullets: [
            'Researched non-aqueous biochemistry and the assumptions underpinning the search for extraterrestrial life.',
          ],
        },
      ],
    },
    {
      id: 'g-s2',
      title: 'Education',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'g-e4',
          title: 'Ph.D., Molecular Biology',
          subtitle: 'University',
          date: '—',
          description: '',
          bullets: ['Focus: speculative biochemistry and life under extreme, non-terrestrial conditions.'],
        },
      ],
    },
    {
      id: 'g-s3',
      title: 'Selected Publications',
      type: 'text',
      items: [],
      text:
        '“An Analysis of the Water-Based Assumption in the Search for Extraterrestrial Life” — initially peer-rejected, later vindicated by direct observation.',
    },
    {
      id: 'g-s4',
      title: 'Core Skills',
      type: 'skills',
      items: [],
      text:
        'Improvised Exobiology · Astrophage Cultivation · Xenolinguistics (Eridian) · Relativistic Navigation · Microbiology · Spectroscopy · Crisis Engineering',
    },
  ],
  themeOverride: {
    fontFamily: 'Georgia, serif',
    accentColor: '#047857',
    layoutMode: 'single',
  },
};