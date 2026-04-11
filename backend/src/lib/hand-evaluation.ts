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
  comparisonValues: number[];
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

interface NumberGroup {
  number: number;
  count: number;
}

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

function compareValues(left: number[], right: number[]): number {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? -1;
    const rightValue = right[index] ?? -1;

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return 0;
}

function isFlush(cards: DeckCard[]): boolean {
  return new Set(cards.map((card) => card.suit)).size === 1;
}

function getStraightHighCard(numbers: number[]): number | null {
  const sortedNumbers = [...new Set(numbers)].sort((left, right) => left - right);

  if (sortedNumbers.length !== 5) {
    return null;
  }

  for (let index = 1; index < sortedNumbers.length; index += 1) {
    if (sortedNumbers[index] !== sortedNumbers[index - 1] + 1) {
      return null;
    }
  }

  return sortedNumbers[sortedNumbers.length - 1] ?? null;
}

function getNumberGroups(cards: DeckCard[]): NumberGroup[] {
  const counts = new Map<number, number>();

  for (const card of cards) {
    counts.set(card.number, (counts.get(card.number) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([number, count]) => ({ number, count }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return right.number - left.number;
    });
}

function sortNumbersDescending(cards: DeckCard[]): number[] {
  return cards.map((card) => card.number).sort((left, right) => right - left);
}

function evaluateFiveCardHand(cards: DeckCard[]): HandEvaluation {
  const flush = isFlush(cards);
  const straightHighCard = getStraightHighCard(cards.map((card) => card.number));
  const groups = getNumberGroups(cards);
  const counts = groups.map((group) => group.count);

  if (flush && straightHighCard !== null) {
    return {
      rank: "straight_flush",
      cards,
      comparisonValues: [straightHighCard],
    };
  }

  if (counts[0] === 4) {
    return {
      rank: "four_of_a_kind",
      cards,
      comparisonValues: [groups[0]?.number ?? -1, groups[1]?.number ?? -1],
    };
  }

  if (counts[0] === 3 && counts[1] === 2) {
    return {
      rank: "full_house",
      cards,
      comparisonValues: [groups[0]?.number ?? -1, groups[1]?.number ?? -1],
    };
  }

  if (flush) {
    return {
      rank: "flush",
      cards,
      comparisonValues: sortNumbersDescending(cards),
    };
  }

  if (straightHighCard !== null) {
    return {
      rank: "straight",
      cards,
      comparisonValues: [straightHighCard],
    };
  }

  if (counts[0] === 3) {
    const kickers = groups.slice(1).map((group) => group.number);

    return {
      rank: "three_of_a_kind",
      cards,
      comparisonValues: [groups[0]?.number ?? -1, ...kickers],
    };
  }

  if (counts[0] === 2 && counts[1] === 2) {
    const pairNumbers = groups
      .filter((group) => group.count === 2)
      .map((group) => group.number)
      .sort((left, right) => right - left);
    const kicker = groups.find((group) => group.count === 1)?.number ?? -1;

    return {
      rank: "two_pair",
      cards,
      comparisonValues: [...pairNumbers, kicker],
    };
  }

  if (counts[0] === 2) {
    const pairNumber = groups.find((group) => group.count === 2)?.number ?? -1;
    const kickers = groups
      .filter((group) => group.count === 1)
      .map((group) => group.number)
      .sort((left, right) => right - left);

    return {
      rank: "one_pair",
      cards,
      comparisonValues: [pairNumber, ...kickers],
    };
  }

  return {
    rank: "high_card",
    cards,
    comparisonValues: sortNumbersDescending(cards),
  };
}

function compareEvaluations(left: HandEvaluation, right: HandEvaluation): number {
  const rankDifference = HAND_RANK_SCORE[left.rank] - HAND_RANK_SCORE[right.rank];

  if (rankDifference !== 0) {
    return rankDifference;
  }

  return compareValues(left.comparisonValues, right.comparisonValues);
}

export function evaluateHand(cards: DeckCard[]): HandEvaluation {
  assertValidCards(cards);

  let best: HandEvaluation | null = null;

  for (const candidate of combinations(cards, 5)) {
    const evaluation = evaluateFiveCardHand(candidate);

    if (!best || compareEvaluations(evaluation, best) > 0) {
      best = evaluation;
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

  let bestEvaluation: HandEvaluation | null = null;

  for (const result of results) {
    if (!bestEvaluation || compareEvaluations(result.evaluation, bestEvaluation) > 0) {
      bestEvaluation = result.evaluation;
    }
  }

  if (!bestEvaluation) {
    throw new Error("Failed to compare hands.");
  }

  const winners = results.filter((result) => compareEvaluations(result.evaluation, bestEvaluation as HandEvaluation) === 0);

  return {
    isDraw: winners.length > 1,
    winners,
    results,
  };
}
