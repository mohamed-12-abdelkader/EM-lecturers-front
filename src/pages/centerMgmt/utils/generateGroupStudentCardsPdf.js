import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchStudentQr } from "../../../api/centerMgmtApi";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import { field, studentCode, studentName } from "../centerMgmtUtils";

/**
 * 12 كارت في صفحة A4 أفقي (3×4) — حجم الكارت ثابت حتى لو الصفحة فيها كارت واحد
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

const HEADER_H = 26;
const FOOTER_H = 30;
const BODY_H = CARD_H - HEADER_H - FOOTER_H;
const RIGHT_W = 148;
const CODE_BOX_H = 26;
const QR_GAP = 3;
const QR_FRAME_PAD = 5;
const QR_IMG = Math.min(
  RIGHT_W - 16 - QR_FRAME_PAD * 2,
  BODY_H - CODE_BOX_H - QR_GAP - QR_FRAME_PAD * 2 - 4
);
const ICON = 22;

const BLUE = "#2D7FF6";
const ORANGE = "#F5A623";
const INK = "#2D3748";
const MUTED = "#8A94A6";
const WHITE = "#FFFFFF";
const BORDER = "#E8ECF1";
const DIVIDER = "#EDF1F5";

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

function teacherLabel(name) {
  const raw = truncate(String(name || "المدرس").trim(), 16);
  if (/^(مستر|أ[.\s]|ا\.|الاستاذ|الأستاذ)/i.test(raw)) return raw;
  return `مستر ${raw}`;
}

function circleIcon(bg, svg) {
  return `
    <div style="
      width:${ICON}px;height:${ICON}px;border-radius:50%;background:${bg};
      text-align:center;line-height:${ICON}px;overflow:hidden;
    ">${svg}</div>
  `;
}

const SVG_USER = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${WHITE}" style="vertical-align:middle;"><circle cx="12" cy="8" r="4.2"/><path d="M4 20.2c0-3.8 3.5-6.4 8-6.4s8 2.6 8 6.4"/></svg>`;
const SVG_BOOK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${WHITE}" style="vertical-align:middle;"><path d="M5 4h6.5c.4 0 .7.3.7.7v14.2l-3.7-1.7-3.5 1.7V4.7c0-.4.3-.7.7-.7z"/><path d="M19 4h-6.5c-.4 0-.7.3-.7.7v14.2l3.7-1.7 3.5 1.7V4.7c0-.4-.3-.7-.7-.7z"/></svg>`;
const SVG_GROUP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${WHITE}" style="vertical-align:middle;"><circle cx="9" cy="8" r="3.2"/><circle cx="16.4" cy="9" r="2.6"/><path d="M3 19.8c0-3.1 2.6-5.3 6-5.3s6 2.2 6 5.3"/><path d="M13.8 19.8c.3-2.1 1.9-3.7 4.1-3.8 2.1.1 3.3 1.7 3.3 3.8"/></svg>`;
const SVG_BADGE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;"><rect x="4" y="7" width="16" height="13" rx="2" stroke="${WHITE}" stroke-width="2"/><circle cx="9.2" cy="13.2" r="2.1" fill="${WHITE}"/><path d="M13.2 12h5.2M13.2 15.2h4" stroke="${WHITE}" stroke-width="1.8" stroke-linecap="round"/><path d="M9 7V5.2a3 3 0 0 1 6 0V7" stroke="${WHITE}" stroke-width="2" fill="none"/></svg>`;
const SVG_CAP = `<svg width="11" height="11" viewBox="0 0 24 24" fill="${WHITE}" style="vertical-align:middle;"><path d="M12 3L1.5 9.1 12 15.2 21 10.3V17h2V9.1L12 3z"/><path d="M5 12.2V16c0 1.6 3.1 3.2 7 3.2s7-1.6 7-3.2v-3.8"/></svg>`;

function infoRow({ icon, label, value, valueColor, last }) {
  const rowH = Math.floor(BODY_H / 3);
  return `
    <tr>
      <td style="
        height:${rowH}px;
        padding:0;
        border-bottom:${last ? "none" : `1px solid ${DIVIDER}`};
        vertical-align:middle;
      ">
        <table dir="rtl" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
          <tr>
            <td style="width:${ICON + 8}px;vertical-align:middle;padding:0 0 0 8px;">
              ${icon}
            </td>
            <td style="direction:rtl;text-align:right;vertical-align:middle;white-space:nowrap;">
              <div style="color:${MUTED};font-size:7px;font-weight:700;font-family:${FONT};line-height:1.15;">
                ${spacedAr(label)}
              </div>
              <div style="color:${valueColor};font-size:12px;font-weight:700;font-family:${FONT};line-height:1.25;padding-top:2px;">
                ${spacedAr(value)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function qrCorners(inner) {
  const frame = QR_IMG + QR_FRAME_PAD * 2;
  const arm = 12;
  const thick = 2.4;
  const corner = (extra) =>
    `<div style="position:absolute;width:${arm}px;height:${arm}px;${extra}"></div>`;
  return `
    <div style="position:relative;width:${frame}px;height:${frame}px;margin:0 auto;">
      ${corner(`top:0;left:0;border-top:${thick}px solid ${BLUE};border-left:${thick}px solid ${BLUE};`)}
      ${corner(`top:0;right:0;border-top:${thick}px solid ${BLUE};border-right:${thick}px solid ${BLUE};`)}
      ${corner(`bottom:0;left:0;border-bottom:${thick}px solid ${BLUE};border-left:${thick}px solid ${BLUE};`)}
      ${corner(`bottom:0;right:0;border-bottom:${thick}px solid ${BLUE};border-right:${thick}px solid ${BLUE};`)}
      <div style="padding:${QR_FRAME_PAD}px;text-align:center;line-height:0;background:${WHITE};">${inner}</div>
    </div>
  `;
}

function waveFooter() {
  return `
    <div style="position:relative;width:${CARD_W}px;height:${FOOTER_H}px;overflow:hidden;">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 380 28"
        preserveAspectRatio="none"
        width="${CARD_W}"
        height="${FOOTER_H}"
        style="display:block;position:absolute;top:0;left:0;width:100%;height:100%;"
      >
        <path fill="${ORANGE}" d="M0 10 C36 1, 72 16, 118 8 C140 4, 155 12, 168 14 L168 28 L0 28 Z"/>
        <path fill="${BLUE}" d="M110 16 C160 4, 220 2, 280 8 C320 12, 350 4, 380 7 L380 28 L110 28 Z"/>
      </svg>
      <div style="
        position:absolute;right:12px;top:0;height:${FOOTER_H}px;
        line-height:${FOOTER_H}px;white-space:nowrap;direction:rtl;
      ">
        <span style="display:inline-block;vertical-align:middle;padding-left:5px;">${SVG_CAP}</span>
        <span style="
          color:${WHITE};font-size:7.5px;font-weight:700;font-family:${FONT};
          vertical-align:middle;
        ">${spacedAr("مستقبلك يبدأ من هنا")}</span>
      </div>
    </div>
  `;
}

function buildCardHtml({
  studentName: name,
  studentId,
  groupName,
  gradeName,
  qrSrc,
  branding,
}) {
  const grade = truncate(gradeName || "—", 22);
  const safeName = truncate(name, 22);
  const safeGroup = truncate(groupName || "—", 18);
  const safeId = String(studentId ?? "—");
  const teacherDisplay = teacherLabel(branding.teacherName);

  const qrInner = qrSrc
    ? `<img
        src="${qrSrc}"
        alt="QR"
        width="${QR_IMG}"
        height="${QR_IMG}"
        style="
          width:${QR_IMG}px;height:${QR_IMG}px;
          object-fit:contain;display:block;background:${WHITE};
          image-rendering:-webkit-optimize-contrast;
          image-rendering:pixelated;
        "
      />`
    : `<div style="width:${QR_IMG}px;height:${QR_IMG}px;text-align:center;line-height:${QR_IMG}px;font-size:8px;color:#A0AEC0;font-family:${FONT};">لا&nbsp;QR</div>`;

  const qrFrameW = QR_IMG + QR_FRAME_PAD * 2;

  return `
<div dir="ltr" style="
  position:relative;
  width:${CARD_W}px;
  height:${CARD_H}px;
  border-radius:12px;
  overflow:hidden;
  border:1.5px solid ${BORDER};
  background:${WHITE};
  font-family:${FONT};
  box-sizing:border-box;
">
  <div style="position:relative;height:${HEADER_H}px;overflow:hidden;">
    <div style="
      position:absolute;top:0;right:0;
      background:${BLUE};color:${WHITE};
      border-radius:0 0 0 12px;
      padding:7px 11px 7px 12px;
      line-height:1;
      white-space:nowrap;
      direction:rtl;
    ">
      <span style="display:inline-block;vertical-align:middle;padding-left:5px;">${SVG_BADGE}</span>
      <span style="
        color:${WHITE};font-size:8.5px;font-weight:700;font-family:${FONT};
        vertical-align:middle;
      ">${spacedAr("بطاقة طالب")}</span>
    </div>
    <div style="
      position:absolute;right:108px;top:0;left:${RIGHT_W + 12}px;height:${HEADER_H}px;
      line-height:${HEADER_H}px;overflow:hidden;
      color:${BLUE};font-size:13px;font-weight:700;font-family:${FONT};
      white-space:nowrap;direction:rtl;text-align:right;
    ">${spacedAr(teacherDisplay)}</div>
  </div>

  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;height:${BODY_H}px;table-layout:fixed;">
    <tr>
      <td style="
        width:${RIGHT_W}px;
        vertical-align:middle;
        text-align:center;
        padding:0 6px;
        height:${BODY_H}px;
      ">
        ${qrCorners(qrInner)}
        <div style="width:${qrFrameW}px;margin:${QR_GAP}px auto 0 auto;">
          <div style="
            background:${BLUE};color:${WHITE};
            font-size:7px;font-weight:700;font-family:${FONT};
            line-height:1;padding:4px 0;border-radius:3px 3px 0 0;
            white-space:nowrap;
          ">${spacedAr("كود الطالب")}</div>
          <div style="
            border:1px solid ${BORDER};border-top:none;
            border-radius:0 0 3px 3px;
            padding:3px 2px;
            color:${INK};font-size:10px;font-weight:700;font-family:${FONT};
            letter-spacing:0.2px;line-height:1.2;white-space:nowrap;
          ">${spacedAr(safeId)}</div>
        </div>
      </td>
      <td style="width:1px;background:${DIVIDER};font-size:0;line-height:0;">&nbsp;</td>
      <td style="
        vertical-align:middle;padding:0 12px 0 10px;
        height:${BODY_H}px;
      ">
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;height:${BODY_H}px;">
          ${infoRow({
            icon: circleIcon(BLUE, SVG_USER),
            label: "اسم الطالب",
            value: safeName,
            valueColor: BLUE,
          })}
          ${infoRow({
            icon: circleIcon(BLUE, SVG_BOOK),
            label: "الصف الدراسي",
            value: grade,
            valueColor: BLUE,
          })}
          ${infoRow({
            icon: circleIcon(ORANGE, SVG_GROUP),
            label: "اسم المجموعة",
            value: safeGroup,
            valueColor: ORANGE,
            last: true,
          })}
        </table>
      </td>
    </tr>
  </table>

  ${waveFooter()}
</div>`;
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
  const halfGap = GRID_GAP / 2;

  const rowHtml = Array.from({ length: GRID_ROWS }, (_, rowIdx) => {
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

  return `
    <div id="pdf-page" style="
      width:${PAGE_RENDER_W}px;
      height:${PAGE_RENDER_H}px;
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

  iframe.style.width = `${PAGE_RENDER_W}px`;
  iframe.style.height = `${PAGE_RENDER_H}px`;

  await waitForImages(pageEl);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const canvas = await html2canvas(pageEl, {
    scale: 4,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: PAGE_RENDER_W,
    height: PAGE_RENDER_H,
    windowWidth: PAGE_RENDER_W,
    windowHeight: PAGE_RENDER_H,
    logging: false,
    letterRendering: true,
    imageTimeout: 15000,
  });

  document.body.removeChild(iframe);
  return canvas;
}

/**
 * Generate PDF — 12 cards per A4 landscape page (3×4 grid).
 * Card size stays fixed even when a page has a single card.
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
