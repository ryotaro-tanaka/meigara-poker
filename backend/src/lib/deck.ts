export interface DeckCard {
  edinetCode: string;
  name: string;
  suit: string;
  number: number;
}

export interface DeckBuildResult {
  deck: DeckCard[];
  selectedIndustries: string[];
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export async function buildDeck(db: D1Database): Promise<DeckBuildResult> {
  const industriesResult = await db
    .prepare("SELECT DISTINCT industry FROM stocks ORDER BY RANDOM() LIMIT 4")
    .all<{ industry: string }>();

  const selectedIndustries = (industriesResult.results ?? []).map((row) => row.industry);

  if (selectedIndustries.length !== 4) {
    throw new Error("Failed to select 4 industries.");
  }

  const deck: DeckCard[] = [];

  for (const industry of selectedIndustries) {
    for (let number = 0; number <= 9; number += 1) {
      const card = await db
        .prepare(
          `
            SELECT
              edinet_code AS edinetCode,
              name,
              industry AS suit,
              corporate_number_last_digit AS number
            FROM stocks
            WHERE industry = ?1 AND corporate_number_last_digit = ?2
            ORDER BY RANDOM()
            LIMIT 1
          `,
        )
        .bind(industry, number)
        .first<DeckCard>();

      if (!card) {
        throw new Error(`Failed to build deck for industry=${industry}, number=${number}.`);
      }

      deck.push(card);
    }
  }

  return {
    deck: shuffle(deck),
    selectedIndustries,
  };
}
