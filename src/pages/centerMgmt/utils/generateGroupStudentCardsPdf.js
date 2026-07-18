import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchStudentQr } from "../../../api/centerMgmtApi";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import { field, studentCode, studentName } from "../centerMgmtUtils";

/**
 * 12 كارت في صفحة A4 أفقي (3×4)
 */
const A4_RATIO = 297 / 210;
const PAGE_RENDER_W = 1188;
const PAGE_RENDER_H = Math.round(PAGE_RENDER_W / A4_RATIO);
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

/** QR أكبر لوضوح المسح */
const QR_BOX = 108;
const QR_IMG = 100;

/** Chakra: blue.500 / orange.500 */
const BLUE = "#3182CE";
const BLUE_SOFT = "#EBF8FF";
const ORANGE = "#DD6B20";
const ORANGE_SOFT = "#FFFAF0";
const INK = "#1A202C";
const MUTED = "#718096";
const WHITE = "#FFFFFF";
const BORDER = "#E2E8F0";

/** Tahoma يثبت تشكيل العربي في html2canvas — Cairo بيخلي الحروف تلزق */
const FONT = "Tahoma,'Segoe UI',Arial,sans-serif";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** مسافات غير قابلة للانهيار بين الكلمات عشان html2canvas ما يلزقش الحروف */
function spacedAr(text) {
  return escapeHtml(String(text || "")).replace(/ /g, "&nbsp;");
}

function truncate(text, max = 24) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

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

/**
 * عرض أنظف للبيانات:
 * - الاسم كبير وبارز بدون صندوق فورم
 * - المجموعة سطر بسيط بخط فاصل
 * - الكود شارة برتقالية واضحة
 */
