import { NextResponse } from "next/server";
import { runTool } from "@/lib/mcp/run-tool";

/**
 * GET /api/mcp/test — calls MCP tools internally and returns results
 * so the home page test button can verify the app-callable MCP flow.
 */
export async function GET() {
  const smartEmailResult = await runTool("smart_email_info", {});
  const classifyResult = await runTool("classify_email", {
    from: "alice@company.com",
    subject: "Invoice problem",
    snippet: "The total amount looks incorrect. Can you review?",
  });

  return NextResponse.json({
    ok: true,
    smart_email_info:
      smartEmailResult.ok ? smartEmailResult.data : { error: smartEmailResult.error },
    classify_email:
      classifyResult.ok ? classifyResult.data : { error: classifyResult.error },
  });
}
