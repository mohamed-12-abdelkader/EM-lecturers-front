/** تطبيع حقول wrong_questions من GET /api/course/course-exam/:id/submissions */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const EXPORT_FONT = "'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif";
const PDF_ROWS_FIRST_PAGE = 20;
const PDF_ROWS_PER_PAGE = 26;

function resolveOptionText(question, letter) {
  if (!letter || !question) return null;
  const key = `option${String(letter).trim().toUpperCase()}`;
  return question[key] ?? null;
}

export function formatSubmissionAnswer(letter, text, question) {
  const normalizedLetter = letter ? String(letter).trim().toUpperCase() : "";
  const resolvedText =
    (text && String(text).trim()) ||
    resolveOptionText(question, normalizedLetter) ||
    null;

  if (!normalizedLetter && !resolvedText) return "لم يجب";
  if (normalizedLetter && resolvedText) return `${normalizedLetter} — ${resolvedText}`;
  return resolvedText || normalizedLetter;
}

export function normalizeWrongQuestion(raw) {
  if (!raw || typeof raw !== "object") return null;

  const yourLetter = raw.yourAnswer ?? raw.yourChoice?.id ?? null;
  const correctLetter = raw.correctAnswer ?? raw.correctChoice?.id ?? null;
  const yourText = raw.yourAnswerText ?? raw.yourChoice?.text ?? null;
  const correctText = raw.correctAnswerText ?? raw.correctChoice?.text ?? null;

  return {
    questionId: raw.questionId ?? raw.id,
    questionText: raw.questionText ?? raw.text ?? "",
    questionImage: raw.questionImage ?? raw.image ?? null,
    type: raw.type ?? "mcq",
    yourAnswerDisplay: formatSubmissionAnswer(yourLetter, yourText, raw),
    correctAnswerDisplay: formatSubmissionAnswer(correctLetter, correctText, raw),
  };
}

export function getWrongQuestions(submission) {
  const list = submission?.wrong_questions ?? submission?.wrongQuestions ?? [];
  if (!Array.isArray(list)) return [];
  return list.map(normalizeWrongQuestion).filter(Boolean);
}

export function getWrongQuestionsCount(submission) {
  if (submission?.wrong_questions_count != null) {
    return Number(submission.wrong_questions_count) || 0;
  }
  return getWrongQuestions(submission).length;
}

export function resolveSubmissionOutcome(submission) {
  const inProgress =
    submission?.status === "in_progress" ||
    submission?.in_progress === true ||
    submission?.exam_status === "in_progress";
  if (inProgress) {
    return { obtained: 0, total: 0, percentage: 0, passed: false, inProgress: true };
  }
  const obtained = Number(submission?.obtained_grade ?? submission?.obtainedGrade ?? 0);
  const total = Number(submission?.total_grade ?? submission?.totalGrade ?? 0);
  const percentage =
    submission?.percentage != null
      ? Math.round(Number(submission.percentage))
      : total > 0
        ? Math.round((obtained / total) * 100)
        : 0;
  const passed =
    submission?.passed != null ? Boolean(submission.passed) : percentage >= 50;

  return { obtained, total, percentage, passed, inProgress: false };
}

