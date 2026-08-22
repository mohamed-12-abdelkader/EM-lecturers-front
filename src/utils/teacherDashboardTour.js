import { safeLocalGet, safeLocalRemove, safeLocalSet } from "./safeStorage";

const PENDING_KEY = "teacher_dashboard_tour_pending";
const DONE_KEY = "teacher_dashboard_tour_done";

/** عرض الجولة مرة واحدة فقط — بعد الإكمال لا تُعرض مجدداً */
const ALWAYS_SHOW_TEACHER_DASHBOARD_TOUR = false;

export function markTeacherDashboardTourPending() {
  safeLocalSet(PENDING_KEY, "1");
}

export function shouldShowTeacherDashboardTour() {
  if (ALWAYS_SHOW_TEACHER_DASHBOARD_TOUR) return true;
  return safeLocalGet(DONE_KEY) !== "1";
}

export function completeTeacherDashboardTour() {
  safeLocalRemove(PENDING_KEY);
  safeLocalSet(DONE_KEY, "1");
}

export function resetTeacherDashboardTour() {
  safeLocalRemove(DONE_KEY);
  safeLocalRemove(PENDING_KEY);
}

/** أحداث القائمة الجانبية / درج على الموبايل — نفس Navbar */
export {
  TOUR_OPEN_MOBILE_NAV,
  TOUR_CLOSE_MOBILE_NAV,
  openMobileNavForTour,
  closeMobileNavForTour,
} from "./studentHomeTour";

export const TOUR_OPEN_CREATE_COURSE = "teacher-dashboard-tour:open-create-course";
export const TOUR_CLOSE_CREATE_COURSE = "teacher-dashboard-tour:close-create-course";

export function openCreateCourseForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_CREATE_COURSE));
  }
}

export function closeCreateCourseForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_CLOSE_CREATE_COURSE));
  }
}
