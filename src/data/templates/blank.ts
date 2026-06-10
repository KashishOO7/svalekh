import type { ResumeTemplate } from './types';

export const blankTemplate: ResumeTemplate = {
  key: 'blank',
  label: 'Blank',
  blurb: 'A clean starting point with placeholder guidance.',
  name: 'YOUR NAME',
  tagline: 'Target Role',
  contacts: [
    { id: 'b-c1', label: 'Email', value: 'email@example.com', type: 'text', redact: false },
    { id: 'b-c2', label: 'Phone', value: '(555) 123-4567', type: 'text', redact: false },
    { id: 'b-c3', label: 'Location', value: 'City, State', type: 'text', redact: false },
  ],
  sections: [
    {
      id: 'b-s1',
      title: 'Education',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'b-e1',
          title: 'University Name',
          subtitle: 'Degree Name, Major',
          date: 'Graduation Year',
          description: '',
          bullets: ['GPA: 3.8/4.0', 'Relevant Coursework or Honors'],
        },
      ],
    },
    {
      id: 'b-s2',
      title: 'Professional Experience',
      type: 'bullets',
      text: '',
      items: [
        {
          id: 'b-e2',
          title: 'Job Title',
          subtitle: 'Company Name',
          date: 'Month Year - Present',
          description: '',
          bullets: ['Action verb + task + metric (e.g., Increased sales by 20%)', 'Managed cross-functional team...'],
        },
      ],
    },
    {
      id: 'b-s3',
      title: 'Technical Skills',
      type: 'skills',
      items: [],
      text: 'JavaScript, React, Node.js, Project Management',
    },
  ],
};