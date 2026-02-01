import {
  type ClassifyEmailInput,
  type ClassifyEmailOutput,
  classifyEmailOutputSchema,
} from "@/lib/mcp/schemas";

/**
 * AI client for MCP tools. Replace the implementation with your chosen model
 * (OpenAI, Anthropic, etc.) when ready.
 */
export async function classifyEmailWithAI(
  input: ClassifyEmailInput
): Promise<ClassifyEmailOutput> {
  // Stub: returns mock structured output until you plug in a real model.
  // Replace this with your provider (e.g. OpenAI SDK, structured output).
  const mock: ClassifyEmailOutput = {
    category: "ACTION",
    urgency: 6,
    summary: `${input.subject}: ${input.snippet.slice(0, 80)}${input.snippet.length > 80 ? "…" : ""}`,
    suggested_reply: "I'll look into this and get back to you shortly.",
  };
  return classifyEmailOutputSchema.parse(mock);
}
