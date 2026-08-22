import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Progress,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaChevronLeft, FaChalkboardTeacher } from "react-icons/fa";
import {
  collapseLectureForTour,
  completeTeacherCoursePageTour,
  expandLectureForTour,
  setCourseTourSection,
} from "../../utils/coursePageTour";
import {
  closeAccessSettingsForTour,
  closeActivateStudentForTour,
  closeAllTeacherCourseTourModals,
  closeAssignmentModalForTour,
  closeCourseAssignmentModalForTour,
  closeCreateCodesForTour,
  closeCreateExamForTour,
  closeCreateStreamForTour,
  closeEnrollmentsForTour,
  closeFileUploadForTour,
  closeLectureModalForTour,
  closeVideoModalForTour,
  closeViewCodesForTour,
  openAccessSettingsForTour,
  openActivateStudentForTour,
  openAssignmentModalForTour,
  openCourseAssignmentModalForTour,
  openCreateCodesForTour,
  openCreateExamForTour,
  openCreateStreamForTour,
  openEnrollmentsForTour,
  openFileUploadForTour,
  openLectureModalForTour,
  openVideoModalForTour,
  openViewCodesForTour,
} from "../../utils/teacherCoursePageTour";

const CARD_HEIGHT_ESTIMATE = 320;

function buildTeacherTourSteps(meta) {
  const {
    hasLectures,
    lectureId,
    isCourseBasedAssignments = false,
    showActivationCodes = true,
  } = meta || {};

  const prepLectures = () => {
    collapseLectureForTour();
    setCourseTourSection("lectures");
  };

  const prepLectureExpanded = () => {
    setCourseTourSection("lectures");
    if (lectureId != null) expandLectureForTour(lectureId);
  };

  const steps = [
    {
      targetId: null,
      title: "مرحباً في إدارة الكورس",
      description:
        "جولة تفصيلية على كل أزرار صفحة الكورس — سنتوقف عند كل زر، نشرح وظيفته، ونفتح النوافذ (الموديلات) لتوضيح الحقول. تستغرق 4–5 دقائق.",
    },
    {
      targetId: "course-hero",
      title: "بطاقة الكورس",
      description:
        "نظرة عامة: الغلاف، العنوان، الوصف، عدد الطلاب، التقييم، وعدد المحاضرات — قبل الدخول في أدوات الإدارة.",
      onEnter: () => closeAllTeacherCourseTourModals(),
    },
    {
      targetId: "course-hero-activate",
      title: "زر «تفعيل طالب»",
      description:
        "يفتح نافذة لإضافة طالب للكورس يدوياً برقم هويته (ID) — مفيد عند التفعيل المباشر بدون كود اشتراك.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherCourseTourModals(),
    },
    {
      targetId: "course-activate-student-modal",
      title: "نافذة تفعيل الطالب",
      description:
        "أدخل «رقم الطالب» من سجل الطلاب ثم اضغط «تفعيل». يُسجّل الطالب في الكورس فوراً. «إلغاء» للخروج بدون تفعيل.",
      onEnter: () => openActivateStudentForTour(),
      onLeave: () => closeActivateStudentForTour(),
      enterDelay: 580,
    },
    {
      targetId: "course-hero-stats",
      title: "زر «الإحصائيات»",
      description:
        "ينقلك لصفحة تحليلات الكورس: أداء الطلاب، نسب الإكمال، ونتائج الامتحانات — لمراجعة مستوى الفصل.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherCourseTourModals(),
    },
    {
      targetId: "course-hero-enrollments",
      title: "زر «المشتركين»",
      description:
        "يعرض قائمة الطلاب المسجّلين في الكورس مع بيانات التواصل وتاريخ الاشتراك وحالة الحظر — ويمكنك الانتقال لإدارة الطلاب.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherCourseTourModals(),
    },
    {
      targetId: "course-enrollments-modal",
      title: "نافذة المشتركين",
      description:
        "ابحث بالاسم أو الهاتف أو البريد. الجدول يعرض: الطالب، التواصل، تاريخ الاشتراك، والحالة (نشط/محظور). «إدارة الطلاب» للتحكم الكامل.",
      onEnter: () => openEnrollmentsForTour(),
      onLeave: () => closeEnrollmentsForTour(),
      enterDelay: 580,
    },
  ];

  if (showActivationCodes) {
    steps.push(
      {
        targetId: "course-create-codes-btn",
        title: "زر «إنشاء أكواد»",
        description:
          "يولّد أكواد اشتراك جديدة للكورس — تحدد العدد وتاريخ انتهاء الصلاحية ثم توزّعها على الطلاب.",
        cardPlacement: "below-target",
        onEnter: () => closeAllTeacherCourseTourModals(),
      },
      {
        targetId: "course-create-codes-modal",
        title: "نافذة إنشاء الأكواد",
        description:
          "«عدد الأكواد»: كم كود تريد توليده. «تاريخ انتهاء الصلاحية»: آخر موعد لاستخدام الكود. اضغط «إنشاء» للحفظ — لا تُفعَّل الأكواد تلقائياً، الطالب يستخدمها عند الاشتراك.",
        onEnter: () => openCreateCodesForTour(),
        onLeave: () => closeCreateCodesForTour(),
        enterDelay: 580,
      },
      {
        targetId: "course-view-codes-btn",
        title: "زر «عرض أكواد الكورس»",
        description:
          "يفتح قائمة كل أكواد الكورس: البحث، نسخ الأكواد، وتصدير PDF لطباعة بطاقات التفعيل.",
        cardPlacement: "below-target",
        onEnter: () => closeAllTeacherCourseTourModals(),
      },
      {
        targetId: "course-view-codes-modal",
        title: "نافذة عرض الأكواد",
        description:
          "ابحث عن كود محدد، راجع حالة الاستخدام (مستخدم/غير مستخدم)، وصدّر نطاقاً من الأكواد كـ PDF للتوزيع على الطلاب.",
        onEnter: () => openViewCodesForTour(),
        onLeave: () => closeViewCodesForTour(),
        enterDelay: 650,
      },
    );
  }

  steps.push(
    {
      targetId: "course-content-nav",
      title: "أقسام المحتوى",
      description:
        "التنقل بين: المحاضرات، الواجبات، البث المباشر، الامتحانات، التقارير، وملفات PDF. على الموبايل مرّر أفقياً بين الأقسام.",
      cardPlacement: "above-target",
      onEnter: () => {
        closeAllTeacherCourseTourModals();
        prepLectures();
      },
    },
    {
      targetId: "course-add-lecture",
      title: "زر «إضافة محاضرة»",
      description:
        "ينشئ محاضرة جديدة داخل الكورس — العنوان، الوصف، الترتيب، وإعدادات الظهور للطلاب.",
      cardPlacement: "below-target",
      onEnter: prepLectures,
    },
    {
      targetId: "course-lecture-modal",
      title: "نافذة إضافة محاضرة",
      description:
        "«عنوان المحاضرة»: الاسم الذي يراه الطالب. «الوصف»: نبذة اختيارية. «ترتيب المحاضرة»: ترتيب الظهور (1، 2، 3…). إن كان الوصول بمدة زمنية، يظهر حقل تاريخ الانتهاء.",
      onEnter: () => openLectureModalForTour(),
      onLeave: () => closeLectureModalForTour(),
      enterDelay: 580,
    },
    {
      targetId: "course-access-settings",
      title: "زر «إعدادات الوصول»",
      description:
        "يتحكم في كيفية فتح المحاضرات للطلاب وأين تُعرض الواجبات — إعدادات على مستوى الكورس بالكامل.",
      cardPlacement: "below-target",
      onEnter: () => {
        closeLectureModalForTour();
        prepLectures();
      },
    },
    {
      targetId: "course-access-settings-modal",
      title: "نافذة إعدادات الوصول",
      description:
        "«طريقة فتح المحاضرات»: مفتوحة دائماً، بمدة زمنية، أو بكود تفعيل. «مكان الواجبات»: داخل كل محاضرة أو على مستوى الكورس. اضغط «حفظ» لتطبيق التغيير.",
      onEnter: () => openAccessSettingsForTour(),
      onLeave: () => closeAccessSettingsForTour(),
      enterDelay: 580,
    },
  );

  if (hasLectures && lectureId) {
    steps.push(
      {
        targetId: "course-lecture-card",
        title: "بطاقة المحاضرة",
        description:
          "تعرض عنوان المحاضرة، حالة الظهور (ظاهر/مخفي)، عدد الفيديوهات والواجبات، وحالة الفتح للطلاب. «فتح المحاضرة» لإدارة المحتوى.",
        cardPlacement: "above-target",
        onEnter: prepLectureExpanded,
        enterDelay: 520,
      },
      {
        targetId: "course-lecture-edit",
        title: "زر تعديل المحاضرة",
        description:
          "يفتح نفس نافذة الإضافة لكن ببيانات المحاضرة الحالية — لتعديل العنوان، الوصف، الترتيب، أو تاريخ الانتهاء.",
        cardPlacement: "below-target",
        onEnter: prepLectureExpanded,
        enterDelay: 480,
      },
      {
        targetId: "course-lecture-visibility",
        title: "زر إظهار / إخفاء",
        description:
          "يُبدّل ظهور المحاضرة للطلاب فوراً: «مخفي» = لا يراها الطلاب، «ظاهر» = متاحة حسب إعدادات الوصول.",
        cardPlacement: "below-target",
        onEnter: prepLectureExpanded,
        enterDelay: 480,
      },
      {
        targetId: "course-lecture-delete",
        title: "زر حذف المحاضرة",
        description:
          "يحذف المحاضرة نهائياً مع فيديوهاتها وواجباتها — يطلب تأكيداً قبل التنفيذ. استخدمه بحذر.",
        cardPlacement: "below-target",
        onEnter: prepLectureExpanded,
        enterDelay: 480,
      },
      {
        targetId: "course-lecture-add-video",
        title: "زر «إضافة فيديو»",
        description:
          "يرفع فيديو شرح جديد داخل هذه المحاضرة — رابط يوتيوب أو Vimeo مع عنوان وترتيب.",
        cardPlacement: "below-target",
        onEnter: prepLectureExpanded,
        enterDelay: 480,
      },
      {
        targetId: "course-video-modal",
        title: "نافذة إضافة فيديو",
        description:
          "«عنوان الفيديو»: اسم يظهر للطالب. «رابط الفيديو»: رابط YouTube/Vimeo. «ترتيب الفيديو»: ترتيب التشغيل داخل المحاضرة. «إضافة الفيديو» للحفظ.",
        onEnter: () => {
          prepLectureExpanded();
          openVideoModalForTour(lectureId);
        },
        onLeave: () => closeVideoModalForTour(),
        enterDelay: 580,
      },
    );

    if (!isCourseBasedAssignments) {
      steps.push(
        {
          targetId: "course-lecture-add-assignment",
          title: "زر «إضافة واجب»",
          description:
            "ينشئ واجباً (امتحاناً قصيراً) مرتبطاً بهذه المحاضرة — بدرجة، مدة، وإمكانية قفل المحاضرات التالية حتى النجاح.",
          cardPlacement: "below-target",
          onEnter: () => {
            closeVideoModalForTour();
            prepLectureExpanded();
          },
          enterDelay: 480,
        },
        {
          targetId: "course-assignment-modal",
          title: "نافذة إضافة واجب",
          description:
            "«عنوان الواجب»، «الدرجة الكلية»، «المدة بالدقائق»، مواعيد الظهور/الإخفاء، «قفل المحاضرات التالية» (يمنع فتح محاضرات لاحقة قبل النجاح)، وإظهار الإجابات.",
          onEnter: () => {
            prepLectureExpanded();
            openAssignmentModalForTour(lectureId);
          },
          onLeave: () => {
            closeAssignmentModalForTour();
            collapseLectureForTour();
          },
          enterDelay: 580,
        },
      );
    } else {
      const videoStep = steps.find((s) => s.targetId === "course-video-modal");
      if (videoStep) {
        videoStep.onLeave = () => {
          closeVideoModalForTour();
          collapseLectureForTour();
        };
      }
    }
  }

  if (isCourseBasedAssignments) {
    steps.push(
      {
        targetId: "course-assignments-add-btn",
        title: "زر «إضافة واجب» (مستوى الكورس)",
        description:
          "عند اختيار «واجبات على مستوى الكورس» في إعدادات الوصول، تُضاف الواجبات من هذا القسم — مستقلة عن المحاضرات.",
        cardPlacement: "below-target",
        onEnter: () => {
          closeAllTeacherCourseTourModals();
          collapseLectureForTour();
          setCourseTourSection("assignments");
        },
        enterDelay: 480,
      },
      {
        targetId: "course-assignment-modal",
        title: "نافذة واجب الكورس",
        description:
          "نفس حقول واجب المحاضرة: العنوان، الدرجة، المدة، الظهور للطلاب، ومواعيد البداية/النهاية — لكن الواجب يظهر في قسم «واجبات الكورس» وليس داخل محاضرة.",
        onEnter: () => {
          setCourseTourSection("assignments");
          openCourseAssignmentModalForTour();
        },
        onLeave: () => closeCourseAssignmentModalForTour(),
        enterDelay: 580,
      },
    );
  }

  steps.push(
    {
      targetId: "course-create-stream-btn",
      title: "زر «إنشاء جلسة»",
      description:
        "يفتح نافذة لجدولة أو بدء بث مباشر للكورس — الطلاب يرون الجلسة في قسم «المحاضرات المباشرة».",
      cardPlacement: "below-target",
      onEnter: () => {
        closeAllTeacherCourseTourModals();
        collapseLectureForTour();
        setCourseTourSection("live");
      },
      enterDelay: 480,
    },
    {
      targetId: "course-create-stream-modal",
      title: "نافذة إنشاء بث مباشر",
      description:
        "«عنوان البث»: اسم الحصة (مثل: مراجعة امتحان). «بدء البث» ينشئ الغرفة — شارك الرابط مع الطلاب أو ادخل من زر «دخول الغرفة».",
      onEnter: () => {
        setCourseTourSection("live");
        openCreateStreamForTour();
      },
      onLeave: () => closeCreateStreamForTour(),
      enterDelay: 580,
    },
    {
      targetId: "course-create-exam-btn",
      title: "زر «إنشاء امتحان شامل»",
      description:
        "ينشئ امتحاناً يغطي الكورس بالكامل — بموعد، مدة، عدد أسئلة، وإعدادات ظهور النتائج.",
      cardPlacement: "below-target",
      onEnter: () => {
        closeCreateStreamForTour();
        setCourseTourSection("exams");
      },
      enterDelay: 480,
    },
    {
      targetId: "course-create-exam-modal",
      title: "نافذة الامتحان الشامل",
      description:
        "«عنوان الامتحان»، «عدد الأسئلة»، «المدة»، «ظاهر للطلاب»، موعد انتهاء الظهور، وإعدادات إظهار الإجابات. بعد الإنشاء أضف الأسئلة من بطاقة الامتحان.",
      onEnter: () => {
        setCourseTourSection("exams");
        openCreateExamForTour();
      },
      onLeave: () => closeCreateExamForTour(),
      enterDelay: 580,
    },
    {
      targetId: "course-content-panel",
      title: "قسم «التقارير»",
      description:
        "تحليلات أداء الطلاب في الواجبات: نسب النجاح، الأسئلة الأكثر خطأً، ومقارنة المجموعات — راجعها قبل الامتحانات.",
      cardPlacement: "above-target",
      onEnter: () => {
        closeCreateExamForTour();
        collapseLectureForTour();
        setCourseTourSection("assignment-reports");
      },
      enterDelay: 420,
    },
    {
      targetId: "course-add-file-btn",
      title: "زر «إضافة ملف PDF»",
      description:
        "يرفع ملف PDF للكورس (ملخصات، مراجع، نماذج) — يشاهده الطلاب داخل المنصة مع حماية من التحميل غير المصرّح.",
      cardPlacement: "below-target",
      onEnter: () => {
        closeAllTeacherCourseTourModals();
        setCourseTourSection("files");
      },
      enterDelay: 480,
    },
    {
      targetId: "course-file-upload-modal",
      title: "نافذة رفع ملف PDF",
      description:
        "«عنوان الملف» و«الوصف» للطلاب. اسحب ملف PDF أو اختره (حد أقصى حسب إعدادات المنصة). «رفع الملف» للحفظ — يظهر في قائمة ملفات الكورس.",
      onEnter: () => {
        setCourseTourSection("files");
        openFileUploadForTour();
      },
      onLeave: () => closeFileUploadForTour(),
      enterDelay: 580,
    },
    {
      targetId: "course-tour-restart",
      title: "إعادة الجولة",
      description:
        "زر «جولة الإدارة» يعيد هذه الجولة في أي وقت — مفيد عند دعوة مساعد أو مراجعة خطوات الإدارة.",
      cardPlacement: "below-target",
      onEnter: () => {
        closeAllTeacherCourseTourModals();
        setCourseTourSection("lectures");
      },
      enterDelay: 350,
    },
  );

  return steps;
}

