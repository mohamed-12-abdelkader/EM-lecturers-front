import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { fetchStudentQr } from "../../../api/centerMgmtApi";
import { fetchTenantPublic } from "../../../api/tenantPublicApi";
import { getTenantSubdomain } from "../../../utils/tenantHost";
import { field, studentCode, studentName } from "../centerMgmtUtils";

/**
 * العرض الأفقي يملأ الصفحة (3 أعمدة).
 * الارتفاع الرأسي ثابت 53.98 مم — أي فراغ يتبقى ينزل أسفل الصفحة.
 */
const A4_W_MM = 297;
const A4_H_MM = 210;
const CARD_H_MM = 53.98;
const PX_PER_MM = 4;
const PAGE_RENDER_W = Math.round(A4_W_MM * PX_PER_MM);
const PAGE_RENDER_H = Math.round(A4_H_MM * PX_PER_MM);
const GRID_COLS = 3;
const GRID_ROWS = 3;
const CARDS_PER_PAGE = 9;
const PAGE_PAD_X = Math.round(3.5 * PX_PER_MM);
const PAGE_PAD_TOP = Math.round(3.5 * PX_PER_MM);
const GRID_GAP = Math.round(2.2 * PX_PER_MM);

const CARD_W = Math.floor(
  (PAGE_RENDER_W - PAGE_PAD_X * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
);
const CARD_H = Math.round(CARD_H_MM * PX_PER_MM);
const GRID_H = GRID_ROWS * CARD_H + (GRID_ROWS - 1) * GRID_GAP;
const PAGE_PAD_BOTTOM = Math.max(0, PAGE_RENDER_H - PAGE_PAD_TOP - GRID_H);

const LEFT_W = Math.round(CARD_W * 0.12);
const QR_COL_W = Math.round(CARD_W * 0.34);
const QR_RIGHT_PAD = 4;
const ICON = 16;
const TITLE_H = 38;
const QR_IMG = Math.min(QR_COL_W - QR_RIGHT_PAD - 10, CARD_H - TITLE_H - 18);
const INFO_ROW_H = 26;

const BLUE = "#3182CE";
const BLUE_DEEP = "#2B6CB0";
const ORANGE = "#DD6B20";
const INK = "#1A365D";
const LABEL = "#2C5282";
const LINE = "#BEE3F8";
const WHITE = "#FFFFFF";
const PAPER = "#B6D9F5";
const PANEL = "#FFFFFF";

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

function asDataUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return `data:image/png;base64,${s}`;
}

function pickQrImage(source) {
  if (!source || typeof source !== "object") return null;
  const nested =
    source.data && typeof source.data === "object" ? source.data : source;
  return (
    field(
      nested,
      "qr_image_base64",
      "qrImageBase64",
      "qr_image",
      "qrImage",
      "image_base64",
      "image"
    ) ||
    field(source, "qr_image_base64", "qrImageBase64", "qr_image", "qrImage")
  );
}

function pickQrText(qrData, student) {
  const src =
    qrData?.data && typeof qrData.data === "object"
      ? { ...qrData, ...qrData.data }
      : qrData || {};
  const payload = field(src, "qr_payload", "qrPayload", "payload", "content");
  if (payload) return String(payload);
  const token =
    field(src, "qr_token", "qrToken", "token") ||
    field(student, "qr_token", "qrToken");
  if (token) {
    return JSON.stringify({ type: "tc_student", qr_token: token });
  }
  if (student?.id) {
    return JSON.stringify({
      type: "tc_student",
      student_id: student.id,
      student_code: studentCode(student),
    });
  }
  return "";
}

async function resolveQrSrc(qrData, student) {
  const fromApi = asDataUrl(pickQrImage(qrData)) || asDataUrl(pickQrImage(student));
  if (fromApi) return fromApi;

  const text = pickQrText(qrData, student);
  if (!text) return null;
  try {
    return await QRCode.toDataURL(text, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#FFFFFF" },
    });
  } catch {
    return null;
  }
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
  const raw = truncate(String(name || "المدرس").trim(), 20);
  if (/^(مستر|أ[.\s]|ا\.|الاستاذ|الأستاذ)/i.test(raw)) return raw;
  return `مستر ${raw}`;
}

