import { safeLocalGet, safeLocalRemove, safeLocalSet } from "./safeStorage";

const PENDING_KEY = "student_home_tour_pending";
const DONE_KEY = "student_home_tour_done";

/** عرض الجولة مرة واحدة فقط — بعد الإكمال لا تُعرض مجدداً */
const ALWAYS_SHOW_STUDENT_HOME_TOUR = false;

export function markStudentHomeTourPending() {
  safeLocalSet(PENDING_KEY, "1");
}

export function shouldShowStudentHomeTour() {
  if (ALWAYS_SHOW_STUDENT_HOME_TOUR) return true;
  return safeLocalGet(DONE_KEY) !== "1";
}

export function completeStudentHomeTour() {
  safeLocalRemove(PENDING_KEY);
  safeLocalSet(DONE_KEY, "1");
}

/** Custom events — Navbar listens to open/close the mobile drawer during the tour */
export const TOUR_OPEN_MOBILE_NAV = "student-home-tour:open-mobile-nav";
export const TOUR_CLOSE_MOBILE_NAV = "student-home-tour:close-mobile-nav";

export function openMobileNavForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_MOBILE_NAV));
  }
}

export function closeMobileNavForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_CLOSE_MOBILE_NAV));
  }
}

export const TOUR_OPEN_STATS = "student-home-tour:open-stats";

export function openStatsForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_STATS));
  }
}

export const TOUR_OPEN_QUICK_ACTIONS = "student-home-tour:open-quick-actions";

export function openQuickActionsForTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOUR_OPEN_QUICK_ACTIONS));
  }
}
