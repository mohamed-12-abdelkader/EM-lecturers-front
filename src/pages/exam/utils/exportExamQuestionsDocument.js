import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];
const PDF_SCALE = 1.45;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 10;
const PAGE_WIDTH_PX = 794;
/** ارتفاع المحتوى داخل الصفحة — أعلى قليلاً لتقليل الصفحات */
const PAGE_CONTENT_HEIGHT_PX = 1080;
/** أقل طول لنص ليُعتبر قطعة قراءة مكررة */
const MIN_PASSAGE_LEN = 180;
const PASSAGE_HEAD_LEN = 160;

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

/** تطبيع للمقارنة بين نسخ القطعة (اختلافات بسيطة في الهمزات/التشكيل) */
function normalizeForMatch(text) {
  return stripHtmlToText(text)
    .replace(/[\u064B-\u065F\u0670]/g, "") // تشكيل
    .replace(/\u0640/g, "") // تطويل
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9()\s.]/g, " ")
    .replace(/\s+/g, " ")
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

function passageHeadKey(plain) {
  const n = normalizeForMatch(plain);
  if (n.length < MIN_PASSAGE_LEN) return null;
  return n.slice(0, PASSAGE_HEAD_LEN);
}

function sharedPrefixLen(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  while (i > 0 && a[i] && a[i] !== " ") i -= 1;
  return i;
}

/**
 * يستخرج أطول بادئة مشتركة من نصوص المجموعة (بعد التطبيع)،
 * ثم يقطع النص الأصلي للسؤال الأول بنفس النسبة تقريباً.
 */
function extractSharedPassagePlain(plains) {
  if (plains.length < 2) return null;
  const norms = plains.map(normalizeForMatch);
  let minLen = norms[0].length;
  for (let i = 1; i < norms.length; i += 1) {
    minLen = Math.min(minLen, sharedPrefixLen(norms[0], norms[i]));
  }
  if (minLen < MIN_PASSAGE_LEN) return null;

  // ارجع للنص الأصلي: خذ من plain[0] حتى نغطي نفس البادئة المطبّعة
  const target = norms[0].slice(0, minLen);
  const original = plains[0];
  let built = "";
  let cut = 0;
  for (let i = 0; i < original.length && built.length < target.length; i += 1) {
    const ch = original[i];
    const nextBuilt = normalizeForMatch(original.slice(0, i + 1));
    if (nextBuilt.length > built.length) {
      built = nextBuilt;
      cut = i + 1;
    }
    if (built.startsWith(target) || built.length >= target.length) {
      cut = i + 1;
      break;
    }
  }
  // اقطع عند آخر فاصل فقرات إن أمكن
  const slice = original.slice(0, cut);
  const paraBreak = slice.lastIndexOf("\n\n");
  if (paraBreak > MIN_PASSAGE_LEN * 0.6) {
    return slice.slice(0, paraBreak).trim();
  }
  return slice.trim();
}

function removePassagePrefix(plain, passagePlain) {
  if (!passagePlain) return plain;
  const nPlain = normalizeForMatch(plain);
  const nPass = normalizeForMatch(passagePlain);
  if (!nPlain.startsWith(nPass)) {
    // محاولة بادئة أقصر
    const len = sharedPrefixLen(nPlain, nPass);
    if (len < MIN_PASSAGE_LEN) return plain;
  }
  // احذف من الأصلي بمطابقة التطبيع
  let built = "";
  let cut = 0;
  const targetLen = normalizeForMatch(passagePlain).length;
  for (let i = 0; i < plain.length; i += 1) {
    built = normalizeForMatch(plain.slice(0, i + 1));
    cut = i + 1;
    if (built.length >= targetLen) break;
  }
  return plain.slice(cut).replace(/^\s+/, "");
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
    const key = String(q.passage?.id || passageHeadKey(text) || "");
    return { text: String(text || "").trim(), key };
  }
  const text =
    q.passageText ||
    q.passage?.content ||
    q.passage?.text ||
    q.passage?.passageText ||
    "";
  const key = String(q.passageId || q.passage_id || q.passage?.id || passageHeadKey(text) || "");
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
    text: q?.text || q?.questionText || "",
    image: q?.image || q?.questionImage || null,
    choices: Array.isArray(q?.choices)
      ? q.choices
      : [
          q?.optionA && { letter: "A", text: q.optionA },
          q?.optionB && { letter: "B", text: q.optionB },
          q?.optionC && { letter: "C", text: q.optionC },
          q?.optionD && { letter: "D", text: q.optionD },
        ].filter(Boolean),
    isEssay: String(q?.type || "").toUpperCase() === "ESSAY",
  };
}

