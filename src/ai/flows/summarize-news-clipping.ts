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

const SingleArticleSchema = z.object({
  summary: z.string().describe('A concise summary of the single, most relevant human rights-related news clipping found in the text.'),
  extractedArticle: z.string().describe('The full, verbatim text of the single most relevant human rights-related article found in the provided text.'),
  containsViolation: z.boolean().describe('Whether the clipping contains a potential human rights violation.'),
});

const SummarizeNewsClippingOutputSchema = z.object({
    articles: z.array(SingleArticleSchema).describe("A list of all human rights-related articles found in the text.")
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
Your task is to analyze text from a newspaper page and identify ALL relevant articles concerning potential human rights violations.

### INSTRUCTIONS

1.  **Scan and Identify**: Read the entire text and find every article discussing a potential human rights issue. Ignore advertisements, stock prices, and articles on topics like general politics, sports, or economics unless they directly involve a human rights concern (e.g., athlete protests, corruption leading to rights abuses).

2.  **Create a List**: For EACH relevant article you find, you will create a JSON object with the following fields:
    *   \`extractedArticle\`: The full text of the article, extracted exactly as it appears. Do not shorten or alter it.
    *   \`summary\`: A concise, 2-4 sentence summary of the article you extracted.
    *   \`containsViolation\`: Set this to \`true\`.

3.  **No Relevant Articles**: If no part of the text discusses anything related to human rights, return an object with an empty list for the \`articles\` field.

### Output Requirements
Return a single JSON object with one key, "articles", which contains a list of the article objects you created.

Example for a text with two relevant articles:
{
  "articles": [
    {
      "extractedArticle": "The full, verbatim text of the first human rights article...",
      "summary": "A concise, 2-4 sentence summary of the first article.",
      "containsViolation": true
    },
    {
      "extractedArticle": "The full, verbatim text of the second human rights article...",
      "summary": "A concise, 2-4 sentence summary of the second article.",
      "containsViolation": true
    }
  ]
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
        articles: [],
      };
    }
    
    return output;
  }
);
