import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ENGAGEMENT_STATUS_META } from "../../../api/lectureEngagementReportApi";

const FONT = "Tahoma, 'Segoe UI', Arial, sans-serif";
/** صفوف كثيرة لكل صفحة = صفحات أقل = تصدير أسرع */
const ROWS_PER_PAGE = 32;

function safeFileName(value, fallback) {
  const clean = String(value || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean || fallback;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusLabel(status) {
  return ENGAGEMENT_STATUS_META[status]?.label || status || "—";
}

function buildPageHtml({
  title,
  courseTitle,
  filterSummary,
  rows,
  startIndex,
  pageNumber,
  totalPages,
  totalStudents,
}) {
  const dateLabel = new Date().toLocaleDateString("ar-EG");
  const body = rows
    .map((student, i) => {
      const bg = i % 2 === 0 ? "#fff" : "#f8fafc";
      return `<tr style="background:${bg}">
        <td style="padding:5px 4px;text-align:center;font-size:11px;color:#64748b">${startIndex + i + 1}</td>
        <td style="padding:5px 6px;text-align:right;font-size:11px;font-weight:700">${htmlEscape(student.name || "—")}</td>
        <td style="padding:5px 6px;text-align:right;font-size:10px;color:#334155">${htmlEscape(student.group?.name || "—")}</td>
        <td style="padding:5px 4px;text-align:center;font-size:10px;font-weight:700">${htmlEscape(statusLabel(student.status))}</td>
        <td style="padding:5px 4px;text-align:center;font-size:11px;font-weight:800;color:#0e4c92">${Number(student.watchPercentage) || 0}%</td>
        <td style="padding:5px 4px;text-align:center;font-size:10px;direction:ltr">${htmlEscape(student.phone || "—")}</td>
      </tr>`;
    })
    .join("");

  return `
    <div dir="rtl" style="width:920px;background:#fff;color:#0f172a;font-family:${FONT};box-sizing:border-box;padding:16px 18px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;border-bottom:2px solid #0e4c92;padding-bottom:8px;">
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:2px">تقرير تفاعل المحاضرة</div>
          <div style="font-size:18px;font-weight:900;color:#0e4c92;line-height:1.3">${htmlEscape(title)}</div>
          <div style="font-size:11px;color:#64748b;margin-top:3px">
            ${courseTitle ? `${htmlEscape(courseTitle)} · ` : ""}${htmlEscape(filterSummary || "بدون فلاتر")} · ${totalStudents} طالب · ${dateLabel}
          </div>
        </div>
        <div style="font-size:11px;font-weight:800;color:#475569;white-space:nowrap">صفحة ${pageNumber}/${totalPages}</div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#0e4c92;color:#fff">
            <th style="padding:7px 4px;font-size:11px;width:36px">م</th>
            <th style="padding:7px 6px;font-size:11px;text-align:right">الطالب</th>
            <th style="padding:7px 6px;font-size:11px;text-align:right">المجموعة</th>
            <th style="padding:7px 4px;font-size:11px;width:70px">الحالة</th>
            <th style="padding:7px 4px;font-size:11px;width:70px">المشاهدة</th>
            <th style="padding:7px 4px;font-size:11px;width:100px">الهاتف</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

/**
 * PDF خفيف وسريع: JPEG مضغوط + scale منخفض + أعمدة مختصرة.
 */
export async function downloadLectureEngagementPdf({
  students = [],
  lectureTitle = "",
  courseTitle = "",
  filterSummary = "",
  filename,
} = {}) {
  const list = Array.isArray(students) ? students : [];
  if (!list.length) return false;

  const title = lectureTitle || "تقرير تفاعل المحاضرة";
  const base = safeFileName(
    filename || `تقرير-تفاعل-${title}-${todayStamp()}`,
    `lecture-engagement-${todayStamp()}`,
  );
  const pdfName = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;

  const chunks = [];
  for (let i = 0; i < list.length; i += ROWS_PER_PAGE) {
    chunks.push(list.slice(i, i + ROWS_PER_PAGE));
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const totalPages = Math.max(chunks.length, 1);
  const margin = 6;
  const pdfWidth = 297;
  const pdfHeight = 210;
  const imgWidth = pdfWidth - margin * 2;

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none;";
  document.body.appendChild(host);

  try {
    for (let pageIndex = 0; pageIndex < chunks.length; pageIndex += 1) {
      const chunk = chunks[pageIndex];
      host.innerHTML = buildPageHtml({
        title,
        courseTitle,
        filterSummary,
        rows: chunk,
        startIndex: pageIndex * ROWS_PER_PAGE,
        pageNumber: pageIndex + 1,
        totalPages,
        totalStudents: list.length,
      });

      // انتظار إطار رسم واحد فقط (بدون تأخير طويل)
      await new Promise((r) => requestAnimationFrame(() => r()));

      const canvas = await html2canvas(host.firstElementChild, {
        scale: 1.1,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        removeContainer: true,
      });

      // JPEG مضغوط بدل PNG → حجم أصغر بكثير وسرعة أعلى
      const imgData = canvas.toDataURL("image/jpeg", 0.52);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        margin,
        imgWidth,
        Math.min(imgHeight, pdfHeight - margin * 2),
        undefined,
        "FAST",
      );
    }
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }

  pdf.save(pdfName);
  return true;
}