function circleIcon(bg, svg) {
  return `
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:${ICON}px;height:${ICON}px;margin:0 auto;">
      <tr>
        <td style="
          width:${ICON}px;height:${ICON}px;
          background:${bg};border-radius:50%;
          text-align:center;vertical-align:middle;line-height:0;
        ">${svg}</td>
      </tr>
    </table>
  `;
}

const SVG_USER = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${WHITE}"><circle cx="12" cy="8" r="4.2"/><path d="M4 20.2c0-3.8 3.5-6.4 8-6.4s8 2.6 8 6.4"/></svg>`;
const SVG_TEACHER = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="3.5" width="13.5" height="9.5" rx="1.2" stroke="${WHITE}" stroke-width="1.8"/><path d="M4.5 15.5h9.5" stroke="${WHITE}" stroke-width="1.8" stroke-linecap="round"/><circle cx="17.2" cy="16" r="2.3" fill="${WHITE}"/><path d="M14.2 21.2c.2-1.7 1.4-2.8 3-2.8s2.8 1.1 3 2.8" fill="${WHITE}"/></svg>`;
const SVG_BOOK = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${WHITE}"><path d="M5 4h6.5c.4 0 .7.3.7.7v14.2l-3.7-1.7-3.5 1.7V4.7c0-.4.3-.7.7-.7z"/><path d="M19 4h-6.5c-.4 0-.7.3-.7.7v14.2l3.7-1.7 3.5 1.7V4.7c0-.4-.3-.7-.7-.7z"/></svg>`;
const SVG_GROUP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${WHITE}"><circle cx="9" cy="8" r="3.2"/><circle cx="16.4" cy="9" r="2.6"/><path d="M3 19.8c0-3.1 2.6-5.3 6-5.3s6 2.2 6 5.3"/><path d="M13.8 19.8c.3-2.1 1.9-3.7 4.1-3.8 2.1.1 3.3 1.7 3.3 3.8"/></svg>`;
const SVG_BADGE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="4" y="7" width="16" height="13" rx="2" stroke="${WHITE}" stroke-width="2"/><circle cx="9.2" cy="13.2" r="2.1" fill="${WHITE}"/><path d="M13.2 12h5.2M13.2 15.2h4" stroke="${WHITE}" stroke-width="1.8" stroke-linecap="round"/><path d="M9 7V5.2a3 3 0 0 1 6 0V7" stroke="${WHITE}" stroke-width="2" fill="none"/></svg>`;

let cardTitleCache = new Map();

/** html2canvas بيلخبط العربي المتصل — نرسم العنوان على Canvas ونحطه كصورة */
async function getCardTitleImage(teacherDisplay) {
  const display = String(teacherDisplay || "المدرس");
  const cacheKey = `v9:${display}`;
  if (cardTitleCache.has(cacheKey)) return cardTitleCache.get(cacheKey);

  try {
    await document.fonts.load("700 16px Tahoma");
    await document.fonts.ready;
  } catch {
    // fallback to system Tahoma
  }

  const cssW = 300;
  const cssH = 34;
  const scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * scale);
  canvas.height = Math.round(cssH * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, cssW, cssH);

  const color = INK;
  const gap = 8;
  const parts = [
    { text: display, size: 15 },
    { text: "سنتر", size: 15 },
    { text: "كارت", size: 15 },
  ];

  const measure = (text, size) => {
    ctx.font = `700 ${size}px Tahoma, Arial, sans-serif`;
    return ctx.measureText(text).width;
  };

  let size = 15;
  let widths = parts.map((p) => measure(p.text, size));
  let total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  if (total > cssW - 28) {
    size = 13;
    widths = parts.map((p) => measure(p.text, size));
    total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  }

  const pillW = Math.min(cssW - 4, total + 20);
  const pillH = cssH - 6;
  const pillX = (cssW - pillW) / 2;
  const pillY = 3;
  const radius = 8;

  ctx.beginPath();
  ctx.moveTo(pillX + radius, pillY);
  ctx.lineTo(pillX + pillW - radius, pillY);
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + radius);
  ctx.lineTo(pillX + pillW, pillY + pillH - radius);
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH);
  ctx.lineTo(pillX + radius, pillY + pillH);
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - radius);
  ctx.lineTo(pillX, pillY + radius);
  ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
  ctx.closePath();
  ctx.fillStyle = WHITE;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = BLUE;
  ctx.stroke();

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.font = `700 ${size}px Tahoma, Arial, sans-serif`;
  ctx.fillStyle = color;

  let x = (cssW - total) / 2;
  const y = Math.round(cssH * 0.68);
  parts.forEach((part, i) => {
    ctx.fillText(part.text, x, y);
    x += widths[i] + gap;
  });

  const image = {
    src: canvas.toDataURL("image/png"),
    width: cssW,
    height: cssH,
  };
  cardTitleCache.set(cacheKey, image);
  return image;
}

let infoLineCache = new Map();

async function getInfoLineImage(label, value) {
  const key = `v6:${label}::${value}`;
  if (infoLineCache.has(key)) return infoLineCache.get(key);

  try {
    await document.fonts.load("700 20px Tahoma");
    await document.fonts.ready;
  } catch {
    // fallback to system Tahoma
  }

  const labelSize = 13;
  const valueSize = 16;
  const padX = 4;
  const padTop = 6;
  const padBottom = 10;
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  mctx.font = `700 ${labelSize}px Tahoma, Arial, sans-serif`;
  const labelW = mctx.measureText(label).width;
  const colonW = mctx.measureText(" : ").width;
  mctx.font = `700 ${valueSize}px Tahoma, Arial, sans-serif`;
  const valueMetrics = mctx.measureText(value);
  const valueW = valueMetrics.width;
  const ascent = Math.max(
    valueMetrics.actualBoundingBoxAscent || valueSize * 0.8,
    labelSize * 0.8
  );
  const descent = Math.max(
    valueMetrics.actualBoundingBoxDescent || valueSize * 0.4,
    labelSize * 0.4
  );

  const cssW = Math.ceil(padX * 2 + labelW + colonW + valueW + 4);
  const cssH = Math.ceil(padTop + ascent + descent + padBottom);
  const scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * scale);
  canvas.height = Math.round(cssH * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "right";
  ctx.direction = "rtl";

  const y = padTop + ascent;
  let x = cssW - padX;

  ctx.direction = "rtl";
  ctx.font = `700 ${labelSize}px Tahoma, Arial, sans-serif`;
  ctx.fillStyle = LABEL;
  ctx.fillText(label, x, y);
  x -= labelW;

  ctx.direction = "ltr";
  ctx.fillText(" : ", x, y);
  x -= colonW;

  ctx.direction = "rtl";
  ctx.font = `700 ${valueSize}px Tahoma, Arial, sans-serif`;
  ctx.fillStyle = INK;
  ctx.fillText(value, x, y);

  const image = {
    src: canvas.toDataURL("image/png"),
    width: cssW,
    height: cssH,
  };
  infoLineCache.set(key, image);
  return image;
}

function dottedRule() {
  return `
    <div style="position:relative;height:10px;">
      <div style="position:absolute;left:16%;right:16%;top:5px;height:1px;background:${BLUE};opacity:0.45;"></div>
      <div style="position:relative;text-align:center;line-height:10px;font-size:0;">
        <span style="display:inline-block;padding:0 8px;">
          <span style="display:inline-block;width:5px;height:5px;background:${ORANGE};border-radius:50%;vertical-align:middle;"></span>
        </span>
      </div>
    </div>
  `;
}

function rowSep() {
  return `
    <tr>
      <td style="padding:0;height:6px;font-size:0;line-height:0;">
        <div style="height:1px;margin:2px 8px 0 8px;background:${LINE};"></div>
      </td>
    </tr>
  `;
}

function infoRow({ icon, lineImg, last }) {
  const displayH = 20;
  const displayW = Math.round(lineImg.width * (displayH / lineImg.height));
  return `
    <tr>
      <td style="padding:3px 8px 3px 6px;height:${INFO_ROW_H}px;vertical-align:middle;overflow:visible;">
        <table dir="rtl" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
          <tr>
            <td style="
              width:${ICON + 6}px;
              vertical-align:middle;text-align:center;padding:0 0 0 6px;
            ">${icon}</td>
            <td dir="rtl" style="
              text-align:right;vertical-align:middle;
              padding:0;overflow:visible;line-height:0;
            ">
              <img
                src="${lineImg.src}"
                alt=""
                width="${displayW}"
                height="${displayH}"
                style="
                  display:block;
                  height:${displayH}px;
                  width:auto;
                  max-width:100%;
                  margin-right:0;
                  margin-left:auto;
                  border:0;
                "
              />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${last ? "" : rowSep()}
  `;
}

function qrFrame(inner) {
  return `
    <table cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 auto;">
      <tr>
        <td style="
          border:1.6px solid ${BLUE};
          border-radius:8px;
          padding:3px;
          background:${WHITE};
        ">
          <div style="line-height:0;font-size:0;background:${WHITE};">
            ${inner}
          </div>
        </td>
      </tr>
    </table>
  `;
}

function leftBar(uid) {
  const slant = 8;
  const pid = `dots-${uid}`;
  const gid = `navy-${uid}`;
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${LEFT_W}"
      height="${CARD_H}"
      viewBox="0 0 ${LEFT_W} ${CARD_H}"
      style="position:absolute;left:0;top:0;display:block;z-index:4;"
    >
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${BLUE}"/>
          <stop offset="100%" stop-color="${BLUE_DEEP}"/>
        </linearGradient>
        <pattern id="${pid}" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="1.1" cy="1.1" r="0.7" fill="rgba(255,255,255,0.28)"/>
        </pattern>
      </defs>
      <polygon points="0,0 ${LEFT_W},0 ${LEFT_W - slant},${CARD_H} 0,${CARD_H}" fill="url(#${gid})"/>
      <polygon points="0,0 ${LEFT_W},0 ${LEFT_W - slant},${CARD_H} 0,${CARD_H}" fill="url(#${pid})"/>
      <polygon points="${LEFT_W - 2.4},0 ${LEFT_W},0 ${LEFT_W - slant},${CARD_H} ${LEFT_W - slant - 2.4},${CARD_H}" fill="${ORANGE}"/>
    </svg>
  `;
}

