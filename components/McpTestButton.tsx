"use client";

import { useState } from "react";

type TestResult = {
  smart_email_info: { content?: { type: string; text: string }[]; error?: string };
  classify_email:
    | { category: string; urgency: number; summary: string; suggested_reply: string }
    | { error: string };
};

export default function McpTestButton() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    setOpen(true);
    try {
      const res = await fetch("/api/mcp/test");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult({
        smart_email_info: data.smart_email_info,
        classify_email: data.classify_email,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={runTest}
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Testing MCP…" : "Test MCP server"}
      </button>
      {open && (
        <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-gray-900">MCP test result</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {error && (
            <p className="mb-3 text-sm text-red-600">{error}</p>
          )}
          {result && (
            <div className="space-y-4 text-left">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  smart_email_info
                </p>
                <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800">
                  {result.smart_email_info.error ??
                    result.smart_email_info.content?.[0]?.text ??
                    "—"}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  classify_email (sample)
                </p>
                <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800">
                  {result.classify_email.error
                    ? String(result.classify_email.error)
                    : JSON.stringify(result.classify_email, null, 2)}
                </pre>
              </div>
              <p className="text-xs text-gray-500">
                App calls POST /api/mcp/call with tool + input.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
