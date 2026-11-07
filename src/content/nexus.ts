/**
 * Approved NEXUS 2026 website copy (PRD sections 5–10).
 *
 * The organising team can update wording, contacts or downloadable files here
 * without touching page layouts. Keep the event date as 25 November 2026
 * (PRD decision 1) and do not add unconfirmed panelist names (PRD section 7).
 */
import { EXPO_PROJECT_CATEGORIES, NEXUS_EVENT } from '@/lib/nexus/constants';

export const EVENT = {
  ...NEXUS_EVENT,
  shortName: 'NEXUS',
  dateCompact: '25.11.2026',
  venueShort: 'NMAMIT, Nitte',
  instagramUrl: 'https://www.instagram.com/csi_nmamit/',
  websiteUrl: 'https://csinmamit.in',
  /** Replace the PDF in /public (same name) to update the template without code changes. */
  showcaseTemplateUrl: '/Chapter_Showcase_Template.pdf',
  /** Replace the PDF in /public (same name) to update the brochure. */
  brochureUrl: '/Nexus_Brochure_2026.pdf' as string | null,
} as const;

/** The environment can override the organising team’s public group invite. */
export function getWhatsappLink(): string | null {
  return process.env.WHATSAPP_COMMUNITY_LINK || 'https://chat.whatsapp.com/KY7YHJFzDt2GrVFpEisjxQ';
}

export type NavItem = { href: string; label: string; short: string };

/** Fixed page sequence (PRD section 3 and decision 3). */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', short: 'Home' },
  { href: '/schedule', label: 'Schedule', short: 'Schedule' },
  { href: '/panel', label: 'Industry Panel', short: 'Panel' },
  { href: '/showcase', label: 'Chapter Showcase', short: 'Showcase' },
  { href: '/expo', label: 'Project Expo', short: 'Expo' },
  { href: '/contact', label: 'Contact', short: 'Contact' },
];

export const ABOUT = {
  paragraphs: [
    'NEXUS — CSI Student Summit on Innovation & Technology is a flagship initiative by the CSI Student Branch, NMAMIT, bringing together students from CSI student branches across Karnataka, along with faculty members and industry professionals.',
    'The summit provides a common platform for students to exchange ideas, showcase innovation, develop leadership skills and explore emerging technologies.',
    'Through industry interactions, chapter presentations and project exhibitions, NEXUS aims to strengthen connections between student communities, encourage interdisciplinary collaboration and create opportunities for future partnerships.',
  ],
  stats: [
    { value: '30+', label: 'CSI Student Branches', note: 'Target participation' },
    { value: '100+', label: 'Students', note: 'Expected participation' },
    { value: 'Industry', label: 'Professionals', note: 'Panel & interactions' },
    { value: 'One', label: 'Day', note: 'Of innovation and collaboration' },
  ],
  statsNote: 'Figures are proposed participation targets, not confirmed attendance.',
};

export const HOSTS = [
  {
    id: 'nmamit',
    eyebrow: 'Host institution',
    name: 'NMAMIT, Nitte',
    logo: { src: '/nitte_white.png', alt: 'Nitte (Deemed to be University) — NMAM Institute of Technology', width: 1628, height: 278 },
    paragraphs: [
      'Established in 1986, NMAM Institute of Technology (NMAMIT), Nitte, is a constituent college of Nitte (Deemed to be University), Mangaluru.',
      'The institution fosters academic excellence, innovation, research and industry engagement.',
    ],
    facts: [
      { value: '1986', label: 'Established' },
      { value: 'Nitte DU', label: 'Constituent college' },
    ],
  },
  {
    id: 'csi',
    eyebrow: 'Organising chapter',
    name: 'CSI NMAMIT',
    logo: { src: '/csi-bangalore.png', alt: 'Computer Society of India — Bangalore Chapter', width: 1908, height: 559 },
    paragraphs: [
      'Established in 2007, the Computer Society of India (CSI) Student Branch, NMAMIT, has grown into a vibrant technical community with over 700 student members and 350+ technical events.',
      'Through hackathons, coding competitions, workshops and industry interactions, the chapter promotes technical learning, practical skills and innovation.',
      'CSI NMAMIT has received national recognition, including the Best Accredited Student Branch and Largest Student Branch Awards (2017–19).',
    ],
    facts: [
      { value: '700+', label: 'Student members' },
      { value: '350+', label: 'Technical events' },
      { value: '2017–19', label: 'National awards' },
    ],
  },
] as const;

export const SCHEDULE = [
  { start: '9:00 AM', end: '9:30 AM', iso: '09:00', title: 'Registration & Breakfast', href: null },
  { start: '9:30 AM', end: '10:30 AM', iso: '09:30', title: 'Inauguration & Keynote', href: null },
  { start: '10:30 AM', end: '11:30 AM', iso: '10:30', title: 'Industry Panel Discussion', href: '/panel' },
  { start: '11:30 AM', end: '1:00 PM', iso: '11:30', title: 'CSI Branch Showcase', href: '/showcase' },
  { start: '1:00 PM', end: '2:00 PM', iso: '13:00', title: 'Lunch & Networking', href: null },
  { start: '2:00 PM', end: '4:00 PM', iso: '14:00', title: 'Student Project Expo', href: '/expo' },
  { start: '4:00 PM', end: '4:30 PM', iso: '16:00', title: 'Snacks', href: null },
  { start: '4:30 PM', end: '5:30 PM', iso: '16:30', title: 'Valedictory Ceremony', href: null },
] as const;

