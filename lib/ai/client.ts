import OpenAI from "openai";
import {
  type ClassifyEmailInput,
  type ClassifyEmailOutput,
  classifyEmailOutputSchema,
} from "@/lib/mcp/schemas";
import { CATEGORIZE_EMAIL_PROMPT } from "@/lib/mcp/resources/prompts";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function fillPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`{{${key}}}`, "g"), value),
    template
  );
}

export async function classifyEmailWithAI(
  input: ClassifyEmailInput
): Promise<ClassifyEmailOutput> {
  const prompt = fillPromptTemplate(CATEGORIZE_EMAIL_PROMPT, {
    from: input.from,
    subject: input.subject,
    snippet: input.snippet,
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error("No response text from OpenAI API");
  }

  const parsed = JSON.parse(responseText);

  return classifyEmailOutputSchema.parse(parsed);
}
