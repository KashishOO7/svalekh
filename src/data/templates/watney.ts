import type { ResumeTemplate } from './types';

export const watneyTemplate: ResumeTemplate = {
  key: 'watney',
  label: 'Mark Watney',
  blurb: 'The Martian — botanist & mechanical engineer. Two-column layout demo.',
  name: 'MARK WATNEY, Ph.D.',
  tagline:
    'Botanist & Mechanical Engineer — surviving the impossible through extreme cross-disciplinary engineering and zero-resupply improvisation.',
  contacts: [
    { id: 'w-c1', label: 'Email', value: 'm.watney@ares3.nasa.gov', type: 'text', redact: false },
    { id: 'w-c2', label: 'Location', value: 'Houston, TX', type: 'text', redact: false },
    { id: 'w-c3', label: 'Clearance', value: 'TS/SCI', type: 'text', redact: true },
  ],
  sections: [
    {
      id: 'w-s1',
      title: 'Mission Experience',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'w-e1',
          title: 'Ares III Mission Specialist',
          subtitle: 'NASA — Acidalia Planitia, Mars',
          date: '2035 – Present',
          description: 'Stranded solo after a mission abort; sustained life for 549 Sols with zero external resupply.',
          bullets: [
            'Synthesized 600 L of water from volatile hydrazine via iridium-catalyzed reduction to irrigate a sealed farm yielding ~1.5M calories.',
            'Recovered interplanetary comms by excavating and reverse-engineering the defunct Pathfinder probe, hand-writing hexadecimal ASCII patches to bridge it to modern rover firmware.',
            'Executed a 3,200 km overland rover traverse, retrofitting RTG heat shielding and battery arrays for extreme cold-weather endurance.',
            'Improvised repeated pressure-seal and life-support repairs under catastrophic habitat failures.',
          ],
        },
        {
          id: 'w-e2',
          title: 'Lead Botanist & CELSS Engineer',
          subtitle: 'Jet Propulsion Laboratory (JPL) — Pasadena, CA',
          date: '2028 – 2035',
          description: '',
          bullets: [
            'Architected closed-loop ecological life-support systems (CELSS), increasing crop yield per cubic meter by 240%.',
            'Ran destructive stress tests on EVA CO₂ scrubbers to map degradation limits under heavy exertion.',
            'Designed automated regolith-to-soil conversion protocols validated against simulated Martian atmospheres.',
          ],
        },
        {
          id: 'w-e3',
          title: 'Postdoctoral Researcher',
          subtitle: 'University of Chicago — Chicago, IL',
          date: '2026 – 2028',
          description: '',
          bullets: [
            'Co-authored a widely cited paper on metabolic slowdown of extremophile flora in hyper-arid, sub-zero environments.',
          ],
        },
      ],
    },
    {
      id: 'w-s2',
      title: 'Education',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'w-e4',
          title: 'Ph.D., Botany & Plant Biology',
          subtitle: 'University of Chicago',
          date: '2026',
          description: '',
          bullets: ['Dissertation: “Sub-Zero Arid Agriculture: Activating Dormant Biomes.”'],
        },
        {
          id: 'w-e5',
          title: 'M.S., Mechanical Engineering',
          subtitle: 'Massachusetts Institute of Technology (MIT)',
          date: '2023',
          description: '',
          bullets: [],
        },
      ],
    },
    {
      id: 'w-s3',
      title: 'Selected Publications',
      type: 'text',
      items: [],
      text:
        'Viability of <em>Solanum tuberosum</em> in Perchlorate-Heavy Regolith — Journal of Astrobotany (2031)<br>Thermodynamic Risks of Iridium Catalysis in Hydrazine Reduction — AIAA Journal of Spacecraft and Rockets (2030)',
    },
    {
      id: 'w-s4',
      title: 'Technical Skills',
      type: 'skills',
      items: [],
      text:
        'Botany &amp; Agriculture · Mechanical Troubleshooting · Atmospheric Chemistry · Hexadecimal Computing · EVA Operations · Orbital Mechanics · Resource Rationing · Nutritional Biochemistry · Duct-Tape Engineering',
    },
    {
      id: 'w-s5',
      title: 'Certifications',
      type: 'certs',
      items: [],
      text: 'NASA EVA Operations<br>Mars Surface Operations<br>Advanced Life Support Systems',
    },
  ],
  themeOverride: {
    accentColor: '#B91C1C',
    layoutMode: 'two-column',
    twoColumnRatio: 0.33,
  },
};