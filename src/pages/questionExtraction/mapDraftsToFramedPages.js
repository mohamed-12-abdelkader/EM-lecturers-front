const ARABIC_KEYS = ["أ", "ب", "ج", "د", "هـ", "و"];

function pickQuestionImage(draft) {
  if (draft?.image_url) return draft.image_url;
  const imgs = Array.isArray(draft?.questionImages) ? draft.questionImages : [];
  const first = imgs.find((img) => img?.url || img?.image_url || typeof img === "string");
  if (!first) return null;
  if (typeof first === "string") return first;
  return first.url || first.image_url || null;
}

/**
 * يحوّل مسودات الاستخراج إلى صفحات إطار PDF بنفس الثيم المختار.
 */
export function mapDraftsToFramedPages(drafts, themeId) {
  const list = Array.isArray(drafts) ? drafts : [];
  return list.map((draft, index) => {
    const labels = Array.isArray(draft.optionLabels) ? draft.optionLabels : ARABIC_KEYS;
    const choices = Array.isArray(draft.choices) ? draft.choices : [];
    const options = choices
      .map((text, i) => ({
        key: labels[i] || ARABIC_KEYS[i] || String(i + 1),
        text: String(text ?? "").trim(),
      }))
      .filter((o) => o.text);

    const imageUrl = pickQuestionImage(draft);

    return {
      id: draft.id || `framed-${index + 1}`,
      themeId,
      pageNumber: index + 1,
      questionText: String(draft.question_text || "").trim(),
      options:
        options.length > 0
          ? options
          : ARABIC_KEYS.slice(0, 4).map((key) => ({ key, text: "—" })),
      figureLabel: imageUrl ? "شكل السؤال" : "",
      figureType: imageUrl ? "image" : "none",
      questionImage: imageUrl,
      draftId: draft.id,
    };
  });
}
