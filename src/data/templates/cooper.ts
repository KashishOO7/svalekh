import type { ResumeTemplate } from './types';

export const cooperTemplate: ResumeTemplate = {
  key: 'cooper',
  label: 'Joseph Cooper',
  blurb: 'Interstellar — NASA test pilot, engineer, and deep-space explorer.',
  name: 'JOSEPH COOPER',
  tagline:
    'NASA test pilot and engineer turned farmer turned deep-space explorer — precision piloting, relativistic navigation, and getting home against the odds.',
  contacts: [
    { id: 'c-c1', label: 'Email', value: 'cooper@endurance.nasa.gov', type: 'text', redact: false },
    { id: 'c-c2', label: 'Location', value: 'Earth', type: 'text', redact: false },
    { id: 'c-c3', label: 'Coordinates', value: 'Cooper Station', type: 'text', redact: true },
  ],
  sections: [
    {
      id: 'c-s1',
      title: 'Experience',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'c-e1',
          title: 'Pilot, Endurance Mission',
          subtitle: 'NASA — Lazarus Program',
          date: 'Confidential',
          description: 'Piloted humanity’s last crewed deep-space mission through a wormhole in search of a habitable world.',
          bullets: [
            'Performed a manual docking with the violently spinning Endurance after an explosive decompression — widely considered impossible.',
            'Executed a powered slingshot around the supermassive black hole Gargantua, trading time dilation for delta-v to reach a candidate world.',
            'Survived passage beyond the event horizon and relayed quantum-gravity data home via Morse-coded gravitational signals.',
            'Operated and repurposed TARS/CASE robotics for high-risk EVA and retrieval tasks.',
          ],
        },
        {
          id: 'c-e2',
          title: 'Corn Farmer & Mechanical Engineer',
          subtitle: 'Family Farm',
          date: 'Prior',
          description: '',
          bullets: [
            'Kept autonomous harvesters and GPS-guided equipment running through chronic parts shortages and dust-blight conditions.',
            'Reverse-engineered surplus drone avionics for ground use.',
          ],
        },
        {
          id: 'c-e3',
          title: 'Test Pilot',
          subtitle: 'NASA',
          date: 'Prior',
          description: '',
          bullets: ['Flew experimental aircraft and spacecraft at the edge of the flight envelope.'],
        },
      ],
    },
    {
      id: 'c-s2',
      title: 'Education',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'c-e4',
          title: 'B.S., Aerospace Engineering',
          subtitle: 'NASA Flight Program',
          date: '—',
          description: '',
          bullets: [],
        },
      ],
    },
    {
      id: 'c-s3',
      title: 'Core Skills',
      type: 'skills',
      items: [],
      text:
        'Spacecraft Piloting · Manual Orbital Docking · Relativistic Navigation · Robotics Interfacing (TARS/CASE) · Mechanical & Agricultural Engineering · High-G Improvisation',
    },
    {
      id: 'c-s4',
      title: 'Certifications',
      type: 'certs',
      items: [],
      text: 'NASA Test Pilot<br>Deep-Space Mission Command<br>Advanced EVA Operations',
    },
  ],
  themeOverride: {
    fontFamily: "'Inter', sans-serif",
    accentColor: '#374151',
    layoutMode: 'single',
  },
};