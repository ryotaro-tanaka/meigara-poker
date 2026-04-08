import type { DeckCard } from "../lib/types";

interface CardItemProps {
  card: DeckCard;
}

export function CardItem({ card }: CardItemProps) {
  return (
    <article className="card-item">
      <p className="card-suit">{card.suit}</p>
      <h3>{card.number}</h3>
      <p className="card-name">{card.name}</p>
    </article>
  );
}
