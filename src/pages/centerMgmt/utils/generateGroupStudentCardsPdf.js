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

const LEFT_W = Math.round(CARD_W * 0.14);
const QR_COL_W = Math.round(CARD_W * 0.28);
const QR_RIGHT_PAD = 8;
const QR_FRAME_PAD = 3;
const FOOTER_H = 8;
const QR_IMG = Math.min(QR_COL_W - QR_RIGHT_PAD - 18, CARD_H - 70 - FOOTER_H);
const ICON = 16;
const TITLE_H = 32;
const INFO_ROW_H = 26;

const BLUE = "#004AAD";
const ORANGE = "#FF7A00";
const INK = "#1A1A1A";
const WHITE = "#FFFFFF";
const BORDER = "#E6EAF0";
const LINE = "#E8EDF2";
const DOT = "#C5CDD6";

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
  const raw = truncate(String(name || "المدرس").trim(), 16);
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

function titleDots() {
  const cell = `<td style="padding:1.6px;"><div style="width:3.4px;height:3.4px;border-radius:50%;background:${DOT};"></div></td>`;
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cell.repeat(4)}</tr><tr>${cell.repeat(4)}</tr></table>`;
}

let cardTitleCache = new Map();

/** html2canvas بيلخبط العربي المتصل — نرسم العنوان على Canvas ونحطه كصورة */
async function getCardTitleImage(teacherDisplay) {
  const key = String(teacherDisplay || "المدرس");
  if (cardTitleCache.has(key)) return cardTitleCache.get(key);

  try {
    await document.fonts.load("700 15px Tahoma");
    await document.fonts.ready;
  } catch {
    // fallback to system Tahoma
  }

  const cssW = 250;
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
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.direction = "ltr";

  const parts = [
    { text: key, color: BLUE, size: 13 },
    { text: "سنتر", color: ORANGE, size: 15 },
    { text: "كارت", color: BLUE, size: 15 },
  ];
  const gap = 6;

  const measure = (part) => {
    ctx.font = `700 ${part.size}px Tahoma, Arial, sans-serif`;
    return ctx.measureText(part.text).width;
  };

  let widths = parts.map(measure);
  let total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  if (total > cssW - 4) {
    parts[0].size = 11;
    parts[1].size = 13;
    parts[2].size = 13;
    widths = parts.map(measure);
    total = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  }

  let x = Math.max(0, (cssW - total) / 2);
  const y = Math.round(cssH * 0.72);
  parts.forEach((part, i) => {
    ctx.font = `700 ${part.size}px Tahoma, Arial, sans-serif`;
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, x, y);
    x += widths[i] + gap;
  });

  const image = {
    src: canvas.toDataURL("image/png"),
    width: cssW,
    height: cssH,
  };
  cardTitleCache.set(key, image);
  return image;
}

let infoLineCache = new Map();

async function getInfoLineImage(label, value) {
  const key = `${label}::${value}`;
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
  ctx.fillStyle = ORANGE;
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

function dottedRule(dots = ["#004AAD", "#FF7A00", "#004AAD"]) {
  const beads = dots
    .map(
      (c) =>
        `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${c};margin:0 2px;vertical-align:middle;"></span>`
    )
    .join("");
  return `
    <div style="position:relative;height:10px;">
      <div style="position:absolute;left:16%;right:16%;top:5px;height:1px;background:${LINE};"></div>
      <div style="position:relative;text-align:center;line-height:10px;font-size:0;">
        <span style="display:inline-block;background:${WHITE};padding:0 7px;">${beads}</span>
      </div>
    </div>
  `;
}

function rowSep() {
  return `
    <tr>
      <td style="padding:0;height:7px;font-size:0;line-height:0;">
        <div style="position:relative;height:7px;">
          <div style="position:absolute;right:2px;left:6px;top:3px;height:1px;background:${LINE};"></div>
          <div style="position:absolute;right:0;top:1px;width:5px;height:5px;border-radius:50%;background:${ORANGE};"></div>
        </div>
      </td>
    </tr>
  `;
}

