"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
  {
    question: "What is AeroPrep?",
    answer:
      "AeroPrep is an AI-powered aviation learning platform built for Aircraft Maintenance Engineers preparing for DGCA and EASA exams. It combines an AI tutor, mock exams, a large question bank, and an adaptive study planner in one place.",
  },
  {
    question: "Does it cover both DGCA and EASA?",
    answer:
      "Yes. We provide dedicated learning paths for DGCA (B1 and B2) in India and EASA Part-66 (combined B1 + B2 across 17 modules) in Europe, each aligned to its official syllabus.",
  },
  {
    question: "How does the AI Tutor work?",
    answer:
      "The AI Tutor answers your questions in plain language, references the relevant module, and adapts explanations to your level. Free users get a daily question limit; Pro and Premium unlock much higher or unlimited usage.",
  },
  {
    question: "Are the mock exams realistic?",
    answer:
      "Absolutely. Mock exams are full-length and timed to mirror real DGCA and EASA conditions, with detailed solutions and analytics after every attempt.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The Free plan lets you explore core modules, a limited number of AI questions and mock exams per period, and the question bank, supported by ads. You can upgrade any time.",
  },
  {
    question: "Can I study on mobile?",
    answer:
      "Yes. The entire platform is fully responsive and optimized for studying on phones, tablets, and desktops.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur transition-colors hover:border-primary/30">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-base font-semibold text-foreground">{question}</span>
          <FiChevronDown
            className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </h3>
      <div
        className={`grid overflow-hidden px-6 transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <p className="text-sm leading-7 text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            FAQ
          </p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
