import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const EXPORT_FONT = "'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif";
const PDF_ROWS_FIRST_PAGE = 18;
const PDF_ROWS_PER_PAGE = 24;

export function notExaminedStatusLabel(status) {
  return status === "in_progress" ? "بدأ ولم يسلّم" : "لم يبدأ";
}

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

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlEscape(value) {
  return xmlEscape(value).replace(/'/g, "&#39;");
}

function excelCell(value, type = "String") {
  return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

export function downloadNotExaminedExcel(students = [], options = {}) {
  const list = Array.isArray(students) ? students : [];
  if (!list.length) return false;

  const title = options.title || "الطلاب الذين لم يسلّموا";
  const courseTitle = options.courseTitle || "";
  const filename = `${safeFileName(options.filename || title, "لم-يسلموا")}-${todayStamp()}.xls`;

  const header = `
    <Row ss:StyleID="title">
      <Cell ss:MergeAcross="3"><Data ss:Type="String">${xmlEscape(title)}</Data></Cell>
    </Row>
    ${
      courseTitle
        ? `<Row><Cell ss:MergeAcross="3"><Data ss:Type="String">${xmlEscape(`الكورس: ${courseTitle}`)}</Data></Cell></Row>`
        : ""
    }
    <Row>
      <Cell ss:MergeAcross="3"><Data ss:Type="String">${xmlEscape(`العدد: ${list.length} — ${todayStamp()}`)}</Data></Cell>
    </Row>
    <Row></Row>
    <Row ss:StyleID="header">
      ${["م", "اسم الطالب", "البريد الإلكتروني", "الحالة"].map((h) => excelCell(h)).join("")}
    </Row>
  `;

  const body = list
    .map(
      (student, index) => `
    <Row>
      ${excelCell(index + 1, "Number")}
      ${excelCell(student.studentName || "طالب")}
      ${excelCell(student.studentEmail || "")}
      ${excelCell(notExaminedStatusLabel(student.examStatus))}
    </Row>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="title">
      <Font ss:Bold="1" ss:Size="14" ss:Color="#0E4C92"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0E4C92" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="لم يسلموا">
    <Table ss:DefaultColumnWidth="90">
      <Column ss:Width="40"/>
      <Column ss:Width="160"/>
      <Column ss:Width="200"/>
      <Column ss:Width="110"/>
      ${header}
      ${body}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft/>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([`\uFEFF${xml}`], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  triggerDownload(blob, filename);
  return true;
}

function buildPdfRows(students, startIndex = 0) {
  return students
    .map((student, index) => {
      const inProgress = student.examStatus === "in_progress";
      const rowBg = index % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      const statusBg = inProgress ? "#FFEDD5" : "#F1F5F9";
      const statusColor = inProgress ? "#C2410C" : "#475569";
      return `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 11px 10px; text-align: center; font-weight: 700; color: #64748B;">${startIndex + index + 1}</td>
          <td style="padding: 11px 12px; text-align: right; font-weight: 800; color: #0F172A;">${htmlEscape(student.studentName || "طالب")}</td>
          <td style="padding: 11px 12px; text-align: left; direction: ltr; color: #475569; font-weight: 600;">${htmlEscape(student.studentEmail || "—")}</td>
          <td style="padding: 11px 10px; text-align: center;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; background: ${statusBg}; color: ${statusColor}; font-weight: 800; font-size: 12px;">
              ${notExaminedStatusLabel(student.examStatus)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildPdfPageHtml({
  title,
  courseTitle,
  rowsHtml,
  pageNumber,
  totalPages,
  totalStudents,
  inProgressCount,
  neverStartedCount,
  showSummary,
}) {
  const dateLabel = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const summaryHtml = showSummary
    ? `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px;">
      <div style="background: #E8F0FA; border-radius: 14px; padding: 14px; text-align: center;">
        <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">إجمالي من لم يسلّموا</div>
        <div style="font-size: 26px; font-weight: 900; color: #0E4C92;">${totalStudents}</div>
      </div>
      <div style="background: #F1F5F9; border-radius: 14px; padding: 14px; text-align: center;">
        <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">لم يبدأ</div>
        <div style="font-size: 26px; font-weight: 900; color: #475569;">${neverStartedCount}</div>
      </div>
      <div style="background: #FFEDD5; border-radius: 14px; padding: 14px; text-align: center;">
        <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">بدأ ولم يسلّم</div>
        <div style="font-size: 26px; font-weight: 900; color: #C2410C;">${inProgressCount}</div>
      </div>
    </div>`
    : "";

  return `
    <div dir="rtl" style="width: 1100px; background: #fff; color: #1A202C; font-family: ${EXPORT_FONT}; box-sizing: border-box; overflow: hidden; border: 1px solid #E2E8F0; border-radius: 18px;">
      <div style="height: 6px; background: linear-gradient(to left, #0E4C92, #DD6B20);"></div>
      <div style="padding: 28px 32px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px;">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #64748B; margin-bottom: 6px;">كشف الطلاب الذين لم يسلّموا الامتحان</div>
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 900; color: #0E4C92; line-height: 1.25;">${htmlEscape(title)}</h1>
            <p style="margin: 0; font-size: 14px; color: #64748B; font-weight: 600;">
              ${courseTitle ? `${htmlEscape(courseTitle)} — ` : ""}${dateLabel} — العدد: ${totalStudents}
            </p>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 14px; font-size: 13px; color: #475569; font-weight: 800; white-space: nowrap;">
            صفحة ${pageNumber} / ${totalPages}
          </div>
        </div>
        ${summaryHtml}
        <div style="border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: linear-gradient(to left, #0E4C92, #1D4ED8); color: #FFFFFF;">
                <th style="padding: 14px 10px; text-align: center; width: 56px; font-weight: 800;">م</th>
                <th style="padding: 14px 12px; text-align: right; font-weight: 800;">اسم الطالب</th>
                <th style="padding: 14px 12px; text-align: right; font-weight: 800;">البريد الإلكتروني</th>
                <th style="padding: 14px 10px; text-align: center; width: 140px; font-weight: 800;">الحالة</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function downloadNotExaminedPdf(students = [], options = {}) {
  const list = Array.isArray(students) ? students : [];
  if (!list.length) return false;

  const title = options.title || "الطلاب الذين لم يسلّموا";
  const filename = `${safeFileName(options.filename || title, "لم-يسلموا")}-${todayStamp()}.pdf`;
  const inProgressCount = list.filter((s) => s.examStatus === "in_progress").length;
  const neverStartedCount = list.length - inProgressCount;

  const chunks = [];
  let cursor = 0;
  let pageIndex = 0;
  while (cursor < list.length) {
    const pageSize = pageIndex === 0 ? PDF_ROWS_FIRST_PAGE : PDF_ROWS_PER_PAGE;
    chunks.push(list.slice(cursor, cursor + pageSize));
    cursor += pageSize;
    pageIndex += 1;
  }

  const pdf = new jsPDF("l", "mm", "a4");
  const totalPages = Math.max(chunks.length, 1);

  for (let currentPage = 0; currentPage < chunks.length; currentPage += 1) {
    const chunk = chunks[currentPage];
    const startIndex =
      currentPage === 0
        ? 0
        : PDF_ROWS_FIRST_PAGE + (currentPage - 1) * PDF_ROWS_PER_PAGE;
    const html = buildPdfPageHtml({
      title,
      courseTitle: options.courseTitle || "",
      rowsHtml: buildPdfRows(chunk, startIndex),
      pageNumber: currentPage + 1,
      totalPages,
      totalStudents: list.length,
      inProgressCount,
      neverStartedCount,
      showSummary: currentPage === 0,
    });

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: 1100,
    });
    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 297;
    const pdfHeight = 210;
    const margin = 5;
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (currentPage > 0) pdf.addPage();
    pdf.addImage(
      imgData,
      "PNG",
      margin,
      margin,
      imgWidth,
      Math.min(imgHeight, pdfHeight - margin * 2),
    );
  }

  pdf.save(filename);
  return true;
}
