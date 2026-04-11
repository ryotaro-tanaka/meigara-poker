import type { DeckCard } from "../lib/types";

interface CardItemProps {
  card: DeckCard;
}

export function CardItem({ card }: CardItemProps) {
  const suitClass = getSuitClass(card.suit);

  return (
    <article className={`card-item ${suitClass}`}>
      <p className="card-suit card-suit-colored">{card.suit}</p>
      <h3>{card.number}</h3>
      <p className="card-name">{card.name}</p>
    </article>
  );
}

function getSuitClass(suit: string): string {
  if (suit.includes("情報")) {
    return "card-suit-it";
  }
  if (suit.includes("建設")) {
    return "card-suit-construction";
  }
  if (suit.includes("小売")) {
    return "card-suit-retail";
  }
  if (suit.includes("銀行")) {
    return "card-suit-bank";
  }
  return "card-suit-default";
}
