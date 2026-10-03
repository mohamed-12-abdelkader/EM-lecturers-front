import { ENGAGEMENT_STATUS_META } from "../../../api/lectureEngagementReportApi";

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

function excelCell(value, type = "String") {
  return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  if (total <= 0) return "";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}س ${m}د`;
  return `${m} دقيقة`;
}

function statusLabel(status) {
  return ENGAGEMENT_STATUS_META[status]?.label || status || "";
}

/**
 * تنزيل بيانات تقرير تفاعل المحاضرة (بعد الفلترة) كملف Excel.
 * @returns {boolean}
 */
export function downloadLectureEngagementExcel({
  students = [],
  lectureTitle = "",
  courseTitle = "",
  filterSummary = "",
  filename,
} = {}) {
  const list = Array.isArray(students) ? students : [];
  if (!list.length) return false;

  const title = lectureTitle || "تقرير تفاعل المحاضرة";
  const resolvedName = safeFileName(
    filename || `تقرير-تفاعل-${title}-${todayStamp()}`,
    `lecture-engagement-${todayStamp()}`,
  );
  const excelFilename = resolvedName.toLowerCase().endsWith(".xls")
    ? resolvedName
    : `${resolvedName}.xls`;

  const infoRows = [
    `<Row ss:StyleID="title"><Cell ss:MergeAcross="13">${excelCell(title)}</Cell></Row>`,
    courseTitle
      ? `<Row><Cell ss:MergeAcross="13">${excelCell(`الكورس: ${courseTitle}`)}</Cell></Row>`
      : "",
    filterSummary
      ? `<Row><Cell ss:MergeAcross="13">${excelCell(`الفلاتر: ${filterSummary}`)}</Cell></Row>`
      : "",
    `<Row><Cell ss:MergeAcross="13">${excelCell(`عدد الطلاب: ${list.length}`)}</Cell></Row>`,
    `<Row><Cell ss:MergeAcross="13">${excelCell(`تاريخ التصدير: ${todayStamp()}`)}</Cell></Row>`,
    `<Row></Row>`,
  ]
    .filter(Boolean)
    .join("");

  const headers = [
    "م",
    "اسم الطالب",
    "كود الطالب",
    "المجموعة",
    "الحالة",
    "نسبة المشاهدة %",
    "فيديوهات مشاهَدة",
    "إجمالي الفيديوهات",
    "فيديوهات مكتملة",
    "مدة المشاهدة",
    "آخر مشاهدة",
    "فتح المحاضرة",
    "الهاتف",
    "هاتف ولي الأمر",
  ];

  const body = list
    .map((student, index) => {
      const cells = [
        excelCell(index + 1, "Number"),
        excelCell(student.name || ""),
        excelCell(student.studentCode || ""),
        excelCell(student.group?.name || ""),
        excelCell(statusLabel(student.status)),
        excelCell(Number(student.watchPercentage) || 0, "Number"),
        excelCell(Number(student.watchedVideos) || 0, "Number"),
        excelCell(Number(student.totalVideos) || 0, "Number"),
        excelCell(Number(student.completedVideos) || 0, "Number"),
        excelCell(formatDuration(student.totalWatchDurationSeconds)),
        excelCell(formatDateTime(student.lastWatchedAt)),
        excelCell(
          student.hasOpenedLecture
            ? formatDateTime(student.lectureOpenedAt) || "نعم"
            : "لا",
        ),
        excelCell(student.phone || ""),
        excelCell(student.parentPhone || ""),
      ];
      return `<Row>${cells.join("")}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
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
  <Worksheet ss:Name="تفاعل المحاضرة">
    <Table ss:DefaultColumnWidth="100">
      <Column ss:Width="40"/>
      <Column ss:Width="160"/>
      <Column ss:Width="90"/>
      <Column ss:Width="120"/>
      <Column ss:Width="80"/>
      <Column ss:Width="90"/>
      <Column ss:Width="90"/>
      <Column ss:Width="90"/>
      <Column ss:Width="90"/>
      <Column ss:Width="90"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
      <Column ss:Width="110"/>
      <Column ss:Width="110"/>
      ${infoRows}
      <Row ss:StyleID="header">
        ${headers.map((h) => excelCell(h)).join("")}
      </Row>
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
  triggerDownload(blob, excelFilename);
  return true;
}
