import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchStudentQr } from "../../../api/centerMgmtApi";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import { field, studentCode, studentName } from "../centerMgmtUtils";

/**
 * 12 كارت في صفحة A4 أفقي (3×4)
 * النسبة مضبوطة على 297×210 عشان تملأ الورقة بدون فراغ على الأجناب أو فوق/تحت
 */
const A4_RATIO = 297 / 210;
const PAGE_RENDER_W = 1188; // ~4px/mm × 297
const PAGE_RENDER_H = Math.round(PAGE_RENDER_W / A4_RATIO); // ~840
const GRID_COLS = 3;
const GRID_ROWS = 4;
const CARDS_PER_PAGE = 12;
const GRID_GAP = 10;
const PAGE_PAD = 8;

const CARD_W = Math.floor(
  (PAGE_RENDER_W - PAGE_PAD * 2 - GRID_GAP * GRID_COLS) / GRID_COLS
);
const CARD_H = Math.floor(
  (PAGE_RENDER_H - PAGE_PAD * 2 - GRID_GAP * GRID_ROWS) / GRID_ROWS
);

const QR_SIZE = 86;
const QR_BOX = 92;

/** Professional navy / slate palette */
const NAVY = "#0F2744";
const NAVY_SOFT = "#1A3A5C";
const INK = "#14233A";
const MUTED = "#64748B";
const ACCENT = "#C4782A";
const SURFACE = "#F7F9FC";
const LINE = "#E2E8F0";
const BORDER = "#CBD5E1";

/**
 * Tahoma + Cairo: Tahoma أولوية لـ html2canvas لأنه يثبت تشكيل العربي.
 */
const FONT = "Tahoma,'Cairo','Segoe UI',Arial,sans-serif";

function normalizeQrSrc(qrData, student) {
  const raw =
    field(qrData, "qr_image_base64", "qrImageBase64") ||
    field(student, "qr_image_base64", "qrImageBase64");
  if (!raw) return null;
  return String(raw).startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
}

