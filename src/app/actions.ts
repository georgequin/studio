
'use server';

import { z } from 'zod';
import { summarizeNewsClipping } from '@/ai/flows/summarize-news-clipping';
import { categorizeNewsClipping } from '@/ai/flows/categorize-news-clipping';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';


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

  try {
    if (!text && file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const {imageTypeFromBuffer} = await (eval('import("image-type")') as Promise<typeof import('image-type')>);
        const type = await imageTypeFromBuffer(buffer);
        if (!type) {
            return {
                message: 'Invalid file type.',
                errors: { file: ['Could not determine file type. Please upload a valid image or PDF.'] },
                data: null,
            }
        }
        
        const photoDataUri = `data:${type.mime};base64,${buffer.toString('base64')}`;
        
        const ocrResult = await extractTextFromImage({ photoDataUri });
        text = ocrResult.text;
    } else if (!text) {
        return {
            message: 'Please provide either text or a file.',
            errors: { text: ['Please provide either text or a file.'] },
            data: null,
        }
    }


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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during AI processing.';
    return {
      message: errorMessage,
      errors: null,
      data: null,
    };
  }
}
