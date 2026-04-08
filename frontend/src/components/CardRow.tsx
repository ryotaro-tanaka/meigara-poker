import type { DeckCard } from "../lib/types";
import { CardItem } from "./CardItem";

interface CardRowProps {
  cards: DeckCard[];
  emptyLabel: string;
  title: string;
}

export function CardRow({ cards, emptyLabel, title }: CardRowProps) {
  return (
    <section className="stack">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      {cards.length > 0 ? (
        <div className="card-row">
          {cards.map((card) => (
            <CardItem key={card.edinetCode} card={card} />
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyLabel}</p>
      )}
    </section>
  );
}
