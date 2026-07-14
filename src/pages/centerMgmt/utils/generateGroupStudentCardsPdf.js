import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { fetchStudentQr } from "../../../api/centerMgmtApi";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import { field, studentCode, studentName } from "../centerMgmtUtils";

/** 12 cards per A4 landscape — 3 cols × 4 rows */
const CARD_W = 300;
const CARD_H = 158;
const CARDS_PER_PAGE = 12;
const GRID_COLS = 3;
const GRID_ROWS = 4;
const GRID_GAP = 10;
const PAGE_PAD = 10;

const BLUE = "#1565A8";
const ORANGE = "#E86A12";
const BORDER = "#7EB8E0";

/**
 * Tahoma + Cairo: Tahoma أولوية لـ html2canvas لأنه يثبت تشكيل العربي.
 * (overflow+ellipsis مع Cairo كانت سبب تقطيع الحروف في الـ PDF)
 */
const FONT = "Tahoma,'Cairo','Segoe UI',Arial,sans-serif";

async function toDataUrl(url) {
  if (!url) return null;
  if (String(url).startsWith("data:")) return url;
  try {
    const absolute = url.startsWith("http")
      ? url
      : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    const res = await fetch(absolute, { mode: "cors", credentials: "omit" });
    if (!res.ok) return absolute;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url.startsWith("http") ? url : `${window.location.origin}${url}`;
  }
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
  let teacherPhoto =
    user.avatar || user.avatar_url || user.photo || user.image || null;

  if (subdomain) {
    try {
      const res = await fetchTenantPublic(subdomain);
      const tenant = res?.data?.tenant;
      const teacher = res?.data?.teacher;
      teacherName = teacher?.name || tenant?.display_name || teacherName;
      teacherPhoto =
        teacher?.avatar ||
        teacher?.avatar_url ||
        teacher?.photo ||
        tenant?.avatar_url ||
        teacherPhoto;
    } catch {
      // keep fallbacks
    }
  }

  const photoData = await toDataUrl(teacherPhoto);

  return {
    teacherName,
    teacherPhoto: photoData || teacherPhoto || null,
  };
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

function avatarFallbackSvg() {
  return `
    <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#D6E9F8"/>
      <circle cx="32" cy="23" r="12" fill="${BLUE}"/>
      <path d="M10 58c2.5-12 10.5-18 22-18s19.5 6 22 18" fill="${BLUE}"/>
    </svg>`;
}

function idIconSvg() {
  return `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink:0;">
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="${BLUE}" stroke-width="1.8"/>
      <circle cx="8.5" cy="12" r="2.2" stroke="${BLUE}" stroke-width="1.6"/>
      <path d="M13.2 10h5.2M13.2 14h4" stroke="${BLUE}" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
}

function buildCardHtml({
  studentName: name,
  studentId,
  groupName,
  gradeName,
  qrSrc,
  branding,
}) {
  const grade = escapeHtml(truncate(gradeName || "—", 26));
  const safeName = escapeHtml(truncate(name, 28));
  const headerGroup = escapeHtml(truncate(groupName || "—", 20));
  const safeId = escapeHtml(String(studentId ?? "—"));
  const teacher = escapeHtml(truncate(branding.teacherName || "المدرس", 14));
  const teacherPhoto = branding.teacherPhoto;

  const teacherPhotoBlock = teacherPhoto
    ? `<img src="${teacherPhoto}" alt="" crossorigin="anonymous" width="48" height="48" style="width:48px;height:48px;object-fit:cover;display:block;border-radius:50%;" />`
    : avatarFallbackSvg();

  const qrBlock = qrSrc
    ? `<img src="${qrSrc}" alt="QR" width="64" height="64" style="width:64px;height:64px;object-fit:contain;display:block;" />`
    : `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#64748b;font-family:${FONT};">لا QR</div>`;

  // ملاحظة: ممنوع overflow:hidden + text-overflow:ellipsis على العربي مع html2canvas
  return `
<table dir="rtl" cellpadding="0" cellspacing="0" style="
  width:${CARD_W}px;
  height:${CARD_H}px;
  border-collapse:separate;
  border-spacing:0;
  border-radius:14px;
  overflow:hidden;
  border:2px solid ${BORDER};
  background:#ffffff;
  font-family:${FONT};
  table-layout:fixed;
">
  <tr>
    <td colspan="3" style="
      background:${BLUE};
      padding:7px 12px;
      vertical-align:middle;
    ">
      <table dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:${FONT};">
        <tr>
          <td style="
            color:#ffffff;
            font-size:11px;
            font-weight:700;
            font-family:${FONT};
            line-height:1.35;
            text-align:right;
            white-space:nowrap;
          ">${grade}</td>
          <td style="
            color:#ffffff;
            font-size:11px;
            font-weight:700;
            font-family:${FONT};
            line-height:1.35;
            text-align:left;
            white-space:nowrap;
            width:48%;
          ">
            <span style="color:${ORANGE};">●</span>
            &nbsp;${headerGroup}&nbsp;
            <span style="color:${ORANGE};">●</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="width:72px;padding:8px 6px 6px 4px;vertical-align:middle;text-align:center;background:#fff;">
      <div style="
        width:52px;
        height:52px;
        margin:0 auto 5px;
        border:2.5px solid ${BLUE};
        border-radius:50%;
        overflow:hidden;
        background:#D6E9F8;
        line-height:0;
      ">${teacherPhotoBlock}</div>
      <div style="
        color:${BLUE};
        font-size:10px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.3;
        text-align:center;
      ">${teacher}</div>
    </td>

    <td style="padding:8px 4px 6px;vertical-align:middle;background:#fff;">
      <div style="
        color:${BLUE};
        font-size:13px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.3;
        margin-bottom:7px;
        text-align:right;
        white-space:nowrap;
      ">${safeName}</div>
      <div style="
        color:${BLUE};
        font-size:12px;
        font-weight:700;
        font-family:${FONT};
        line-height:1.35;
        text-align:right;
        white-space:nowrap;
      ">
        ${idIconSvg()}
        <span style="vertical-align:middle;">&nbsp;الكود : ${safeId}</span>
      </div>
    </td>

    <td style="width:80px;padding:8px 8px 6px 6px;vertical-align:middle;text-align:center;background:#fff;">
      <div style="
        width:70px;
        height:70px;
        margin:0 auto;
        border:2.5px solid ${ORANGE};
        border-radius:8px;
        padding:3px;
        background:#fff;
        box-sizing:border-box;
      ">${qrBlock}</div>
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
  const pageW = GRID_COLS * CARD_W + (GRID_COLS - 1) * GRID_GAP + PAGE_PAD * 2;
  const slots = Array.from({ length: CARDS_PER_PAGE }, (_, i) => cardHtmlList[i] || "");
  const filled = slots.filter(Boolean).length;
  const rows = Math.min(GRID_ROWS, Math.ceil(filled / GRID_COLS) || 1);

  const cardsHtml = slots
    .map((card) => {
      if (!card) {
        return `<div style="width:${CARD_W}px;height:${CARD_H}px;"></div>`;
      }
      return `<div style="width:${CARD_W}px;height:${CARD_H}px;">${card}</div>`;
    })
    .join("");

  return `
    <div id="pdf-page" style="
      width:${pageW}px;
      padding:${PAGE_PAD}px;
      background:#ffffff;
      box-sizing:border-box;
      font-family:${FONT};
      display:grid;
      grid-template-columns:repeat(${GRID_COLS}, ${CARD_W}px);
      grid-template-rows:repeat(${rows}, ${CARD_H}px);
      gap:${GRID_GAP}px;
      align-content:start;
      justify-content:start;
    ">
      ${cardsHtml}
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
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: pageEl.scrollWidth,
    height: pageEl.scrollHeight,
    logging: false,
    letterRendering: true,
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
  const margin = 6;

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
    const imgRatio = canvas.width / canvas.height;
    let drawW = pageW - margin * 2;
    let drawH = drawW / imgRatio;
    if (drawH > pageH - margin * 2) {
      drawH = pageH - margin * 2;
      drawW = drawH * imgRatio;
    }
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    if (pageIdx > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", x, y, drawW, drawH, undefined, "FAST");
  }

  const safeName = String(groupName || "group")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  pdf.save(`كروت-سنتر-${safeName || "group"}.pdf`);
}
