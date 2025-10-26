'use server';
/**
 * @fileOverview This file defines a Genkit flow for extracting text from an image (OCR).
 *
 * - extractTextFromImage - A function that takes an image of a news clipping and returns the extracted text.
 * - ExtractTextFromImageInput - The input type for the extractTextFromImage function.
 * - ExtractTextFromImageOutput - The return type for the extractTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a news clipping, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromImageInput = z.infer<
  typeof ExtractTextFromImageInputSchema
>;

const ExtractTextFromImageOutputSchema = z.object({
  text: z.string().describe('The extracted text from the image.'),
});
export type ExtractTextFromImageOutput = z.infer<
  typeof ExtractTextFromImageOutputSchema
>;

export async function extractTextFromImage(
  input: ExtractTextFromImageInput
): Promise<ExtractTextFromImageOutput> {
  return extractTextFromImageFlow(input);
}

const ocrPrompt = ai.definePrompt({
  name: 'ocrPrompt',
  input: {schema: ExtractTextFromImageInputSchema},
  output: {schema: ExtractTextFromImageOutputSchema},
  prompt: `You are an OCR (Optical Character Recognition) expert. Extract all text from the following image of a news clipping.

  Image: {{media url=photoDataUri}}`,
});

const extractTextFromImageFlow = ai.defineFlow(
  {
    name: 'extractTextFromImageFlow',
    inputSchema: ExtractTextFromImageInputSchema,
    outputSchema: ExtractTextFromImageOutputSchema,
  },
  async input => {
    const {output} = await ocrPrompt(input);
    return output!;
  }
);
