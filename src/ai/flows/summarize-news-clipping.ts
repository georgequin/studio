'use server';
/**
 * @fileOverview An AI agent for summarizing news clippings related to potential human rights violations.
 *
 * - summarizeNewsClipping - A function that handles the summarization process.
 * - SummarizeNewsClippingInput - The input type for the summarizeNewsClipping function.
 * - SummarizeNewsClippingOutput - The return type for the summarizeNewsClipping function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNewsClippingInputSchema = z.object({
  text: z
    .string()
    .describe('The text content of the news clipping to summarize.'),
});
export type SummarizeNewsClippingInput = z.infer<typeof SummarizeNewsClippingInputSchema>;

const SummarizeNewsClippingOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the news clipping.'),
  containsViolation: z.boolean().describe('Whether the clipping contains a potential human rights violation.'),
});
export type SummarizeNewsClippingOutput = z.infer<typeof SummarizeNewsClippingOutputSchema>;

export async function summarizeNewsClipping(input: SummarizeNewsClippingInput): Promise<SummarizeNewsClippingOutput> {
  return summarizeNewsClippingFlow(input);
}

const summarizeNewsClippingPrompt = ai.definePrompt({
  name: 'summarizeNewsClippingPrompt',
  input: {schema: SummarizeNewsClippingInputSchema},
  output: {schema: SummarizeNewsClippingOutputSchema},
  prompt: `You are an AI assistant helping to summarize news clippings related to potential human rights violations.

  Please provide a concise summary of the following news clipping. Based on the summary, determine if it describes a potential human rights violation and set the 'containsViolation' field to true or false.

  {{{text}}}
`,
});

const summarizeNewsClippingFlow = ai.defineFlow(
  {
    name: 'summarizeNewsClippingFlow',
    inputSchema: SummarizeNewsClippingInputSchema,
    outputSchema: SummarizeNewsClippingOutputSchema,
  },
  async input => {
    const {output} = await summarizeNewsClippingPrompt(input);
    return output!;
  }
);
