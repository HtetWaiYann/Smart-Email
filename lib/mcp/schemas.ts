import { z } from "zod";

export const classifyEmailInputSchema = z.object({
  from: z.string(),
  subject: z.string(),
  snippet: z.string(),
});

export const classifyEmailOutputSchema = z.object({
  category: z.string(),
  urgency: z.number().min(0).max(10),
  summary: z.string(),
  suggested_reply: z.string(),
});

export type ClassifyEmailInput = z.infer<typeof classifyEmailInputSchema>;
export type ClassifyEmailOutput = z.infer<typeof classifyEmailOutputSchema>;
