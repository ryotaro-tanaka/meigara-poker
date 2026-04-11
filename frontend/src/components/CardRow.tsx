import type { ReactNode } from "react";
import type { DeckCard } from "../lib/types";
import { CardItem } from "./CardItem";

interface CardRowProps {
  cards: DeckCard[];
  emptyLabel: string;
  hiddenCount?: number;
  trailingInfoCard?: ReactNode;
  title: string;
}

export function CardRow({ cards, emptyLabel, hiddenCount = 0, trailingInfoCard, title }: CardRowProps) {
  const hasVisibleCards = cards.length > 0 || hiddenCount > 0;

  return (
    <section className="stack">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      {hasVisibleCards ? (
        <div className="card-row">
          {cards.map((card) => (
            <CardItem key={card.edinetCode} card={card} />
          ))}
          {Array.from({ length: hiddenCount }, (_, index) => (
            <article key={`hidden-${title}-${index}`} className="card-item card-item-hidden">
              <p className="card-suit">伏せカード</p>
              <h3>?</h3>
              <p className="card-name">まだ公開されていません</p>
            </article>
          ))}
          {trailingInfoCard ? (
            <article className="card-item card-item-info">
              <div className="card-info-content">{trailingInfoCard}</div>
            </article>
          ) : null}
        </div>
      ) : (
        <p className="empty-state">{emptyLabel}</p>
      )}
    </section>
  );
}
