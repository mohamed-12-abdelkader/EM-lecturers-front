import { safeLocalGet, safeLocalSet } from "./safeStorage";

const DONE_KEY = "course_page_tours_done";
const TEACHER_DONE_KEY = "teacher_course_page_tours_done";

/** عرض الجولة أول مرة فقط لكل كورس */
const ALWAYS_SHOW_COURSE_PAGE_TOUR = false;

function readDoneSet() {
  try {
    const raw = safeLocalGet(DONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeDoneSet(ids) {
  safeLocalSet(DONE_KEY, JSON.stringify([...new Set(ids.map(String))]));
}

export function shouldShowCoursePageTour(courseId) {
  if (courseId == null || courseId === "") return false;
  if (ALWAYS_SHOW_COURSE_PAGE_TOUR) return true;
  return !readDoneSet().includes(String(courseId));
}

export function completeCoursePageTour(courseId) {
  if (courseId == null || courseId === "") return;
  const id = String(courseId);
  const done = readDoneSet();
  if (!done.includes(id)) {
    writeDoneSet([...done, id]);
  }
}

function readTeacherDoneSet() {
  try {
    const raw = safeLocalGet(TEACHER_DONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeTeacherDoneSet(ids) {
  safeLocalSet(TEACHER_DONE_KEY, JSON.stringify([...new Set(ids.map(String))]));
}

export function shouldShowTeacherCoursePageTour(courseId) {
  if (courseId == null || courseId === "") return false;
  if (ALWAYS_SHOW_COURSE_PAGE_TOUR) return true;
  return !readTeacherDoneSet().includes(String(courseId));
}

export function completeTeacherCoursePageTour(courseId) {
  if (courseId == null || courseId === "") return;
  const id = String(courseId);
  const done = readTeacherDoneSet();
  if (!done.includes(id)) {
    writeTeacherDoneSet([...done, id]);
  }
}

export function resetTeacherCoursePageTour(courseId) {
  if (courseId == null || courseId === "") return;
  const id = String(courseId);
  writeTeacherDoneSet(readTeacherDoneSet().filter((item) => item !== id));
}

export const TOUR_SET_SECTION = "course-page-tour:set-section";

export function setCourseTourSection(section) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(TOUR_SET_SECTION, { detail: { section } }),
    );
  }
}

export const TOUR_EXPAND_LECTURE = "course-page-tour:expand-lecture";
export const TOUR_COLLAPSE_LECTURE = "course-page-tour:collapse-lecture";

export function expandLectureForTour(lectureId) {
  if (typeof window !== "undefined" && lectureId != null) {
    window.dispatchEvent(
      new CustomEvent(TOUR_EXPAND_LECTURE, { detail: { lectureId: String(lectureId) } }),
    );
  }
}

export function collapseLectureForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_COLLAPSE_LECTURE));
  }
}

function countLectureAssignments(lecture) {
  if (Array.isArray(lecture?.assignments) && lecture.assignments.length > 0) {
    return lecture.assignments.length;
  }
  if (Array.isArray(lecture?.exams) && lecture.exams.length > 0) {
    const assignments = lecture.exams.filter((e) => !e.type || e.type === "assignment");
    if (assignments.length > 0) return assignments.length;
  }
  return lecture?.exam ? 1 : 0;
}

/** أول محاضرة مناسبة للجولة (مفتوحة للطالب إن أمكن) */
export function pickTourLecture(lectures, { isTeacher = false, isAdmin = false } = {}) {
  if (!Array.isArray(lectures) || lectures.length === 0) return null;
  const canManage = isTeacher || isAdmin;
  if (canManage) return lectures[0];
  const unlocked = lectures.find((l) => !l.locked);
  return unlocked || lectures[0];
}

export function buildLectureTourMeta(lecture, { isTeacher = false, isAdmin = false } = {}) {
  if (!lecture) {
    return { hasLectures: false, hasVideos: false, hasAssignments: false, lectureId: null };
  }
  const canManage = isTeacher || isAdmin;
  const isLocked = Boolean(lecture.locked) && !canManage;
  const videoCount = lecture.videos?.length ?? 0;
  const assignmentCount = countLectureAssignments(lecture);
  return {
    hasLectures: true,
    hasVideos: !isLocked,
    hasAssignments: !isLocked && assignmentCount > 0,
    lectureId: lecture.id,
    isLocked,
    videoCount,
  };
}
