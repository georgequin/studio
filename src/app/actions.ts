'use server';

import { z } from 'zod';
import { summarizeNewsClipping } from '@/ai/flows/summarize-news-clipping';
import { categorizeNewsClipping } from '@/ai/flows/categorize-news-clipping';
import { THEMATIC_AREA_MAP } from '@/lib/thematic-areas';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import imageType from 'image-type';


const inputSchema = z.object({
  text: z.string().optional(),
});

export type AnalysisResult = {
  summary: string;
  extractedArticle: string;
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
  
  const files = formData.getAll('files') as File[];
  let textToProcess = validatedFields.success ? validatedFields.data.text : '';

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    if (files.length > 0) {
        let allExtractedText = '';
        for (const file of files) {
             if (file instanceof File && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const type = await imageType(buffer);
        
                if (!type) {
                    console.warn(`Skipping a file of unknown type: ${file.name}`);
                    continue;
                }
                
                const photoDataUri = `data:${type.mime};base64,${buffer.toString('base64')}`;
                
                const ocrResult = await extractTextFromImage({ photoDataUri });
                allExtractedText += ocrResult.text + '\n\n';
             }
        }
        textToProcess = (textToProcess || '') + allExtractedText;
    } 
    
    if (!textToProcess) {
        return {
            message: 'Please provide either text or at least one valid file.',
            errors: { text: ['Please provide either text or a file.'] },
            data: null,
        }
    }

    const summaryResult = await summarizeNewsClipping({ text: textToProcess });
    if (!summaryResult || !summaryResult.articles) {
      throw new Error('AI summarization failed to return a result.');
    }

    // If no violation is found, we can stop here.
    if (summaryResult.articles.length === 0) {
        return {
            message: 'Analysis complete. No human rights violations were found in the provided text.',
            errors: null,
            data: [],
        }
    }
    
    const analysisResults: AnalysisResult[] = [];

    for (const article of summaryResult.articles) {
        if (article.containsViolation) {
            const categoryResult = await categorizeNewsClipping({ text: article.extractedArticle });
            const thematicArea = THEMATIC_AREA_MAP[categoryResult.category as keyof typeof THEMATIC_AREA_MAP] || 'Unassigned';
            
            analysisResults.push({
                ...article,
                ...categoryResult,
                thematicArea,
            });
        }
    }


    return {
      message: 'Analysis complete.',
      errors: null,
      data: analysisResults,
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
