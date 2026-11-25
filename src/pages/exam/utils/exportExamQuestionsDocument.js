import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];
const PDF_SCALE = 1.5;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 12;
/** عرض صفحة التصدير بالبكسل (A4 تقريباً عند 96dpi) */
const PAGE_WIDTH_PX = 794;
/** ارتفاع المحتوى القابل للطباعة داخل الصفحة */
const PAGE_CONTENT_HEIGHT_PX = 1040;
/** أقل طول لنعتبر النص المشترك «قطعة» مكررة داخل نص السؤال */
const MIN_EMBEDDED_PASSAGE_LEN = 100;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtmlToText(raw) {
  return String(raw ?? "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatQuestionHtml(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "");
  }
  return escapeHtml(text).replace(/\n/g, "<br/>");
}

function choiceLetter(idx, choice) {
  if (choice?.letter) {
    const map = { A: "أ", B: "ب", C: "ج", D: "د", E: "هـ", F: "و" };
    return map[String(choice.letter).toUpperCase()] || LETTERS[idx] || `${idx + 1}`;
  }
  return LETTERS[idx] || `${idx + 1}`;
}

function passageFingerprint(text) {
  return stripHtmlToText(text)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function commonPrefix(strings) {
  if (!strings.length) return "";
  let prefix = strings[0] || "";
  for (let i = 1; i < strings.length; i += 1) {
    const s = strings[i] || "";
    let j = 0;
    while (j < prefix.length && j < s.length && prefix[j] === s[j]) j += 1;
    prefix = prefix.slice(0, j);
    if (!prefix) break;
  }
  // اقطع عند آخر مسافة حتى لا نفصل كلمة
  const lastSpace = prefix.lastIndexOf(" ");
  if (lastSpace > MIN_EMBEDDED_PASSAGE_LEN) {
    prefix = prefix.slice(0, lastSpace);
  }
  return prefix.trim();
}

function getStructuredPassage(q) {
  if (!q) return { text: "", key: "" };
  if (q.type === "passage_sub") {
    const text =
      q.passage?.content ||
      q.passage?.text ||
      q.passage?.passageText ||
      q.passageText ||
      "";
    const key = String(q.passage?.id || passageFingerprint(text));
    return { text: String(text || "").trim(), key };
  }
  const text =
    q.passageText ||
    q.passage?.content ||
    q.passage?.text ||
    q.passage?.passageText ||
    "";
  const key = String(q.passageId || q.passage_id || q.passage?.id || passageFingerprint(text));
  return { text: String(text || "").trim(), key };
}

function getQuestionPayload(q) {
  if (q?.type === "passage_sub" && q.sub_question) {
    const sq = q.sub_question;
    return {
      text: sq.text || "",
      image: sq.image || null,
      choices: Array.isArray(sq.choices) ? sq.choices : [],
      isEssay: String(sq.type || "").toUpperCase() === "ESSAY",
    };
  }
  return {
    text: q?.text || "",
    image: q?.image || null,
    choices: Array.isArray(q?.choices) ? q.choices : [],
    isEssay: String(q?.type || "").toUpperCase() === "ESSAY",
  };
}

/**
 * تطبيع الأسئلة للتصدير:
 * - القطعة المنظمة تظهر مرة واحدة لكل مجموعة
 * - لو القطعة مكررة داخل نص كل سؤال → تُستخرج مرة وتُحذف من بقية الأسئلة
 */
export function normalizeQuestionsForExport(questions = []) {
  const list = (questions || []).filter(Boolean);
  const rows = [];
  let lastStructuredKey = null;

  // 1) أولاً: جمّع حسب passage المنظم
  const prepared = list.map((q) => {
    const structured = getStructuredPassage(q);
    const payload = getQuestionPayload(q);
    return { q, structured, payload, plain: stripHtmlToText(payload.text) };
  });

  // 2) اكتشف قطع مضمّنة في نص السؤال بين أسئلة متتالية بدون passage منظم
  const embeddedKeys = new Array(prepared.length).fill("");
  const embeddedPassages = new Array(prepared.length).fill("");
  let i = 0;
  while (i < prepared.length) {
    if (prepared[i].structured.text) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < prepared.length && !prepared[j].structured.text) j += 1;
    const group = prepared.slice(i, j);
    if (group.length >= 2) {
      const prefix = commonPrefix(group.map((g) => g.plain));
      if (prefix.length >= MIN_EMBEDDED_PASSAGE_LEN) {
        const key = passageFingerprint(prefix);
        for (let k = i; k < j; k += 1) {
          embeddedPassages[k] = prefix;
          embeddedKeys[k] = key;
        }
      }
    }
    i = j;
  }

  let lastEmbeddedKey = null;
  prepared.forEach((item, idx) => {
    const { structured, payload } = item;

    if (structured.text) {
      if (structured.key !== lastStructuredKey) {
        rows.push({ kind: "passage", text: structured.text });
        lastStructuredKey = structured.key;
      }
      lastEmbeddedKey = null;
      rows.push({
        kind: "question",
        text: payload.text,
        image: payload.image,
        choices: payload.choices,
        isEssay: payload.isEssay,
      });
      return;
    }

    const embedded = embeddedPassages[idx];
    const embeddedKey = embeddedKeys[idx];
    let questionText = payload.text;

    if (embedded && embeddedKey) {
      if (embeddedKey !== lastEmbeddedKey) {
        rows.push({ kind: "passage", text: embedded });
        lastEmbeddedKey = embeddedKey;
      }
      // احذف القطعة من نص السؤال
      const plain = item.plain;
      if (plain.startsWith(embedded)) {
        const restPlain = plain.slice(embedded.length).replace(/^\s+/, "");
        // لو النص الأصلي HTML وبدأ بنفس المحتوى تقريباً، استخدم الباقي كنص عادي
        questionText = restPlain;
      }
    } else {
      lastEmbeddedKey = null;
    }

    rows.push({
      kind: "question",
      text: questionText,
      image: payload.image,
      choices: payload.choices,
      isEssay: payload.isEssay,
    });
  });

  return rows;
}

