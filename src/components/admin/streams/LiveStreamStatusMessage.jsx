import React from "react";
import {
  AiOutlineLoading3Quarters,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import {
  MdOutlineUpdate,
  MdOutlineDelete,
  MdOutlineErrorOutline,
  MdPlayArrow,
  MdStop,
} from "react-icons/md";

const statusMessages = {
  CREATING: {
    text: "جاري إنشاء البث المباشر...",
    icon: <AiOutlineLoading3Quarters className="animate-spin text-blue-500" />,
    color: "text-blue-500",
  },
  CREATE_FAILED: {
    text: "فشل في إنشاء البث!",
    icon: <MdOutlineErrorOutline className="text-red-500" />,
    color: "text-red-500",
  },
  IDLE: {
    text: "البث غير نشط حالياً.",
    icon: <MdStop className="text-gray-500" />,
    color: "text-gray-500",
  },
  STARTING: {
    text: "جاري بدء البث...",
    icon: <AiOutlineLoading3Quarters className="animate-spin text-blue-600" />,
    color: "text-blue-600",
  },
  RUNNING: {
    text: "البث يعمل الآن",
    icon: <MdPlayArrow className="text-green-600" />,
    color: "text-green-600",
  },
  RECOVERING: {
    text: "استعادة البث بعد انقطاع...",
    icon: (
      <AiOutlineLoading3Quarters className="animate-spin text-yellow-500" />
    ),
    color: "text-yellow-500",
  },
  STOPPING: {
    text: "جاري إيقاف البث...",
    icon: (
      <AiOutlineLoading3Quarters className="animate-spin text-orange-500" />
    ),
    color: "text-orange-500",
  },
  DELETING: {
    text: "جاري حذف قناة البث...",
    icon: <AiOutlineLoading3Quarters className="animate-spin text-red-400" />,
    color: "text-red-400",
  },
  DELETED: {
    text: "تم حذف قناة البث.",
    icon: <MdOutlineDelete className="text-red-600" />,
    color: "text-red-600",
  },
  UPDATING: {
    text: "جاري تحديث إعدادات البث...",
    icon: <MdOutlineUpdate className="animate-spin text-indigo-500" />,
    color: "text-indigo-500",
  },
  UPDATE_FAILED: {
    text: "فشل تحديث البث!",
    icon: <AiOutlineCloseCircle className="text-red-600" />,
    color: "text-red-600",
  },
};

const LiveStreamStatusMessage = ({ status }) => {
  const { text, icon, color } = statusMessages[status] || {
    text: "حالة البث غير معروفة",
    icon: null,
    color: "text-gray-400",
  };

  return (
    <div
      className={`flex items-center justify-center gap-2 text-lg font-medium ${color} rtl`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

export default LiveStreamStatusMessage;
