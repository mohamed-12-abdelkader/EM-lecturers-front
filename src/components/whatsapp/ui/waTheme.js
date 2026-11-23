/** Shared WhatsApp services UI tokens (Chakra) */
export const WA_GREEN = "#25D366";
export const WA_GREEN_DARK = "#1DA851";

export const SESSION_STATUS_META = {
  ready: { label: "متصلة", color: "green" },
  qr: { label: "بانتظار المسح", color: "orange" },
  pending: { label: "قيد التحضير", color: "gray" },
  authenticated: { label: "جارٍ الربط", color: "blue" },
  disconnected: { label: "غير متصلة", color: "red" },
};

export const CONVO_STATUS_META = {
  bot: { label: "بوت", color: "purple" },
  waiting_human: { label: "بانتظار موظف", color: "orange" },
  human: { label: "موظف", color: "blue" },
  closed: { label: "مغلقة", color: "gray" },
};

export const ADMIN_WA_NAV = [
  { to: "/admin/whatsapp/services", label: "الخدمات", key: "services" },
  { to: "/admin/whatsapp/sessions", label: "الجلسات", key: "sessions" },
  { to: "/admin/whatsapp/monitor", label: "المراقبة", key: "monitor" },
  { to: "/admin/whatsapp/inbox", label: "صندوق الوارد", key: "inbox" },
  { to: "/admin/whatsapp/policy", label: "سياسة الدعم", key: "policy" },
  { to: "/admin/whatsapp/parents-exam", label: "إشعار أولياء", key: "parents-exam" },
  { to: "/admin/whatsapp/teachers-management", label: "تذكير المدرسين", key: "teachers-management" },
  { to: "/admin/whatsapp/exam-assistant", label: "مساعد الامتحانات", key: "exam-assistant" },
  { to: "/admin/whatsapp/sales-agent", label: "وكيل المبيعات", key: "sales-agent" },
];
