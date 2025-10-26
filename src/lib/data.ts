import { THEMATIC_AREA_MAP } from './thematic-areas';

export type Clipping = {
  id: string;
  title: string;
  source: string;
  date: string;
  category: keyof typeof THEMATIC_AREA_MAP;
  summary: string;
  thematicArea: string;
};

export const mockData: Clipping[] = [
  {
    id: '1',
    title: 'Protestors Demand Action Over Custodial Death in City',
    source: 'The Daily Chronicle',
    date: '2024-05-15',
    category: 'Custodial Torture',
    summary: 'Activists gathered downtown to protest the alleged custodial death of a 28-year-old man, demanding an independent investigation into police conduct.',
    thematicArea: THEMATIC_AREA_MAP['Custodial Torture'],
  },
  {
    id: '2',
    title: 'Village Tense After Inter-Community Clash Over Land Dispute',
    source: 'Hindustan Times',
    date: '2024-05-20',
    category: 'Communal Clashes',
    summary: 'A long-standing land dispute between two communities erupted into violence, leaving several injured and heightening tensions in the region.',
    thematicArea: THEMATIC_AREA_MAP['Communal Clashes'],
  },
  {
    id: '3',
    title: 'New Bill Threatens Freedom of Press, Say Journalists',
    source: 'The Wire',
    date: '2024-06-01',
    category: 'Freedom of Speech',
    summary: 'Journalist unions have condemned a proposed legislation, stating it imposes severe restrictions on reporting and freedom of speech.',
    thematicArea: THEMATIC_AREA_MAP['Freedom of Speech'],
  },
  {
    id: '4',
    title: 'Child Labor Racket Busted in Factory Raid',
    source: 'Times of India',
    date: '2024-06-05',
    category: 'Women & Children',
    summary: 'Authorities rescued over 50 minors forced to work in hazardous conditions during a raid on an unregistered manufacturing unit.',
    thematicArea: THEMATIC_AREA_MAP['Women & Children'],
  },
  {
    id: '5',
    title: 'Dalit Family Attacked, Denied Access to Village Well',
    source: 'NDTV',
    date: '2024-06-10',
    category: 'Caste Discrimination',
    summary: 'A Dalit family was assaulted by upper-caste members for attempting to draw water from a public well, highlighting persistent caste-based discrimination.',
    thematicArea: THEMATIC_AREA_MAP['Caste Discrimination'],
  },
  {
    id: '6',
    title: 'Security Forces Accused of Extrajudicial Killing in Valley',
    source: 'The Kashmir Monitor',
    date: '2024-06-12',
    category: 'Extrajudicial Killings',
    summary: 'Human rights groups are calling for an inquiry into the death of two youths during a counter-insurgency operation, alleging they were killed in a fake encounter.',
    thematicArea: THEMATIC_AREA_MAP['Extrajudicial Killings'],
  },
  {
    id: '7',
    title: 'Report Highlights Rise in Violence Against Women',
    source: 'The Hindu',
    date: '2024-07-02',
    category: 'Women & Children',
    summary: 'An annual report by a leading NGO indicates a significant increase in reported cases of domestic violence and assaults against women in the last year.',
    thematicArea: THEMATIC_AREA_MAP['Women & Children'],
  },
  {
    id: '8',
    title: 'Peace March Held to Ease Communal Tensions',
    source: 'Deccan Herald',
    date: '2024-07-08',
    category: 'Communal Clashes',
    summary: 'Citizens and community leaders organized a peace march to promote harmony following recent communal disturbances in the city.',
    thematicArea: THEMATIC_AREA_MAP['Communal Clashes'],
  },
  {
    id: '9',
    title: 'Suspected Terror Module Apprehended by ATS',
    source: 'India Today',
    date: '2024-07-15',
    category: 'Terrorism',
    summary: 'The Anti-Terrorism Squad (ATS) arrested three individuals suspected of planning attacks in major cities, seizing incriminating materials.',
    thematicArea: THEMATIC_AREA_MAP['Terrorism'],
  },
  {
    id: '10',
    title: 'Activist Arrested for Sedition Over Social Media Post',
    source: 'The Quint',
    date: '2024-07-18',
    category: 'Freedom of Speech',
    summary: 'A prominent human rights activist was arrested under sedition laws for a social media post critical of government policy, sparking widespread outrage.',
    thematicArea: THEMATIC_AREA_MAP['Freedom of Speech'],
  },
  {
    id: '11',
    title: 'Missing Children Found in Another State, Trafficking Suspected',
    source: 'Times of India',
    date: '2024-04-22',
    category: 'Women & Children',
    summary: 'Police rescued three missing children from a neighboring state, suspecting the involvement of an interstate human trafficking ring.',
    thematicArea: THEMATIC_AREA_MAP['Women & Children'],
  },
  {
    id: '12',
    title: 'Police Brutality Under Scrutiny After Viral Video',
    source: 'The Daily Chronicle',
    date: '2024-04-28',
    category: 'Custodial Torture',
    summary: 'A video showing police officers brutally beating a suspect has gone viral, leading to public outcry and the suspension of the involved officers.',
    thematicArea: THEMATIC_AREA_MAP['Custodial Torture'],
  },
];