export async function fetchCenterCardBranding() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const subdomain = getTenantSubdomain();

  let teacherName = user.name || user.full_name || "المدرس";

  if (subdomain) {
    try {
      const res = await fetchTenantPublic(subdomain);
      const tenant = res?.data?.tenant;
      const teacher = res?.data?.teacher;
      teacherName = teacher?.name || tenant?.display_name || teacherName;
    } catch {
      // keep fallbacks
    }
  }

  return { teacherName };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text, max = 24) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function buildCardHtml({
  studentName: name,
  studentId,
  groupName,
  gradeName,
  qrSrc,
  branding,
}) {
  const grade = escapeHtml(truncate(gradeName || "—", 24));
  const safeName = escapeHtml(truncate(name, 24));
  const headerGroup = escapeHtml(truncate(groupName || "—", 18));
  const safeId = escapeHtml(String(studentId ?? "—"));
  const teacher = escapeHtml(truncate(branding.teacherName || "المدرس", 20));

  const qrBlock = qrSrc
    ? `<img
        src="${qrSrc}"
        alt="QR"
        width="${QR_SIZE}"
        height="${QR_SIZE}"
        style="
          width:${QR_SIZE}px;
          height:${QR_SIZE}px;
          object-fit:contain;
          display:block;
          image-rendering:-webkit-optimize-contrast;
          image-rendering:crisp-edges;
          image-rendering:pixelated;
        "
      />`
    : `<div style="width:${QR_SIZE}px;height:${QR_SIZE}px;display:flex;align-items:center;justify-content:center;font-size:10px;color:${MUTED};font-family:${FONT};">لا QR</div>`;

  // ملاحظة: ممنوع overflow:hidden + text-overflow:ellipsis على العربي مع html2canvas
  return `
<table dir="rtl" cellpadding="0" cellspacing="0" style="
  width:${CARD_W}px;
  height:${CARD_H}px;
  border-collapse:separate;
  border-spacing:0;
  border-radius:10px;
  overflow:hidden;
  border:1px solid ${BORDER};
  background:#ffffff;
  font-family:${FONT};
  table-layout:fixed;
">
  <tr>
    <td colspan="2" style="
      background:${NAVY};
      padding:7px 12px;
      vertical-align:middle;
      height:30px;
    ">
      <table dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:${FONT};">
        <tr>
          <td style="
            color:#FFFFFF;
            font-size:11px;
            font-weight:700;
            font-family:${FONT};
            line-height:1.25;
            text-align:right;
            white-space:nowrap;
            vertical-align:middle;
          ">${grade}</td>
          <td style="
            text-align:left;
            white-space:nowrap;
            vertical-align:middle;
            width:48%;
          ">
            <span style="
              display:inline-block;
              background:${NAVY_SOFT};
              color:#FFFFFF;
              font-size:10px;
              font-weight:700;
              font-family:${FONT};
              line-height:1.25;
              padding:3px 10px;
              border-radius:999px;
              border:1px solid rgba(255,255,255,0.18);
            ">${headerGroup}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="height:3px;background:${ACCENT};padding:0;font-size:0;line-height:0;">&nbsp;</td>
  </tr>

  <tr>
    <td style="
      padding:10px 12px 10px 10px;
      vertical-align:middle;
      background:${SURFACE};
      border-left:1px solid ${LINE};
    ">
      <div style="
        color:${MUTED};
        font-size:9px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.15;
        margin-bottom:2px;
        text-align:right;
        white-space:nowrap;
      ">المدرس</div>
      <div style="
        color:${INK};
        font-size:13px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.25;
        margin-bottom:8px;
        text-align:right;
        white-space:nowrap;
      ">${teacher}</div>

      <div style="height:1px;background:${LINE};margin:0 0 8px;line-height:0;font-size:0;">&nbsp;</div>

      <div style="
        color:${MUTED};
        font-size:9px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.15;
        margin-bottom:2px;
        text-align:right;
        white-space:nowrap;
      ">اسم الطالب</div>
      <div style="
        color:${NAVY};
        font-size:16px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.25;
        margin-bottom:8px;
        text-align:right;
        white-space:nowrap;
      ">${safeName}</div>

      <div style="
        display:inline-block;
        background:#FFFFFF;
        border:1px solid ${LINE};
        border-radius:7px;
        padding:4px 10px;
        color:${INK};
        font-size:12px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.25;
        white-space:nowrap;
      ">الكود&nbsp;&nbsp;<span style="color:${ACCENT};">${safeId}</span></div>
    </td>

    <td style="
      width:112px;
      padding:10px 12px;
      vertical-align:middle;
      text-align:center;
      background:#FFFFFF;
    ">
      <div style="
        width:${QR_BOX}px;
        height:${QR_BOX}px;
        margin:0 auto;
        border:1px solid ${BORDER};
        border-radius:8px;
        padding:2px;
        background:#FFFFFF;
        box-sizing:border-box;
        line-height:0;
      ">${qrBlock}</div>
      <div style="
        margin-top:5px;
        color:${MUTED};
        font-size:8px;
        font-weight:700;
        font-family:${FONT};
        white-space:nowrap;
      ">SCAN QR</div>
    </td>
  </tr>
</table>`;
}

async function waitForImages(container) {
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 4000);
        })
    )
  );
}

async function loadStudentCards(students) {
  return Promise.all(
    students.map(async (student) => {
      let qrData = null;
      try {
        qrData = await fetchStudentQr(student.id);
      } catch {
        qrData = null;
      }
      return {
        student,
        qrSrc: normalizeQrSrc(qrData, student),
      };
    })
  );
}

