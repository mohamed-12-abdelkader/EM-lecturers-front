import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { notExaminedStatusLabel } from "./exportNotExaminedStudents";

const EXPORT_FONT = "'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif";
const PDF_ROWS_FIRST_PAGE = 16;
const PDF_ROWS_PER_PAGE = 22;

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

function resolveGroupName(student, fallbackGroupName) {
  return (
    student?.groupName ||
    student?.group_name ||
    fallbackGroupName ||
    "كل المجموعات"
  );
}

export function formatExaminedGrade(student) {
  const obtained = Number(student?.obtainedGrade);
  const total = Number(student?.totalGrade);
  if (!Number.isFinite(obtained)) return "—";
  if (Number.isFinite(total) && total > 0) return `${obtained} / ${total}`;
  return String(obtained);
}

export function formatExaminedPercentage(student) {
  const n = Number(student?.percentage);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 10) / 10}%`;
}

export function examinedResultLabel(student) {
  return student?.passed ? "ناجح" : "راسب";
}

export function notExaminedResultLabel(student) {
  return student?.examStatus === "in_progress"
    ? notExaminedStatusLabel("in_progress")
    : "لم يحل";
}

function buildExportMeta({
  examinedStudents = [],
  notExaminedStudents = [],
  examTitle = "",
  courseTitle = "",
  groupName = "",
  filename,
} = {}) {
  const examined = Array.isArray(examinedStudents) ? examinedStudents : [];
  const notExamined = Array.isArray(notExaminedStudents) ? notExaminedStudents : [];
  const resolvedGroup = groupName || "كل المجموعات";
  const title = examTitle || "تقرير الامتحان";
  const baseName = filename || `تقرير-طلاب-${resolvedGroup}-${title}`;

  return {
    examined,
    notExamined,
    resolvedGroup,
    title,
    courseTitle: courseTitle || "",
    filenameBase: safeFileName(baseName, "تقرير-طلاب-المجموعة"),
  };
}

export function downloadExamReportGroupExcel(options = {}) {
  const { examined, notExamined, resolvedGroup, title, courseTitle, filenameBase } =
    buildExportMeta(options);
  if (!examined.length && !notExamined.length) return false;

  const dateLabel = todayStamp();
  const filename = `${filenameBase}-${dateLabel}.xls`;

  const infoRows = `
    <Row ss:StyleID="title">
      <Cell ss:MergeAcross="5"><Data ss:Type="String">${xmlEscape(title)}</Data></Cell>
    </Row>
    <Row>
      <Cell ss:MergeAcross="5"><Data ss:Type="String">${xmlEscape(`المجموعة: ${resolvedGroup}`)}</Data></Cell>
    </Row>
    ${
      courseTitle
        ? `<Row><Cell ss:MergeAcross="5"><Data ss:Type="String">${xmlEscape(`الكورس: ${courseTitle}`)}</Data></Cell></Row>`
        : ""
    }
    <Row>
      <Cell ss:MergeAcross="5"><Data ss:Type="String">${xmlEscape(
        `حلوا: ${examined.length} — لم يحلوا: ${notExamined.length} — ${dateLabel}`,
      )}</Data></Cell>
    </Row>
    <Row></Row>
  `;

  const examinedBody = examined.length
    ? examined
        .map(
          (student, index) => `
    <Row>
      ${excelCell(index + 1, "Number")}
      ${excelCell(student.studentName || "طالب")}
      ${excelCell(resolveGroupName(student, resolvedGroup))}
      ${excelCell(formatExaminedGrade(student))}
      ${excelCell(formatExaminedPercentage(student))}
      ${excelCell(examinedResultLabel(student))}
    </Row>`,
        )
        .join("")
    : `<Row><Cell ss:MergeAcross="5"><Data ss:Type="String">لا يوجد طلاب حلوا الامتحان</Data></Cell></Row>`;

  const notExaminedBody = notExamined.length
    ? notExamined
        .map(
          (student, index) => `
    <Row>
      ${excelCell(index + 1, "Number")}
      ${excelCell(student.studentName || "طالب")}
      ${excelCell(resolveGroupName(student, resolvedGroup))}
      ${excelCell(notExaminedResultLabel(student))}
    </Row>`,
        )
        .join("")
    : `<Row><Cell ss:MergeAcross="3"><Data ss:Type="String">لا يوجد طلاب لم يحلوا الامتحان</Data></Cell></Row>`;

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
    <Style ss:ID="headerAmber">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#C2410C" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="الذين حلوا">
    <Table ss:DefaultColumnWidth="90">
      <Column ss:Width="40"/>
      <Column ss:Width="170"/>
      <Column ss:Width="140"/>
      <Column ss:Width="90"/>
      <Column ss:Width="80"/>
      <Column ss:Width="80"/>
      ${infoRows}
      <Row ss:StyleID="header">
        ${["م", "اسم الطالب", "المجموعة", "الدرجة", "النسبة", "النتيجة"].map((h) => excelCell(h)).join("")}
      </Row>
      ${examinedBody}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <DisplayRightToLeft/>
    </WorksheetOptions>
  </Worksheet>
  <Worksheet ss:Name="الذين لم يحلوا">
    <Table ss:DefaultColumnWidth="90">
      <Column ss:Width="40"/>
      <Column ss:Width="170"/>
      <Column ss:Width="140"/>
      <Column ss:Width="120"/>
      ${infoRows}
      <Row ss:StyleID="headerAmber">
        ${["م", "اسم الطالب", "المجموعة", "الحالة"].map((h) => excelCell(h)).join("")}
      </Row>
      ${notExaminedBody}
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

function buildCombinedRows(examined, notExamined, resolvedGroup) {
  return [
    ...examined.map((student) => ({
      studentName: student.studentName || "طالب",
      groupName: resolveGroupName(student, resolvedGroup),
      status: student.passed ? "حل الامتحان · ناجح" : "حل الامتحان · راسب",
      grade: formatExaminedGrade(student),
      kind: student.passed ? "passed" : "failed",
    })),
    ...notExamined.map((student) => ({
      studentName: student.studentName || "طالب",
      groupName: resolveGroupName(student, resolvedGroup),
      status: notExaminedResultLabel(student),
      grade: "—",
      kind: student.examStatus === "in_progress" ? "in_progress" : "never",
    })),
  ];
}

function statusStyle(kind) {
  if (kind === "passed") return { bg: "#DCFCE7", color: "#15803D" };
  if (kind === "failed") return { bg: "#FEE2E2", color: "#B91C1C" };
  if (kind === "in_progress") return { bg: "#FFEDD5", color: "#C2410C" };
  return { bg: "#F1F5F9", color: "#475569" };
}

function buildPdfRows(rows, startIndex = 0) {
  return rows
    .map((row, index) => {
      const rowBg = index % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      const badge = statusStyle(row.kind);
      return `
        <tr style="background: ${rowBg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 11px 10px; text-align: center; font-weight: 700; color: #64748B;">${startIndex + index + 1}</td>
          <td style="padding: 11px 12px; text-align: right; font-weight: 800; color: #0F172A;">${htmlEscape(row.studentName)}</td>
          <td style="padding: 11px 12px; text-align: right; font-weight: 700; color: #0E4C92;">${htmlEscape(row.groupName)}</td>
          <td style="padding: 11px 10px; text-align: center;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; background: ${badge.bg}; color: ${badge.color}; font-weight: 800; font-size: 12px;">
              ${htmlEscape(row.status)}
            </span>
          </td>
          <td style="padding: 11px 10px; text-align: center; font-weight: 800; color: #0E4C92;">${htmlEscape(row.grade)}</td>
        </tr>
      `;
    })
    .join("");
}

function buildPdfPageHtml({
  title,
  courseTitle,
  groupName,
  rowsHtml,
  pageNumber,
  totalPages,
  examinedCount,
  notExaminedCount,
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
        <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">المجموعة</div>
        <div style="font-size: 18px; font-weight: 900; color: #0E4C92; line-height: 1.35;">${htmlEscape(groupName)}</div>
      </div>
      <div style="background: #DCFCE7; border-radius: 14px; padding: 14px; text-align: center;">
        <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">حلوا الامتحان</div>
        <div style="font-size: 26px; font-weight: 900; color: #15803D;">${examinedCount}</div>
      </div>
      <div style="background: #F1F5F9; border-radius: 14px; padding: 14px; text-align: center;">
        <div style="font-size: 12px; color: #64748B; font-weight: 700; margin-bottom: 6px;">لم يحلوا</div>
        <div style="font-size: 26px; font-weight: 900; color: #475569;">${notExaminedCount}</div>
      </div>
    </div>`
    : "";

  return `
    <div dir="rtl" style="width: 1100px; background: #fff; color: #1A202C; font-family: ${EXPORT_FONT}; box-sizing: border-box; overflow: hidden; border: 1px solid #E2E8F0; border-radius: 18px;">
      <div style="height: 6px; background: linear-gradient(to left, #0E4C92, #DD6B20);"></div>
      <div style="padding: 28px 32px 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px;">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #64748B; margin-bottom: 6px;">كشف طلاب المجموعة في الامتحان</div>
            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 900; color: #0E4C92; line-height: 1.25;">${htmlEscape(title)}</h1>
            <p style="margin: 0; font-size: 14px; color: #64748B; font-weight: 600;">
              ${htmlEscape(groupName)}${courseTitle ? ` — ${htmlEscape(courseTitle)}` : ""} — ${dateLabel}
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
                <th style="padding: 14px 12px; text-align: right; font-weight: 800;">المجموعة</th>
                <th style="padding: 14px 10px; text-align: center; width: 180px; font-weight: 800;">الحالة</th>
                <th style="padding: 14px 10px; text-align: center; width: 110px; font-weight: 800;">الدرجة</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function downloadExamReportGroupPdf(options = {}) {
  const { examined, notExamined, resolvedGroup, title, courseTitle, filenameBase } =
    buildExportMeta(options);
  const rows = buildCombinedRows(examined, notExamined, resolvedGroup);
  if (!rows.length) return false;

  const filename = `${filenameBase}-${todayStamp()}.pdf`;
  const chunks = [];
  let cursor = 0;
  let pageIndex = 0;
  while (cursor < rows.length) {
    const pageSize = pageIndex === 0 ? PDF_ROWS_FIRST_PAGE : PDF_ROWS_PER_PAGE;
    chunks.push(rows.slice(cursor, cursor + pageSize));
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
      courseTitle,
      groupName: resolvedGroup,
      rowsHtml: buildPdfRows(chunk, startIndex),
      pageNumber: currentPage + 1,
      totalPages,
      examinedCount: examined.length,
      notExaminedCount: notExamined.length,
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
