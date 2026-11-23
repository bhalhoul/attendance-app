# newsroom/ — GLOBAL NEWSROOM AI

خط إنتاج الأخبار. الخطة الكاملة والحالة في [`../NEWSROOM_AUDIT.md`](../NEWSROOM_AUDIT.md).

## ما هو جاهز (المهمة 1)

| الملف | الوظيفة |
|---|---|
| `schemas/raw_item.schema.json` | شكل الخبر الخام كما جاء من المصدر بعد التوحيد |
| `schemas/story.schema.json` | شكل الخبر الموحّد: المصادر، ومستوى التحقق، والأدلة، وسجل الحالات |
| `src/intake/parse_feed.py` | يحوّل RSS/Atom إلى سجلات موحدة. التاريخ يتحول إلى UTC، وإذا لم يوجد تاريخ يبقى فارغًا ويُعلَّم (`no_date`) ولا يُخمَّن |
| `src/intake/normalize.py` | تنظيف الروابط من معاملات التتبع، وتوحيد العناوين (التشكيل العربي، والهمزات، والحروف اللاتينية بعلامات) |
| `src/intake/dedupe.py` | حذف المكرر (نفس الرابط أو نفس الخبر من نفس المصدر)، وربط العناوين المتطابقة من مصادر مختلفة بدون اعتبارها تأكيدًا مستقلًا |
| `src/intake/run_intake.py` | تشغيل كامل: جلب، ثم تحليل، ثم إزالة تكرار، ثم كتابة `data/raw/` وسجل `data/logs/`. المصدر الفاشل يُسجَّل ويُتخطى |
| `config/desks.yaml` + `src/intake/from_search.py` | خطة البحث لكل مكتب، وتحويل نتائج Parallel Search إلى نفس شكل الخبر |
| `tests/` | 27 اختبارًا على ملفات RSS تجريبية وعلى رد بحث تجريبي (مكتوبة يدويًا، ونطاقاتها `.test`، وليست أخبارًا حقيقية) |

## جمع الأخبار عبر Parallel Search (قرار المدير 2026-11-23)

المصدر المعتمد لجمع الأخبار هو أداة **Parallel Search** المربوطة بحساب المدير، وليس RSS. ملف `config/desks.yaml` فيه لكل مكتب هدف بحث و1 إلى 3 عبارات بحث قصيرة.

**الخطوات:**
1. Claude ينفّذ `web_search` لكل مكتب بنفس الهدف والعبارات، ويحفظ الرد في `data/inbox/<desk>.json`.
2. يحوّل الرد إلى سجلات موحدة:
   ```bash
   PYTHONPATH=src .venv/bin/python -m intake.from_search --desk morocco --input ../data/inbox/morocco.json --data ../data
   ```
3. الناتج يُحفظ في `data/raw/YYYY-MM-DD/search-<desk>-*.json`، والسجل في `data/logs/`.

**القواعد (`src/intake/from_search.py`):**
- الصفحات الرئيسية وصفحات الأقسام والنتائج والوسوم لا تُعتبر أخبارًا، فتُتخطى وتُسجَّل.
- تاريخ الأداة يوم بدون ساعة، فيُحفظ كما هو ويُعلَّم `date_only`، ولا تُخترع ساعة.
- المصدر هو نطاق الموقع. الحكم على الاستقلالية (مثلًا العربية والحدث من نفس المجموعة) يتم في مرحلة التحقق.

## التشغيل

```bash
cd newsroom
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/pytest -q                                   # الاختبارات (بدون إنترنت)
PYTHONPATH=src .venv/bin/python -m intake.run_intake \
    --sources tests/fixtures/sources.fixtures.yaml --data ../data   # تشغيل تجريبي على العينات
```

## مستويات علامات الخبر الخام (`flags`)
- `no_date`: المصدر لم يذكر تاريخًا.
- `future_date`: التاريخ بعد وقت الجلب بأكثر من ساعة.
- `stale`: أقدم من `max_age_hours` للمصدر (افتراضيًا 48 ساعة)، وقد يكون خبرًا قديمًا أعيد نشره.
- `no_summary`: لا يوجد ملخص.

## لم يُنفَّذ بعد
التجميع (توحيد المقالات التي تتحدث عن نفس الحدث)، و والتحقق والتحرير والفيديو (الخطوات 4 إلى 11).
