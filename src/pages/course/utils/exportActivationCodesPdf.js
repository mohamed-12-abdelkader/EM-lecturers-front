import jsPDF from "jspdf";

const COLS = 3;
const ROWS = 4;
const CODES_PER_PAGE = COLS * ROWS;
const PAGE_W_MM = 297;
const PAGE_H_MM = 210;
/** ~150dpi — جودة جيدة وسرعة أعلى بكثير من html2canvas */
const PX_PER_MM = 6;
const PAGE_W = Math.round(PAGE_W_MM * PX_PER_MM);
const PAGE_H = Math.round(PAGE_H_MM * PX_PER_MM);
const GAP = Math.round(3 * PX_PER_MM);
const MARGIN = Math.round(4 * PX_PER_MM);
const FONT = "Tahoma, 'Segoe UI', Arial, sans-serif";
const PHONES = "01111272393 & 01132176865 & 01132176849";

function extractHexes(value) {
  return String(value || "").match(/#[0-9A-Fa-f]{3,8}\b/g) || [];
}

function firstHex(value, fallback) {
  return extractHexes(value)[0] || fallback;
}

function lastHex(value, fallback) {
  const list = extractHexes(value);
  return list[list.length - 1] || fallback;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // data URLs لا تحتاج crossOrigin
    if (!String(src).startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, fillStyle) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r, strokeStyle, lineWidth = 2) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function fitText(ctx, text, maxWidth) {
  const value = String(text || "");
  if (!value) return "";
  if (ctx.measureText(value).width <= maxWidth) return value;
  let out = value;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function drawCard(ctx, card, theme, meta) {
  const { x, y, w, h, code, qrImg } = card;
  const { courseName, teacherName, logoImg } = meta;
  const radius = 14;
  const headerH = Math.round(h * 0.22);
  const footerH = Math.round(h * 0.16);
  const accentH = Math.round(3.5 * PX_PER_MM);
  const headerFrom = firstHex(theme.headerGradient, "#0B1B3A");
  const headerTo = lastHex(theme.headerGradient, "#1E40AF");
  const accentFrom = firstHex(theme.accentBar, theme.codeColor || "#EA580C");
  const accentTo = lastHex(theme.accentBar, accentFrom);
  const footerColor = firstHex(theme.footerGradient, headerFrom);

  // بطاقة
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = theme.cardBg || "#fff";
  ctx.fill();
  ctx.strokeStyle = theme.border || "#DBEAFE";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();

  // هيدر
  const headerGrad = ctx.createLinearGradient(x, y, x + w, y);
  headerGrad.addColorStop(0, headerFrom);
  headerGrad.addColorStop(1, headerTo);
  ctx.fillStyle = headerGrad;
  ctx.fillRect(x, y, w, headerH);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const headerPad = 10;
  const headerY = y + headerH / 2;
  ctx.font = `700 ${Math.max(11, Math.round(h * 0.07))}px ${FONT}`;
  ctx.fillText(
    fitText(ctx, code.grade_name || "الصف", w * 0.28),
    x + w - headerPad,
    headerY,
  );

  ctx.font = `800 ${Math.max(12, Math.round(h * 0.085))}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(
    fitText(ctx, teacherName, w * 0.28),
    x + headerPad,
    headerY,
  );

  // شريحة اسم الكورس في المنتصف
  const chipText = fitText(ctx, courseName, w * 0.34);
  ctx.font = `700 ${Math.max(10, Math.round(h * 0.065))}px ${FONT}`;
  const chipW = Math.min(w * 0.4, ctx.measureText(chipText).width + 18);
  const chipH = Math.max(18, Math.round(h * 0.11));
  const chipX = x + (w - chipW) / 2;
  const chipY = y + (headerH - chipH) / 2;
  fillRoundRect(ctx, chipX, chipY, chipW, chipH, 8, "rgba(255,255,255,0.22)");
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(chipText, x + w / 2, headerY);

  // شريط تمييز
  const accentGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  accentGrad.addColorStop(0, accentFrom);
  accentGrad.addColorStop(1, accentTo);
  ctx.fillStyle = accentGrad;
  ctx.fillRect(x, y + headerH, w, accentH);

  // محتوى
  const contentTop = y + headerH + accentH;
  const contentBottom = y + h - footerH;
  const contentH = contentBottom - contentTop;
  const contentPad = 12;
  const qrSize = Math.min(Math.round(h * 0.42), Math.round(w * 0.28), contentH - 16);
  const qrX = x + w - contentPad - qrSize;
  const qrY = contentTop + (contentH - qrSize) / 2;

  // QR يمين (RTL: على يمين البطاقة)
  if (qrImg) {
    fillRoundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 10, "#fff");
    strokeRoundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 10, theme.qrBorder || accentFrom, 3);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } else {
    strokeRoundRect(ctx, qrX, qrY, qrSize, qrSize, 10, theme.qrDashed || accentFrom, 2);
    ctx.fillStyle = theme.qrDashed || accentFrom;
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("QR", qrX + qrSize / 2, qrY + qrSize / 2);
  }

  // لوجو في الوسط
  const logoMaxH = Math.round(h * 0.28);
  const logoMaxW = Math.round(w * 0.28);
  if (logoImg) {
    const ratio = logoImg.width / Math.max(1, logoImg.height);
    let lw = logoMaxW;
    let lh = lw / ratio;
    if (lh > logoMaxH) {
      lh = logoMaxH;
      lw = lh * ratio;
    }
    const lx = x + (w - lw) / 2;
    const ly = contentTop + (contentH - lh) / 2;
    fillRoundRect(ctx, lx - 8, ly - 6, lw + 16, lh + 12, 10, "#fff");
    strokeRoundRect(ctx, lx - 8, ly - 6, lw + 16, lh + 12, 10, theme.logoBorder || "#E2E8F0", 1.5);
    ctx.drawImage(logoImg, lx, ly, lw, lh);
  }

  // الكود يسار
  const codeBlockX = x + contentPad;
  const codeBlockW = Math.max(40, qrX - 16 - codeBlockX);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.codeLabelColor || accentFrom;
  ctx.font = `700 ${Math.max(11, Math.round(h * 0.07))}px ${FONT}`;
  ctx.fillText("كود التفعيل", codeBlockX + codeBlockW / 2, contentTop + contentH * 0.35);
  ctx.fillStyle = theme.codeColor || accentFrom;
  ctx.font = `800 ${Math.max(16, Math.round(h * 0.12))}px monospace, ${FONT}`;
  ctx.fillText(
    fitText(ctx, code.code || "", codeBlockW),
    codeBlockX + codeBlockW / 2,
    contentTop + contentH * 0.62,
  );

  // فوتر
  ctx.fillStyle = footerColor;
  ctx.fillRect(x, y + h - footerH, w, footerH);
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${Math.max(11, Math.round(h * 0.065))}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(PHONES, x + w / 2, y + h - footerH / 2);

  ctx.restore();
}

function yieldToUi() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * تصدير سريع لكروت أكواد التفعيل عبر Canvas (بدون html2canvas).
 */
export async function exportActivationCodesPdf({
  codes,
  courseName,
  teacherName,
  logoUrl,
  theme,
  fileName = "activation-codes.pdf",
  onProgress,
}) {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error("لا توجد أكواد للتصدير");
  }

  const logoImg = await loadImage(logoUrl);

  // تحميل صور QR دفعة واحدة (متوازٍ) قبل الرسم
  const qrImages = await Promise.all(codes.map((c) => loadImage(c?.qr_code)));

  const pdf = new jsPDF("l", "mm", "a4");
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d", { alpha: false });

  const usableW = PAGE_W - MARGIN * 2;
  const usableH = PAGE_H - MARGIN * 2;
  const cardW = Math.floor((usableW - GAP * (COLS - 1)) / COLS);
  const cardH = Math.floor((usableH - GAP * (ROWS - 1)) / ROWS);
  const totalPages = Math.ceil(codes.length / CODES_PER_PAGE);

  for (let page = 0; page < totalPages; page += 1) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const start = page * CODES_PER_PAGE;
    const pageCodes = codes.slice(start, start + CODES_PER_PAGE);

    pageCodes.forEach((code, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      // RTL: العمود 0 على اليمين
      const visualCol = COLS - 1 - col;
      const x = MARGIN + visualCol * (cardW + GAP);
      const y = MARGIN + row * (cardH + GAP);
      drawCard(
        ctx,
        {
          x,
          y,
          w: cardW,
          h: cardH,
          code,
          qrImg: qrImages[start + index],
        },
        theme,
        { courseName, teacherName, logoImg },
      );
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.82);
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM);

    onProgress?.({
      page: page + 1,
      totalPages,
      done: Math.min(codes.length, start + pageCodes.length),
      total: codes.length,
    });

    await yieldToUi();
  }

  pdf.save(fileName);
  return { pages: totalPages, count: codes.length };
}

export const ACTIVATION_CODES_PER_PDF_PAGE = CODES_PER_PAGE;
