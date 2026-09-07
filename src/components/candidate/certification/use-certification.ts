"use client";

import { useState } from "react";

import { apiSend } from "@/lib/api-client";
import type { CertificationResult, CertificationState, CertificationQuestion } from "./types";

function resultFrom(state: CertificationState): CertificationResult | null {
  if (state.status !== "submitted" || state.score === null) return null;

  return {
    score: state.score,
    threshold: state.threshold,
    passed: Boolean(state.passed),
    certified: Boolean(state.passed),
  };
}

function firstUnanswered(questions: CertificationQuestion[], state: CertificationState): number {
  const index = questions.findIndex((question) => state.answers[question.id] === undefined);
  return index < 0 ? Math.max(0, questions.length - 1) : index;
}

export function useCertification(
  questions: CertificationQuestion[],
  initialState: CertificationState,
) {
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState<CertificationResult | null>(() => resultFrom(initialState));
  const [index, setIndex] = useState(() => firstUnanswered(questions, initialState));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[index];

  async function run<T>(request: Promise<{ ok: true; data: T } | { ok: false; message: string }>) {
    setBusy(true);
    setError(null);

    const result = await request;
    if (!result.ok) setError(result.message);

    setBusy(false);
    return result.ok ? result.data : null;
  }

  async function answer(value: number) {
    if (!question || busy) return;

    const next = await run(
      apiSend<CertificationState>("PUT", "/api/me/certification/answers", {
        answers: { [question.id]: value },
      }),
    );
    if (next) setState(next);
  }

  async function submit() {
    const outcome = await run(
      apiSend<CertificationResult>("POST", "/api/me/certification/submit"),
    );
    if (outcome) setResult(outcome);
  }

  async function restart() {
    const next = await run(apiSend<CertificationState>("POST", "/api/me/certification/restart"));
    if (!next) return;

    setState(next);
    setResult(null);
    setIndex(0);
  }

  return {
    question,
    index,
    result,
    busy,
    error,
    selected: question ? state.answers[question.id] : undefined,
    progress: questions.length ? ((index + 1) / questions.length) * 100 : 0,
    goPrevious: () => setIndex((value) => Math.max(0, value - 1)),
    goNext: () => setIndex((value) => Math.min(questions.length - 1, value + 1)),
    answer,
    submit,
    restart,
  };
}
