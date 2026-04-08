import type { AppState } from "../state/app-state";
import type { PlayerActionType, PlayerPositionMap, PlayerState } from "./types";

export function resolvePlayerName(players: PlayerState[], playerId: string | null, selfPlayerId?: string | null): string {
  if (!playerId) {
    return "未設定";
  }

  if (playerId === selfPlayerId) {
    return "あなた";
  }

  return players.find((player) => player.playerId === playerId)?.name || playerId;
}

export function getActionLabel(action: PlayerActionType, toCall?: number): string {
  switch (action) {
    case "fold":
      return "fold";
    case "check":
      return "check";
    case "call":
      return `call (${toCall ?? 0})`;
    case "bet":
      return "bet";
    case "raise":
      return "raise";
    case "all-in":
      return "all-in";
  }
}

export function getCurrentTurnLabel(state: Pick<AppState, "currentTurnPlayerId" | "playerId" | "room">): string {
  if (!state.currentTurnPlayerId) {
    return "進行待ち";
  }

  return resolvePlayerName(state.room?.players ?? [], state.currentTurnPlayerId, state.playerId);
}

export function getRoomDescription(phase: AppState["room"] extends { phase: infer T } ? T : string): string {
  if (phase === "waiting") {
    return "名前を決めて参加者を待ちます。2 人以上そろうとゲームを開始できます。";
  }

  return "自分の手番ではアクションを選び、ベット進行に合わせて pot と場札の変化を確認します。";
}

export function getWaitingRuleItems(): string[] {
  return [
    "手札 2 枚と場札 5 枚で最強の 5 枚役を作ります。",
    "SB / BB を置いてから preflop, flop, turn, river の順に進みます。",
    "同役でもキッカーまで比較し、完全同値だけ引き分けです。",
  ];
}

export function getPositionLines(
  players: PlayerState[],
  positions: PlayerPositionMap,
  selfPlayerId: string | null,
): Array<{ label: string; value: string }> {
  return [
    { label: "Dealer", value: resolvePlayerName(players, positions.dealer, selfPlayerId) },
    { label: "SB", value: resolvePlayerName(players, positions.smallBlind, selfPlayerId) },
    { label: "BB", value: resolvePlayerName(players, positions.bigBlind, selfPlayerId) },
  ];
}
