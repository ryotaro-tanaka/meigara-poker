import type { ConnectionStatus } from "../lib/types";

interface StatusBadgeProps {
  status: ConnectionStatus;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  idle: "待機中",
  loading: "読み込み中",
  connecting: "接続中",
  connected: "接続済み",
  disconnected: "切断",
  error: "エラー",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}