export const PANEL = {
  topic: 'From Skills to Startups: Preparing the Next Generation of Tech Innovators',
  description: [
    'An engaging discussion with industry professionals and innovators on emerging technologies, industry expectations, career readiness and entrepreneurship.',
    'Gain insights into the skills shaping the future of technology and learn how to turn ideas into real-world solutions.',
  ],
  highlights: [
    { title: 'Industry Readiness', text: 'Skills and competencies employers value.' },
    { title: 'Emerging Technologies', text: 'Opportunities and challenges in the evolving technology landscape.' },
    { title: 'Innovation & Entrepreneurship', text: 'Turning ideas into practical solutions and startups.' },
    { title: 'Career Pathways', text: 'Navigating opportunities and preparing for the future.' },
  ],
  /** Add confirmed panelists here: { name, designation, organisation, photo?, moderator? } */
  panelists: [] as { name: string; designation: string; organisation: string; photo?: string; moderator?: boolean }[],
};

export const SHOWCASE = {
  tagline: 'One Community. Many Journeys. Shared Impact.',
  description: [
    'The CSI Branch Showcase provides a platform for student chapters from across Karnataka to present their journeys, achievements and contributions to the technical community.',
    'It celebrates student-led initiatives, encourages the exchange of ideas and creates opportunities for collaboration between chapters.',
  ],
  areas: [
    { title: 'Chapter Overview', text: 'Chapter introduction, vision and community.' },
    { title: 'Activities & Initiatives', text: 'Events, workshops and engagements.' },
    { title: 'Achievements & Highlights', text: 'Key milestones and collaborations.' },
    { title: 'Student Innovation', text: 'Projects and member initiatives.' },
    { title: 'Future Roadmap', text: 'Upcoming goals and collaborations.' },
  ],
  details: [
    { label: 'Duration', value: '5 minutes per chapter' },
    { label: 'Format', value: 'Standardised presentation template' },
    { label: 'Q&A', value: 'No separate Q&A session' },
  ],
};

const CATEGORY_TEXT: Record<(typeof EXPO_PROJECT_CATEGORIES)[number], string> = {
  'Sustainability & Environment': 'Waste management, pollution control, recycling, biodiversity conservation and environmental solutions.',
  'Smart Infrastructure & Mobility': 'Smart cities, intelligent transportation, automation, connected infrastructure and mobility.',
  'Energy & Resource Management': 'Renewable energy, energy efficiency, water management and efficient resource utilisation.',
  'AI, IoT & Intelligent Systems': 'AI/ML applications, IoT, robotics, automation and connected technologies.',
  'Healthcare & Social Innovation': 'Healthcare technology, accessibility, assistive solutions, public welfare and quality of life.',
  'Open Innovation': 'Other creative engineering and technology solutions that contribute to a smarter, more sustainable future.',
};

export const EXPO = {
  theme: 'Technology for a Sustainable and Smarter Future',
  intro: 'Showcase technology-driven solutions that address real-world challenges and create meaningful impact.',
  eligibility:
    'Participants may showcase existing or newly developed projects, including research projects, prototypes, working models, software products, hardware systems, robotics, IoT, AI/ML applications, sustainable technologies and other engineering innovations or proof-of-concepts.',
  alignment: 'All projects, including those under Open Innovation, must align with the central theme.',
  categories: EXPO_PROJECT_CATEGORIES.map((title) => ({ title, text: CATEGORY_TEXT[title] })),
  teamSize: '2–4 members',
  abstractRequirements: [
    'Project Category',
    'Project / Product Title',
    'Brief Description',
    'Problem Statement and Proposed Solution',
    'Theme Relevance',
    'College and Team Details',
  ],
  presentation: [
    { minutes: '7', label: 'Project Presentation and Demonstration' },
    { minutes: '3', label: 'Jury Interaction and Q&A' },
  ],
  guidelines: [
    'Teams must bring their own project models, hardware, devices and required accessories.',
    'A working demonstration is strongly encouraged.',
    'All team members should understand the project and explain their individual contributions.',
    'Special infrastructure requirements must be communicated to the organising team in advance.',
    "The jury's decision will be final.",
  ],
};

export const CONTACT = {
  intro:
    'For registration-related queries, participation details, project expo submissions or other event-related information, reach out to our organising team.',
  people: [
    { name: 'Shravya N Bhat', role: 'President, CSI NMAMIT', phone: '+91 89512 36021', tel: '+918951236021' },
    { name: 'Pranjal Shetty', role: 'Organising Team, CSI NMAMIT', phone: '+91 85913 10513', tel: '+918591310513' },
  ],
  closing: 'Connect. Collaborate. Create Impact.',
  farewell: 'See you on 25 November 2026 at NMAMIT, Nitte!',
};

export const ABSTRACT_INSTRUCTIONS = [
  'Deadline: 20 November 2026.',
  'PDF format only, up to 10 MB.',
  'Explain the project, problem statement, proposed solution and theme relevance.',
  'Existing and newly developed projects are accepted.',
  'All eligible registered teams proceed to the exhibition.',
  'Abstracts are reviewed for theme relevance, not shortlisting.',
];