function infoRow({ icon, lineImg, last }) {
  const displayH = 20;
  const displayW = Math.round(lineImg.width * (displayH / lineImg.height));
  return `
    <tr>
      <td style="padding:2px 0;height:${INFO_ROW_H}px;vertical-align:middle;overflow:visible;">
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
        <td style="border:2.5px solid ${BLUE};border-radius:10px;padding:3px;background:${WHITE};">
          <table cellpadding="0" cellspacing="0" style="border-collapse:separate;">
            <tr>
              <td style="border:2px solid ${ORANGE};border-radius:7px;padding:${QR_FRAME_PAD}px;background:${WHITE};line-height:0;font-size:0;">
                ${inner}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function leftBar(uid, code) {
  const slant = 14;
  const pid = `dots-${uid}`;
  const badgeW = LEFT_W - slant - 8;
  const badgeH = 22;
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${LEFT_W}"
      height="${CARD_H}"
      viewBox="0 0 ${LEFT_W} ${CARD_H}"
      style="position:absolute;left:0;top:0;display:block;"
    >
      <defs>
        <pattern id="${pid}" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.05" fill="rgba(255,255,255,0.22)"/>
        </pattern>
      </defs>
      <polygon points="0,0 ${LEFT_W},0 ${LEFT_W - slant},${CARD_H} 0,${CARD_H}" fill="${BLUE}"/>
      <polygon points="0,0 ${LEFT_W},0 ${LEFT_W - slant},${CARD_H} 0,${CARD_H}" fill="url(#${pid})"/>
    </svg>
    <div style="
      position:absolute;left:4px;bottom:${FOOTER_H + 6}px;
      width:${badgeW}px;height:${badgeH}px;
      z-index:7;
    ">
      <table cellpadding="0" cellspacing="0" style="
        border-collapse:collapse;width:${badgeW}px;height:${badgeH}px;
        background:#003580;border:1.5px solid ${WHITE};border-radius:6px;
      ">
        <tr>
          <td style="
            width:${badgeW}px;height:${badgeH}px;
            text-align:center;vertical-align:middle;
            color:${WHITE};font-size:9px;font-weight:700;font-family:${FONT};
            line-height:1.35;letter-spacing:0;
            padding:2px 2px 3px;
            overflow:visible;white-space:nowrap;
          ">${escapeHtml(code)}</td>
        </tr>
      </table>
    </div>
  `;
}

function cornerDecor() {
  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="32"
      viewBox="0 0 64 32"
      style="position:absolute;top:0;right:0;display:block;z-index:0;pointer-events:none;"
    >
      <path fill="${BLUE}" d="M64 0 H34 C46 6, 56 16, 64 32 Z"/>
      <path fill="${ORANGE}" d="M64 0 H42 C52 5, 58 14, 64 26 Z"/>
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="96"
      height="36"
      viewBox="0 0 96 36"
      style="position:absolute;bottom:${FOOTER_H}px;right:0;display:block;z-index:0;pointer-events:none;"
    >
      <path fill="${BLUE}" d="M96 36 H10 C30 32, 54 14, 96 18 Z"/>
      <path fill="${ORANGE}" d="M96 36 H32 C52 30, 72 22, 96 24 Z"/>
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
  border-radius:12px;
  overflow:hidden;
  border:1px solid ${BORDER};
  background:${WHITE};
  font-family:${FONT};
  box-sizing:border-box;
">
  ${leftBar(uid, safeId)}
  ${cornerDecor()}

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
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 auto;">
      <tr>
        <td style="width:22px;text-align:center;vertical-align:middle;">${titleDots()}</td>
        <td style="text-align:center;vertical-align:middle;padding:0 2px;line-height:0;">
          <img
            src="${titleImg.src}"
            alt=""
            width="${titleImg.width}"
            height="${titleImg.height}"
            style="
              display:block;
              height:20px;
              width:auto;
              max-width:210px;
              margin:0 auto;
              border:0;
            "
          />
        </td>
        <td style="width:22px;text-align:center;vertical-align:middle;">${titleDots()}</td>
      </tr>
    </table>
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
        padding:${TITLE_H + 2}px 8px ${FOOTER_H + 8}px 8px;
        overflow:visible;
      ">
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
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
        padding:${TITLE_H}px ${QR_RIGHT_PAD}px ${FOOTER_H + 8}px 4px;
        overflow:hidden;
      ">${qrFrame(qrInner)}</td>
    </tr>
  </table>

  <div style="
    position:absolute;left:0;right:0;bottom:0;z-index:6;
    height:${FOOTER_H}px;
    background:${BLUE};
  "></div>
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
