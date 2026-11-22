import React from 'react';
import { Composition } from 'remotion';
import { DURATION_FRAMES, FPS, HEIGHT, VARIANTS, VARIANT_INFO, WIDTH } from '../shared/timing.js';
import { ChallengeVideo } from './ChallengeVideo';
import './theme';
import type { Variant, VideoProps } from './types';
// القائمة كتتولد تلقائياً (npm run new-challenge / npm run render)
import { CHALLENGES } from './challenges.generated';
import { NEWS } from './news.generated';
import { NewsVideo } from './news/NewsVideo';
import type { NewsProps } from './news/types';
import { NEWS_DURATION_FRAMES } from '../shared/news-timing.js';
import { WEEKLY } from './weekly.generated';
import { WeeklyVideo, type WeeklyProps } from './weekly/WeeklyVideo';

export const RemotionRoot: React.FC = () => (
  <>
    {CHALLENGES.flatMap((c) =>
      (VARIANTS as Variant[]).map((v) => (
        <Composition<any, VideoProps>
          key={`${c.id}-${v}`}
          id={`${c.id}-${v}-${VARIANT_INFO[v].slug}`}
          component={ChallengeVideo}
          durationInFrames={DURATION_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ challenge: c, variant: v, showSafeZones: false }}
        />
      )),
    )}
    {NEWS.map((n) => (
      <Composition<any, NewsProps>
        key={n.id}
        id={n.id}
        component={NewsVideo}
        durationInFrames={NEWS_DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ news: n, showSafeZones: false }}
      />
    ))}
    {WEEKLY.map((w) => (
      <Composition<any, WeeklyProps>
        key={w.id}
        id={w.id}
        component={WeeklyVideo}
        durationInFrames={w.durationSec * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ weekly: w, showSafeZones: false }}
      />
    ))}
  </>
);
