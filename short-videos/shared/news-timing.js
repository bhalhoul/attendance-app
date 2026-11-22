// توقيت فيديو الأخبار (60 ثانية، 120 BPM → ضربة = 15 فريم)
import { FPS, beat } from './timing.js';

export const NEWS_DURATION_SECONDS = 60;
export const NEWS_DURATION_FRAMES = FPS * NEWS_DURATION_SECONDS; // 1800
export const NEWS_INTRO = { from: 0, to: beat(8) }; //          0 → 4s
export const ITEM_BEATS = 17; //                                  8.5s لكل خبر
export const NEWS_ITEMS_MAX = 6;
export const itemRange = (i) => ({ from: beat(8 + i * ITEM_BEATS), to: beat(8 + (i + 1) * ITEM_BEATS) });
export const newsOutro = (count) => ({ from: itemRange(count - 1).to, to: NEWS_DURATION_FRAMES });
// داخل كل خبر (بالضربات من بداية الخبر)
export const ITEM_CUES = { category: 0, emoji: 0.5, headline: 1, detail1: 5, detail2: 7, source: 8, exit: ITEM_BEATS };
