"use server";

import { runTool } from "@/lib/mcp/run-tool";
import type { ClassifyEmailOutput } from "@/lib/mcp/schemas";

export type CategorizeEmailInput = {
  from: string;
  subject: string;
  snippet: string;
};

/**
 * Calls the categorize_email tool. Use after fetching the email list.
 */
export async function categorizeEmail(
  input: CategorizeEmailInput
): Promise<
  | { ok: true; result: ClassifyEmailOutput }
  | { ok: false; error: string }
> {
  const result = await runTool("categorize_email", {
    from: input.from,
    subject: input.subject,
    snippet: input.snippet,
  });
 
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const data = result.data as ClassifyEmailOutput;
  return {
    ok: true,
    result: {
      category: data.category,
      urgency: data.urgency,
      summary: data.summary,
      suggested_reply: data.suggested_reply,
    },
  };
}
