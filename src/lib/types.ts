import { THEMATIC_AREA_MAP } from './thematic-areas';

export type Report = {
  id: string;
  title: string;
  sourceId: string;
  publicationDate: string;
  category: keyof typeof THEMATIC_AREA_MAP;
  summary: string;
  thematicArea: string;
  content: string; // This now holds the full extracted article
  userId: string;
  uploadDate: string;
  isDuplicate?: boolean;
  duplicateReportId?: string;
};

export type Source = {
    id: string;
    name: string;
    url?: string;
}