function cardAtmosphere(uid) {
  const paper = `paper-${uid}`;
  const glowB = `glowb-${uid}`;
  const glowO = `glowo-${uid}`;
  const inset = 3.2;
  const w = CARD_W;
  const h = CARD_H;
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${w}"
      height="${h}"
      viewBox="0 0 ${w} ${h}"
      style="position:absolute;left:0;top:0;display:block;z-index:0;pointer-events:none;"
    >
      <defs>
        <linearGradient id="${paper}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7EB6EA"/>
          <stop offset="38%" stop-color="#C5E4F9"/>
          <stop offset="68%" stop-color="#F8E1C4"/>
          <stop offset="100%" stop-color="#F0A35A"/>
        </linearGradient>
        <radialGradient id="${glowB}" cx="12%" cy="8%" r="52%">
          <stop offset="0%" stop-color="#63B3ED" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#63B3ED" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${glowO}" cx="92%" cy="92%" r="58%">
          <stop offset="0%" stop-color="#DD6B20" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#DD6B20" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#${paper})"/>
      <rect width="${w}" height="${h}" fill="url(#${glowB})"/>
      <rect width="${w}" height="${h}" fill="url(#${glowO})"/>
      <path
        d="M${w} 0 H${w - 92} C${w - 58} 12, ${w - 22} 34, ${w} 64 Z"
        fill="${BLUE}"
        fill-opacity="0.42"
      />
      <path
        d="M${w} 0 H${w - 58} C${w - 36} 8, ${w - 14} 24, ${w} 46 Z"
        fill="${ORANGE}"
        fill-opacity="0.88"
      />
      <path
        d="M${w} ${h} H${w - 84} C${w - 52} ${h - 14}, ${w - 18} ${h - 32}, ${w} ${h - 46} Z"
        fill="${ORANGE}"
        fill-opacity="0.38"
      />
      <path
        d="M${w} ${h} H${w - 52} C${w - 32} ${h - 10}, ${w - 12} ${h - 24}, ${w} ${h - 34} Z"
        fill="${BLUE}"
        fill-opacity="0.55"
      />
      <g fill="rgba(255,255,255,0.38)">
        <circle cx="${w - 22}" cy="10" r="1.4"/>
        <circle cx="${w - 14}" cy="10" r="1.4"/>
        <circle cx="${w - 18}" cy="16" r="1.4"/>
        <circle cx="${w - 10}" cy="16" r="1.4"/>
      </g>
      <rect
        x="${inset}" y="${inset}"
        width="${w - inset * 2}" height="${h - inset * 2}"
        fill="none" stroke="${ORANGE}" stroke-width="1.15" rx="8"
      />
    </svg>
  `;
}

function buildCardHtml({
  studentName: name,
  studentId,
  groupName,
  gradeName,
  qrSrc,
  branding,
  uniqueKey = "",
  titleImg,
  lineImgs,
}) {
  const grade = truncate(gradeName || "—", 20);
  const safeName = truncate(name, 20);
  const safeGroup = truncate(groupName || "—", 16);
  const safeId = String(studentId ?? "—");
  const uid = `c${String(uniqueKey || studentId || "x").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 28) || "x"}`;

  const qrInner = qrSrc
    ? `<div style="width:${QR_IMG}px;height:${QR_IMG}px;background:${WHITE};line-height:0;font-size:0;">
        <img
          src="${qrSrc}"
          alt="QR"
          width="${QR_IMG}"
          height="${QR_IMG}"
          style="
            width:${QR_IMG}px;height:${QR_IMG}px;
            display:block;border:0;
            background:${WHITE};
          "
        />
      </div>`
    : `<div style="width:${QR_IMG}px;height:${QR_IMG}px;background:${WHITE};"></div>`;

  return `
