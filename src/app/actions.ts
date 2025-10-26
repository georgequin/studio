
'use server';

import { z } from 'zod';
import { summarizeNewsClipping } from '@/ai/flows/summarize-news-clipping';
import { categorizeNewsClipping } from '@/ai/flows/categorize-news-clipping';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';

const inputSchema = z.object({
  text: z.string().optional(),
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
  
  const file = formData.get('file');
  let text = validatedFields.success ? validatedFields.data.text : '';

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  // TODO: Add logic to extract text from file if text is empty.
  // For now, we will use a placeholder if no text is provided.
  if (!text && file instanceof File && file.size > 0) {
      // In a real scenario, you'd use a library like Tesseract.js for OCR
      // or a PDF parsing library.
      text = `Placeholder text from uploaded file: ${file.name}`;
  } else if (!text) {
      return {
          message: 'Please provide either text or a file.',
          errors: { text: ['Please provide either text or a file.'] },
          data: null,
      }
  }


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
