
'use server';

import { z } from 'zod';
import { summarizeNewsClipping } from '@/ai/flows/summarize-news-clipping';
import { categorizeNewsClipping } from '@/ai/flows/categorize-news-clipping';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';

const inputSchema = z.object({
  text: z.string().min(50, 'Please provide at least 50 characters of text.'),
});

export type AnalysisResult = {
  summary: string;
  containsViolation: boolean;
  category: string;
  confidence: number;
  thematicArea: string;
};

export async function processClippingAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = inputSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const { text } = validatedFields.data;

  try {
    const [summaryResult, categoryResult] = await Promise.all([
      summarizeNewsClipping({ text }),
      categorizeNewsClipping({ text }),
    ]);

    if (!summaryResult || !categoryResult) {
      throw new Error('AI processing failed to return a result.');
    }

    const thematicArea = THEMATIC_AREA_MAP[categoryResult.category as keyof typeof THEMATIC_AREA_MAP] || 'Unassigned';

    const resultData: AnalysisResult = {
      ...summaryResult,
      ...categoryResult,
      thematicArea,
    };

    return {
      message: 'Analysis complete.',
      errors: null,
      data: resultData,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred during AI processing.',
      errors: null,
      data: null,
    };
  }
}
