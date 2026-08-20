export { buildCourseFileViewPath } from "../api/courseFilesApi";

export function getCourseFileViewBackPath(courseId, section = "files") {
  return `/CourseDetailsPage/${courseId}?section=${section}`;
}
