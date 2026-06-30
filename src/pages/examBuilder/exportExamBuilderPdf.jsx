import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PdfExamSheetPage } from "./components/ExamBuilderPdfDocument";
import { partitionQuestionsForPdfPages } from "./examBuilderUtils";

const MAX_QUESTIONS_PER_PAGE = 5;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 8;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_MM * 2;
const CANVAS_SCALE = 2.5;

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
        })
    )
  );
}

async function waitForFonts() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load('700 22px "Noto Sans Arabic"'),
      document.fonts.load('400 15px "Noto Sans Arabic"'),
      document.fonts.load('400 14px "Segoe UI"'),
    ]).catch(() => undefined);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

function buildFileName(title) {
  const slug = String(title || "exam")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `exam-${slug || "exam"}-${date}.pdf`;
}

async function captureReactElement(element) {
  const mount = document.createElement("div");
  mount.setAttribute("data-exam-builder-pdf-page", "true");
  mount.style.cssText =
    "position:fixed;left:-12000px;top:0;z-index:-1;pointer-events:none;opacity:1;";
  document.body.appendChild(mount);

  const root = createRoot(mount);

  try {
    root.render(<ChakraProvider>{element}</ChakraProvider>);

    await new Promise((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 400));
    });
    await waitForFonts();
    await waitForImages(mount);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const content = mount.firstElementChild;
    if (!content) throw new Error("تعذر تجهيز محتوى PDF");

    return html2canvas(content, {
      scale: CANVAS_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      width: content.offsetWidth,
      height: content.offsetHeight,
      windowWidth: content.offsetWidth,
      windowHeight: content.offsetHeight,
    });
  } finally {
    root.unmount();
    mount.remove();
  }
}

function addPageToPdf(pdf, canvas, isFirstPage) {
  if (!isFirstPage) {
    pdf.addPage();
  }

  let widthMm = CONTENT_WIDTH_MM;
  let heightMm = (canvas.height * widthMm) / canvas.width;

  if (heightMm > CONTENT_HEIGHT_MM) {
    const scale = CONTENT_HEIGHT_MM / heightMm;
    heightMm = CONTENT_HEIGHT_MM;
    widthMm = widthMm * scale;
  }

  const imgData = canvas.toDataURL("image/png");
  const x = MARGIN_MM + (CONTENT_WIDTH_MM - widthMm) / 2;
  const y = MARGIN_MM;
  pdf.addImage(imgData, "PNG", x, y, widthMm, heightMm);
}

/**
 * تصدير أسئلة إلى PDF — حتى 5 أسئلة/صفحة حسب الحجم، بدون إجابات
 */
export async function exportExamBuilderQuestionsPdf({ questions, title }) {
  if (!questions?.length) {
    throw new Error("لا توجد أسئلة للتصدير");
  }

  const trimmedTitle = String(title || "").trim();
  if (!trimmedTitle) {
    throw new Error("يرجى إدخال عنوان الامتحان");
  }

  const pages = partitionQuestionsForPdfPages(questions, {
    maxPerPage: MAX_QUESTIONS_PER_PAGE,
  });
  const totalPages = pages.length;
  const pdf = new jsPDF("p", "mm", "a4");
  let startIndex = 0;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageQuestions = pages[pageIndex];
    const canvas = await captureReactElement(
      <PdfExamSheetPage
        title={trimmedTitle}
        questions={pageQuestions}
        startIndex={startIndex}
        pageNumber={pageIndex + 1}
        totalPages={totalPages}
        showFullHeader={pageIndex === 0}
        questionCount={questions.length}
      />
    );
    addPageToPdf(pdf, canvas, pageIndex === 0);
    startIndex += pageQuestions.length;
  }

  pdf.save(buildFileName(trimmedTitle));
}
