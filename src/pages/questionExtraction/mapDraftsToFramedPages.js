const ARABIC_KEYS = ["أ", "ب", "ج", "د", "هـ", "و"];

const FIGURE_TYPE_LABELS = {
  question_figure: "شكل السؤال",
  diagram: "رسم",
  chart: "مخطط",
  graph: "منحنى",
  data_table: "جدول بيانات",
  options_table: "جدول الاختيارات",
  table: "جدول",
};

function pickQuestionFigures(draft) {
  const imgs = Array.isArray(draft?.questionImages) ? draft.questionImages : [];
  const figures = imgs
    .filter((img) => img?.image_url || img?.url)
    .map((img, i) => {
      const type = String(img.image_type || "question_figure").toLowerCase();
      return {
        url: img.image_url || img.url,
        label:
          img.short_description ||
          FIGURE_TYPE_LABELS[type] ||
          `شكل ${i + 1}`,
        imageType: type,
      };
    });

  if (figures.length === 0 && draft?.image_url) {
    figures.push({
      url: draft.image_url,
      label: draft.imageDescription || "شكل السؤال",
      imageType: "question_figure",
    });
  }

  return figures;
}

function choiceImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image.trim() || null;
  return image.image_url || image.url || null;
}

/**
 * يحوّل مسودات الاستخراج إلى صفحات إطار PDF بنفس الثيم المختار.
 * يدعم: نص MCQ، أشكال متعددة، جداول data/options، اختيارات مصوّرة، شعر.
 */
export function mapDraftsToFramedPages(drafts, themeId) {
  const list = Array.isArray(drafts) ? drafts : [];
  return list.map((draft, index) => {
    const labels = Array.isArray(draft.optionLabels) ? draft.optionLabels : ARABIC_KEYS;
    const choices = Array.isArray(draft.choices) ? draft.choices : [];
    const choiceImages = Array.isArray(draft.choiceImages) ? draft.choiceImages : [];

    const options = choices
      .map((text, i) => {
        const imageUrl = choiceImageUrl(choiceImages[i]);
        const trimmed = String(text ?? "").trim();
        if (!trimmed && !imageUrl) return null;
        return {
          key: labels[i] || ARABIC_KEYS[i] || String(i + 1),
          text: trimmed,
          imageUrl,
        };
      })
      .filter(Boolean);

    const figures = pickQuestionFigures(draft);
    const hasImageOptions = options.some((o) => o.imageUrl);
    const questionTable =
      draft.questionTable?.content
        ? {
            role: draft.questionTable.role || "data",
            format: draft.questionTable.format || "markdown",
            content: String(draft.questionTable.content),
          }
        : null;

    const verses = Array.isArray(draft.verses)
      ? draft.verses.filter((v) => v?.firstHemistich || v?.secondHemistich)
      : [];

    const displayBlocks = Array.isArray(draft.display_blocks)
      ? draft.display_blocks
      : [];
    const introText =
      draft.intro_text ||
      displayBlocks.find((b) => b.role === "intro")?.text ||
      "";
    const promptText =
      draft.prompt_text ||
      displayBlocks.find((b) => b.role === "prompt")?.text ||
      "";

    return {
      id: draft.id || `framed-${index + 1}`,
      themeId,
      pageNumber: index + 1,
      questionText: String(draft.question_text || "").trim(),
      introText: String(introText || "").trim(),
      promptText: String(promptText || "").trim(),
      displayBlocks,
      poetry: !!draft.poetry || verses.length > 0,
      verses,
      options,
      hasOptions: options.length > 0,
      hasImageOptions,
      figures,
      // توافق خلفي مع معاينة الكارت القديمة
      figureLabel: figures[0]?.label || "",
      figureType: figures.length > 0 ? "image" : "none",
      questionImage: figures[0]?.url || null,
      questionTable,
      draftId: draft.id,
      sourceNumber: draft.source_number ?? null,
    };
  });
}
