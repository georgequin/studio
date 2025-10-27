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
  summary: z.string().describe('A concise summary of the single, most relevant human rights-related news clipping found in the text.'),
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
  prompt: `You are an AI assistant for the National Human Rights Commission (NHRC). Your task is to analyze a block of text extracted from a newspaper page and identify articles related to potential human rights violations.

Human rights violations include topics like: extrajudicial killings, torture, caste discrimination, communal violence, attacks on women and children, and violations of freedom of speech. General news about politics, economics, or health (like polio reduction) are NOT human rights violations unless they explicitly mention a rights-based issue.

From the text below, please perform the following steps:
1. Identify the single, most prominent news article that discusses a potential human rights violation.
2. Provide a concise summary of that specific article.
3. Based on your summary, determine if it describes a potential human rights violation and set the 'containsViolation' field to true or false.

If no relevant articles are found, you MUST return an empty string for the summary and set 'containsViolation' to false.

Text to analyze:
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
    
    // If the model fails to return a valid output, return a default "safe" response.
    if (!output) {
      return {
        summary: '',
        containsViolation: false,
      };
    }
    
    return output;
  }
);
