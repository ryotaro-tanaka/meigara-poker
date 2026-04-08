import type { DeckCard } from "./deck";

export const HAND_RANKS = [
  "straight_flush",
  "four_of_a_kind",
  "full_house",
  "flush",
  "straight",
  "three_of_a_kind",
  "two_pair",
  "one_pair",
  "high_card",
] as const;

export type HandRank = (typeof HAND_RANKS)[number];

export interface HandEvaluation {
  rank: HandRank;
  cards: DeckCard[];
}

export interface HandComparisonEntry {
  playerId: string;
  cards: DeckCard[];
}

export interface HandComparisonResultEntry {
  playerId: string;
  evaluation: HandEvaluation;
}

export interface HandComparisonResult {
  isDraw: boolean;
  winners: HandComparisonResultEntry[];
  results: HandComparisonResultEntry[];
}

const HAND_RANK_SCORE: Record<HandRank, number> = {
  straight_flush: 8,
  four_of_a_kind: 7,
  full_house: 6,
  flush: 5,
  straight: 4,
  three_of_a_kind: 3,
  two_pair: 2,
  one_pair: 1,
  high_card: 0,
};

function combinations<T>(items: T[], size: number): T[][] {
  const results: T[][] = [];

  function visit(start: number, current: T[]): void {
    if (current.length === size) {
      results.push([...current]);
      return;
    }

    for (let index = start; index < items.length; index += 1) {
      current.push(items[index]);
      visit(index + 1, current);
      current.pop();
    }
  }

  visit(0, []);
  return results;
}

function assertValidCards(cards: DeckCard[]): void {
  if (cards.length !== 7) {
    throw new Error("Hand evaluation requires exactly 7 cards.");
  }

  for (const card of cards) {
    if (!Number.isInteger(card.number) || card.number < 0 || card.number > 9) {
      throw new Error("Card number must be an integer between 0 and 9.");
    }
  }
}

function isFlush(cards: DeckCard[]): boolean {
  return new Set(cards.map((card) => card.suit)).size === 1;
}

function isStraight(cards: DeckCard[]): boolean {
  const sortedNumbers = [...new Set(cards.map((card) => card.number))].sort((left, right) => left - right);

  if (sortedNumbers.length !== 5) {
    return false;
  }

  for (let index = 1; index < sortedNumbers.length; index += 1) {
    if (sortedNumbers[index] !== sortedNumbers[index - 1] + 1) {
      return false;
    }
  }

  return true;
}

function getCountSignature(cards: DeckCard[]): number[] {
  const counts = new Map<number, number>();

  for (const card of cards) {
    counts.set(card.number, (counts.get(card.number) ?? 0) + 1);
  }

  return [...counts.values()].sort((left, right) => right - left);
}

function evaluateFiveCardHand(cards: DeckCard[]): HandRank {
  const flush = isFlush(cards);
  const straight = isStraight(cards);

  if (flush && straight) {
    return "straight_flush";
  }

  const signature = getCountSignature(cards);

  if (signature[0] === 4) {
    return "four_of_a_kind";
  }

  if (signature[0] === 3 && signature[1] === 2) {
    return "full_house";
  }

  if (flush) {
    return "flush";
  }

  if (straight) {
    return "straight";
  }

  if (signature[0] === 3) {
    return "three_of_a_kind";
  }

  if (signature[0] === 2 && signature[1] === 2) {
    return "two_pair";
  }

  if (signature[0] === 2) {
    return "one_pair";
  }

  return "high_card";
}

export function evaluateHand(cards: DeckCard[]): HandEvaluation {
  assertValidCards(cards);

  let best: HandEvaluation | null = null;

  for (const candidate of combinations(cards, 5)) {
    const rank = evaluateFiveCardHand(candidate);

    if (!best || HAND_RANK_SCORE[rank] > HAND_RANK_SCORE[best.rank]) {
      best = {
        rank,
        cards: candidate,
      };
    }
  }

  if (!best) {
    throw new Error("Failed to evaluate hand.");
  }

  return best;
}

export function compareHands(entries: HandComparisonEntry[]): HandComparisonResult {
  if (entries.length < 2) {
    throw new Error("Hand comparison requires at least 2 players.");
  }

  const results = entries.map<HandComparisonResultEntry>((entry) => ({
    playerId: entry.playerId,
    evaluation: evaluateHand(entry.cards),
  }));

  const bestScore = Math.max(...results.map((result) => HAND_RANK_SCORE[result.evaluation.rank]));
  const winners = results.filter((result) => HAND_RANK_SCORE[result.evaluation.rank] === bestScore);

  return {
    isDraw: winners.length > 1,
    winners,
    results,
  };
}
