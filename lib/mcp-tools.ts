/**
 * Shared logic for Smart Email MCP tools.
 * Used by POST /api/mcp/call (run-tool) and /api/mcp/test.
 */

export const MCP_APP_NAME = "Smart Email";
export const MCP_APP_VERSION = "0.1.0";

/** Returns the same result as the MCP tool `smart_email_info`. */
export function getSmartEmailInfoText(): string {
  return [
    `Name: ${MCP_APP_NAME}`,
    `Version: ${MCP_APP_VERSION}`,
    "",
    "Smart Email is a Next.js app that lets you view and manage Gmail from a simple UI. It uses NextAuth for Google sign-in, Prisma + PostgreSQL for account data, and the Gmail API for reading emails.",
  ].join("\n");
}
