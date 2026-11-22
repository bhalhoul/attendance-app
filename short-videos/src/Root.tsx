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
import { WeeklyPro, type WeeklyProProps } from './weeklypro/WeeklyPro';
import w47Timeline from '../weekly/2026-W47.timeline.json';

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
    <Composition<any, WeeklyProProps>
      id="weekly-pro-2026-w47"
      component={WeeklyPro}
      durationInFrames={Math.round((w47Timeline as any).durationSec * FPS)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ timeline: w47Timeline as any, rangeLabel: '16 – 22 نونبر 2026', brand: 'أخبار الأسبوع', withAudio: true, showSafeZones: false }}
    />
  </>
);
