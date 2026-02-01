"use server";

import { callMCP } from "@/lib/mcpClient";
import type { ClassifyEmailOutput } from "@/lib/mcp/schemas";

export type ClassifyEmailActionInput = {
  from: string;
  subject: string;
  snippet: string;
};

/**
 * Calls the MCP classify_email tool. Runs only on server.
 * Returns structured result or error; frontend never sees MCP or AI directly.
 */
export async function classifyEmailAction(
  email: ClassifyEmailActionInput
): Promise<
  | { ok: true; result: ClassifyEmailOutput }
  | { ok: false; error: string }
> {
  const response = await callMCP("classify_email", {
    from: email.from,
    subject: email.subject,
    snippet: email.snippet,
  });

  if (!response.ok) {
    return { ok: false, error: response.error };
  }

  const result = response.data as ClassifyEmailOutput;
  return {
    ok: true,
    result: {
      category: result.category,
      urgency: result.urgency,
      summary: result.summary,
      suggested_reply: result.suggested_reply,
    },
  };
}