<div dir="ltr" style="
  position:relative;
  width:${CARD_W}px;
  height:${CARD_H}px;
  border-radius:10px;
  overflow:hidden;
  border:1.5px solid ${BLUE};
  background:${PAPER};
  font-family:${FONT};
  box-sizing:border-box;
">
  ${cardAtmosphere(uid)}
  ${leftBar(uid)}

  <div style="
    position:absolute;
    left:${LEFT_W}px;
    right:8px;
    top:4px;
    height:${TITLE_H}px;
    z-index:3;
    overflow:hidden;
    text-align:center;
  ">
    <div style="text-align:center;line-height:0;padding-top:1px;">
      <img
        src="${titleImg.src}"
        alt=""
        width="${titleImg.width}"
        height="${titleImg.height}"
        style="
          display:inline-block;
          height:26px;
          width:auto;
          max-width:270px;
          margin:0 auto;
          border:0;
        "
      />
    </div>
    ${dottedRule()}
  </div>

  <table cellpadding="0" cellspacing="0" style="
    border-collapse:collapse;width:100%;height:100%;
    table-layout:fixed;position:relative;z-index:2;
  ">
    <colgroup>
      <col style="width:${LEFT_W}px;" />
      <col />
      <col style="width:${QR_COL_W}px;" />
    </colgroup>
    <tr>
      <td style="width:${LEFT_W}px;padding:0;font-size:0;">&nbsp;</td>
      <td style="
        vertical-align:middle;
        padding:${TITLE_H + 2}px 8px 10px 8px;
        overflow:visible;
      ">
        <table cellpadding="0" cellspacing="0" style="
          border-collapse:collapse;width:100%;
          background:${PANEL};
          border:1px solid ${LINE};
          border-radius:8px;
        ">
          ${infoRow({ icon: circleIcon(BLUE, SVG_USER), lineImg: lineImgs.name })}
          ${infoRow({ icon: circleIcon(BLUE, SVG_BOOK), lineImg: lineImgs.grade })}
          ${infoRow({ icon: circleIcon(ORANGE, SVG_GROUP), lineImg: lineImgs.group })}
          ${infoRow({ icon: circleIcon(BLUE, SVG_BADGE), lineImg: lineImgs.code, last: true })}
        </table>
      </td>
      <td style="
        width:${QR_COL_W}px;
        vertical-align:middle;
        text-align:center;
        padding:${TITLE_H - 4}px ${QR_RIGHT_PAD}px 8px 2px;
        overflow:visible;
      ">${qrFrame(qrInner)}</td>
    </tr>
  </table>
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
      const qrSrc = await resolveQrSrc(qrData, student);
      if (qrSrc) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = qrSrc;
          setTimeout(resolve, 4000);
        });
      }
      return { student, qrSrc };
    })
  );
}

