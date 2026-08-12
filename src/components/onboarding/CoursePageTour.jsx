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
import { FaChevronLeft, FaGraduationCap } from "react-icons/fa";
import {
  collapseLectureForTour,
  completeCoursePageTour,
  expandLectureForTour,
  setCourseTourSection,
} from "../../utils/coursePageTour";

const CARD_HEIGHT_ESTIMATE = 280;

function buildTourSteps(lectureMeta) {
  const { hasLectures, hasVideos, hasAssignments, lectureId } = lectureMeta || {};

  const steps = [
    {
      targetId: null,
      title: "مرحباً بك في صفحة الكورس!",
      description:
        "خلينا ناخد جولة سريعة على الصفحة علشان تعرف فين المحاضرات، البث المباشر، والامتحانات — أقل من دقيقة.",
    },
    {
      targetId: "course-hero",
      title: "معلومات الكورس",
      description:
        "هنا بتلاقي غلاف الكورس، العنوان، الوصف، مدة الكورس، عدد الطلاب، تقييم الكورس، وشريط تقدّمك في التعلم.",
    },
    {
      targetId: "course-content-nav",
      title: "أقسام المحتوى",
      description:
        "من هنا تتنقل بين: المحاضرات (فيديوهات وملفات)، المحاضرات المباشرة (البث)، والامتحانات الشاملة. على الموبايل مرّر أفقياً لو مش شايف كل الأقسام.",
      cardPlacement: "above-target",
    },
    {
      targetId: "course-content-panel",
      title: "قائمة المحاضرات",
      description:
        "المحاضرات مرتبة بالترتيب. كل محاضرة فيها فيديوهات وواجبات — اضغط «فتح المحاضرة» لعرض المحتوى بالتفصيل.",
      cardPlacement: "above-target",
      onEnter: () => setCourseTourSection("lectures"),
      enterDelay: 420,
    },
  ];

  if (hasLectures && lectureId) {
    steps.push({
      targetId: "course-lecture-card",
      title: lectureMeta.isLocked ? "محاضرة مغلقة" : "بطاقة المحاضرة",
      description: lectureMeta.isLocked
        ? "بعض المحاضرات بتكون مغلقة لحد ما تنجح في واجبات المحاضرات اللي قبلها. أكمل الواجبات السابقة علشان المحتوى يتفتح."
        : "هنا عنوان المحاضرة، حالة الإكمال، ونسبة مشاهدة الفيديوهات. هنفتح المحاضرة دلوقتي علشان نشوف المحتوى من جوّا.",
      cardPlacement: "above-target",
      onEnter: () => {
        setCourseTourSection("lectures");
        expandLectureForTour(lectureId);
      },
      enterDelay: 520,
    });

    if (hasVideos) {
      steps.push({
        targetId: "course-lecture-videos",
        title: "فيديوهات المحاضرة",
        description:
          lectureMeta.videoCount > 0
            ? "كل فيديو له زر «مشاهدة» — اضغط عليه لمتابعة الشرح. الأرقام الخضراء تعني إنك خلّصت الفيديو، والزرقاء إنك بدأت ومكملش."
            : "هنا بتظهر فيديوهات المحاضرة لما المدرس يرفعها. كل فيديو هيكون له زر «مشاهدة» لمتابعة الشرح.",
        cardPlacement: "above-target",
        onEnter: () => {
          setCourseTourSection("lectures");
          expandLectureForTour(lectureId);
        },
        enterDelay: 480,
      });
    }

    if (hasAssignments) {
      steps.push({
        targetId: "course-lecture-assignments",
        title: "واجبات المحاضرة",
        description:
          "الواجبات مرتبطة بكل محاضرة. اضغط «ابدأ الواجب» أو «متابعة الواجب» لحل الأسئلة. لازم تنجح في الواجبات علشان المحاضرات اللي بعدها تتفتح.",
        cardPlacement: "above-target",
        onEnter: () => {
          setCourseTourSection("lectures");
          expandLectureForTour(lectureId);
        },
        enterDelay: 480,
      });
    }

    const lastLectureStep = steps[steps.length - 1];
    if (lastLectureStep?.targetId?.startsWith("course-lecture")) {
      lastLectureStep.onLeave = () => collapseLectureForTour();
    }
  }

  steps.push(
    {
      targetId: "course-content-panel",
      title: "المحاضرات المباشرة",
      description:
        "لما المدرس يفتح بث مباشر للكورس، هتلاقيه هنا. ادخل الجلسة في موعدها لمتابعة الشرح والتفاعل مع المدرس.",
      cardPlacement: "above-target",
      onEnter: () => {
        collapseLectureForTour();
        setCourseTourSection("live");
      },
      enterDelay: 420,
    },
    {
      targetId: "course-content-panel",
      title: "الامتحانات",
      description:
        "الامتحانات الشاملة للكورس بتظهر هنا. راجع مواعيدها، ادخل الامتحان في وقته، وتابع درجاتك بعد التصحيح.",
      cardPlacement: "above-target",
      onEnter: () => setCourseTourSection("exams"),
      enterDelay: 420,
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

export default function CoursePageTour({ isOpen, courseId, lectureTourMeta, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);

  const tourSteps = useMemo(
    () => buildTourSteps(lectureTourMeta),
    [lectureTourMeta],
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
    collapseLectureForTour();
    completeCoursePageTour(courseId);
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
              bg="blue.50"
              _dark={{ bg: "blue.900" }}
              align="center"
              justify="center"
              color="blue.500"
              flexShrink={0}
            >
              <Icon as={FaGraduationCap} />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" color={muted} mb={0.5}>
                {stepIndex === 0
                  ? "جولة في صفحة الكورس"
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
