export type Variant = 'A' | 'B' | 'C';

export type Challenge = {
  id: string;
  series: string;
  seed: number;
  difficulty: string;
  grid: { rows: number; cols: number };
  baseColor: string;
  oddColor: string;
  deltaE: number;
  answer: number; // رقم المربع الصحيح (1 → rows*cols)
  texts: {
    title: string;
    hookA: string[];
    hookB: string;
    hookCYou: string;
    hookCPartner: string;
    hookCQuestion: string;
    instruction: string;
    countdownLabel: string;
    commentPrompt: string;
    commentSub: string;
    revealLabel: string;
    revealSub: string;
    shareLine1: string;
    shareLine2: string;
  };
};

export type VideoProps = {
  challenge: Challenge;
  variant: Variant;
  showSafeZones: boolean;
};
