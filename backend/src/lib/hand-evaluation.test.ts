import { describe, expect, it } from "vitest";

import type { DeckCard } from "./deck";
import { compareHands, evaluateHand } from "./hand-evaluation";

function card(suit: string, number: number, name = `${suit}-${number}`): DeckCard {
  return {
    edinetCode: `${suit}-${number}-${name}`,
    name,
    suit,
    number,
  };
}

describe("evaluateHand", () => {
  it("detects straight flush", () => {
    const result = evaluateHand([
      card("情報・通信業", 0),
      card("情報・通信業", 1),
      card("情報・通信業", 2),
      card("情報・通信業", 3),
      card("情報・通信業", 4),
      card("建設業", 8),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("straight_flush");
    expect(result.comparisonValues).toEqual([4]);
  });

  it("detects four of a kind", () => {
    const result = evaluateHand([
      card("情報・通信業", 7),
      card("建設業", 7),
      card("小売業", 7),
      card("銀行業", 7),
      card("情報・通信業", 2),
      card("建設業", 4),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("four_of_a_kind");
    expect(result.comparisonValues).toEqual([7, 9]);
  });

  it("detects full house", () => {
    const result = evaluateHand([
      card("情報・通信業", 3),
      card("建設業", 3),
      card("小売業", 3),
      card("銀行業", 8),
      card("情報・通信業", 8),
      card("建設業", 1),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("full_house");
    expect(result.comparisonValues).toEqual([3, 8]);
  });

  it("detects flush", () => {
    const result = evaluateHand([
      card("情報・通信業", 0),
      card("情報・通信業", 2),
      card("情報・通信業", 4),
      card("情報・通信業", 7),
      card("情報・通信業", 9),
      card("建設業", 1),
      card("小売業", 3),
    ]);

    expect(result.rank).toBe("flush");
    expect(result.comparisonValues).toEqual([9, 7, 4, 2, 0]);
  });

  it("detects straight", () => {
    const result = evaluateHand([
      card("情報・通信業", 1),
      card("建設業", 2),
      card("小売業", 3),
      card("銀行業", 4),
      card("情報・通信業", 5),
      card("建設業", 8),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("straight");
    expect(result.comparisonValues).toEqual([5]);
  });

  it("treats 0-1-2-3-4 as a straight", () => {
    const result = evaluateHand([
      card("情報・通信業", 0),
      card("建設業", 1),
      card("小売業", 2),
      card("銀行業", 3),
      card("情報・通信業", 4),
      card("建設業", 7),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("straight");
    expect(result.comparisonValues).toEqual([4]);
  });

  it("does not treat 8-9-0-1-2 as a straight", () => {
    const result = evaluateHand([
      card("情報・通信業", 8),
      card("建設業", 9),
      card("小売業", 0),
      card("銀行業", 1),
      card("情報・通信業", 2),
      card("建設業", 5),
      card("小売業", 7),
    ]);

    expect(result.rank).toBe("high_card");
  });

  it("returns exactly five cards for the winning hand", () => {
    const result = evaluateHand([
      card("情報・通信業", 2),
      card("建設業", 2),
      card("小売業", 2),
      card("銀行業", 8),
      card("情報・通信業", 8),
      card("建設業", 1),
      card("小売業", 9),
    ]);

    expect(result.cards).toHaveLength(5);
    expect(result.rank).toBe("full_house");
  });

  it("selects the strongest hand from multiple candidates", () => {
    const result = evaluateHand([
      card("情報・通信業", 2),
      card("建設業", 2),
      card("小売業", 2),
      card("情報・通信業", 4),
      card("情報・通信業", 6),
      card("情報・通信業", 8),
      card("情報・通信業", 9),
    ]);

    expect(result.rank).toBe("flush");
    expect(result.comparisonValues).toEqual([9, 8, 6, 4, 2]);
  });

  it("rejects hands with invalid card counts", () => {
    expect(() =>
      evaluateHand([
        card("情報・通信業", 0),
        card("建設業", 1),
        card("小売業", 2),
        card("銀行業", 3),
        card("情報・通信業", 4),
        card("建設業", 5),
      ]),
    ).toThrow("Hand evaluation requires exactly 7 cards.");
  });

  it("rejects cards with numbers outside 0-9", () => {
    expect(() =>
      evaluateHand([
        card("情報・通信業", 0),
        card("建設業", 1),
        card("小売業", 2),
        card("銀行業", 3),
        card("情報・通信業", 4),
        card("建設業", 5),
        card("小売業", 10),
      ]),
    ).toThrow("Card number must be an integer between 0 and 9.");
  });
});

describe("compareHands", () => {
  it("selects the player with the stronger hand rank", () => {
    const result = compareHands([
      {
        playerId: "player-1",
        cards: [
          card("情報・通信業", 0),
          card("情報・通信業", 1),
          card("情報・通信業", 2),
          card("情報・通信業", 3),
          card("情報・通信業", 4),
          card("建設業", 8),
          card("小売業", 9),
        ],
      },
      {
        playerId: "player-2",
        cards: [
          card("情報・通信業", 7),
          card("建設業", 7),
          card("小売業", 7),
          card("銀行業", 7),
          card("情報・通信業", 2),
          card("建設業", 4),
          card("小売業", 9),
        ],
      },
    ]);

    expect(result.isDraw).toBe(false);
    expect(result.winners).toHaveLength(1);
    expect(result.winners[0]?.playerId).toBe("player-1");
  });

  it("breaks ties inside the same rank with kickers", () => {
    const result = compareHands([
      {
        playerId: "player-1",
        cards: [
          card("情報・通信業", 7),
          card("建設業", 7),
          card("小売業", 9),
          card("銀行業", 8),
          card("情報・通信業", 6),
          card("建設業", 4),
          card("小売業", 2),
        ],
      },
      {
        playerId: "player-2",
        cards: [
          card("情報・通信業", 7),
          card("建設業", 7),
          card("小売業", 1),
          card("銀行業", 8),
          card("情報・通信業", 6),
          card("建設業", 4),
          card("小売業", 2),
        ],
      },
    ]);

    expect(result.isDraw).toBe(false);
    expect(result.winners[0]?.playerId).toBe("player-1");
    expect(result.winners[0]?.evaluation.rank).toBe("one_pair");
  });

  it("keeps a draw only when comparison values are identical", () => {
    const board = [
      card("情報・通信業", 9),
      card("建設業", 8),
      card("小売業", 7),
      card("銀行業", 6),
      card("情報・通信業", 5),
    ];
    const result = compareHands([
      {
        playerId: "player-1",
        cards: [...board, card("建設業", 1), card("小売業", 0)],
      },
      {
        playerId: "player-2",
        cards: [...board, card("銀行業", 3), card("情報・通信業", 2)],
      },
    ]);

    expect(result.isDraw).toBe(true);
    expect(result.winners).toHaveLength(2);
    expect(result.winners.map((winner) => winner.playerId)).toEqual(["player-1", "player-2"]);
  });

  it("compares straights by their high card", () => {
    const result = compareHands([
      {
        playerId: "player-1",
        cards: [
          card("情報・通信業", 0),
          card("建設業", 1),
          card("小売業", 2),
          card("銀行業", 3),
          card("情報・通信業", 4),
          card("建設業", 7),
          card("小売業", 9),
        ],
      },
      {
        playerId: "player-2",
        cards: [
          card("情報・通信業", 1),
          card("建設業", 2),
          card("小売業", 3),
          card("銀行業", 4),
          card("情報・通信業", 5),
          card("建設業", 6),
          card("小売業", 9),
        ],
      },
    ]);

    expect(result.isDraw).toBe(false);
    expect(result.winners[0]?.playerId).toBe("player-2");
    expect(result.winners[0]?.evaluation.comparisonValues).toEqual([6]);
  });

  it("rejects comparisons with fewer than 2 players", () => {
    expect(() =>
      compareHands([
        {
          playerId: "player-1",
          cards: [
            card("情報・通信業", 0),
            card("建設業", 1),
            card("小売業", 2),
            card("銀行業", 3),
            card("情報・通信業", 4),
            card("建設業", 7),
            card("小売業", 9),
          ],
        },
      ]),
    ).toThrow("Hand comparison requires at least 2 players.");
  });
});
