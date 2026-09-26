/**
 * رسائل تفعيل الكورس للطالب — عربية واضحة بغض النظر عن رسالة الـ API.
 */

export const ACTIVATION_SUPPORT_WHATSAPP_NUMBERS = [
  "01111272393",
  "01132176865",
  "01132176849",
];

export function pickActivationSupportWhatsAppNumber() {
  const list = ACTIVATION_SUPPORT_WHATSAPP_NUMBERS;
  return list[Math.floor(Math.random() * list.length)];
}

/** رابط واتساب برقم مصري ورسالة جاهزة */
export function buildActivationSupportWhatsAppUrl(code) {
  const phone = pickActivationSupportWhatsAppNumber();
  const digits = String(phone).replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
  const codeText = String(code || "").trim() || "غير معروف";
  const message =
    `انا اواجه مشكلة فى تفعيل الكورس باستخدام هذا الكود ${codeText} بيظهر ان الكود مستخدم اريد حل المشكلة وفهم الخطاء`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export function getActivationSuccessCopy(course) {
  const courseTitle = String(course?.title || course?.name || "").trim();
  return {
    title: "تم تفعيل الكورس بنجاح",
    message: courseTitle
      ? `تم تفعيل كورس «${courseTitle}» بنجاح. يمكنك الآن الدخول ومتابعة المحاضرات.`
      : "تم تفعيل الكورس بنجاح. يمكنك الآن الدخول ومتابعة المحاضرات.",
  };
}

const ERROR_MAP = [
  {
    test: /fully used|already used|exhausted|مستنفذ|مستخدم/,
    kind: "code_exhausted",
    message: "كود التفعيل مستنفذ بالكامل",
    reason:
      "يبدو أن هذا الكود تم استخدامه من قبل. تواصل مع الدعم الفني عبر واتساب لحل المشكلة.",
  },
  {
    test: /expired|انتهت|منتهي/,
    kind: "error",
    message: "انتهت صلاحية هذا الكود",
    reason: "اطلب كود تفعيل جديداً من المدرّس.",
  },
  {
    test: /invalid|not found|غير صحيح|غير صالح/,
    kind: "error",
    message: "كود التفعيل غير صحيح",
    reason: "تأكد من الكود ثم حاول مرة أخرى.",
  },
  {
    test: /already enrolled|already activated|مشترك/,
    kind: "already_enrolled",
    message: "أنت مشترك في هذا الكورس بالفعل",
    reason: "يمكنك الدخول للكورس مباشرة ومتابعة المحتوى.",
  },
  {
    test: /unauthorized|login|تسجيل/,
    kind: "error",
    message: "يلزم تسجيل الدخول أولاً",
    reason: "سجّل الدخول ثم أعد محاولة التفعيل.",
  },
];

export function isAlreadyEnrolledError(apiMessage, apiReason) {
  const combined = `${apiMessage || ""} ${apiReason || ""}`.toLowerCase();
  return /already enrolled|already activated|مشترك/.test(combined);
}

/** استخراج بيانات الكورس من استجابة الخطأ إن وُجدت */
export function extractCourseFromActivationError(error) {
  const data = error?.response?.data || {};
  const course = data.course || data.data?.course || null;
  const id =
    course?.id ??
    data.course_id ??
    data.courseId ??
    data.data?.course_id ??
    null;
  const title =
    course?.title ||
    course?.name ||
    data.course_name ||
    data.courseTitle ||
    data.data?.course_name ||
    "";
  if (id == null && !title) return null;
  return { id, title: String(title || "").trim() || null };
}

export function getActivationErrorCopy(apiMessage, apiReason) {
  const combined = `${apiMessage || ""} ${apiReason || ""}`.toLowerCase();
  const hit = ERROR_MAP.find((row) => row.test.test(combined));
  if (hit) {
    return { kind: hit.kind, message: hit.message, reason: hit.reason };
  }

  const looksEnglish = /[a-z]/i.test(String(apiMessage || ""));
  return {
    kind: "error",
    message: looksEnglish || !apiMessage ? "تعذّر تفعيل الكورس" : String(apiMessage),
    reason:
      looksEnglish || !apiReason
        ? "تحقق من الكود أو جرّب مرة أخرى. إن استمرت المشكلة تواصل مع المدرّس."
        : String(apiReason),
  };
}

const ALREADY_ENROLLED_COPY = {
  kind: "already_enrolled",
  message: "أنت مشترك في هذا الكورس بالفعل",
  reason: "يمكنك الدخول للكورس مباشرة ومتابعة المحتوى.",
};

/**
 * لو الـ API رجّع «كود مستنفذ» والكورس ده الطالب مشترك فيه أصلاً
 * → نعرض «مشترك بالفعل» بدل رسالة الكود المستخدم.
 */
export function resolveActivationErrorCopy({
  apiMessage,
  apiReason,
  errorData,
  course,
  enrolledCourseIds = [],
} = {}) {
  const base = getActivationErrorCopy(apiMessage, apiReason);
  const data = errorData || {};

  const apiSaysEnrolled =
    data.already_enrolled === true ||
    data.is_enrolled === true ||
    data.student_already_enrolled === true ||
    data.enrolled === true ||
    data.data?.already_enrolled === true ||
    data.data?.is_enrolled === true;

  if (base.kind === "already_enrolled" || apiSaysEnrolled) {
    return { ...ALREADY_ENROLLED_COPY };
  }

  const courseId = course?.id ?? data.course_id ?? data.courseId ?? data.data?.course_id;
  const enrolledSet = new Set(
    (Array.isArray(enrolledCourseIds) ? enrolledCourseIds : []).map((id) => String(id)),
  );
  const locallyEnrolled = courseId != null && enrolledSet.has(String(courseId));

  if (base.kind === "code_exhausted" && locallyEnrolled) {
    return { ...ALREADY_ENROLLED_COPY };
  }

  return base;
}