function infoBlock({ name, group, code }) {
  return `
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:${FONT};">
  <tr>
    <td style="padding:0 2px 8px 2px;direction:rtl;text-align:right;border-bottom:1px solid ${BORDER};">
      <div style="color:${BLUE};font-size:7px;font-weight:700;font-family:${FONT};line-height:1.2;white-space:nowrap;">
        ${spacedAr("اسم الطالب")}
      </div>
      <div style="color:${INK};font-size:13px;font-weight:700;font-family:${FONT};line-height:1.35;white-space:nowrap;padding-top:2px;">
        ${spacedAr(name)}
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:7px 2px;direction:rtl;text-align:right;border-bottom:1px solid ${BORDER};">
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="direction:rtl;text-align:right;vertical-align:middle;white-space:nowrap;">
            <span style="color:${MUTED};font-size:7.5px;font-weight:700;font-family:${FONT};">${spacedAr("المجموعة")}</span>
            <span style="color:${ORANGE};padding:0 4px;font-size:8px;">•</span>
            <span style="color:${INK};font-size:11px;font-weight:700;font-family:${FONT};">${spacedAr(group)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0 0 0;">
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:${ORANGE};border-radius:6px;">
        <tr>
          <td style="padding:6px 8px;direction:rtl;text-align:center;vertical-align:middle;">
            <span style="color:${WHITE};font-size:7.5px;font-weight:700;font-family:${FONT};opacity:0.95;">${spacedAr("كود حضور السنتر")}</span>
            <span style="color:${WHITE};font-size:9px;padding:0 5px;">—</span>
            <span style="color:${WHITE};font-size:14px;font-weight:700;font-family:${FONT};letter-spacing:0.5px;">${spacedAr(code)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * هيدر سطر واحد: الصف + كارت سنتر مستر + المدرس
 * جسم: بيانات محسّنة | QR
 */
function buildCardHtml({
  studentName: name,
  studentId,
  groupName,
  gradeName,
  qrSrc,
  branding,
}) {
  const grade = truncate(gradeName || "—", 18);
  const safeName = truncate(name, 20);
  const safeGroup = truncate(groupName || "—", 16);
  const safeId = String(studentId ?? "—");
  const teacherRaw = truncate(branding.teacherName || "المدرس", 14);
  const teacherDisplay = /^أ[.\s]|الاستاذ|الأستاذ/i.test(teacherRaw)
    ? teacherRaw
    : `أ. ${teacherRaw}`;

  const qrBlock = qrSrc
    ? `<img
        src="${qrSrc}"
        alt="QR"
        width="${QR_IMG}"
        height="${QR_IMG}"
        style="width:${QR_IMG}px;height:${QR_IMG}px;object-fit:contain;display:block;image-rendering:pixelated;"
      />`
    : `<div style="width:${QR_IMG}px;height:${QR_IMG}px;text-align:center;line-height:${QR_IMG}px;font-size:9px;color:#A0AEC0;font-family:${FONT};">لا&nbsp;QR</div>`;

  const headerH = 30;
  const bodyH = CARD_H - headerH;
  const headerGrade = spacedAr(grade);
  const headerTitle = spacedAr("كارت سنتر مستر");
  const headerTeacher = spacedAr(teacherDisplay);

  return `
<table dir="ltr" cellpadding="0" cellspacing="0" style="
  width:${CARD_W}px;
  height:${CARD_H}px;
  border-collapse:separate;
  border-spacing:0;
  border-radius:10px;
  overflow:hidden;
  border:1.5px solid ${BORDER};
  background:${WHITE};
  font-family:${FONT};
  table-layout:fixed;
">
  <!-- هيدر سطر واحد: الصف | كارت سنتر مستر | المدرس -->
  <tr>
    <td colspan="2" style="height:${headerH}px;padding:0;background:${BLUE};vertical-align:middle;">
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;height:${headerH}px;">
        <tr>
          <td style="width:5px;background:${ORANGE};font-size:0;line-height:0;">&nbsp;</td>
          <td style="padding:0 10px;vertical-align:middle;direction:rtl;text-align:right;">
            <div style="
              font-size:10px;font-weight:700;font-family:${FONT};
              line-height:1.3;white-space:nowrap;
            ">
              <span style="color:${ORANGE};">${headerGrade}</span>
              <span style="color:rgba(255,255,255,0.45);padding:0 5px;">|</span>
              <span style="color:${WHITE};">${headerTitle}</span>
              <span style="color:rgba(255,255,255,0.45);padding:0 5px;">|</span>
              <span style="color:${WHITE};">${headerTeacher}</span>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- جسم: بيانات محسّنة | QR -->
  <tr>
    <td style="
      width:50%;
      height:${bodyH}px;
      vertical-align:middle;
      padding:10px 8px 10px 10px;
      background:${WHITE};
    ">
      ${infoBlock({ name: safeName, group: safeGroup, code: safeId })}
    </td>
    <td style="
      width:50%;
      height:${bodyH}px;
      vertical-align:middle;
      text-align:center;
      padding:6px 8px;
      background:${BLUE_SOFT};
    ">
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 auto;background:${WHITE};border:2.5px solid ${ORANGE};border-radius:8px;">
        <tr>
          <td style="padding:3px;">
            <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:2px solid ${BLUE};border-radius:5px;background:${WHITE};">
              <tr>
                <td style="padding:2px;width:${QR_BOX}px;height:${QR_BOX}px;text-align:center;vertical-align:middle;">
                  ${qrBlock}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="
        color:${BLUE};font-size:7.5px;font-weight:700;font-family:${FONT};
        line-height:1.35;padding-top:4px;white-space:nowrap;
      ">${spacedAr("امسح للحضور")}</div>
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
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: #fff;
      font-family: ${FONT};
      -webkit-font-smoothing: auto;
      text-rendering: optimizeLegibility;
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

  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (doc.fonts?.ready) {
    await doc.fonts.ready;
  }
  try {
    await doc.fonts.load(`700 12px Tahoma`);
    await doc.fonts.load(`700 16px Tahoma`);
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
