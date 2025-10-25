'use server';

/**
 * @fileOverview This file defines a Genkit flow for categorizing news clippings related to human rights violations.
 *
 * - categorizeNewsClipping - A function that takes news clipping text as input and returns a categorization of the content.
 * - CategorizeNewsClippingInput - The input type for the categorizeNewsClipping function, which is the text content of the news clipping.
 * - CategorizeNewsClippingOutput - The return type for the categorizeNewsClipping function, which includes the determined category and confidence level.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeNewsClippingInputSchema = z.object({
  text: z
    .string()
    .describe('The text content of the news clipping to be categorized.'),
});
export type CategorizeNewsClippingInput = z.infer<
  typeof CategorizeNewsClippingInputSchema
>;

const CategorizeNewsClippingOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The determined category for the news clipping, chosen from predefined NHRC categories such as Communal Clashes, Terrorism, Women & Children, etc.'
    ),
  confidence: z
    .number()
    .describe(
      'A numerical value representing the confidence level of the categorization (0-1).'
    ),
});
export type CategorizeNewsClippingOutput = z.infer<
  typeof CategorizeNewsClippingOutputSchema
>;

export async function categorizeNewsClipping(
  input: CategorizeNewsClippingInput
): Promise<CategorizeNewsClippingOutput> {
  return categorizeNewsClippingFlow(input);
}

const categoryPrompt = ai.definePrompt({
  name: 'categoryPrompt',
  input: {schema: CategorizeNewsClippingInputSchema},
  output: {schema: CategorizeNewsClippingOutputSchema},
  prompt: `You are an expert in categorizing news articles related to human rights violations based on predefined NHRC categories.

  The available categories are: Communal Clashes, Terrorism, Women & Children, Caste Discrimination, Extrajudicial Killings, Custodial Torture, Freedom of Speech, and other.

  Analyze the following news clipping and determine the most appropriate category. Also, provide a confidence level (0-1) for your categorization.

  News Clipping Text: {{{text}}}

  Format your output as a JSON object with "category" and "confidence" keys.`,
});

const categorizeNewsClippingFlow = ai.defineFlow(
  {
    name: 'categorizeNewsClippingFlow',
    inputSchema: CategorizeNewsClippingInputSchema,
    outputSchema: CategorizeNewsClippingOutputSchema,
  },
  async input => {
    const {output} = await categoryPrompt(input);
    return output!;
  }
);
