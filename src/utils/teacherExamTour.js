/** أحداث جولة إدارة الامتحان الشامل للمدرس */

export const TOUR_CLOSE_ALL = "teacher-exam-tour:close-all";

export const TOUR_OPEN_AI = "teacher-exam-tour:open-ai";
export const TOUR_CLOSE_AI = "teacher-exam-tour:close-ai";

export const TOUR_OPEN_BULK = "teacher-exam-tour:open-bulk";
export const TOUR_CLOSE_BULK = "teacher-exam-tour:close-bulk";

export const TOUR_OPEN_PASSAGE = "teacher-exam-tour:open-passage";
export const TOUR_CLOSE_PASSAGE = "teacher-exam-tour:close-passage";

export const TOUR_OPEN_IMAGES = "teacher-exam-tour:open-images";
export const TOUR_CLOSE_IMAGES = "teacher-exam-tour:close-images";

export const TOUR_OPEN_EDIT = "teacher-exam-tour:open-edit";
export const TOUR_CLOSE_EDIT = "teacher-exam-tour:close-edit";

export const TOUR_OPEN_DELETE = "teacher-exam-tour:open-delete";
export const TOUR_CLOSE_DELETE = "teacher-exam-tour:close-delete";

export const TOUR_OPEN_Q_IMAGE = "teacher-exam-tour:open-q-image";
export const TOUR_CLOSE_Q_IMAGE = "teacher-exam-tour:close-q-image";

function dispatch(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

export function closeAllTeacherExamTourModals() {
  if (typeof window === "undefined") return;
  [
    TOUR_CLOSE_ALL,
    TOUR_CLOSE_AI,
    TOUR_CLOSE_BULK,
    TOUR_CLOSE_PASSAGE,
    TOUR_CLOSE_IMAGES,
    TOUR_CLOSE_EDIT,
    TOUR_CLOSE_DELETE,
    TOUR_CLOSE_Q_IMAGE,
  ].forEach((name) => dispatch(name));
}

export function openAiExtractForTour() {
  dispatch(TOUR_OPEN_AI);
}
export function closeAiExtractForTour() {
  dispatch(TOUR_CLOSE_AI);
}

export function openBulkTextForTour() {
  dispatch(TOUR_OPEN_BULK);
}
export function closeBulkTextForTour() {
  dispatch(TOUR_CLOSE_BULK);
}

export function openPassageForTour() {
  dispatch(TOUR_OPEN_PASSAGE);
}
export function closePassageForTour() {
  dispatch(TOUR_CLOSE_PASSAGE);
}

export function openImagesForTour() {
  dispatch(TOUR_OPEN_IMAGES);
}
export function closeImagesForTour() {
  dispatch(TOUR_CLOSE_IMAGES);
}

export function openEditQuestionForTour() {
  dispatch(TOUR_OPEN_EDIT);
}
export function closeEditQuestionForTour() {
  dispatch(TOUR_CLOSE_EDIT);
}

export function openDeleteQuestionForTour() {
  dispatch(TOUR_OPEN_DELETE);
}
export function closeDeleteQuestionForTour() {
  dispatch(TOUR_CLOSE_DELETE);
}

export function openQuestionImageForTour() {
  dispatch(TOUR_OPEN_Q_IMAGE);
}
export function closeQuestionImageForTour() {
  dispatch(TOUR_CLOSE_Q_IMAGE);
}