function escapeCsvCell(value) {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** تصدير درجات الطلاب فقط (بدون أسئلة خاطئة) — يفتح في Excel */
export function downloadExamGradesExcel(submissions = [], options = {}) {
  const list = Array.isArray(submissions) ? submissions : [];
  if (!list.length) return false;

  const filename =
    options.filename ||
    `exam-grades-${new Date().toISOString().slice(0, 10)}.csv`;

  const headers = [
    "#",
    "اسم الطالب",
    "رقم الطالب",
    "الدرجة",
    "الدرجة الكلية",
    "النسبة المئوية",
    "الحالة",
  ];

  const rows = list.map((submission, index) => {
    const { obtained, total, percentage, passed } = resolveSubmissionOutcome(submission);
    return [
      index + 1,
      submission.name || "طالب",
      submission.student_id ?? "",
      Number.isFinite(obtained) ? obtained : "",
      Number.isFinite(total) && total > 0 ? total : "",
      `${percentage}%`,
      passed ? "ناجح" : "راسب",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildGradesPdfTableRows(submissions, startIndex = 0) {
  return submissions
    .map((submission, index) => {
      const { obtained, total, percentage, passed } = resolveSubmissionOutcome(submission);
      const rowNum = startIndex + index + 1;
      const obtainedText = Number.isFinite(obtained) ? obtained : "—";
      const totalText = Number.isFinite(total) && total > 0 ? total : "—";
      const statusText = passed ? "ناجح" : "راسب";
      const rowBg = index % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      const statusBg = passed ? "#DCFCE7" : "#FEE2E2";
      const statusColor = passed ? "#15803D" : "#B91C1C";

      return `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 11px 10px; text-align: center; font-weight: 700; color: #64748B;">${rowNum}</td>
          <td style="padding: 11px 10px; text-align: right; font-weight: 800; color: #0F172A;">${escapeHtml(submission.name || "طالب")}</td>
          <td style="padding: 11px 10px; text-align: center; color: #475569;">${escapeHtml(submission.student_id ?? "—")}</td>
          <td style="padding: 11px 10px; text-align: center; font-weight: 800; color: #0E4C92;">${obtainedText}</td>
          <td style="padding: 11px 10px; text-align: center; color: #475569;">${totalText}</td>
          <td style="padding: 11px 10px; text-align: center; font-weight: 800; color: ${passed ? "#15803D" : "#B91C1C"};">${percentage}%</td>
          <td style="padding: 11px 10px; text-align: center;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; background: ${statusBg}; color: ${statusColor}; font-weight: 800; font-size: 12px;">
              ${statusText}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildGradesPdfSummaryHtml(summary) {
  const cards = [
    { label: "إجمالي الطلاب", value: summary.total, color: "#0E4C92", bg: "#E8F0FA" },
    { label: "ناجح", value: summary.passed, color: "#15803D", bg: "#DCFCE7" },
    { label: "راسب", value: summary.failed, color: "#B91C1C", bg: "#FEE2E2" },
    { label: "متوسط النسبة", value: `${summary.averagePercentage}%`, color: "#7C3AED", bg: "#EDE9FE" },
  ];

  return `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
      ${cards
        .map(
          (card) => `
            <div style="background: ${card.bg}; border: 1px solid #E2E8F0; border-radius: 14px; padding: 14px 12px; text-align: center;">
              <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">${card.label}</div>
              <div style="font-size: 24px; font-weight: 900; color: ${card.color}; line-height: 1;">${card.value}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function buildGradesPdfPageHtml({
  title,
  rowsHtml,
  pageNumber,
  totalPages,
  totalStudents,
  summary,
  showSummary = false,
}) {
  const dateLabel = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = new Date().toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div dir="rtl" style="width: 1100px; background: #fff; color: #1A202C; font-family: ${EXPORT_FONT}; box-sizing: border-box; overflow: hidden; border: 1px solid #E2E8F0; border-radius: 18px;">
      <div style="height: 6px; background: linear-gradient(to left, #0E4C92, #16A34A);"></div>
      <div style="padding: 28px 32px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${showSummary ? "20px" : "16px"}; gap: 16px;">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #64748B; letter-spacing: 0.04em; margin-bottom: 6px;">تقرير درجات الامتحان</div>
            <h1 style="margin: 0 0 8px; font-size: 30px; font-weight: 900; color: #0E4C92; line-height: 1.2;">${escapeHtml(title)}</h1>
            <p style="margin: 0; font-size: 14px; color: #64748B; font-weight: 600;">
              إجمالي الطلاب: ${totalStudents} — ${dateLabel} — ${timeLabel}
            </p>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 14px; font-size: 13px; color: #475569; font-weight: 800; white-space: nowrap;">
            صفحة ${pageNumber} / ${totalPages}
          </div>
        </div>
        ${showSummary && summary ? buildGradesPdfSummaryHtml(summary) : ""}
        <div style="border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: linear-gradient(to left, #0E4C92, #1D4ED8); color: #FFFFFF;">
                <th style="padding: 14px 10px; text-align: center; width: 52px; font-weight: 800;">#</th>
                <th style="padding: 14px 10px; text-align: right; font-weight: 800;">اسم الطالب</th>
                <th style="padding: 14px 10px; text-align: center; width: 110px; font-weight: 800;">رقم الطالب</th>
                <th style="padding: 14px 10px; text-align: center; width: 90px; font-weight: 800;">الدرجة</th>
                <th style="padding: 14px 10px; text-align: center; width: 110px; font-weight: 800;">الدرجة الكلية</th>
                <th style="padding: 14px 10px; text-align: center; width: 90px; font-weight: 800;">النسبة</th>
                <th style="padding: 14px 10px; text-align: center; width: 100px; font-weight: 800;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 14px; text-align: center; font-size: 11px; color: #94A3B8; font-weight: 600;">
          تم إنشاء التقرير تلقائياً — درجات الطلاب فقط بدون تفاصيل الأسئلة
        </div>
      </div>
    </div>
  `;
}

function buildGradesPdfSummary(submissions) {
  const outcomes = submissions.map(resolveSubmissionOutcome);
  const passed = outcomes.filter((item) => item.passed).length;
  const averagePercentage =
    outcomes.length > 0
      ? Math.round(outcomes.reduce((sum, item) => sum + item.percentage, 0) / outcomes.length)
      : 0;

  return {
    total: submissions.length,
    passed,
    failed: submissions.length - passed,
    averagePercentage,
  };
}

/** تصدير كل درجات الطلاب كـ PDF (جدول فقط — بدون أسئلة خاطئة) */
export async function downloadExamGradesPdf(submissions = [], options = {}) {
  const list = Array.isArray(submissions) ? submissions : [];
  if (!list.length) return false;

  const title = options.title || "درجات الطلاب في الامتحان";
  const filename =
    options.filename || `exam-grades-${new Date().toISOString().slice(0, 10)}.pdf`;
  const pdf = new jsPDF("l", "mm", "a4");
  const summary = buildGradesPdfSummary(list);
  const chunks = [];
  let cursor = 0;
  let pageIndex = 0;

  while (cursor < list.length) {
    const pageSize = pageIndex === 0 ? PDF_ROWS_FIRST_PAGE : PDF_ROWS_PER_PAGE;
    chunks.push(list.slice(cursor, cursor + pageSize));
    cursor += pageSize;
    pageIndex += 1;
  }

  const totalPages = Math.max(chunks.length, 1);

  for (let currentPage = 0; currentPage < chunks.length; currentPage += 1) {
    const chunk = chunks[currentPage];
    const startIndex =
      currentPage === 0
        ? 0
        : PDF_ROWS_FIRST_PAGE + (currentPage - 1) * PDF_ROWS_PER_PAGE;
    const rowsHtml = buildGradesPdfTableRows(chunk, startIndex);
    const html = buildGradesPdfPageHtml({
      title,
      rowsHtml,
      pageNumber: currentPage + 1,
      totalPages,
      totalStudents: list.length,
      summary,
      showSummary: currentPage === 0,
    });

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    await new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: 1100,
    });

    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 297;
    const pdfHeight = 210;
    const margin = 5;
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (currentPage > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - margin * 2));
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  return true;
}
