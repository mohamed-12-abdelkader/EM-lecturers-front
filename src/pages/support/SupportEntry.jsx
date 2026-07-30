import React from "react";
import { Navigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";
import SupportChatStudent from "./SupportChatStudent";
import SupportGuestPage from "./SupportGuestPage";

/**
 * مدخل موحّد لـ /support:
 * - بدون توكن → شات الضيف (guest_token)
 * - مدرس → شات دعم المدرس
 * - طالب → شات الطالب
 */
export default function SupportEntry() {
  const [userData, , isTeacher] = UserType();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!token || !userData) {
    return <SupportGuestPage />;
  }
  if (isTeacher) {
    return <Navigate to="/support-teacher" replace />;
  }
  return <SupportChatStudent />;
}
