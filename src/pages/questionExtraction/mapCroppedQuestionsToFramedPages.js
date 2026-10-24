/**
 * يحوّل ناتج POST /api/ocr/crop-questions إلى صفحات إطار PDF.
 * كل سؤال = صورة واحدة كاملة داخل الإطار.
 */
export function mapCroppedQuestionsToFramedPages(questions, themeId) {
  const list = Array.isArray(questions) ? questions : [];
  return list
    .map((q, index) => {
      const imageUrl = q?.image_url || q?.imageUrl || null;
      if (!imageUrl) return null;
      const sourceNumber =
        q.source_number != null
          ? String(q.source_number)
          : q.number != null
            ? String(q.number)
            : String(index + 1);

      return {
        id: `crop-${sourceNumber}-${index}`,
        themeId,
        pageNumber: index + 1,
        layout: "crop",
        questionText: "",
        options: [],
        hasOptions: false,
        hasImageOptions: false,
        figures: [],
        figureType: "none",
        figureLabel: "",
        questionImage: null,
        cropImageUrl: String(imageUrl),
        sourceNumber,
        pageIndex: q.page_index ?? null,
        bbox: Array.isArray(q.bbox) ? q.bbox : null,
        draftId: null,
      };
    })
    .filter(Boolean);
}
