/**
 * Client for app-callable MCP endpoint.
 * Used by Server Actions to call tools (e.g. classify_email).
 */

function getBaseUrl(): string {
  const url =
    process.env.MCP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export async function callMCP(
  tool: string,
  input: unknown
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const baseUrl = getBaseUrl();
  const secret = process.env.MCP_SECRET;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["Authorization"] = `Bearer ${secret}`;
  }

  const res = await fetch(`${baseUrl}/api/mcp/call`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, input }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      error: (body.error as string) ?? `MCP call failed: ${res.status}`,
    };
  }

  return { ok: true, data: body };
}
