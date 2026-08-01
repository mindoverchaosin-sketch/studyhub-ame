import type { PromptTemplate } from "@/types/ai";

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "explain-topic",
    title: "Explain this topic",
    description: "Break down a concept in simple language.",
    prompt: "Explain {topic} in simple, exam-friendly language.",
  },
  {
    id: "summarize-lesson",
    title: "Summarize today's lesson",
    description: "Provide a short lesson recap.",
    prompt: "Summarize today's lesson focused on {topic} and highlight the key takeaways.",
  },
  {
    id: "generate-questions",
    title: "Generate 20 DGCA questions",
    description: "Create a mock practice set.",
    prompt: "Generate {count} practice questions for {topic} aligned to the DGCA style.",
  },
  {
    id: "explain-answer",
    title: "Why is option B correct?",
    description: "Explain the reasoning behind an option.",
    prompt: "Explain why option B is correct for the question about {topic}.",
  },
  {
    id: "revision-plan",
    title: "Create a revision plan",
    description: "Outline a short revision schedule.",
    prompt: "Create a revision plan for {topic} that fits a focused study session.",
  },
  {
    id: "simple-explanation",
    title: "Explain this concept simply",
    description: "Simplify a complex idea.",
    prompt: "Explain {topic} simply, as if teaching it to someone new to the subject.",
  },
];

export function buildPrompt(templateId: string, values: Record<string, string | number> = {}): string {
  const template = PROMPT_TEMPLATES.find((item) => item.id === templateId);
  if (!template) {
    return "";
  }

  return Object.entries(values).reduce((prompt, [key, value]) => prompt.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)), template.prompt);
}
