#!/usr/bin/env node
/**
 * Smart Email MCP Server
 *
 * A custom Model Context Protocol (MCP) server for the Smart Email app.
 * Exposes one tool (smart_email_info) and one resource (smart_email://about).
 *
 * Run via: npx tsx scripts/smart-email-mcp.ts
 * Or: npm run mcp:serve
 *
 * Important: For stdio transport, never use console.log — use console.error for
 * any debugging, or you will corrupt the JSON-RPC stream.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const APP_NAME = "Smart Email";
const APP_VERSION = "0.1.0";
const ABOUT_URI = "smart_email://about";

// --- Server ---

const server = new McpServer({
  name: "smart-email",
  version: "1.0.0",
});

// --- Tool: smart_email_info ---

server.registerTool(
  "smart_email_info",
  {
    description:
      "Returns basic info about the Smart Email app: name, version, and a short description of what the app does (Gmail integration, NextAuth, Prisma).",
    inputSchema: z.object({}),
  },
  async () => {
    const info = [
      `Name: ${APP_NAME}`,
      `Version: ${APP_VERSION}`,
      "",
      "Smart Email is a Next.js app that lets you view and manage Gmail from a simple UI. It uses NextAuth for Google sign-in, Prisma + PostgreSQL for account data, and the Gmail API for reading emails.",
    ].join("\n");

    return {
      content: [{ type: "text" as const, text: info }],
    };
  }
);

// --- Resource: smart_email://about ---

server.registerResource(
  "about",
  ABOUT_URI,
  {
    description: "Read-only overview of the Smart Email app (tech stack and purpose).",
    mimeType: "text/plain",
  },
  async (uri) => {
    const content = [
      "# Smart Email",
      "",
      "A small app to read and manage Gmail from a custom UI.",
      "",
      "## Tech stack",
      "- Next.js 16",
      "- NextAuth (Google OAuth)",
      "- Prisma + PostgreSQL",
      "- Gmail API (googleapis)",
      "",
      "## MCP",
      "This app exposes an MCP server with one tool (`smart_email_info`) and this about resource.",
    ].join("\n");

    return {
      contents: [
        {
          uri: ABOUT_URI,
          mimeType: "text/plain",
          text: content,
        },
      ],
    };
  }
);

// --- Run ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Smart Email MCP server running on stdio");
}

main().catch((err) => {
  console.error("Smart Email MCP server error:", err);
  process.exit(1);
});
