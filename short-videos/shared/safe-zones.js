// مناطق واجهة TikTok و Instagram Reels على كادر 1080×1920 (تقديرات محافظة).
// كل النصوص والشبكة كتبقى داخل SAFE_AREA اللي هي تقاطع المنطقتين الآمنتين.

export const PLATFORM_UI = {
  tiktok: {
    top: 170, // تبويبات Following / For You
    bottom: 420, // اسم الحساب + الوصف + الصوت
    right: { width: 150, from: 760, to: 1560 }, // عمود الأزرار (لايك، كومنتير، شارك…)
  },
  instagram: {
    top: 220, // عنوان Reels + الكاميرا
    bottom: 450, // الوصف + الصوت + شريط التطبيق
    right: { width: 160, from: 820, to: 1600 },
  },
};

const left = 90;
const right = 1080 - 170; // 910
const top = 250;
const bottom = 1920 - 460; // 1460
export const SAFE_AREA = {
  left, right, top, bottom,
  width: right - left, // 820
  height: bottom - top, // 1210
  centerX: (left + right) / 2, // 500
};

// تخطيط الكادر داخل المنطقة الآمنة
export const LAYOUT = {
  topBlock: { top: 265, height: 300 }, // سلسلة + النص الرئيسي
  grid: { size: 720, top: 590 }, // 590 → 1310
  bottomBlock: { top: 1330, height: 125 }, // العداد / الحبة السفلية → 1455
};
