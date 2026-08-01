"use client";

import { useMemo, useState, useRef } from "react";
import { FiPlusCircle, FiSend, FiTrash2, FiXCircle } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { buildPrompt, PROMPT_TEMPLATES } from "@/services/ai/PromptTemplates";
import type { AIConversation, AIMessage } from "@/types/ai";

const createInitialConversation = (): AIConversation => ({
  id: "conv-1",
  title: "AI tutor session",
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "I’m your AI tutor for AeroPrep. Ask me to explain a topic, summarize a lesson, or generate practice questions.",
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
});

export default function AIChatPanel() {
  const [conversation, setConversation] = useState<AIConversation>(createInitialConversation);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startNewChat = () => {
    setConversation(createInitialConversation());
    setDraft("");
    setErrorMessage(null);
  };

  const clearConversation = () => {
    setConversation({
      ...createInitialConversation(),
      messages: [],
    });
    setDraft("");
    setErrorMessage(null);
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setCanCancel(false);
      setIsLoading(false);
      setErrorMessage('Generation cancelled.');
    }
  };

  const submitPrompt = async (promptText?: string) => {
    const text = (promptText ?? draft).trim();
    if (!text) {
      return;
    }

    const userMessage: AIMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

      const nextMessages = [...conversation.messages, userMessage];
    setConversation({ ...conversation, messages: nextMessages, lastUpdated: new Date().toISOString() });
    setDraft("");
    setErrorMessage(null);
    setIsLoading(true);
    setCanCancel(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ prompt: text, conversationId: conversation.id }),
      });

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({ error: 'Stream request failed.' }));
        throw new Error(error.error || 'Stream request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: AIMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      let buffer = '';


      setConversation((current) => ({
        ...current,
        messages: [...current.messages, assistantMessage],
        lastUpdated: new Date().toISOString(),
      }));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'delta' && parsed.content) {
              assistantMessage.content += parsed.content;
              setConversation((current) => ({
                ...current,
                messages: [...current.messages.filter((m) => m.id !== assistantMessage.id), assistantMessage],
                lastUpdated: new Date().toISOString(),
              }));
            } else if (parsed.type === 'done') {
              setConversation((current) => ({
                ...current,
                messages: [...current.messages.filter((m) => m.id !== assistantMessage.id), assistantMessage],
                lastUpdated: new Date().toISOString(),
              }));
              setIsLoading(false);
              setCanCancel(false);
              return;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error ?? 'AI stream error.');
            }
          } catch (error) {
            if (error instanceof SyntaxError) {
              continue;
            }
            throw error;
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.type === 'delta' && parsed.content) {
            assistantMessage.content += parsed.content;
          }
        } catch {
          // ignore partial buffer content
        }
      }

      setConversation((current) => ({
        ...current,
        messages: [...current.messages.filter((m) => m.id !== assistantMessage.id), assistantMessage],
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'AI generation failed.');
    } finally {
      setIsLoading(false);
      setCanCancel(false);
      abortControllerRef.current = null;
    }
  };

  const handleSuggestedPrompt = (templateId: string) => {
    const resolvedPrompt = buildPrompt(templateId, { topic: "Corrosion", count: 20 });
    void submitPrompt(resolvedPrompt);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.06),_transparent_28%),#f8fafc] px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-80">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">AI Tutor</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your study copilot</h1>
              </div>
              <button
                type="button"
                onClick={startNewChat}
                className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                aria-label="Start a new chat"
              >
                <FiPlusCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Suggested prompts</h2>
              <div className="mt-3 space-y-2">
                {PROMPT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSuggestedPrompt(template.id)}
                    className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-white"
                  >
                    <p className="font-semibold text-slate-950">{template.title}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </aside>

        <Card className="flex-1 p-0" variant="elevated">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Conversation</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Adaptive guidance for your next revision block</h2>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={clearConversation}>
              <span className="flex items-center gap-2">
                <FiTrash2 className="h-4 w-4" />
                Clear
              </span>
            </Button>
          </div>

          <div className="flex min-h-[22rem] flex-col gap-3 px-5 py-5 sm:px-6">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
              {conversation.messages.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm leading-7 text-slate-600">
                  Start a conversation to receive a tailored explanation, revision plan, or practice set.
                </div>
              ) : (
                conversation.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-7 ${message.role === "user" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                      {message.content}
                    </div>
                  </div>
                ))
              )}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Thinking…</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
              <label htmlFor="ai-tutor-input" className="sr-only">Ask the AI tutor</label>
              <textarea
                id="ai-tutor-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder="Ask the tutor to explain a topic or generate a practice set..."
                className="min-h-24 w-full resize-none border-none bg-transparent text-sm text-slate-700 outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">Responses are placeholder-based now, ready for a real provider later.</p>
                  {errorMessage ? <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">{errorMessage}</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  {canCancel ? (
                    <Button type="button" variant="ghost" size="sm" onClick={cancelGeneration}>
                      <span className="flex items-center gap-2">
                        <FiXCircle className="h-4 w-4" />
                        Cancel
                      </span>
                    </Button>
                  ) : null}
                  <Button type="button" variant="primary" size="md" onClick={() => void submitPrompt()} disabled={isLoading}>
                    <span className="flex items-center gap-2">
                      <FiSend className="h-4 w-4" />
                      Send
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
