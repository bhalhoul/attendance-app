export type NewsItem = {
  category: string;
  emoji: string;
  color: string;
  headline: string;
  details: string[];
  source: string;
};

export type NewsBrief = {
  id: string;
  brand: string;
  dateLabel: string;
  seed: number;
  intro: { title: string; sub: string };
  items: NewsItem[];
  outro: { question: string; share: string };
};

export type NewsProps = { news: NewsBrief; showSafeZones: boolean };
