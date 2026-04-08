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

  it("detects three of a kind", () => {
    const result = evaluateHand([
      card("情報・通信業", 6),
      card("建設業", 6),
      card("小売業", 6),
      card("銀行業", 1),
      card("情報・通信業", 4),
      card("建設業", 8),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("three_of_a_kind");
  });

  it("detects two pair", () => {
    const result = evaluateHand([
      card("情報・通信業", 2),
      card("建設業", 2),
      card("小売業", 8),
      card("銀行業", 8),
      card("情報・通信業", 4),
      card("建設業", 6),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("two_pair");
  });

  it("detects one pair", () => {
    const result = evaluateHand([
      card("情報・通信業", 2),
      card("建設業", 2),
      card("小売業", 4),
      card("銀行業", 6),
      card("情報・通信業", 7),
      card("建設業", 8),
      card("小売業", 9),
    ]);

    expect(result.rank).toBe("one_pair");
  });

  it("detects high card", () => {
    const result = evaluateHand([
      card("情報・通信業", 0),
      card("建設業", 2),
      card("小売業", 4),
      card("銀行業", 6),
      card("情報・通信業", 8),
      card("建設業", 9),
      card("小売業", 1),
    ]);

    expect(result.rank).toBe("high_card");
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

  it("rejects hands with fewer than 7 cards", () => {
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

  it("rejects hands with more than 7 cards", () => {
    expect(() =>
      evaluateHand([
        card("情報・通信業", 0),
        card("建設業", 1),
        card("小売業", 2),
        card("銀行業", 3),
        card("情報・通信業", 4),
        card("建設業", 5),
        card("小売業", 6),
        card("銀行業", 7),
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
    expect(result.winners[0]?.evaluation.rank).toBe("straight_flush");
  });

  it("treats players with the same rank as a draw", () => {
    const result = compareHands([
      {
        playerId: "player-1",
        cards: [
          card("情報・通信業", 2),
          card("建設業", 2),
          card("小売業", 4),
          card("銀行業", 6),
          card("情報・通信業", 7),
          card("建設業", 8),
          card("小売業", 9),
        ],
      },
      {
        playerId: "player-2",
        cards: [
          card("銀行業", 3),
          card("建設業", 3),
          card("小売業", 0),
          card("情報・通信業", 5),
          card("銀行業", 7),
          card("建設業", 8),
          card("小売業", 9),
        ],
      },
    ]);

    expect(result.isDraw).toBe(true);
    expect(result.winners).toHaveLength(2);
    expect(result.winners.map((winner) => winner.playerId)).toEqual(["player-1", "player-2"]);
    expect(result.winners.map((winner) => winner.evaluation.rank)).toEqual(["one_pair", "one_pair"]);
  });

  it("returns every top-ranked player in a multi-way draw", () => {
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
          card("建設業", 8),
          card("小売業", 9),
        ],
      },
      {
        playerId: "player-3",
        cards: [
          card("情報・通信業", 2),
          card("建設業", 2),
          card("小売業", 4),
          card("銀行業", 6),
          card("情報・通信業", 7),
          card("建設業", 8),
          card("小売業", 9),
        ],
      },
    ]);

    expect(result.isDraw).toBe(true);
    expect(result.winners.map((winner) => winner.playerId)).toEqual(["player-1", "player-2"]);
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
