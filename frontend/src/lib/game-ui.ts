import type { AppState } from "../state/app-state";
import type {
  ConnectionStatus,
  FinalStanding,
  GameOverReason,
  MainPot,
  PlayerActionType,
  PlayerPositionMap,
  PublicPlayerPosition,
  PublicPlayerState,
  SidePot,
} from "./types";

export function resolvePlayerName(players: PublicPlayerState[], playerId: string | null, selfPlayerId?: string | null): string {
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

export function getPositionBadgeLabel(position: PublicPlayerPosition): string | null {
  switch (position) {
    case "dealer":
      return "Dealer";
    case "small_blind":
      return "SB";
    case "big_blind":
      return "BB";
    default:
      return null;
  }
}

export function getPlayerStatusSummary(player: PublicPlayerState): string {
  const tags = [
    player.isCurrentTurn ? "手番" : null,
    player.isFolded ? "fold" : null,
    player.isAllIn ? "all-in" : null,
    player.isEliminated ? "busted" : null,
    player.hasLeft ? "退出" : null,
    !player.connected ? "切断" : null,
  ].filter((value): value is string => Boolean(value));

  return tags.join(" / ");
}

export function getCurrentTurnLabel(state: Pick<AppState, "currentTurnPlayerId" | "playerId" | "room">): string {
  if (!state.currentTurnPlayerId) {
    return "進行待ち";
  }

  return resolvePlayerName(state.room?.players ?? [], state.currentTurnPlayerId, state.playerId);
}

export function getRoomDescription(phase: AppState["room"] extends { phase: infer T } ? T : string): string {
  if (phase === "waiting") {
    return "共有 URL を送って参加者を集め、2 人以上そろったら開始します。";
  }

  if (phase === "between_hands") {
    return "前のハンド結果を確認中です。stack を引き継いで次のハンドを開始できます。";
  }

  return "自分の手番ではアクションを選び、pot と場札、相手のベット状況を見ながら進行を確認します。";
}

export function getGameOverReasonLabel(reason: GameOverReason | null): string {
  switch (reason) {
    case "player_busted":
      return "stack が 0 になったプレイヤーが出たため、このゲームを終了しました。";
    case "insufficient_players":
      return "継続できるプレイヤーが 2 人未満になったため、このゲームを終了しました。";
    default:
      return "このゲームは終了しました。順位を確認して待機画面に戻れます。";
  }
}

export function getStandingStatusLabel(status: FinalStanding["status"]): string {
  switch (status) {
    case "active":
      return "継続";
    case "busted":
      return "busted";
    case "left":
      return "退出";
    case "disconnected":
      return "切断";
  }
}

export function getWaitingRuleItems(): string[] {
  return [
    "手札 2 枚と場札 5 枚で最強の 5 枚役を作ります。",
    "流れ: 手札確認 -> 賭け -> 場札 3 枚 -> 賭け -> 4 枚目 -> 賭け -> 5 枚目 -> 賭け -> 勝負",
    "賭けは全員の参加額がそろうと次に進みます。",
  ];
}

export function getWaitingHandRankItems(): string[] {
  return [
    "ストレートフラッシュ: 同じ業種で連番 5 枚",
    "フォーカード: 同じ数字 4 枚",
    "フルハウス: スリーカード + ワンペア",
    "フラッシュ: 同じ業種 5 枚",
    "ストレート: 連番 5 枚",
    "スリーカード: 同じ数字 3 枚",
    "ツーペア: ペア 2 組",
    "ワンペア: 同じ数字 2 枚",
    "ハイカード: どの役もない",
  ];
}

export function getPositionLines(
  players: PublicPlayerState[],
  positions: PlayerPositionMap,
  selfPlayerId: string | null,
): Array<{ label: string; value: string }> {
  return [
    { label: "Dealer", value: resolvePlayerName(players, positions.dealer, selfPlayerId) },
    { label: "SB", value: resolvePlayerName(players, positions.smallBlind, selfPlayerId) },
    { label: "BB", value: resolvePlayerName(players, positions.bigBlind, selfPlayerId) },
  ];
}

export function getConnectionHelpText(status: ConnectionStatus): string {
  switch (status) {
    case "loading":
      return "部屋情報を読み込んでいます。";
    case "connecting":
      return "WebSocket を接続中です。数秒待つと同期が始まります。";
    case "connected":
      return "接続済みです。操作するとそのまま部屋全体へ反映されます。";
    case "disconnected":
      return "接続が切れています。再読み込みで復帰できるか確認してください。";
    case "error":
      return "通信または操作で失敗が起きています。手番や入力値も確認してください。";
    default:
      return "部屋に入ると接続状態がここに表示されます。";
  }
}

export function getServerErrorHelp(message: string | null): string | null {
  if (!message) {
    return null;
  }

  if (message.includes("turn")) {
    return "いまは自分の手番ではない可能性があります。現在の手番表示を確認してください。";
  }

  if (message.includes("Cannot bet")) {
    return "このラウンドはすでにベットが始まっているので、bet ではなく raise を使います。";
  }

  if (message.includes("Cannot check")) {
    return "この場面では無料で回せません。続けるなら call か raise が必要です。";
  }

  if (message.includes("Raise")) {
    return "raise は追加額ではなく、そのラウンド終了時の最終ベット額を入力します。";
  }

  return "入力値や現在の手番、使えるアクションの案内を確認してください。";
}

export function getDeckInfoLines(selectedIndustries: string[]): string[] {
  if (selectedIndustries.length === 0) {
    return ["ゲーム開始後に、今回使う 4 業種がここに表示されます。"];
  }

  return [
    `今回のスート: ${selectedIndustries.join(" / ")}`,
    "各業種 0〜9 を 1 枚ずつ使う 4 業種 × 10 枚 = 40 枚構成です。",
  ];
}

export function getPotHelpText(mainPot: MainPot | null, sidePots: SidePot[]): string {
  if (!mainPot) {
    return "ベットが入ると main pot がここに表示されます。";
  }

  if (sidePots.length === 0) {
    return "all-in が起きていないので、いまは main pot だけを争っています。";
  }

  return "all-in が起きたため、追加で争う side pot が分かれています。";
}

export function getActionSummary(availableActions: PlayerActionType[], isMyTurn: boolean): string {
  if (!isMyTurn) {
    return "今は自分の手番ではありません。";
  }

  if (availableActions.length === 0) {
    return "この状況では選べる操作がありません。";
  }

  return `今選べる操作: ${availableActions.join(" / ")}`;
}

export function getActionGuidance(
  availableActions: PlayerActionType[],
  isMyTurn: boolean,
  currentBet: number,
  toCall: number,
): string[] {
  if (!isMyTurn) {
    return ["現在の手番プレイヤーが操作を終えると、自分の選べる操作が有効になります。"];
  }

  const lines: string[] = ["数字入力が必要なのは bet / raise だけです。"];

  if (currentBet === 0) {
    lines.push("このラウンドはまだ誰も賭けていないので、最初の攻撃的アクションは bet です。");
    if (!availableActions.includes("raise")) {
      lines.push("まだベットがないので raise は使えません。");
    }
  } else {
    lines.push("すでにベットがあるので、新しく bet する代わりに raise を使います。");
  }

  if (toCall > 0 && !availableActions.includes("check")) {
    lines.push("いま check はできず、続けるなら call か raise、降りるなら fold です。");
  }

  if (availableActions.includes("all-in")) {
    lines.push("all-in は残り stack をすべて賭けます。");
  }

  return lines;
}
