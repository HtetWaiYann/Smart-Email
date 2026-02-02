import { classifyEmailWithAI } from "@/lib/ai/client";
import { classifyEmailInputSchema } from "./schemas";

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * Runs the MCP tool by name. Used by POST /api/mcp/call and by server actions.
 */
export async function runTool(
  tool: string,
  input: unknown
): Promise<ToolResult> {
  if (tool !== "categorize_email") {
    return { ok: false, error: `Unknown tool: ${tool}` };
  }

  const parsed = classifyEmailInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Invalid input: ${parsed.error.message}`,
    };
  }

  try {
    const result = await classifyEmailWithAI(parsed.data);
    return { ok: true, data: result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "categorize_email failed",
    };
  }
}
