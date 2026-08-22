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
  useMediaQuery,
} from "@chakra-ui/react";
import { FaCompass, FaChevronLeft } from "react-icons/fa";
import { SHELL_DESKTOP_MIN_PX } from "../../theme/chakraTheme";
import {
  closeMobileNavForTour,
  closeCreateCourseForTour,
  completeTeacherDashboardTour,
  openCreateCourseForTour,
  openMobileNavForTour,
} from "../../utils/teacherDashboardTour";

const CONTENT_STEPS = [
  {
    targetId: null,
    title: "مرحباً بك في لوحة المدرس",
    description:
      "هذه جولة تفصيلية على لوحة التحكم — سنوضّح كل قسم: إنشاء الكورسات، الأدوات السريعة، إدارة المحتوى، والتنقل في المنصة. تستغرق دقيقتين تقريباً.",
  },
  {
    targetId: "teacher-hero",
    title: "لوحة الترحيب",
    description:
      "هنا ترحيبك الشخصي وتاريخ اليوم. من الأزرار العلوية: «كورس جديد» لإنشاء كورس، «تحديث» لتحديث البيانات، و«تثبيت التطبيق» لتثبيت المنصة على جهازك.",
  },
  {
    targetId: "teacher-subscription-alert",
    title: "تنبيه الاشتراك",
    description:
      "إذا كان اشتراكك على وشك الانتهاء، يظهر هنا تنبيه واضح مع أيام متبقية. راجع فواتير الاشتراك من القائمة الجانبية عند الحاجة.",
    cardPlacement: "below-target",
  },
  {
    targetId: "teacher-kpis",
    title: "مؤشرات الأداء",
    description:
      "نظرة سريعة على: عدد كورساتك، المواد الدراسية في بنك الأسئلة، وإجمالي المجموعات — لتتبّع حجم محتواك على المنصة.",
  },
  {
    targetId: "teacher-quick-links",
    title: "الوصول السريع",
    description:
      "اختصارات لأهم الأدوات: إدارة السنتر، بنك الأسئلة، الرسائل، مولّد الامتحانات، المسابقات اليومية، محلل البيانات، السوشيال، ملفاتي، والمساعد العلمي. اسحب أو استخدم الأسهم للتنقل.",
    cardPlacement: "above-target",
  },
  {
    targetId: "teacher-courses",
    title: "قسم كورساتي",
    description:
      "مركز إدارة كورساتك. من هنا تضيف كورساً جديداً، تتابع عدد الكورسات، وتصل لكل كورس بسرعة.",
  },
  {
    targetId: "teacher-create-course-trigger",
    title: "بدء إنشاء كورس",
    description:
      "لإنشاء كورس جديد اضغط «كورس جديد» في لوحة الترحيب أو «إضافة كورس» هنا. في الخطوة التالية سنفتح النموذج ونشرح كل جزء بالتفصيل.",
    cardPlacement: "below-target",
  },
  {
    targetId: "teacher-create-course-modal",
    title: "نموذج إنشاء الكورس",
    description:
      "هذا نموذج إنشاء الكورس — يتكوّن من: معلومات أساسية (العنوان والوصف)، التسعير والصفوف، وصورة الغلاف. في النهاية اضغط «إنشاء الكورس».",
    cardPlacement: "below-target",
    onEnter: () => openCreateCourseForTour(),
    enterDelay: 550,
  },
  {
    targetId: "teacher-create-course-basic",
    title: "المعلومات الأساسية",
    description:
      "اكتب عنواناً واضحاً للكورس (مثل: فيزياء — ثالثة ثانوي) ووصفاً يشرح للطالب ماذا سيتعلّم. هذان الحقلان يظهران في صفحة الكورس للطلاب.",
    onEnter: () => openCreateCourseForTour(),
    enterDelay: 450,
  },
  {
    targetId: "teacher-create-course-pricing",
    title: "التسعير والصفوف",
    description:
      "اختر «مدفوع» وحدّد السعر بالجنيه، أو «مجاني» ليكون متاحاً مباشرة. ثم حدّد الصفوف الدراسية — يمكن اختيار أكثر من صف لنفس الكورس.",
    onEnter: () => openCreateCourseForTour(),
    enterDelay: 450,
  },
  {
    targetId: "teacher-create-course-cover",
    title: "صورة الغلاف",
    description:
      "ارفع صورة جذابة للكورس (PNG أو JPG). تظهر في قائمة الكورسات وصفحة التفاصيل — اختيارية لكنها تزيد ثقة الطلاب.",
    onEnter: () => openCreateCourseForTour(),
    enterDelay: 450,
  },
  {
    targetId: "teacher-create-course-submit",
    title: "إنشاء الكورس",
    description:
      "بعد مراجعة البيانات اضغط «إنشاء الكورس» للحفظ. يمكنك «إلغاء» للخروج بدون حفظ. بعد الإنشاء أضف المحاضرات والامتحانات من «إدارة الكورس».",
    cardPlacement: "above-target",
    onEnter: () => openCreateCourseForTour(),
    onLeave: () => closeCreateCourseForTour(),
    enterDelay: 450,
  },
  {
    targetId: "teacher-courses-toolbar",
    title: "بحث وتصفية الكورسات",
    description:
      "ابحث بالاسم أو الوصف، صفِّ حسب الصف الدراسي، ورتّب من الأحدث أو الأقدم — مفيد عندما يكثر عدد الكورسات.",
    cardPlacement: "above-target",
  },
  {
    targetId: "teacher-courses-list",
    title: "بطاقات الكورسات",
    description:
      "كل كورس يعرض السعر/المجاني، الصف، وتاريخ الإنشاء. عدّل أو احذف من الأيقونات، ثم «إدارة الكورس» للمحاضرات والامتحانات والطلاب.",
  },
  {
    targetId: "teacher-tour-restart",
    title: "إعادة الجولة",
    description:
      "يمكنك إعادة هذه الجولة في أي وقت من زر «جولة المنصة» في لوحة الترحيب — مفيد عند دعوة مساعد أو مراجعة الأقسام.",
    cardPlacement: "below-target",
  },
];

