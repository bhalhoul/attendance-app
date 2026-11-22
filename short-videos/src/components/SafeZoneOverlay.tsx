import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PLATFORM_UI, SAFE_AREA } from '../../shared/safe-zones.js';

// طبقة مساعدة (للمراجعة فقط): الأحمر = واجهة TikTok، الأزرق = Instagram، الأخضر = المنطقة الآمنة
export const SafeZoneOverlay: React.FC = () => {
  const zone = (ui: typeof PLATFORM_UI.tiktok, color: string) => (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ui.top, background: color }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: ui.bottom, background: color }} />
      <div style={{ position: 'absolute', right: 0, width: ui.right.width, top: ui.right.from, height: ui.right.to - ui.right.from, background: color }} />
    </>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {zone(PLATFORM_UI.tiktok, 'rgba(255,0,60,0.28)')}
      {zone(PLATFORM_UI.instagram, 'rgba(0,120,255,0.22)')}
      <div style={{ position: 'absolute', left: SAFE_AREA.left, top: SAFE_AREA.top, width: SAFE_AREA.width,
        height: SAFE_AREA.height, border: '4px dashed #3dff7a' }} />
    </AbsoluteFill>
  );
};
