import { getSmartEmailInfoText } from "@/lib/mcp-tools";
import { classifyEmailWithAI } from "@/lib/ai/client";
import { classifyEmailInputSchema } from "./schemas";

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * Runs an MCP tool by name. Used by POST /api/mcp/call.
 * Validates input per tool schema and returns structured result.
 */
export async function runTool(
  tool: string,
  input: unknown
): Promise<ToolResult> {
  switch (tool) {
    case "smart_email_info": {
      const text = getSmartEmailInfoText();
      return { ok: true, data: { content: [{ type: "text", text }] } };
    }
    case "classify_email": {
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
          error: e instanceof Error ? e.message : "classify_email failed",
        };
      }
    }
    default:
      return { ok: false, error: `Unknown tool: ${tool}` };
  }
}
