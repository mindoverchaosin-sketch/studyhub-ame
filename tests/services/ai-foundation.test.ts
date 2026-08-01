import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/services/ai/MockAIProvider";
import { buildPrompt, PROMPT_TEMPLATES } from "@/services/ai/PromptTemplates";
import { createRecommendationEngine } from "@/services/ai/RecommendationEngine";
import { filterQuestions, getPlaceholderQuestions } from "@/services/ai/QuestionBankService";

describe("AI foundation services", () => {
  it("returns structured placeholder responses from the mock provider", async () => {
    const provider = new MockAIProvider();
    const message = await provider.generateResponse({
      prompt: "Explain corrosion in simple terms",
      conversation: {
        id: "conv-1",
        title: "Corrosion review",
        messages: [],
        createdAt: "2026-07-30T09:00:00.000Z",
        lastUpdated: "2026-07-30T09:00:00.000Z",
      },
    });

    expect(message.role).toBe("assistant");
    expect(message.content).toContain("placeholder");
  });

  it("builds prompts from prompt templates", () => {
    const prompt = buildPrompt(
      PROMPT_TEMPLATES.find((template) => template.id === "generate-questions")?.id ?? PROMPT_TEMPLATES[0].id,
      {
        topic: "Corrosion",
        count: 20,
      }
    );

    expect(prompt).toContain("Corrosion");
    expect(prompt).toContain("20");
  });

  it("generates recommendations from lightweight analytics placeholders", () => {
    const engine = createRecommendationEngine();
    const recommendations = engine.generate({
      weakTopics: ["Corrosion"],
      recentMockPerformance: 62,
      lessonCompletion: 74,
      studyStreak: 4,
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].title).toContain("Review");
  });

  it("filters questions by search, standard, difficulty, and status", () => {
    const questions = getPlaceholderQuestions();
    const filtered = filterQuestions(questions, {
      search: "corrosion",
      standard: "DGCA",
      difficulty: "Hard",
      status: "Unanswered",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((question) => question.module.includes("DGCA") || question.module.includes("Module"))).toBe(true);
  });

  it("exposes placeholder explanations for each question", async () => {
    const provider = new MockAIProvider();
    const question = getPlaceholderQuestions()[0];
    const explanation = await provider.generateExplanation(question);

    expect(explanation.answer).toContain("Option");
    expect(explanation.simplified).toContain("simple");
    expect(explanation.relatedConcepts.length).toBeGreaterThan(0);
  });
});