/**
 * تطبيع الأسئلة للتصدير مع دمج القطعة المكررة داخل questionText.
 * مثال: أسئلة 18–24 بنفس نص النانو → القطعة مرة + أسئلة قصيرة بعدها.
 */
export function normalizeQuestionsForExport(questions = []) {
  const list = (questions || []).filter(Boolean);
  const prepared = list.map((q) => {
    const structured = getStructuredPassage(q);
    const payload = getQuestionPayload(q);
    const plain = stripHtmlToText(payload.text);
    return {
      structured,
      payload,
      plain,
      headKey: structured.text ? null : passageHeadKey(plain),
    };
  });

  const rows = [];
  let lastStructuredKey = null;
  let i = 0;

  while (i < prepared.length) {
    const item = prepared[i];

    // قطعة منظمة من الـ API
    if (item.structured.text) {
      if (item.structured.key !== lastStructuredKey) {
        rows.push({ kind: "passage", text: item.structured.text });
        lastStructuredKey = item.structured.key;
      }
      rows.push({
        kind: "question",
        text: item.payload.text,
        image: item.payload.image,
        choices: item.payload.choices,
        isEssay: item.payload.isEssay,
      });
      i += 1;
      continue;
    }

    lastStructuredKey = null;
    const key = item.headKey;

    // سؤال قصير عادي
    if (!key) {
      rows.push({
        kind: "question",
        text: item.payload.text,
        image: item.payload.image,
        choices: item.payload.choices,
        isEssay: item.payload.isEssay,
      });
      i += 1;
      continue;
    }

    // مجموعة أسئلة متتالية بنفس رأس القطعة
    let j = i + 1;
    while (
      j < prepared.length &&
      !prepared[j].structured.text &&
      prepared[j].headKey === key
    ) {
      j += 1;
    }

    const group = prepared.slice(i, j);
    if (group.length === 1) {
      rows.push({
        kind: "question",
        text: group[0].payload.text,
        image: group[0].payload.image,
        choices: group[0].payload.choices,
        isEssay: group[0].payload.isEssay,
      });
      i = j;
      continue;
    }

    const passagePlain =
      extractSharedPassagePlain(group.map((g) => g.plain)) ||
      group[0].plain.slice(0, Math.min(group[0].plain.length, 2500));

    rows.push({ kind: "passage", text: passagePlain });

    group.forEach((g) => {
      const rest = removePassagePrefix(g.plain, passagePlain);
      rows.push({
        kind: "question",
        text: rest || g.payload.text,
        image: g.payload.image,
        choices: g.payload.choices,
        isEssay: g.payload.isEssay,
      });
    });

    i = j;
  }

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
    <div class="passage">
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
    ? `<div class="essay-lines"><div class="line"></div><div class="line"></div><div class="line"></div></div>`
    : "";

  return `
    <div class="question">
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
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  .exam-export-root, .exam-pdf-page {
    margin: 0;
    padding: 10px 14px;
    font-family: "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif;
    color: #111;
    background: #fff;
    direction: rtl;
    line-height: 1.45;
    font-size: 13px;
  }
  .sheet { max-width: 800px; margin: 0 auto; width: 100%; }
  .header {
    border: 1.5px solid #222;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .exam-title {
    text-align: center;
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 4px;
  }
  .meta {
    text-align: center;
    color: #444;
    font-size: 11px;
    margin-bottom: 8px;
  }
  .fields { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .field { display: flex; align-items: center; gap: 8px; min-height: 22px; }
  .field-label { font-weight: 700; white-space: nowrap; font-size: 12px; }
  .field-line { flex: 1; border-bottom: 1.5px solid #333; min-height: 18px; }
  .export-block { break-inside: avoid; page-break-inside: avoid; }
  .question {
    padding: 6px 0 7px;
    border-bottom: 1px dashed #ccc;
  }
  .q-head { display: flex; gap: 6px; align-items: flex-start; }
  .q-num { font-weight: 800; min-width: 22px; font-size: 13px; }
  .q-text { flex: 1; font-size: 13px; font-weight: 600; white-space: pre-wrap; }
  .q-image { text-align: center; margin: 4px 0; }
  .q-image img { max-height: 120px; max-width: 100%; object-fit: contain; }
  .choices {
    margin-top: 4px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px 10px;
    padding-right: 22px;
  }
  .choice { display: flex; gap: 4px; align-items: flex-start; }
  .choice-letter { font-weight: 700; min-width: 18px; font-size: 12px; }
  .choice-text { flex: 1; font-size: 12px; }
  .choice-img { max-height: 56px; max-width: 140px; object-fit: contain; }
  .passage {
    background: #f6f6f6;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8px 10px;
    margin: 6px 0 4px;
  }
  .passage-label { font-size: 11px; font-weight: 800; color: #555; margin-bottom: 3px; }
  .passage-body { font-size: 12px; white-space: pre-wrap; line-height: 1.5; }
  .essay-lines { margin: 6px 22px 0; }
  .essay-lines .line { border-bottom: 1px solid #999; height: 20px; margin-bottom: 3px; }
`;

function buildHeaderHtml({ title, questionCount }) {
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const safeTitle = escapeHtml(title || "امتحان شامل");

  return `
    <div class="header">
      <h1 class="exam-title">${safeTitle}</h1>
      <div class="meta">${questionCount} سؤال · ${escapeHtml(dateStr)}</div>
      <div class="fields">
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

export function buildExamDocumentHtml({ title, questionCount, rows }) {
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

export async function exportExamQuestionsAsWord({ title, questions }) {
  const rows = normalizeQuestionsForExport(questions);
  const questionCount = rows.filter((r) => r.kind === "question").length;
  if (!questionCount) throw new Error("لا توجد أسئلة للتصدير");

  const html = buildExamDocumentHtml({ title, questionCount, rows });
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `exam-${buildFileSlug(title)}-${date}.doc`);
}

/**
 * يقسّم البلوكات على صفحات ويملأ كل صفحة بأكبر قدر ممكن.
 * القطع الطويلة تُقسَّم لفقرات حتى لا تترك صفحة شبه فارغة بعدها.
 */
function packBlocksIntoPages(blocks, pageBudget) {
  const pages = [];
  let current = [];
  let used = 0;

  const flush = () => {
    if (!current.length) return;
    pages.push(current);
    current = [];
    used = 0;
  };

  blocks.forEach((block) => {
    const h = Math.ceil(block.height);
    if (current.length && used + h > pageBudget) flush();
    if (h > pageBudget && current.length === 0) {
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

/** قسّم قطعة طويلة إلى فقرات قابلة للتعبئة */
function splitPassageIntoChunks(passageHtml, measureEl, maxChunkHeight) {
  const temp = document.createElement("div");
  temp.innerHTML = passageHtml;
  const body = temp.querySelector(".passage-body");
  if (!body) return [passageHtml];

  const fullText = body.textContent || "";
  const paragraphs = fullText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return [passageHtml];

  const chunks = [];
  let buf = [];

  const measureChunk = (parts, isContinuation) => {
    const html = `
      <div class="passage">
        <div class="passage-label">${isContinuation ? "تتمة قطعة القراءة" : "قطعة القراءة"}</div>
        <div class="passage-body">${parts.map((p) => escapeHtml(p)).join("<br/><br/>")}</div>
      </div>`;
    measureEl.innerHTML = html;
    return {
      html,
      height: measureEl.getBoundingClientRect().height + 4,
    };
  };

  paragraphs.forEach((p) => {
    const trial = [...buf, p];
    const measured = measureChunk(trial, chunks.length > 0);
    if (buf.length && measured.height > maxChunkHeight) {
      chunks.push(measureChunk(buf, chunks.length > 0));
      buf = [p];
    } else {
      buf = trial;
    }
  });
  if (buf.length) chunks.push(measureChunk(buf, chunks.length > 0));
  return chunks;
}

export async function exportExamQuestionsAsPdf({ title, questions }) {
  const rows = normalizeQuestionsForExport(questions);
  const questionCount = rows.filter((r) => r.kind === "question").length;
  if (!questionCount) throw new Error("لا توجد أسئلة للتصدير");

  const measureMount = document.createElement("div");
  measureMount.setAttribute("data-exam-export-measure", "true");
  measureMount.style.cssText = `position:fixed;left:-14000px;top:0;width:${PAGE_WIDTH_PX}px;background:#fff;z-index:-1;pointer-events:none;`;
  measureMount.innerHTML = `<style>${EXAM_DOC_CSS}</style>
    <div class="exam-export-root" dir="rtl" style="padding:10px 14px;">
      <div class="sheet" style="max-width:none;"></div>
    </div>`;
  document.body.appendChild(measureMount);

  try {
    if (document.fonts?.ready) await document.fonts.ready;

    const sheet = measureMount.querySelector(".sheet");
    const probe = document.createElement("div");
    probe.className = "export-block";
    sheet.appendChild(probe);

    const measuredBlocks = [];

    // Header
    probe.innerHTML = buildHeaderHtml({ title, questionCount });
    measuredBlocks.push({
      html: probe.innerHTML,
      height: probe.getBoundingClientRect().height + 4,
    });

    let qIndex = 0;
    for (const row of rows) {
      if (row.kind === "passage") {
        const passageHtml = renderPassageHtml(row.text);
        probe.innerHTML = passageHtml;
        const h = probe.getBoundingClientRect().height + 4;
        if (h > PAGE_CONTENT_HEIGHT_PX * 0.55) {
          const chunks = splitPassageIntoChunks(
            passageHtml,
            probe,
            PAGE_CONTENT_HEIGHT_PX * 0.5,
          );
          chunks.forEach((c) => measuredBlocks.push(c));
        } else {
          measuredBlocks.push({ html: passageHtml, height: h });
        }
        continue;
      }
      qIndex += 1;
      const qHtml = renderQuestionHtml(row, qIndex);
      probe.innerHTML = qHtml;
      measuredBlocks.push({
        html: qHtml,
        height: probe.getBoundingClientRect().height + 3,
      });
    }

    probe.remove();

    const pages = packBlocksIntoPages(measuredBlocks, PAGE_CONTENT_HEIGHT_PX);
    const pdf = new jsPDF("p", "mm", "a4");
    const contentW = PAGE_W_MM - MARGIN_MM * 2;
    const contentH = PAGE_H_MM - MARGIN_MM * 2;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const pageMount = document.createElement("div");
      pageMount.style.cssText = `position:fixed;left:-14000px;top:0;width:${PAGE_WIDTH_PX}px;background:#fff;z-index:-1;pointer-events:none;`;
      pageMount.innerHTML = `<style>${EXAM_DOC_CSS}</style>
        <div class="exam-pdf-page" dir="rtl">
          <div class="sheet" style="max-width:none;">
            ${pages[pageIndex].map((b) => `<div class="export-block">${b.html}</div>`).join("")}
          </div>
        </div>`;
      document.body.appendChild(pageMount);

      try {
        await waitForImages(pageMount);
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
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

        let drawW = contentW;
        let drawH = (canvas.height * drawW) / canvas.width;
        if (drawH > contentH) {
          const scale = contentH / drawH;
          drawH = contentH;
          drawW *= scale;
        }
        const offsetX = MARGIN_MM + (contentW - drawW) / 2;
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
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
