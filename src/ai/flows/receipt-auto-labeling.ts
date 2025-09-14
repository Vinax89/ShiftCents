// src/ai/flows/receipt-auto-labeling.ts
'use server';
/**
 * @fileOverview An AI agent for automatically suggesting transaction categories for receipts.
 *
 * - receiptAutoLabeling - A function that handles the receipt auto labeling process.
 * - ReceiptAutoLabelingInput - The input type for the receiptAutoLabeling function.
 * - ReceiptAutoLabelingOutput - The return type for the receiptAutoLabeling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReceiptAutoLabelingInputSchema = z.object({
  merchant: z.string().describe('The name of the merchant on the receipt.'),
  amountCents: z.number().describe('The amount in cents on the receipt.'),
  dateISO: z.string().describe('The date on the receipt in ISO format.'),
  merchantHistory: z.array(
    z.object({
      merchant: z.string().describe('The name of the merchant.'),
      categoryId: z.string().describe('The ID of the category.'),
    })
  ).describe('A history of merchants and their associated categories.'),
});
export type ReceiptAutoLabelingInput = z.infer<typeof ReceiptAutoLabelingInputSchema>;

const ReceiptAutoLabelingOutputSchema = z.object({
  categoryId: z.string().optional().describe('The ID of the suggested category.'),
  confidence: z.number().describe('A score between 0 and 1 indicating the confidence in the category suggestion.'),
});
export type ReceiptAutoLabelingOutput = z.infer<typeof ReceiptAutoLabelingOutputSchema>;

export async function receiptAutoLabeling(input: ReceiptAutoLabelingInput): Promise<ReceiptAutoLabelingOutput> {
  return receiptAutoLabelingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'receiptAutoLabelingPrompt',
  input: {schema: ReceiptAutoLabelingInputSchema},
  output: {schema: ReceiptAutoLabelingOutputSchema},
  prompt: `You are an AI assistant specializing in categorizing transactions based on receipt data.

  Given the following receipt information, suggest a category ID for the transaction.

  Merchant: {{{merchant}}}
  Amount: {{amountCents}} cents
  Date: {{{dateISO}}}

  Here is the merchant history:
  {{#if merchantHistory}}
  {{#each merchantHistory}}
  - Merchant: {{{merchant}}}, Category ID: {{{categoryId}}}
  {{/each}}
  {{else}}
  No merchant history available.
  {{/if}}
  
  Return a confidence score reflecting the certainty of your suggestion, which ranges from 0 to 1.
  `,
});

const receiptAutoLabelingFlow = ai.defineFlow(
  {
    name: 'receiptAutoLabelingFlow',
    inputSchema: ReceiptAutoLabelingInputSchema,
    outputSchema: ReceiptAutoLabelingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
