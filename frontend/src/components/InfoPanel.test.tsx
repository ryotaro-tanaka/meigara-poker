import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfoPanel } from "./InfoPanel";

const players = [
  {
    playerId: "player-1",
    name: "Alice",
    joinedAt: "2026-04-09T00:00:00.000Z",
    connected: true,
    stack: 180,
    currentBet: 20,
    totalContribution: 20,
    isFolded: false,
    isAllIn: false,
    isCurrentTurn: true,
    position: "dealer" as const,
    hasLeft: false,
    isEliminated: false,
  },
  {
    playerId: "player-2",
    name: "Bob",
    joinedAt: "2026-04-09T00:00:01.000Z",
    connected: true,
    stack: 180,
    currentBet: 20,
    totalContribution: 20,
    isFolded: false,
    isAllIn: false,
    isCurrentTurn: false,
    position: "big_blind" as const,
    hasLeft: false,
    isEliminated: false,
  },
];

describe("InfoPanel", () => {
  it("explains deck composition and main pot when there are no side pots", () => {
    render(
      <InfoPanel
        phaseLabel="flop"
        revealedCount={3}
        selectedIndustries={["情報・通信業", "建設業", "小売業", "銀行業"]}
        pot={40}
        mainPot={{ amount: 40, eligiblePlayerIds: ["player-1", "player-2"] }}
        sidePots={[]}
        myStack={180}
        currentBet={20}
        toCall={0}
        positions={{ dealer: "player-1", smallBlind: "player-1", bigBlind: "player-2" }}
        currentTurnPlayerId="player-1"
        players={players}
        selfPlayerId="player-1"
        lastActionMessage="Alice が bet 20 を実行しました。"
      />,
    );

    expect(screen.getByText("pot 総額: 40")).toBeInTheDocument();
    expect(screen.getByText("main pot: 40")).toBeInTheDocument();
    expect(screen.getByText("今回のスート: 情報・通信業 / 建設業 / 小売業 / 銀行業")).toBeInTheDocument();
    expect(screen.getByText("各業種 0〜9 を 1 枚ずつ使う 4 業種 × 10 枚 = 40 枚構成です。")).toBeInTheDocument();
    expect(screen.getByText("all-in が起きていないので、いまは main pot だけを争っています。")).toBeInTheDocument();
  });

  it("shows side pot explanation when side pots exist", () => {
    render(
      <InfoPanel
        phaseLabel="turn"
        revealedCount={4}
        selectedIndustries={["情報・通信業", "建設業", "小売業", "銀行業"]}
        pot={90}
        mainPot={{ amount: 60, eligiblePlayerIds: ["player-1", "player-2"] }}
        sidePots={[{ amount: 30, eligiblePlayerIds: ["player-1"] }]}
        myStack={140}
        currentBet={30}
        toCall={10}
        positions={{ dealer: "player-1", smallBlind: "player-1", bigBlind: "player-2" }}
        currentTurnPlayerId="player-2"
        players={players}
        selfPlayerId="player-1"
        lastActionMessage={null}
      />,
    );

    expect(screen.getByText("all-in が起きたため、追加で争う side pot が分かれています。")).toBeInTheDocument();
    expect(screen.getByText("side pot: 30")).toBeInTheDocument();
  });
});
