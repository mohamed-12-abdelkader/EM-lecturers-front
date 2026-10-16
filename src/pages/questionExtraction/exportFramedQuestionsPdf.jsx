import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfQuestionFrame from "./components/PdfQuestionFrame";

const SHEET_W = 1120;
const SHEET_H = 792;
const CANVAS_SCALE = 2;

function waitForImages(container) {
  const images = container.querySelectorAll("img");
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

async function waitForFonts() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load('900 17px Tahoma'),
      document.fonts.load('800 14px Tahoma'),
      document.fonts.load('900 17px "Noto Sans Arabic"'),
      document.fonts.load('800 14px "Noto Sans Arabic"'),
      document.fonts.load('700 14px "Segoe UI"'),
    ]).catch(() => undefined);
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
}

function buildFileName(title) {
  const slug = String(title || "اسئلة-مؤطرة")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `framed-questions-${slug || "export"}-${date}.pdf`;
}

async function captureSheet(page, branding) {
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-14000px;top:0;z-index:-1;pointer-events:none;opacity:1;background:#fff;";
  document.body.appendChild(mount);
  const root = createRoot(mount);

  try {
    const safeBranding = {
      teacherName: String(branding?.teacherName || "المدرس").trim(),
      teacherTitle: String(branding?.teacherTitle || "مدرس").trim(),
      phone: String(branding?.phone || "").trim(),
      watermarkLogo: branding?.watermarkLogo || null,
    };

    root.render(
      <ChakraProvider>
        <div
          style={{
            width: SHEET_W,
            background: "#fff",
            fontFamily: '"Noto Sans Arabic", Tahoma, "Segoe UI", Arial, sans-serif',
          }}
        >
          <PdfQuestionFrame page={page} branding={safeBranding} variant="sheet" />
        </div>
      </ChakraProvider>,
    );

    await new Promise((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 550));
    });
    await waitForFonts();
    await waitForImages(mount);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const content = mount.querySelector("[data-framed-sheet='true']") || mount.firstElementChild;
    if (!content) throw new Error("تعذر تجهيز صفحة الإطار");

    return html2canvas(content, {
      scale: CANVAS_SCALE,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: content.offsetWidth || SHEET_W,
      height: content.offsetHeight || SHEET_H,
      windowWidth: content.offsetWidth || SHEET_W,
      windowHeight: content.offsetHeight || SHEET_H,
    });
  } finally {
    root.unmount();
    mount.remove();
  }
}

/** تصدير صفحات الإطار (سؤال لكل صفحة) كـ PDF أفقي بنفس التصميم. */
export async function exportFramedQuestionsPdf({
  pages,
  branding,
  title = "اسئلة مؤطرة",
  onProgress,
}) {
  if (!pages?.length) {
    throw new Error("لا توجد صفحات للتصدير");
  }

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 4;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;

  for (let i = 0; i < pages.length; i += 1) {
    onProgress?.(i + 1, pages.length);
    const canvas = await captureSheet(pages[i], branding);
    const img = canvas.toDataURL("image/png");

    let w = usableW;
    let h = (canvas.height * w) / canvas.width;
    if (h > usableH) {
      const scale = usableH / h;
      h = usableH;
      w *= scale;
    }
    const x = margin + (usableW - w) / 2;
    const y = margin + (usableH - h) / 2;

    if (i > 0) pdf.addPage();
    pdf.addImage(img, "PNG", x, y, w, h);
  }

  pdf.save(buildFileName(title));
}