function buildFileSlug(title) {
  return (
    String(title || "exam")
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40) || "exam"
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function waitForImages(root) {
  const images = root.querySelectorAll("img");
  return Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

function renderPassageHtml(text) {
  return `
    <div class="passage export-block">
      <div class="passage-label">قطعة القراءة</div>
      <div class="passage-body">${formatQuestionHtml(text)}</div>
    </div>`;
}

function renderQuestionHtml(row, qIndex) {
  const choices = (row.choices || [])
    .filter((c) => c && (c.text || c.image))
    .map((c, idx) => {
      const letter = choiceLetter(idx, c);
      const body = c.image
        ? `<img src="${escapeHtml(c.image)}" alt="" class="choice-img" crossorigin="anonymous" />`
        : formatQuestionHtml(c.text);
      return `<div class="choice"><span class="choice-letter">${letter})</span><span class="choice-text">${body}</span></div>`;
    })
    .join("");

  const image = row.image
    ? `<div class="q-image"><img src="${escapeHtml(row.image)}" alt="" crossorigin="anonymous" /></div>`
    : "";

  const essayHint = row.isEssay
    ? `<div class="essay-lines">
        <div class="line"></div><div class="line"></div><div class="line"></div>
      </div>`
    : "";

  return `
    <div class="question export-block">
      <div class="q-head">
        <span class="q-num">${qIndex}.</span>
        <div class="q-text">${formatQuestionHtml(row.text) || (row.image ? "" : "—")}</div>
      </div>
      ${image}
      ${choices ? `<div class="choices">${choices}</div>` : ""}
      ${essayHint}
    </div>`;
}

function renderQuestionsHtml(rows) {
  let qIndex = 0;
  return rows
    .map((row) => {
      if (row.kind === "passage") return renderPassageHtml(row.text);
      qIndex += 1;
      return renderQuestionHtml(row, qIndex);
    })
    .join("");
}

const EXAM_DOC_CSS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  .exam-export-root, .exam-pdf-page {
    margin: 0;
    padding: 16px 20px;
    font-family: "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif;
    color: #111;
    background: #fff;
    direction: rtl;
    line-height: 1.65;
    font-size: 14px;
  }
  .sheet { max-width: 800px; margin: 0 auto; width: 100%; }
  .header {
    border: 1.5px solid #222;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }
  .exam-title {
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 8px;
  }
  .meta {
    text-align: center;
    color: #444;
    font-size: 12px;
    margin-bottom: 12px;
  }
  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 18px;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
  }
  .field-label {
    font-weight: 700;
    white-space: nowrap;
    font-size: 13px;
  }
  .field-value { font-size: 13px; }
  .field-line {
    flex: 1;
    border-bottom: 1.5px solid #333;
    min-height: 22px;
  }
  .export-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .question {
    padding: 10px 0 12px;
    border-bottom: 1px dashed #bbb;
  }
  .q-head { display: flex; gap: 8px; align-items: flex-start; }
  .q-num { font-weight: 800; min-width: 28px; }
  .q-text { flex: 1; font-size: 15px; font-weight: 600; white-space: pre-wrap; }
  .q-image { text-align: center; margin: 8px 0; }
  .q-image img { max-height: 160px; max-width: 100%; object-fit: contain; }
  .choices { margin-top: 8px; display: grid; gap: 6px; padding-right: 28px; }
  .choice { display: flex; gap: 6px; align-items: flex-start; }
  .choice-letter { font-weight: 700; min-width: 22px; }
  .choice-text { flex: 1; }
  .choice-img { max-height: 70px; max-width: 180px; object-fit: contain; }
  .passage {
    background: #f7f7f7;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 10px 0 6px;
  }
  .passage-label { font-size: 12px; font-weight: 800; color: #555; margin-bottom: 4px; }
  .passage-body { font-size: 14px; white-space: pre-wrap; }
  .essay-lines { margin: 10px 28px 0; }
  .essay-lines .line {
    border-bottom: 1px solid #999;
    height: 26px;
    margin-bottom: 4px;
  }
  .pdf-page-shell {
    width: ${PAGE_WIDTH_PX}px;
    min-height: ${PAGE_CONTENT_HEIGHT_PX + 32}px;
    background: #fff;
  }
`;

function buildHeaderHtml({ title, questionCount }) {
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const safeTitle = escapeHtml(title || "امتحان شامل");

  return `
    <div class="header export-block">
      <h1 class="exam-title">${safeTitle}</h1>
      <div class="meta">${questionCount} سؤال · ${escapeHtml(dateStr)}</div>
      <div class="fields" style="grid-template-columns: 1fr;">
        <div class="field">
          <span class="field-label">اسم الطالب:</span>
          <span class="field-line"></span>
        </div>
      </div>
    </div>`;
}

function buildExamBodyHtml({ title, questionCount, rows }) {
  return `
  <div class="exam-export-root" dir="rtl">
    <div class="sheet">
      ${buildHeaderHtml({ title, questionCount })}
      ${renderQuestionsHtml(rows)}
    </div>
  </div>`;
}

export function buildExamDocumentHtml({
  title,
  questionCount,
  rows,
}) {
  const safeTitle = escapeHtml(title || "امتحان شامل");
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>${EXAM_DOC_CSS}</style>
</head>
<body>
${buildExamBodyHtml({ title, questionCount, rows })}
</body>
</html>`;
}

export async function exportExamQuestionsAsWord({
  title,
  questions,
}) {
  const rows = normalizeQuestionsForExport(questions);
  const questionCount = rows.filter((r) => r.kind === "question").length;
  if (!questionCount) throw new Error("لا توجد أسئلة للتصدير");

  const html = buildExamDocumentHtml({
    title,
    questionCount,
    rows,
  });

  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `exam-${buildFileSlug(title)}-${date}.doc`);
}

/**
 * يقسّم البلوكات على صفحات ثابتة الارتفاع بدون قص منتصف السطر.
 */
function packBlocksIntoPages(blocks, firstPageBudget, nextPageBudget) {
  const pages = [];
  let current = [];
  let used = 0;
  let budget = firstPageBudget;

  const flush = () => {
    if (!current.length) return;
    pages.push(current);
    current = [];
    used = 0;
    budget = nextPageBudget;
  };

  blocks.forEach((block) => {
    const h = Math.ceil(block.height);
    if (current.length && used + h > budget) {
      flush();
    }
    // بلوك أطول من الصفحة: يوضع لوحده (أفضل من القص العشوائي)
    if (h > budget && current.length === 0) {
      current.push(block);
      flush();
      return;
    }
    current.push(block);
    used += h;
  });

  flush();
  return pages;
}

/**
 * تصدير PDF بدون تداخل:
 * قياس كل بلوك → تعبئة صفحات → التقاط كل صفحة كاملة.
 */
export async function exportExamQuestionsAsPdf({
  title,
  questions,
}) {
  const rows = normalizeQuestionsForExport(questions);
  const questionCount = rows.filter((r) => r.kind === "question").length;
  if (!questionCount) throw new Error("لا توجد أسئلة للتصدير");

  const measureMount = document.createElement("div");
  measureMount.setAttribute("data-exam-export-measure", "true");
  measureMount.style.cssText = `position:fixed;left:-14000px;top:0;width:${PAGE_WIDTH_PX}px;background:#fff;z-index:-1;pointer-events:none;`;

  let qIndex = 0;
  const blockHtmlParts = [
    `<div class="export-block" data-block="header">${buildHeaderHtml({
      title,
      questionCount,
    })}</div>`,
  ];
  rows.forEach((row) => {
    if (row.kind === "passage") {
      blockHtmlParts.push(
        `<div class="export-block" data-block="passage">${renderPassageHtml(row.text)}</div>`,
      );
      return;
    }
    qIndex += 1;
    blockHtmlParts.push(
      `<div class="export-block" data-block="question">${renderQuestionHtml(row, qIndex)}</div>`,
    );
  });

  measureMount.innerHTML = `<style>${EXAM_DOC_CSS}</style>
    <div class="exam-export-root" dir="rtl" style="padding:0;">
      <div class="sheet" style="max-width:none;">${blockHtmlParts.join("")}</div>
    </div>`;
  document.body.appendChild(measureMount);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await waitForImages(measureMount);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));

    const blockEls = Array.from(measureMount.querySelectorAll(":scope .sheet > .export-block"));
    const measured = blockEls.map((el, index) => ({
      index,
      html: el.innerHTML,
      height: el.getBoundingClientRect().height + 8,
    }));

    const pages = packBlocksIntoPages(
      measured,
      PAGE_CONTENT_HEIGHT_PX,
      PAGE_CONTENT_HEIGHT_PX,
    );

    const pdf = new jsPDF("p", "mm", "a4");
    const contentW = PAGE_W_MM - MARGIN_MM * 2;
    const contentH = PAGE_H_MM - MARGIN_MM * 2;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const pageMount = document.createElement("div");
      pageMount.style.cssText = `position:fixed;left:-14000px;top:0;width:${PAGE_WIDTH_PX}px;background:#fff;z-index:-1;pointer-events:none;`;
      pageMount.innerHTML = `<style>${EXAM_DOC_CSS}</style>
        <div class="exam-pdf-page" dir="rtl" style="min-height:auto;padding:16px 20px;">
          <div class="sheet" style="max-width:none;">
            ${pages[pageIndex].map((b) => `<div class="export-block">${b.html}</div>`).join("")}
          </div>
        </div>`;
      document.body.appendChild(pageMount);

      try {
        await waitForImages(pageMount);
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
        const target = pageMount.querySelector(".exam-pdf-page");
        const canvas = await html2canvas(target, {
          scale: PDF_SCALE,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          width: PAGE_WIDTH_PX,
          windowWidth: PAGE_WIDTH_PX,
        });

        // لا نقصّ منتصف سطر: نضع الصفحة كاملة ونصغّرها إن لزم لتدخل في A4
        let drawW = contentW;
        let drawH = (canvas.height * drawW) / canvas.width;
        if (drawH > contentH) {
          const scale = contentH / drawH;
          drawH = contentH;
          drawW *= scale;
        }
        const offsetX = MARGIN_MM + (contentW - drawW) / 2;

        const imgData = canvas.toDataURL("image/jpeg", 0.93);
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", offsetX, MARGIN_MM, drawW, drawH);
      } finally {
        pageMount.remove();
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    pdf.save(`exam-${buildFileSlug(title)}-${date}.pdf`);
  } finally {
    measureMount.remove();
  }
}
