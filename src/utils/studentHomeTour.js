/** أحداث القائمة الجانبية / درج الموبايل — تستخدمها جولة المدرس من نفس Navbar */
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