function buildPageHtml(cardHtmlList) {
  const slots = Array.from({ length: CARDS_PER_PAGE }, (_, i) => cardHtmlList[i] || "");
  const colCount = GRID_COLS * 2 - 1;

  const cardCell = (card) => `
    <td style="width:${CARD_W}px;height:${CARD_H}px;padding:0;vertical-align:top;">
      <div style="width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;">${card || ""}</div>
    </td>`;
  const gapCell = `<td style="width:${GRID_GAP}px;padding:0;font-size:0;line-height:0;"></td>`;
  const gapRow = `<tr><td colspan="${colCount}" style="height:${GRID_GAP}px;padding:0;font-size:0;line-height:0;"></td></tr>`;

  const rows = Array.from({ length: GRID_ROWS }, (_, rowIdx) => {
    const cols = Array.from({ length: GRID_COLS }, (_, colIdx) => {
      const card = slots[rowIdx * GRID_COLS + colIdx] || "";
      return cardCell(card) + (colIdx < GRID_COLS - 1 ? gapCell : "");
    }).join("");
    return `<tr>${cols}</tr>${rowIdx < GRID_ROWS - 1 ? gapRow : ""}`;
  }).join("");

  const gridW = GRID_COLS * CARD_W + (GRID_COLS - 1) * GRID_GAP;
  const gridH = GRID_ROWS * CARD_H + (GRID_ROWS - 1) * GRID_GAP;

  return `
    <div id="pdf-page" style="
      width:${PAGE_RENDER_W}px;
      height:${PAGE_RENDER_H}px;
      padding:${PAGE_PAD_TOP}px ${PAGE_PAD_X}px ${PAGE_PAD_BOTTOM}px ${PAGE_PAD_X}px;
      background:#ffffff;
      box-sizing:border-box;
      font-family:${FONT};
      overflow:hidden;
    ">
      <table dir="ltr" cellpadding="0" cellspacing="0" style="
        border-collapse:collapse;
        width:${gridW}px;
        height:${gridH}px;
        table-layout:fixed;
      ">
        ${rows}
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
    img { max-width: none; display: block; }
  </style>
</head>
<body>${pageInnerHtml}</body>
</html>`;
}

