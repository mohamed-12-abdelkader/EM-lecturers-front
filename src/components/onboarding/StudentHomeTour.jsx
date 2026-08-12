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
  completeStudentHomeTour,
  openMobileNavForTour,
  openQuickActionsForTour,
  openStatsForTour,
} from "../../utils/studentHomeTour";

const CONTENT_STEPS = [
  {
    targetId: null,
    title: "مرحباً بك في المنصة!",
    description:
      "خلينا ناخد جولة سريعة على الصفحة الرئيسية علشان تفهم كل قسم بيعمل إيه — هتاخد أقل من دقيقة.",
  },
  {
    targetId: "home-hero",
    title: "لوحة الترحيب",
    description:
      "هنا بتلاقي ترحيبك، كود الطالب، وإحصائياتك السريعة — كلها في مكان واحد.",
  },
  {
    targetId: "home-stats",
    title: "إحصائياتك",
    description:
      "عداد سريع يوضّح: كورساتك المشترك فيها، إجمالي الكورسات على المنصة، والكورسات المتاحة للاشتراك. على الموبايل اضغط «إحصائياتك» لفتحها.",
    cardPlacement: "above-target",
    onEnter: () => {
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        openStatsForTour();
      }
    },
    enterDelay: 380,
  },
  {
    targetId: "home-quick-actions",
    title: "ابدأ من هنا",
    description:
      "اختصارات مهمة: كورساتي، المسابقة اليومية، جدول المحاضرات، امتحاناتي، المساعد العلمي، وتفعيل كورس. على الموبايل اضغط «ابدأ من هنا» لفتحها.",
    cardPlacement: "above-target",
    onEnter: () => {
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        openQuickActionsForTour();
      }
    },
    enterDelay: 380,
  },
  {
    targetId: "home-my-courses",
    title: "كورساتي",
    description:
      "كل الكورسات اللي اشتركت فيها. ادخل على أي كورس لمتابعة المحاضرات، الواجبات، والامتحانات.",
  },
  {
    targetId: "home-platform-courses",
    title: "كورسات المنصة",
    description:
      "كورسات جديدة متاحة للاشتراك. فعّل بالكود أو QR، أو اشترك في الكورسات المجانية مباشرة.",
  },
];

const MOBILE_NAV_STEPS = [
  {
    targetId: "student-bottom-nav",
    title: "شريط التنقل السفلي",
    description:
      "على الموبايل والتابلت، الشريط السفلي ثابت دايماً في أسفل الشاشة: الرئيسية، كورساتي، المساعد العلمي، وامتحاناتي — للوصول السريع بدون فتح القائمة.",
    cardPlacement: "above-target",
    onLeave: () => closeMobileNavForTour(),
  },
  {
    targetId: "student-mobile-nav-drawer",
    title: "قائمة المنصة الكاملة",
    description:
      "هنا كل روابط المنصة: الصفحة الرئيسية، ملفك الشخصي، كورساتك، المسابقات اليومية، جدول المحاضرات، درجات الامتحانات، المساعد العلمي، وتسجيل الخروج. زر ☰ في الشريط العلوي يفتح هذه القائمة في أي وقت.",
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
    "على الشاشات الكبيرة، القائمة الجانبية تحتوي كل روابط المنصة: الصفحة الرئيسية، ملفك الشخصي، كورساتك، المسابقات اليومية، جدول المحاضرات، درجات الامتحانات، المساعد العلمي، وتحميل تطبيق أندرويد — بالإضافة لتسجيل الخروج في الأسفل.",
  cardPlacement: "left-of-target",
};

const CARD_HEIGHT_ESTIMATE = 280;

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

export default function StudentHomeTour({ isOpen, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [isDesktopShell] = useMediaQuery(`(min-width: ${SHELL_DESKTOP_MIN_PX})`);

  const tourSteps = useMemo(
    () => [
      ...CONTENT_STEPS,
      ...(isDesktopShell ? [DESKTOP_NAV_STEP] : MOBILE_NAV_STEPS),
    ],
    [isDesktopShell],
  );

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
    closeMobileNavForTour();
    completeStudentHomeTour();
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
      return undefined;
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !step) return undefined;

    let cancelled = false;
    let spotlightTimer;
    let scrollTimer;

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
          step.cardPlacement === "left-of-target" || step.cardPlacement === "above-target";
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
      if (scrollTimer) window.clearTimeout(scrollTimer);
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

  const cardWidth = 360;
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
          borderColor="blue.400"
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
        boxShadow={isIntroStep ? "2xl" : "2xl"}
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
              bg="blue.50"
              _dark={{ bg: "blue.900" }}
              align="center"
              justify="center"
              color="blue.500"
              flexShrink={0}
            >
              <Icon as={FaCompass} />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" color={muted} mb={0.5}>
                {stepIndex === 0
                  ? "جولة تعريفية"
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
            colorScheme="blue"
            borderRadius="full"
            bg={progressTrack}
          />

          <Text fontSize="sm" color={muted} lineHeight="1.9">
            {step.description}
          </Text>

          <HStack spacing={2} justify="flex-end" pt={1}>
            <Button
              colorScheme="blue"
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
              {stepIndex === 0 ? "ابدأ الجولة" : isLast ? "تم — ابدأ التعلم" : "التالي"}
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>,
    document.body,
  );
}
