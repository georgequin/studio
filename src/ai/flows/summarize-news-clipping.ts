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
  extractedArticle: z.string().describe('The full, verbatim text of the single most relevant human rights-related article found in the provided text.'),
  containsViolation: z.boolean().describe('Whether the clipping contains a potential human rights violation.'),
});
export type SummarizeNewsClippingOutput = z.infer<typeof SummarizeNewsClippingOutputSchema>;

export async function summarizeNewsClipping(input: SummarizeNewsClippingInput): Promise<SummarizeNewsClippingOutput> {
  return summarizeNewsClippingFlow(input);
}

const summarizeNewsClippingPrompt = ai.definePrompt({
  name: 'summarizeNewsClippingPrompt',
  input: { schema: SummarizeNewsClippingInputSchema },
  output: { schema: SummarizeNewsClippingOutputSchema },
  prompt: `
You are an AI analyst for the National Human Rights Commission (NHRC).
Your task is to analyze text from a newspaper page and identify the single most
relevant article concerning a potential human rights violation.

### INSTRUCTIONS

1.  **Scan and Identify**: Read the entire text and find the single most relevant article discussing a potential human rights issue. Ignore advertisements, stock prices, and articles on topics like general politics, sports, or economics unless they directly involve a human rights concern (e.g., athlete protests, corruption leading to rights abuses).

2.  **Extract Verbatim**: Once you've identified the article, extract its full text exactly as it appears. Do not shorten or alter it. This is for the \`extractedArticle\` field.

3.  **Summarize**: Write a concise, 2-4 sentence summary of the article you extracted. This summary is for the \`summary\` field.

4.  **Flag Violation**: Set \`containsViolation\` to \`true\` if you found a relevant article, and \`false\` if you did not.

5.  **No Relevant Article**: If no part of the text discusses anything related to human rights, return an empty string for both \`extractedArticle\` and \`summary\`, and set \`containsViolation\` to \`false\`.

### Output Requirements
Return a JSON object with the following structure:
{
  "extractedArticle": "The full, verbatim text of the human rights article...",
  "summary": "A concise, 2-4 sentence summary of the extracted article.",
  "containsViolation": true
}

Now analyze the text below:

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
        extractedArticle: '',
        containsViolation: false,
      };
    }
    
    return output;
  }
);
