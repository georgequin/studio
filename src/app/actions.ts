'use server';

import { z } from 'zod';
import { summarizeNewsClipping } from '@/ai/flows/summarize-news-clipping';
import { categorizeNewsClipping } from '@/ai/flows/categorize-news-clipping';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { detectDuplicateIncident } from '@/ai/flows/detect-duplicate-incident';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { getSdks } from '@/firebase/server';
import type { Report } from '@/lib/types';


const inputSchema = z.object({
  text: z.string().optional(),
  sourceId: z.string().min(1, { message: 'Please select a news source.' }),
});

export type AnalysisResult = {
  summary: string;
  extractedArticle: string;
  containsViolation: boolean;
  category: string;
  confidence: number;
  thematicArea: string;
  isDuplicate: boolean;
  duplicateReportId?: string;
  reasoning?: string;
};

// Helper function to fetch recent reports
async function getRecentReports() {
  const { firestore } = await getSdks();
  const reportsRef = collection(firestore, 'reports');
  const q = query(reportsRef, orderBy('uploadDate', 'desc'), limit(25)); // Look at last 25 reports
  const querySnapshot = await getDocs(q);
  const reports: Pick<Report, 'id' | 'summary' | 'title'>[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Report;
    reports.push({ id: doc.id, summary: data.summary, title: data.title });
  });
  return reports;
}

export async function processClippingAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = inputSchema.safeParse({
    text: formData.get('text'),
    sourceId: formData.get('sourceId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const files = formData.getAll('files') as File[];
  let textToProcess = validatedFields.data.text || '';

  try {
    if (files.length > 0) {
      const imageType = (await import('image-type')).default;

      const extractedTexts = (
        await Promise.all(
          files.map(async (file) => {
            if (!(file instanceof File) || file.size === 0) {
              return '';
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const type = await imageType(buffer);

            if (!type) {
              console.warn(`Skipping a file of unknown type: ${file.name}`);
              return '';
            }

            const photoDataUri = `data:${type.mime};base64,${buffer.toString(
              'base64'
            )}`;

            const { text } = await extractTextFromImage({ photoDataUri });
            return text.trim();
          })
        )
      )
        .filter((text): text is string => Boolean(text))
        .join('\n\n');

      textToProcess = [textToProcess?.trim(), extractedTexts]
        .filter(Boolean)
        .join('\n\n');
    }

    if (!textToProcess) {
      return {
        message: 'Please provide either text or at least one valid file.',
        errors: { text: ['Please provide either text or a file.'] },
        data: null,
      };
    }

    const summaryResult = await summarizeNewsClipping({ text: textToProcess });
    if (!summaryResult || !summaryResult.articles) {
      throw new Error('AI summarization failed to return a result.');
    }

    if (summaryResult.articles.length === 0) {
      return {
        message:
          'Analysis complete. No human rights violations were found in the provided text.',
        errors: null,
        data: [],
      };
    }
    
    // Fetch recent reports for duplicate check
    const recentReports = await getRecentReports();

    const analysisResults: AnalysisResult[] = (
      await Promise.all(
        summaryResult.articles.map(async (article) => {
          if (!article.containsViolation) {
            return null;
          }

          const [categoryResult, duplicateResult] = await Promise.all([
            categorizeNewsClipping({
              text: article.extractedArticle,
            }),
            detectDuplicateIncident({
              newArticleText: article.extractedArticle,
              recentReports: recentReports,
            }),
          ]);

          const thematicArea =
            THEMATIC_AREA_MAP[
              categoryResult.category as keyof typeof THEMATIC_AREA_MAP
            ] || 'Unassigned';

          return {
            ...article,
            ...categoryResult,
            thematicArea,
            isDuplicate: duplicateResult.isDuplicate,
            duplicateReportId: duplicateResult.duplicateReportId,
            reasoning: duplicateResult.reasoning,
          } satisfies AnalysisResult;
        })
      )
    ).filter((result): result is AnalysisResult => result !== null);

    return {
      message: 'Analysis complete.',
      errors: null,
      data: analysisResults,
    };
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred during AI processing.';
    return {
      message: errorMessage,
      errors: { _form: [errorMessage] },
      data: null,
    };
  }
}