function buildPageHtml(cardHtmlList) {
  const slots = Array.from({ length: CARDS_PER_PAGE }, (_, i) => cardHtmlList[i] || "");
  const filled = slots.filter(Boolean).length;
  const rows = Math.min(GRID_ROWS, Math.ceil(filled / GRID_COLS) || 1);
  const halfGap = GRID_GAP / 2;

  const rowHtml = Array.from({ length: rows }, (_, rowIdx) => {
    const cells = Array.from({ length: GRID_COLS }, (_, colIdx) => {
      const card = slots[rowIdx * GRID_COLS + colIdx] || "";
      return `<td style="
        width:${CARD_W + GRID_GAP}px;
        height:${CARD_H + GRID_GAP}px;
        padding:${halfGap}px;
        vertical-align:top;
        box-sizing:border-box;
      "><div style="width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;">${card || ""}</div></td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  // استخدم مقاس ثابت بنفس نسبة A4 حتى لو عدد الصفوف أقل من 4
  const pageW = PAGE_RENDER_W;
  const pageH =
    rows === GRID_ROWS
      ? PAGE_RENDER_H
      : PAGE_PAD * 2 + rows * (CARD_H + GRID_GAP);

  return `
    <div id="pdf-page" style="
      width:${pageW}px;
      height:${pageH}px;
      padding:${PAGE_PAD}px;
      background:#ffffff;
      box-sizing:border-box;
      font-family:${FONT};
      overflow:hidden;
    ">
      <table dir="ltr" cellpadding="0" cellspacing="0" style="
        border-collapse:collapse;
        width:${GRID_COLS * (CARD_W + GRID_GAP)}px;
        table-layout:fixed;
      ">
        ${rowHtml}
      </table>
    </div>
  `;
}

function buildIsolatedDocument(pageInnerHtml) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: #fff;
      font-family: ${FONT};
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }
    table { border-collapse: separate; }
    img { max-width: none; }
    img[alt="QR"] {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      image-rendering: pixelated;
    }
  </style>
</head>
<body>${pageInnerHtml}</body>
</html>`;
}

async function renderPageInIsolatedFrame(pageInnerHtml) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-16000px;top:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("تعذر إنشاء معاينة الكروت");
  }

  doc.open();
  doc.write(buildIsolatedDocument(pageInnerHtml));
  doc.close();

  // انتظر تحميل الخطوط عشان العربي ميتقطّعش
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (doc.fonts?.ready) {
    await doc.fonts.ready;
  }
  try {
    await doc.fonts.load(`700 20px Tahoma`);
    await doc.fonts.load(`700 15px Cairo`);
  } catch {
    // ignore
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  const pageEl = doc.getElementById("pdf-page");
  if (!pageEl) {
    document.body.removeChild(iframe);
    throw new Error("تعذر تجهيز صفحة الكروت");
  }

  iframe.style.width = `${pageEl.scrollWidth}px`;
  iframe.style.height = `${pageEl.scrollHeight}px`;

  await waitForImages(pageEl);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const canvas = await html2canvas(pageEl, {
    scale: 4,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: pageEl.scrollWidth,
    height: pageEl.scrollHeight,
    logging: false,
    letterRendering: true,
    imageTimeout: 15000,
  });

  document.body.removeChild(iframe);
  return canvas;
}

/**
 * Generate PDF — 12 cards per A4 landscape page (3×4 grid).
 */
export async function generateGroupStudentCardsPdf({
  students,
  groupName,
  gradeName = "",
  branding,
  onProgress,
}) {
  if (!students?.length) {
    throw new Error("لا يوجد طلاب لتصدير الكروت");
  }

  const cards = await loadStudentCards(students);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 2;

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx += 1) {
    const slice = cards.slice(
      pageIdx * CARDS_PER_PAGE,
      pageIdx * CARDS_PER_PAGE + CARDS_PER_PAGE
    );
    onProgress?.(
      Math.min((pageIdx + 1) * CARDS_PER_PAGE, cards.length),
      cards.length
    );

    const cardHtmlList = slice.map(({ student, qrSrc }) =>
      buildCardHtml({
        studentName: studentName(student),
        studentId: studentCode(student),
        groupName,
        gradeName,
        qrSrc,
        branding,
      })
    );

    const canvas = await renderPageInIsolatedFrame(buildPageHtml(cardHtmlList));

    const imgData = canvas.toDataURL("image/png");
    const drawW = pageW - margin * 2;
    const drawH = pageH - margin * 2;

    if (pageIdx > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, margin, drawW, drawH, undefined, "NONE");
  }

  const safeName = String(groupName || "group")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  pdf.save(`كروت-سنتر-${safeName || "group"}.pdf`);
}
