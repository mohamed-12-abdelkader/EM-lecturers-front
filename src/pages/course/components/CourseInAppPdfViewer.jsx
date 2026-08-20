import PdfViewer from "./PdfViewer";

/** عارض PDF داخل المنصة عبر المسار الآمن `/api/course-files/:id/view` */
export default function CourseInAppPdfViewer({ fileId, fileName }) {
  return <PdfViewer fileId={fileId} fileName={fileName} />;
}
