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
import { FaChevronLeft, FaClipboardList } from "react-icons/fa";
import {
  closeAiExtractForTour,
  closeAllTeacherExamTourModals,
  closeBulkTextForTour,
  closeDeleteQuestionForTour,
  closeEditQuestionForTour,
  closeImagesForTour,
  closePassageForTour,
  closeQuestionImageForTour,
  openAiExtractForTour,
  openBulkTextForTour,
  openDeleteQuestionForTour,
  openEditQuestionForTour,
  openImagesForTour,
  openPassageForTour,
  openQuestionImageForTour,
} from "../../utils/teacherExamTour";

const CARD_HEIGHT_ESTIMATE = 320;

function buildTeacherExamTourSteps({ hasQuestions = false } = {}) {
  const steps = [
    {
      targetId: null,
      title: "مرحباً في إدارة الامتحان",
      description:
        "جولة تفصيلية لأدوات المدرس في صفحة الامتحان الشامل: إضافة الأسئلة، التعديل، تحديد الإجابة الصحيحة، درجات الطلاب، والتقارير. تستغرق بضع دقائق.",
    },
    {
      targetId: "exam-teacher-hero",
      title: "بطاقة الامتحان",
      description:
        "هنا عنوان الامتحان، نوعه (شامل)، عدد الأسئلة، المدة، والدرجة الكلية — نظرة سريعة قبل إدارة الأسئلة.",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-teacher-reload",
      title: "زر «تحديث»",
      description:
        "يعيد تحميل بيانات الامتحان والأسئلة من السيرفر — مفيد بعد إضافة أسئلة أو عند تأخّر التحديث.",
      cardPlacement: "below-target",
    },
    {
      targetId: "exam-teacher-ai",
      title: "زر «استخراج ذكي»",
      description:
        "يستخرج الأسئلة تلقائياً من ملف PDF أو صور باستخدام الذكاء الاصطناعي، ثم تراجعها قبل الاستيراد.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-ai-modal",
      title: "نافذة الاستخراج الذكي",
      description:
        "ارفع PDF أو صوراً، اختر نطاق الصفحات إن لزم، ثم اضغط استخراج. راجع الأسئلة الناتجة وعدّلها، وبعدها «استيراد» لإضافتها للامتحان.",
      onEnter: () => openAiExtractForTour(),
      onLeave: () => closeAiExtractForTour(),
      enterDelay: 580,
    },
    {
      targetId: "exam-teacher-bulk",
      title: "زر «أسئلة كنص»",
      description:
        "تلصق مجموعة أسئلة دفعة واحدة بصيغة نصية (سؤال + اختيارات a/b/c/d) مع الإجابات الصحيحة.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-bulk-modal",
      title: "نافذة الأسئلة النصية",
      description:
        "الصق النص بالشكل المطلوب، وأدخل مفاتيح الإجابات الصحيحة (مثل: a c b d). اضغط الإضافة لحفظ كل الأسئلة مرة واحدة.",
      onEnter: () => openBulkTextForTour(),
      onLeave: () => closeBulkTextForTour(),
      enterDelay: 580,
    },
    {
      targetId: "exam-teacher-passage",
      title: "زر «من قطعة»",
      description:
        "يضيف قطعة قراءة (نص طويل) ثم أسئلة مرتبطة بها — مناسب لأسئلة الفهم والاستيعاب.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-passage-modal",
      title: "نافذة القطعة والأسئلة",
      description:
        "اكتب عنوان القطعة ومحتواها، ثم ألصق أسئلة القطعة بنفس صيغة النص المجمع. تُحفظ القطعة مع أسئلتها معاً.",
      onEnter: () => openPassageForTour(),
      onLeave: () => closePassageForTour(),
      enterDelay: 580,
    },
    {
      targetId: "exam-teacher-images",
      title: "زر «أسئلة كصور»",
      description:
        "يرفع صوراً كأسئلة (كل صورة = سؤال) — مفيد للمسائل المكتوبة بخط اليد أو المخططات.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-images-modal",
      title: "نافذة أسئلة الصور",
      description:
        "اختر صورة أو أكثر، راجع المعاينة، ثم ارفعها. يمكنك لاحقاً إضافة اختيارات نصية أو تحديد الإجابة الصحيحة على كل سؤال.",
      onEnter: () => openImagesForTour(),
      onLeave: () => closeImagesForTour(),
      enterDelay: 580,
    },
    {
      targetId: "exam-teacher-grades",
      title: "زر «درجات الطلاب»",
      description:
        "يعرض تسليمات الطلاب: الدرجة، النسبة، ناجح/راسب، مع فلترة وبحث — لمتابعة أداء الفصل.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-teacher-report",
      title: "زر «تقرير الأسئلة»",
      description:
        "يفتح صفحة تحليل الأسئلة: أيها الأكثر خطأً، توزيع الإجابات، ومؤشرات الصعوبة — لمراجعة نقاط الضعف.",
      cardPlacement: "below-target",
    },
  ];

  if (hasQuestions) {
    steps.push(
      {
        targetId: "exam-teacher-search",
        title: "بحث الأسئلة",
        description:
          "ابحث في نص الأسئلة لتصفية القائمة بسرعة عندما يكثر عدد الأسئلة.",
        cardPlacement: "below-target",
        onEnter: () => closeAllTeacherExamTourModals(),
      },
      {
        targetId: "exam-question-card",
        title: "بطاقة السؤال",
        description:
          "كل سؤال يعرض رقمه، النص أو الصورة، والاختيارات. اضغط على اختيار لتحديده كإجابة صحيحة (يظهر بالأخضر).",
        cardPlacement: "above-target",
        enterDelay: 420,
      },
      {
        targetId: "exam-question-choices",
        title: "تحديد الإجابة الصحيحة",
        description:
          "اضغط على أي اختيار ليصبح الإجابة الصحيحة. الاختيار الصحيح يظهر بخلفية خضراء — مهم قبل نشر الامتحان للطلاب.",
        cardPlacement: "above-target",
        enterDelay: 420,
      },
      {
        targetId: "exam-question-add-image",
        title: "زر إضافة صورة للسؤال",
        description:
          "يرفق صورة توضيحية لسؤال موجود (مخطط، معادلة، رسم) دون تغيير نص السؤال.",
        cardPlacement: "below-target",
      },
      {
        targetId: "exam-q-image-modal",
        title: "نافذة صورة السؤال",
        description:
          "اختر ملف الصورة ثم ارفعها. تظهر الصورة مع السؤال للطلاب أثناء الحل.",
        onEnter: () => openQuestionImageForTour(),
        onLeave: () => closeQuestionImageForTour(),
        enterDelay: 580,
      },
      {
        targetId: "exam-question-edit",
        title: "زر تعديل السؤال",
        description:
          "يفتح نافذة لتعديل نص السؤال، الاختيارات، أو صورة السؤال.",
        cardPlacement: "below-target",
        onEnter: () => closeAllTeacherExamTourModals(),
      },
      {
        targetId: "exam-edit-modal",
        title: "نافذة تعديل السؤال",
        description:
          "عدّل نص السؤال والاختيارات والصورة ثم «حفظ». التغييرات تظهر فوراً في قائمة الأسئلة.",
        onEnter: () => openEditQuestionForTour(),
        onLeave: () => closeEditQuestionForTour(),
        enterDelay: 580,
      },
      {
        targetId: "exam-question-delete",
        title: "زر حذف السؤال",
        description:
          "يحذف السؤال من الامتحان نهائياً بعد تأكيد — استخدمه بحذر.",
        cardPlacement: "below-target",
        onEnter: () => closeAllTeacherExamTourModals(),
      },
      {
        targetId: "exam-delete-modal",
        title: "نافذة تأكيد الحذف",
        description:
          "تأكيد قبل الحذف النهائي. «تأكيد الحذف» يزيل السؤال، و«إلغاء» يغلق النافذة دون تغيير.",
        onEnter: () => openDeleteQuestionForTour(),
        onLeave: () => closeDeleteQuestionForTour(),
        enterDelay: 580,
      },
    );
  } else {
    steps.push({
      targetId: "exam-teacher-empty",
      title: "لا توجد أسئلة بعد",
      description:
        "ابدأ بإضافة أسئلة من الأزرار أعلاه: استخراج ذكي، نص مجمع، قطعة، أو صور. بعد الإضافة ستظهر بطاقات الأسئلة هنا لإدارتها.",
      cardPlacement: "above-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    });
  }

  steps.push({
    targetId: "exam-teacher-tour-btn",
    title: "إعادة الجولة",
    description:
      "يمكنك إعادة هذه الجولة في أي وقت من زر «جولة الإدارة» في أعلى الصفحة.",
    cardPlacement: "below-target",
    onEnter: () => closeAllTeacherExamTourModals(),
  });

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

function buildPlatformExamTourSteps({ hasQuestions = false } = {}) {
  const steps = [
    {
      targetId: null,
      title: "مرحباً في إدارة الامتحان",
      description:
        "جولة سريعة لأدوات المدرس هنا: استخراج الأسئلة بالذكاء الاصطناعي، درجات الطلاب، تقرير الأسئلة، وتعديل الإجابات الصحيحة. تظهر فقط عند الضغط على «جولة الإدارة».",
    },
    {
      targetId: "platform-exam-hero",
      title: "رأس صفحة الامتحان",
      description:
        "يعرض عنوان الامتحان وعدد الأسئلة. من هنا تدير المحتوى وتصل لأدوات الإضافة والمتابعة.",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "platform-exam-ai",
      title: "زر «استخراج بالذكاء الاصطناعي»",
      description:
        "يرفع ملف PDF أو صوراً ويستخرج الأسئلة تلقائياً، ثم تراجعها قبل استيرادها للامتحان.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "exam-ai-modal",
      title: "نافذة الاستخراج الذكي",
      description:
        "ارفع الملف، شغّل الاستخراج، راجع الأسئلة وعدّلها إن لزم، ثم استوردها. هذا أسرع طريقة لبناء بنك أسئلة الامتحان.",
      onEnter: () => openAiExtractForTour(),
      onLeave: () => closeAiExtractForTour(),
      enterDelay: 580,
    },
    {
      targetId: "platform-exam-grades",
      title: "زر «عرض درجات الطلاب»",
      description:
        "يفتح قائمة تسليمات الطلاب: الدرجة، النسبة، ورقم المحاولة — مع بحث بالاسم أو رقم الطالب.",
      cardPlacement: "below-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    },
    {
      targetId: "platform-exam-report",
      title: "زر «تقرير الأسئلة»",
      description:
        "ينقلك لصفحة تحليل الأسئلة: الأكثر خطأً، توزيع الإجابات، ومؤشرات الصعوبة لمراجعة نقاط الضعف.",
      cardPlacement: "below-target",
    },
  ];

  if (hasQuestions) {
    steps.push(
      {
        targetId: "exam-question-card",
        title: "بطاقة السؤال",
        description:
          "كل سؤال يعرض النص أو الصورة والاختيارات. اضغط اختياراً لتحديده كإجابة صحيحة (يظهر بالأخضر).",
        cardPlacement: "above-target",
        onEnter: () => closeAllTeacherExamTourModals(),
        enterDelay: 420,
      },
      {
        targetId: "exam-question-choices",
        title: "تحديد الإجابة الصحيحة",
        description:
          "اضغط على أي اختيار ليصبح الإجابة الصحيحة قبل أن يحل الطلاب الامتحان.",
        cardPlacement: "above-target",
        enterDelay: 420,
      },
      {
        targetId: "exam-question-add-image",
        title: "زر صورة السؤال",
        description:
          "يرفع أو يحدّث صورة توضيحية للسؤال (معادلة، مخطط، مسألة مكتوبة).",
        cardPlacement: "below-target",
      },
      {
        targetId: "exam-question-edit",
        title: "زر تعديل السؤال",
        description: "يفتح نافذة لتعديل نص السؤال والاختيارات مع معاينة فورية للرموز الرياضية.",
        cardPlacement: "below-target",
      },
      {
        targetId: "exam-edit-modal",
        title: "نافذة تعديل السؤال",
        description:
          "عدّل النص والاختيارات (تدعم LaTeX والرموز) ثم احفظ. التغييرات تظهر فوراً في القائمة.",
        onEnter: () => openEditQuestionForTour(),
        onLeave: () => closeEditQuestionForTour(),
        enterDelay: 580,
      },
      {
        targetId: "exam-question-delete",
        title: "زر حذف السؤال",
        description: "يحذف السؤال من الامتحان بعد تأكيد — استخدمه بحذر.",
        cardPlacement: "below-target",
        onEnter: () => closeAllTeacherExamTourModals(),
      },
      {
        targetId: "exam-delete-modal",
        title: "نافذة تأكيد الحذف",
        description:
          "«تأكيد الحذف» يزيل السؤال نهائياً، و«إلغاء» يغلق النافذة دون تغيير.",
        onEnter: () => openDeleteQuestionForTour(),
        onLeave: () => closeDeleteQuestionForTour(),
        enterDelay: 580,
      },
    );
  } else {
    steps.push({
      targetId: "platform-exam-empty",
      title: "لا توجد أسئلة بعد",
      description:
        "ابدأ بإضافة أسئلة عبر «استخراج بالذكاء الاصطناعي»، أو من صفحة تفاصيل الكورس (تبويب الامتحانات).",
      cardPlacement: "above-target",
      onEnter: () => closeAllTeacherExamTourModals(),
    });
  }

  steps.push({
    targetId: "platform-exam-tour-btn",
    title: "إعادة الجولة",
    description:
      "يمكنك إعادة هذه الجولة في أي وقت من زر «جولة الإدارة» أعلى الصفحة.",
    cardPlacement: "below-target",
    onEnter: () => closeAllTeacherExamTourModals(),
  });

  return steps;
}

export default function TeacherExamTour({
  isOpen,
  hasQuestions,
  onClose,
  variant = "comprehensive",
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);

  const tourSteps = useMemo(
    () =>
      variant === "platform"
        ? buildPlatformExamTourSteps({ hasQuestions })
        : buildTeacherExamTourSteps({ hasQuestions }),
    [hasQuestions, variant],
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
    closeAllTeacherExamTourModals();
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
      closeAllTeacherExamTourModals();
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
        // ignore
      }
      if (cancelled) return;

      const delay = step.enterDelay ?? (step.targetId ? 420 : 0);
      if (step.targetId) {
        const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
        const skipScroll = step.cardPlacement === "above-target";
        el?.scrollIntoView({
          behavior: "smooth",
          block: skipScroll ? "nearest" : "center",
          inline: "nearest",
        });
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
              <Icon as={FaClipboardList} />
            </Flex>
            <Box flex={1} minW={0}>
              <Text fontSize="xs" color={muted} mb={0.5}>
                {stepIndex === 0
                  ? "جولة إدارة الامتحان"
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
                if (isLast) finish();
                else setStepIndex((prev) => prev + 1);
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
