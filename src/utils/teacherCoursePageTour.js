export const TOUR_CLOSE_ALL_MODALS = "teacher-course-tour:close-all-modals";

export const TOUR_OPEN_ACTIVATE_STUDENT = "teacher-course-tour:open-activate-student";
export const TOUR_CLOSE_ACTIVATE_STUDENT = "teacher-course-tour:close-activate-student";

export const TOUR_OPEN_ENROLLMENTS = "teacher-course-tour:open-enrollments";
export const TOUR_CLOSE_ENROLLMENTS = "teacher-course-tour:close-enrollments";

export const TOUR_OPEN_CREATE_CODES = "teacher-course-tour:open-create-codes";
export const TOUR_CLOSE_CREATE_CODES = "teacher-course-tour:close-create-codes";

export const TOUR_OPEN_VIEW_CODES = "teacher-course-tour:open-view-codes";
export const TOUR_CLOSE_VIEW_CODES = "teacher-course-tour:close-view-codes";

export const TOUR_OPEN_LECTURE_MODAL = "teacher-course-tour:open-lecture-modal";
export const TOUR_CLOSE_LECTURE_MODAL = "teacher-course-tour:close-lecture-modal";

export const TOUR_OPEN_ACCESS_SETTINGS = "teacher-course-tour:open-access-settings";
export const TOUR_CLOSE_ACCESS_SETTINGS = "teacher-course-tour:close-access-settings";

export const TOUR_OPEN_VIDEO_MODAL = "teacher-course-tour:open-video-modal";
export const TOUR_CLOSE_VIDEO_MODAL = "teacher-course-tour:close-video-modal";

export const TOUR_OPEN_ASSIGNMENT_MODAL = "teacher-course-tour:open-assignment-modal";
export const TOUR_CLOSE_ASSIGNMENT_MODAL = "teacher-course-tour:close-assignment-modal";

export const TOUR_OPEN_COURSE_ASSIGNMENT_MODAL = "teacher-course-tour:open-course-assignment-modal";
export const TOUR_CLOSE_COURSE_ASSIGNMENT_MODAL = "teacher-course-tour:close-course-assignment-modal";

export const TOUR_OPEN_FILE_UPLOAD = "teacher-course-tour:open-file-upload";
export const TOUR_CLOSE_FILE_UPLOAD = "teacher-course-tour:close-file-upload";

export const TOUR_OPEN_CREATE_EXAM = "teacher-course-tour:open-create-exam";
export const TOUR_CLOSE_CREATE_EXAM = "teacher-course-tour:close-create-exam";

export const TOUR_OPEN_CREATE_STREAM = "teacher-course-tour:open-create-stream";
export const TOUR_CLOSE_CREATE_STREAM = "teacher-course-tour:close-create-stream";

function dispatch(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

export function closeAllTeacherCourseTourModals() {
  if (typeof window === "undefined") return;
  [
    TOUR_CLOSE_ALL_MODALS,
    TOUR_CLOSE_ACTIVATE_STUDENT,
    TOUR_CLOSE_ENROLLMENTS,
    TOUR_CLOSE_CREATE_CODES,
    TOUR_CLOSE_VIEW_CODES,
    TOUR_CLOSE_LECTURE_MODAL,
    TOUR_CLOSE_ACCESS_SETTINGS,
    TOUR_CLOSE_VIDEO_MODAL,
    TOUR_CLOSE_ASSIGNMENT_MODAL,
    TOUR_CLOSE_COURSE_ASSIGNMENT_MODAL,
    TOUR_CLOSE_FILE_UPLOAD,
    TOUR_CLOSE_CREATE_EXAM,
    TOUR_CLOSE_CREATE_STREAM,
  ].forEach((name) => dispatch(name));
}

export function openActivateStudentForTour() {
  dispatch(TOUR_OPEN_ACTIVATE_STUDENT);
}

export function closeActivateStudentForTour() {
  dispatch(TOUR_CLOSE_ACTIVATE_STUDENT);
}

export function openEnrollmentsForTour() {
  dispatch(TOUR_OPEN_ENROLLMENTS);
}

export function closeEnrollmentsForTour() {
  dispatch(TOUR_CLOSE_ENROLLMENTS);
}

export function openCreateCodesForTour() {
  dispatch(TOUR_OPEN_CREATE_CODES);
}

export function closeCreateCodesForTour() {
  dispatch(TOUR_CLOSE_CREATE_CODES);
}

export function openViewCodesForTour() {
  dispatch(TOUR_OPEN_VIEW_CODES);
}

export function closeViewCodesForTour() {
  dispatch(TOUR_CLOSE_VIEW_CODES);
}

export function openLectureModalForTour() {
  dispatch(TOUR_OPEN_LECTURE_MODAL);
}

export function closeLectureModalForTour() {
  dispatch(TOUR_CLOSE_LECTURE_MODAL);
}

export function openAccessSettingsForTour() {
  dispatch(TOUR_OPEN_ACCESS_SETTINGS);
}

export function closeAccessSettingsForTour() {
  dispatch(TOUR_CLOSE_ACCESS_SETTINGS);
}

export function openVideoModalForTour(lectureId) {
  dispatch(TOUR_OPEN_VIDEO_MODAL, { lectureId: lectureId != null ? String(lectureId) : null });
}

export function closeVideoModalForTour() {
  dispatch(TOUR_CLOSE_VIDEO_MODAL);
}

export function openAssignmentModalForTour(lectureId) {
  dispatch(TOUR_OPEN_ASSIGNMENT_MODAL, { lectureId: lectureId != null ? String(lectureId) : null });
}

export function closeAssignmentModalForTour() {
  dispatch(TOUR_CLOSE_ASSIGNMENT_MODAL);
}

export function openCourseAssignmentModalForTour() {
  dispatch(TOUR_OPEN_COURSE_ASSIGNMENT_MODAL);
}

export function closeCourseAssignmentModalForTour() {
  dispatch(TOUR_CLOSE_COURSE_ASSIGNMENT_MODAL);
}

export function openFileUploadForTour() {
  dispatch(TOUR_OPEN_FILE_UPLOAD);
}

export function closeFileUploadForTour() {
  dispatch(TOUR_CLOSE_FILE_UPLOAD);
}

export function openCreateExamForTour() {
  dispatch(TOUR_OPEN_CREATE_EXAM);
}

export function closeCreateExamForTour() {
  dispatch(TOUR_CLOSE_CREATE_EXAM);
}

export function openCreateStreamForTour() {
  dispatch(TOUR_OPEN_CREATE_STREAM);
}

export function closeCreateStreamForTour() {
  dispatch(TOUR_CLOSE_CREATE_STREAM);
}
