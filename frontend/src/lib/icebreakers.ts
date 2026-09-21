// ============================================================================
// TARGET_DESTINATION: frontend/src/lib/icebreakers.ts
// PURPOSE: Engaging Turkish icebreakers & debate questions - pulls from src/data/icebreakers.ts
// ============================================================================

import { ICEBREAKER_QUESTIONS as DETAILED_QUESTIONS } from "@/data/icebreakers";

export const ICEBREAKER_QUESTIONS: string[] = DETAILED_QUESTIONS.map((q) => q.question);

export function getRandomIcebreaker(): string {
  const index = Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length);
  return ICEBREAKER_QUESTIONS[index];
}
