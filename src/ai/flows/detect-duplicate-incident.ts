'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting duplicate news articles.
 *
 * - detectDuplicateIncident - A function that compares a new article against recent reports to check for duplication.
 * - DetectDuplicateInput - The input type for the detectDuplicateIncident function.
 * - DetectDuplicateOutput - The return type for the detectDuplicateIncident function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RecentReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
});

const DetectDuplicateInputSchema = z.object({
  newArticleText: z
    .string()
    .describe('The full text of the newly extracted article.'),
  recentReports: z
    .array(RecentReportSchema)
    .describe(
      'A list of recently saved reports to compare the new article against.'
    ),
});
export type DetectDuplicateInput = z.infer<typeof DetectDuplicateInputSchema>;

const DetectDuplicateOutputSchema = z.object({
  isDuplicate: z
    .boolean()
    .describe('Whether the new article is a duplicate of a recent report.'),
  duplicateReportId: z
    .string()
    .optional()
    .describe(
      'The ID of the report that is considered a duplicate. This should be present if isDuplicate is true.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why the article is or is not considered a duplicate.'
    ),
});
export type DetectDuplicateOutput = z.infer<typeof DetectDuplicateOutputSchema>;

export async function detectDuplicateIncident(
  input: DetectDuplicateInput
): Promise<DetectDuplicateOutput> {
  return detectDuplicateIncidentFlow(input);
}

const duplicatePrompt = ai.definePrompt({
  name: 'duplicatePrompt',
  input: { schema: DetectDuplicateInputSchema },
  output: { schema: DetectDuplicateOutputSchema },
  prompt: `You are an AI analyst specializing in identifying duplicate news reports about human rights violations.
Your task is to determine if a new article is reporting on the same core incident as any of the recent reports provided.

### INSTRUCTIONS

1.  **Analyze the New Article**: Carefully read the text of the new article provided.
2.  **Compare with Recent Reports**: Compare the new article against the list of recent reports. Each recent report includes a title and a summary.
3.  **Determine Duplication**: Decide if the new article describes the exact same event, even if the details, wording, or source are different. Focus on the core incident (what happened, to whom, where, and when).
4.  **Set Output**:
    *   If you find a clear duplicate, set \`isDuplicate\` to \`true\` and provide the \`id\` of the matching recent report in \`duplicateReportId\`.
    *   If it is not a duplicate, set \`isDuplicate\` to \`false\`.
5.  **Provide Reasoning**: In the \`reasoning\` field, provide a short, one-sentence explanation for your decision.
    *   *Example (if duplicate)*: "This article is considered a duplicate because it reports on the same protest in Abuja as report #123."
    *   *Example (if not a duplicate)*: "This article is not a duplicate as it describes a different incident in a different state."

### DATA

**New Article Text:**
\`\`\`
{{{newArticleText}}}
\`\`\`

**Recent Reports to Check Against:**
\`\`\`json
{{{json stringify=recentReports}}}
\`\`\`

Now, perform the analysis and provide the output in the required JSON format.`,
});

const detectDuplicateIncidentFlow = ai.defineFlow(
  {
    name: 'detectDuplicateIncidentFlow',
    inputSchema: DetectDuplicateInputSchema,
    outputSchema: DetectDuplicateOutputSchema,
  },
  async (input) => {
    // If there are no recent reports, it cannot be a duplicate.
    if (input.recentReports.length === 0) {
      return {
        isDuplicate: false,
        reasoning: 'Not a duplicate because there are no recent reports to compare against.',
      };
    }

    const { output } = await duplicatePrompt(input);

    if (!output) {
      // If the model fails, assume it's not a duplicate to be safe.
      return {
        isDuplicate: false,
        reasoning: 'Analysis was inconclusive; assuming not a duplicate.',
      };
    }

    return output;
  }
);
