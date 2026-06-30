import {
  FaBell,
  FaBookOpen,
  FaChalkboardTeacher,
  FaClipboardList,
  FaComments,
  FaExclamationCircle,
  FaFilePdf,
  FaGraduationCap,
  FaHandsHelping,
  FaHeart,
  FaPlayCircle,
  FaRegComment,
  FaReply,
  FaShare,
  FaThumbsUp,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";

export function getNotificationBody(notification) {
  return notification?.body || notification?.message || "";
}

export function getNotificationIcon(notification) {
  switch (notification?.type) {
    case "lecture_added":
      return FaBookOpen;
    case "video_added":
      return FaPlayCircle;
    case "file_added":
      return FaFilePdf;
    case "exam_added":
      return FaClipboardList;
    case "course_added":
    case "course":
      return FaGraduationCap;
    case "chat_message":
      return FaComments;
    case "social_comment":
      return FaRegComment;
    case "social_reply":
      return FaReply;
    case "social_reaction":
      if (notification.social_reaction_type === "like") return FaThumbsUp;
      if (notification.social_reaction_type === "love") return FaHeart;
      if (notification.social_reaction_type === "support") return FaHandsHelping;
      return FaThumbsUp;
    case "social_post":
      return FaShare;
    case "teacher_message":
      return FaChalkboardTeacher;
    case "student_message":
      return FaUserGraduate;
    case "group_message":
      return FaUsers;
    case "announcement":
      return FaExclamationCircle;
    default:
      return FaBell;
  }
}

export function getNotificationColor(notification) {
  switch (notification?.type) {
    case "lecture_added":
    case "video_added":
    case "file_added":
    case "exam_added":
    case "course_added":
    case "course":
      return "blue";
    case "chat_message":
    case "teacher_message":
    case "student_message":
    case "group_message":
      return "green";
    case "social_comment":
    case "social_reply":
      return "orange";
    case "social_reaction":
      return "purple";
    case "social_post":
      return "pink";
    case "announcement":
      return "red";
    default:
      return "gray";
  }
}

export function getNotificationTypeLabel(type) {
  const labels = {
    lecture_added: "محاضرة",
    video_added: "فيديو",
    file_added: "ملف",
    exam_added: "امتحان",
    course_added: "كورس",
    course: "كورس",
    chat_message: "دردشة",
    social_comment: "تعليق",
    social_reply: "رد",
    social_reaction: "تفاعل",
    social_post: "منشور",
    announcement: "إعلان",
    assignment: "واجب",
    payment: "دفع",
  };
  return labels[type] || "إشعار";
}

export function getNotificationPath(notification) {
  if (notification?.url) {
    return notification.url.startsWith("/")
      ? notification.url
      : `/${notification.url}`;
  }

  switch (notification?.type) {
    case "lecture_added":
    case "video_added":
    case "file_added":
    case "exam_added":
    case "course_added":
    case "course":
      return notification.course_id
        ? `/CourseDetailsPage/${notification.course_id}`
        : "/home";
    case "chat_message":
    case "teacher_message":
    case "student_message":
    case "group_message":
      return "/TeacherChat";
    case "social_comment":
    case "social_reply":
    case "social_reaction":
    case "social_post":
      return "/social";
    case "announcement":
      return "/home";
    default:
      return "/home";
  }
}

export const NOTIFICATION_FILTER_TYPES = [
  { value: "all", label: "الكل" },
  { value: "course_added", label: "كورسات" },
  { value: "lecture_added", label: "محاضرات" },
  { value: "exam_added", label: "امتحانات" },
  { value: "announcement", label: "إعلانات" },
  { value: "chat_message", label: "دردشة" },
  { value: "social_post", label: "سوشيال" },
];
