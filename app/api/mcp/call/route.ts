import { NextResponse } from "next/server";
import { runTool } from "@/lib/mcp/run-tool";

/** When set, POST /api/mcp/call requires Authorization: Bearer <MCP_SECRET>. Stops random or frontend abuse. */
const MCP_SECRET = process.env.MCP_SECRET;

/**
 * POST /api/mcp/call — run MCP tool (categorize_email).
 * Body: { tool: "categorize_email", input: { from, subject, snippet } }
 * Optional: Authorization: Bearer MCP_SECRET
 */
export async function POST(request: Request) {
  if (MCP_SECRET) {
    const auth = request.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== MCP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { tool?: string; input?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { tool, input } = body;
  if (!tool || typeof tool !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'tool'" },
      { status: 400 }
    );
  }

  const result = await runTool(tool, input ?? {});

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result.data);
}
