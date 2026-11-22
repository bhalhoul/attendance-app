import React from 'react';
import { Composition } from 'remotion';
import { DURATION_FRAMES, FPS, HEIGHT, VARIANTS, VARIANT_INFO, WIDTH } from '../shared/timing.js';
import { ChallengeVideo } from './ChallengeVideo';
import './theme';
import type { Variant, VideoProps } from './types';
// القائمة كتتولد تلقائياً (npm run new-challenge / npm run render)
import { CHALLENGES } from './challenges.generated';

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
  </>
);