function computeCardPosition(spotlight, cardWidth, placement) {
  const margin = 16;
  const gap = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(cardWidth, vw - margin * 2);

  if (!spotlight) {
    return {
      top: (vh - CARD_HEIGHT_ESTIMATE) / 2,
      left: (vw - w) / 2,
    };
  }

  if (placement === "above-target") {
    const left = clamp(
      spotlight.left + spotlight.width / 2 - w / 2,
      margin,
      vw - w - margin,
    );
    let top = spotlight.top - CARD_HEIGHT_ESTIMATE - gap;
    if (top < margin) {
      top = spotlight.top + spotlight.height + gap;
    }
    return { top: clamp(top, margin, vh - CARD_HEIGHT_ESTIMATE - margin), left };
  }

  const left = clamp(
    spotlight.left + spotlight.width / 2 - w / 2,
    margin,
    vw - w - margin,
  );
  const below = spotlight.top + spotlight.height + gap;
  const above = spotlight.top - CARD_HEIGHT_ESTIMATE - gap;
  let top = below;
  if (below + CARD_HEIGHT_ESTIMATE > vh - margin && above >= margin) {
    top = above;
  }
  return { top: clamp(top, margin, vh - CARD_HEIGHT_ESTIMATE - margin), left };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function TeacherCoursePageTour({
  isOpen,
  courseId,
  lectureTourMeta,
  isCourseBasedAssignments,
  showActivationCodes = true,
  onClose,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);

  const tourMeta = useMemo(
    () => ({
      ...lectureTourMeta,
      isCourseBasedAssignments,
      showActivationCodes,
    }),
    [lectureTourMeta, isCourseBasedAssignments, showActivationCodes],
  );

  const tourSteps = useMemo(() => buildTeacherTourSteps(tourMeta), [tourMeta]);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const progressTrack = useColorModeValue("gray.100", "gray.700");

  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;
  const isIntroStep = stepIndex === 0 && !step?.targetId;
  const progress = ((stepIndex + 1) / tourSteps.length) * 100;

  const finish = useCallback(() => {
    closeAllTeacherCourseTourModals();
    collapseLectureForTour();
    completeTeacherCoursePageTour(courseId);
    onClose?.();
  }, [courseId, onClose]);

  const updateSpotlight = useCallback(() => {
    if (!step?.targetId) {
      setSpotlight(null);
      return;
    }
    const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (!el) {
      setSpotlight(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlight({
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
    });
  }, [step?.targetId]);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      setSpotlight(null);
      closeAllTeacherCourseTourModals();
      collapseLectureForTour();
      setCourseTourSection("lectures");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !step) return undefined;

    let cancelled = false;
    let spotlightTimer;

    const runStep = async () => {
      try {
        await step.onEnter?.();
      } catch {
        // ignore tour hook errors
      }

      if (cancelled) return;

      const delay = step.enterDelay ?? (step.targetId ? 420 : 0);

      if (step.targetId) {
        const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
        const skipScroll =
          step.cardPlacement === "above-target" || step.cardPlacement === "left-of-target";
        if (!skipScroll) {
          el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        } else {
          el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
        spotlightTimer = window.setTimeout(updateSpotlight, delay);
      } else {
        setSpotlight(null);
      }
    };

    runStep();

    return () => {
      cancelled = true;
      if (spotlightTimer) window.clearTimeout(spotlightTimer);
      step.onLeave?.();
    };
  }, [isOpen, stepIndex, step, updateSpotlight]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onLayout = () => updateSpotlight();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [isOpen, updateSpotlight]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const cardWidth = 400;
  const cardPos = computeCardPosition(spotlight, cardWidth, step?.cardPlacement);
  const cardLeft = cardPos.left;
  const cardTop = cardPos.top;

  return createPortal(
    <Box position="fixed" inset={0} zIndex={10050} dir="rtl">
      {isIntroStep ? (
        <Box position="fixed" inset={0} bg="blackAlpha.300" pointerEvents="auto" />
      ) : spotlight ? (
        <Box
          position="fixed"
          top={`${spotlight.top}px`}
          left={`${spotlight.left}px`}
          w={`${spotlight.width}px`}
          h={`${spotlight.height}px`}
          borderRadius="xl"
          boxShadow="0 0 0 9999px rgba(0, 0, 0, 0.72)"
          border="2px solid"
          borderColor="orange.400"
          pointerEvents="none"
          transition="all 0.25s ease"
        />
      ) : (
        <Box position="fixed" inset={0} bg="blackAlpha.720" pointerEvents="auto" />
      )}

      <Box
        position="fixed"
        top={`${cardTop}px`}
        left={`${cardLeft}px`}
        w={`${Math.min(cardWidth, window.innerWidth - 32)}px`}
        bg={cardBg}
        borderWidth="1px"
        borderColor={cardBorder}
        borderRadius="2xl"
        boxShadow="2xl"
        p={5}
        zIndex={10051}
        pointerEvents="auto"
      >
        <VStack align="stretch" spacing={4}>
          <HStack spacing={3}>
            <Flex
              w={10}
              h={10}
              borderRadius="xl"
              bg="orange.50"
              _dark={{ bg: "orange.900" }}
              align="center"
              justify="center"
              color="orange.500"
              flexShrink={0}
            >
              <Icon as={FaChalkboardTeacher} />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" color={muted} mb={0.5}>
                {stepIndex === 0
                  ? "جولة إدارة الكورس"
                  : `الخطوة ${stepIndex} من ${tourSteps.length - 1}`}
              </Text>
              <Text fontWeight="bold" fontSize="lg" color={titleColor} lineHeight="1.4">
                {step.title}
              </Text>
            </Box>
          </HStack>

          <Progress
            value={progress}
            size="xs"
            colorScheme="orange"
            borderRadius="full"
            bg={progressTrack}
          />

          <Text fontSize="sm" color={muted} lineHeight="1.9">
            {step.description}
          </Text>

          <HStack spacing={2} justify="flex-end" pt={1}>
            <Button
              colorScheme="orange"
              size="sm"
              borderRadius="xl"
              px={6}
              rightIcon={!isLast ? <Icon as={FaChevronLeft} /> : undefined}
              onClick={() => {
                if (isLast) {
                  finish();
                } else {
                  setStepIndex((prev) => prev + 1);
                }
              }}
            >
              {stepIndex === 0 ? "ابدأ الجولة" : isLast ? "تم — ابدأ الإدارة" : "التالي"}
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>,
    document.body,
  );
}