const MOBILE_NAV_STEPS = [
  {
    targetId: "student-mobile-nav-trigger",
    title: "قائمة المنصة على الموبايل",
    description:
      "على الشاشات الصغيرة، اضغط ☰ في الشريط العلوي لفتح كل روابط المدرس: بنك الأسئلة، الرسائل، الامتحانات، إدارة الطلاب، والمزيد.",
    cardPlacement: "below-target",
    onLeave: () => closeMobileNavForTour(),
  },
  {
    targetId: "student-mobile-nav-drawer",
    title: "روابط المدرس",
    description:
      "القائمة مقسّمة: المحتوى والأسئلة، التواصل، الأدوات والامتحانات، والطلاب والحساب. منها تصل لكل أقسام المنصة بدون العودة للرئيسية.",
    cardPlacement: "left-of-target",
    onEnter: () => openMobileNavForTour(),
    onLeave: () => closeMobileNavForTour(),
    enterDelay: 480,
  },
];

const DESKTOP_NAV_STEP = {
  targetId: "student-sidebar",
  title: "القائمة الجانبية",
  description:
    "على الشاشات الكبيرة، القائمة الجانبية تحتوي كل أدوات المدرس: مكتبة الأسئلة، بنك الأسئلة، الرسائل، EM Social، المساعد العلمي، الواجبات، الامتحانات، المسابقات، إدارة السنتر، الطلاب، مجموعات الكورس، وفواتير الاشتراك.",
  cardPlacement: "left-of-target",
};

const CARD_HEIGHT_ESTIMATE = 300;

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

  if (placement === "left-of-target") {
    const preferredLeft = spotlight.left - w - gap;
    const left =
      preferredLeft >= margin
        ? preferredLeft
        : clamp(spotlight.left + spotlight.width + gap, margin, vw - w - margin);
    const top = clamp(
      spotlight.top + spotlight.height / 2 - CARD_HEIGHT_ESTIMATE / 2,
      margin,
      vh - CARD_HEIGHT_ESTIMATE - margin,
    );
    return { top, left };
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

  if (placement === "below-target") {
    const left = clamp(
      spotlight.left + spotlight.width / 2 - w / 2,
      margin,
      vw - w - margin,
    );
    const top = clamp(
      spotlight.top + spotlight.height + gap,
      margin,
      vh - CARD_HEIGHT_ESTIMATE - margin,
    );
    return { top, left };
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

export default function TeacherDashboardTour({ isOpen, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [isDesktopShell] = useMediaQuery(`(min-width: ${SHELL_DESKTOP_MIN_PX})`);

  const tourSteps = useMemo(
    () => [...CONTENT_STEPS, ...(isDesktopShell ? [DESKTOP_NAV_STEP] : MOBILE_NAV_STEPS)],
    [isDesktopShell],
  );

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const progressTrack = useColorModeValue("gray.100", "gray.700");
  const accent = useColorModeValue("#0E4C92", "blue.300");

  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;
  const isIntroStep = stepIndex === 0 && !step?.targetId;
  const progress = ((stepIndex + 1) / tourSteps.length) * 100;

  const finish = useCallback(() => {
    closeMobileNavForTour();
    closeCreateCourseForTour();
    completeTeacherDashboardTour();
    onClose?.();
  }, [onClose]);

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
      closeMobileNavForTour();
      closeCreateCourseForTour();
      return undefined;
    }
    return undefined;
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
          step.cardPlacement === "left-of-target" ||
          step.cardPlacement === "above-target" ||
          step.cardPlacement === "below-target";
        if (!skipScroll) {
          el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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
  const targetMissing = step?.targetId && !spotlight && !isIntroStep;

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
        top={`${cardPos.top}px`}
        left={`${cardPos.left}px`}
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
              <Icon as={FaCompass} />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" color={muted} mb={0.5}>
                {stepIndex === 0
                  ? "جولة تعريفية للمدرس"
                  : `الخطوة ${stepIndex + 1} من ${tourSteps.length}`}
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
            sx={{ "& > div": { bg: accent } }}
          />

          <Text fontSize="sm" color={muted} lineHeight="1.95">
            {step.description}
          </Text>

          {targetMissing ? (
            <Text fontSize="xs" color="orange.500" fontWeight="600">
              هذا القسم غير ظاهر حالياً — اضغط «التالي» للمتابعة.
            </Text>
          ) : null}

          <HStack spacing={2} justify="space-between" pt={1}>
            <Button
              variant="ghost"
              size="sm"
              color={muted}
              onClick={finish}
            >
              تخطي
            </Button>
            <Button
              bg="#DD6B20"
              color="white"
              size="sm"
              borderRadius="xl"
              px={6}
              _hover={{ bg: "#C05621" }}
              rightIcon={!isLast ? <Icon as={FaChevronLeft} /> : undefined}
              onClick={() => {
                if (isLast) {
                  finish();
                } else {
                  setStepIndex((prev) => prev + 1);
                }
              }}
            >
              {stepIndex === 0 ? "ابدأ الجولة" : isLast ? "تم — ابدأ التدريس" : "التالي"}
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>,
    document.body,
  );
}