async function renderPageInIsolatedFrame(pageInnerHtml) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-16000px;top:0;border:0;opacity:0;pointer-events:none;";
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
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: PAGE_RENDER_W,
    height: PAGE_RENDER_H,
    windowWidth: PAGE_RENDER_W,
    windowHeight: PAGE_RENDER_H,
    logging: false,
    letterRendering: false,
    imageTimeout: 15000,
  });

  document.body.removeChild(iframe);
  return canvas;
}

/**
 * Generate PDF — 3×3 on A4 landscape. Card height 53.98mm; extra space at the bottom.
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
  const titleImg = await getCardTitleImage(teacherLabel(branding?.teacherName));
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

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

    const cardHtmlList = await Promise.all(
      slice.map(async ({ student, qrSrc }, cardIdx) => {
        const safeName = truncate(studentName(student), 20);
        const safeGroup = truncate(groupName || "—", 16);
        const safeGrade = truncate(gradeName || "—", 20);
        const safeId = String(studentCode(student) ?? "—");
        const [nameImg, gradeImg, groupImg, codeImg] = await Promise.all([
          getInfoLineImage("اسم الطالب", safeName),
          getInfoLineImage("الصف الدراسي", safeGrade),
          getInfoLineImage("اسم المجموعة", safeGroup),
          getInfoLineImage("كود الطالب", safeId),
        ]);
        return buildCardHtml({
          studentName: safeName,
          studentId: safeId,
          groupName: safeGroup,
          gradeName: safeGrade,
          qrSrc,
          branding,
          uniqueKey: `${pageIdx}-${cardIdx}-${student.id || safeId}`,
          titleImg,
          lineImgs: {
            name: nameImg,
            grade: gradeImg,
            group: groupImg,
            code: codeImg,
          },
        });
      })
    );

    const canvas = await renderPageInIsolatedFrame(buildPageHtml(cardHtmlList));

    const imgData = canvas.toDataURL("image/png");
    if (pageIdx > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, A4_W_MM, A4_H_MM, undefined, "NONE");
  }

  const safeName = String(groupName || "group")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  pdf.save(`كروت-سنتر-${safeName || "group"}.pdf`);
}
