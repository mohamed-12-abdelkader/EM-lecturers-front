import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];
const PDF_SCALE = 1.6;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 10;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** يحوّل نص السؤال لـ HTML بسيط مع الإبقاء على أسطر جديدة */
function formatQuestionHtml(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  // لو النص HTML بسيط من المنصة، نمرّره بحذر بعد تنظيف السكربتات
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

/**
 * تطبيع أسئلة الامتحان الشامل لصيغة تصدير موحّدة.
 */
export function normalizeQuestionsForExport(questions = []) {
  const rows = [];
  let lastPassageKey = null;

  for (const q of questions) {
    if (!q) continue;

    if (q.type === "passage_sub" && q.sub_question) {
      const passageText =
        q.passage?.content ||
        q.passage?.text ||
        q.passage?.passageText ||
        q.passageText ||
        "";
      const passageKey = String(q.passage?.id || passageText).slice(0, 120);
      if (passageText && passageKey !== lastPassageKey) {
        rows.push({
          kind: "passage",
          text: passageText,
        });
        lastPassageKey = passageKey;
      }
      const sq = q.sub_question;
      rows.push({
        kind: "question",
        text: sq.text || "",
        image: sq.image || null,
        choices: Array.isArray(sq.choices) ? sq.choices : [],
        isEssay: String(sq.type || "").toUpperCase() === "ESSAY",
      });
      continue;
    }

    const passageText = q.passageText || q.passage?.content || q.passage?.text || "";
    if (passageText) {
      const passageKey = String(q.passageId || q.passage?.id || passageText).slice(0, 120);
      if (passageKey !== lastPassageKey) {
        rows.push({ kind: "passage", text: passageText });
        lastPassageKey = passageKey;
      }
    }

    rows.push({
      kind: "question",
      text: q.text || "",
      image: q.image || null,
      choices: Array.isArray(q.choices) ? q.choices : [],
      isEssay: String(q.type || "").toUpperCase() === "ESSAY",
    });
  }

  return rows;
}

function buildFileSlug(title) {
  return String(title || "exam")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40) || "exam";
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

function renderQuestionsHtml(rows) {
  let qIndex = 0;
  return rows
    .map((row) => {
      if (row.kind === "passage") {
        return `
          <div class="passage">
            <div class="passage-label">قطعة القراءة</div>
            <div class="passage-body">${formatQuestionHtml(row.text)}</div>
          </div>`;
      }

      qIndex += 1;
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
        <div class="question">
          <div class="q-head">
            <span class="q-num">${qIndex}.</span>
            <div class="q-text">${formatQuestionHtml(row.text) || (row.image ? "" : "—")}</div>
          </div>
          ${image}
          ${choices ? `<div class="choices">${choices}</div>` : ""}
          ${essayHint}
        </div>`;
    })
    .join("");
}

const EXAM_DOC_CSS = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  .exam-export-root {
    margin: 0;
    padding: 18px 22px;
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
    margin-bottom: 18px;
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
  .question {
    padding: 10px 0 12px;
    border-bottom: 1px dashed #bbb;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .q-head { display: flex; gap: 8px; align-items: flex-start; }
  .q-num { font-weight: 800; min-width: 28px; }
  .q-text { flex: 1; font-size: 15px; font-weight: 600; }
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
    margin: 12px 0;
    break-inside: avoid;
  }
  .passage-label { font-size: 12px; font-weight: 800; color: #555; margin-bottom: 4px; }
  .passage-body { font-size: 14px; white-space: pre-wrap; }
  .essay-lines { margin: 10px 28px 0; }
  .essay-lines .line {
    border-bottom: 1px solid #999;
    height: 26px;
    margin-bottom: 4px;
  }
`;

function buildExamBodyHtml({ title, teacherName, questionCount, rows }) {
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const safeTitle = escapeHtml(title || "امتحان شامل");
  const safeTeacher = escapeHtml(teacherName || "—");

  return `
  <div class="exam-export-root" dir="rtl">
    <div class="sheet">
      <div class="header">
        <h1 class="exam-title">${safeTitle}</h1>
        <div class="meta">${questionCount} سؤال · ${escapeHtml(dateStr)}</div>
        <div class="fields">
          <div class="field">
            <span class="field-label">اسم المدرس:</span>
            <span class="field-value">${safeTeacher}</span>
          </div>
          <div class="field">
            <span class="field-label">اسم الطالب:</span>
            <span class="field-line"></span>
          </div>
        </div>
      </div>
      ${renderQuestionsHtml(rows)}
    </div>
  </div>`;
}

/**
 * HTML منظّم للامتحان (RTL) — مستند كامل لـ Word.
 */
export function buildExamDocumentHtml({
  title,
  teacherName,
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
${buildExamBodyHtml({ title, teacherName, questionCount, rows })}
</body>
</html>`;
}

/** تصدير Word فوري عبر HTML متوافق مع Word */
export async function exportExamQuestionsAsWord({
  title,
  teacherName,
  questions,
}) {
  const rows = normalizeQuestionsForExport(questions);
  const questionCount = rows.filter((r) => r.kind === "question").length;
  if (!questionCount) throw new Error("لا توجد أسئلة للتصدير");

  const html = buildExamDocumentHtml({
    title,
    teacherName,
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
 * تصدير PDF سريع:
 * بناء HTML مرة واحدة → التقاط Canvas واحد → تقسيم لصفحات A4.
 */
export async function exportExamQuestionsAsPdf({
  title,
  teacherName,
  questions,
}) {
  const rows = normalizeQuestionsForExport(questions);
  const questionCount = rows.filter((r) => r.kind === "question").length;
  if (!questionCount) throw new Error("لا توجد أسئلة للتصدير");

  const mount = document.createElement("div");
  mount.setAttribute("data-exam-export-pdf", "true");
  mount.style.cssText =
    "position:fixed;left:-14000px;top:0;width:794px;background:#fff;z-index:-1;pointer-events:none;";
  mount.innerHTML = `<style>${EXAM_DOC_CSS}</style>${buildExamBodyHtml({
    title,
    teacherName,
    questionCount,
    rows,
  })}`;
  document.body.appendChild(mount);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await waitForImages(mount);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 80)));

    const sheet = mount.querySelector(".exam-export-root") || mount;
    const canvas = await html2canvas(sheet, {
      scale: PDF_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 794,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const contentW = PAGE_W_MM - MARGIN_MM * 2;
    const contentH = PAGE_H_MM - MARGIN_MM * 2;
    const imgW = contentW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const pageCanvasH = Math.floor((contentH * canvas.width) / imgW);

    let offsetY = 0;
    let pageIndex = 0;
    while (offsetY < canvas.height) {
      const sliceH = Math.min(pageCanvasH, canvas.height - offsetY);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceH;
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceH,
        0,
        0,
        canvas.width,
        sliceH,
      );

      const sliceHmm = (sliceH * imgW) / canvas.width;
      const imgData = pageCanvas.toDataURL("image/jpeg", 0.92);
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", MARGIN_MM, MARGIN_MM, imgW, sliceHmm);

      offsetY += sliceH;
      pageIndex += 1;
    }

    const date = new Date().toISOString().slice(0, 10);
    pdf.save(`exam-${buildFileSlug(title)}-${date}.pdf`);
  } finally {
    mount.remove();
  }
}
