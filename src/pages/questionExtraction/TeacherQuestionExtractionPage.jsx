import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useBreakpointValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaChevronDown, FaChevronUp, FaDownload, FaMagic, FaTrash } from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";
import UserType from "../../Hooks/auth/userType";
import { getTenantSubdomain } from "../../utils/tenantHost";
import {
  readCachedTenantBrandLogo,
  readDocumentTenantIcon,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";
import { resolvePublicImageUrl } from "../../utils/highQualityImageUrl";
import { fetchTenantPublic } from "../../api/tenantPublicApi";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";
import AiQuestionExtractionModal from "../exam/components/AiQuestionExtractionModal";
import PdfQuestionFrame from "./components/PdfQuestionFrame";
import ScaledSheetPreview from "./components/ScaledSheetPreview";
import { MOCK_PDF_PAGES, PDF_FRAME_THEMES, getThemeById } from "./mockPdfFrames";
import { mapDraftsToFramedPages } from "./mapDraftsToFramedPages";
import { exportFramedQuestionsPdf } from "./exportFramedQuestionsPdf.jsx";

function resolveTeacherTitle(user) {
  const subject =
    user?.subject ||
    user?.subject_name ||
    user?.subjectName ||
    user?.specialty ||
    user?.title ||
    "";
  if (subject) {
    const s = String(subject).trim();
    if (/^مدرس/.test(s)) return s;
    return `مدرس ${s}`;
  }
  if (user?.description) {
    const d = String(user.description).trim();
    if (d.length <= 40) return d;
  }
  return "مدرس";
}

function resolveTeacherDisplayName(user) {
  return (
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "المدرس"
  );
}

function resolveTeacherPhone(user) {
  return user?.phone || user?.mobile || user?.whatsapp || "";
}

function pickTeacherBrandLogo(tenantLogo, user) {
  const candidates = [
    tenantLogo,
    readDocumentTenantIcon(),
    user?.avatar,
    user?.image,
    user?.logo,
    user?.photo,
  ];
  for (const raw of candidates) {
    const resolved =
      resolvePublicImageUrl(raw) || (raw && String(raw).trim()) || null;
    if (resolved) return resolved;
  }
  return null;
}

export default function TeacherQuestionExtractionPage() {
  const theme = useDailyQuizTheme();
  const toast = useToast();
  const [user] = UserType();
  const extractModal = useDisclosure();
  const resultsRef = useRef(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [selectedThemeId, setSelectedThemeId] = useState(
    MOCK_PDF_PAGES[0]?.themeId || PDF_FRAME_THEMES[0]?.id,
  );
  const [framedPages, setFramedPages] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [framesOpen, setFramesOpen] = useState(false);

  // على الموبايل الإطارات مقفولة افتراضيًا
  useEffect(() => {
    if (isMobile === false) setFramesOpen(true);
    if (isMobile === true) setFramesOpen(false);
  }, [isMobile]);

  const tenantSubdomain = getTenantSubdomain();
  const [teacherLogo, setTeacherLogo] = useState(() =>
    tenantSubdomain
      ? readCachedTenantBrandLogo(tenantSubdomain) || readDocumentTenantIcon()
      : readDocumentTenantIcon(),
  );

  useEffect(() => {
    if (!tenantSubdomain) {
      setTeacherLogo(readDocumentTenantIcon());
      return undefined;
    }

    const cached =
      readCachedTenantBrandLogo(tenantSubdomain) || readDocumentTenantIcon();
    if (cached) setTeacherLogo(cached);

    let cancelled = false;
    fetchTenantPublic(tenantSubdomain)
      .then((res) => {
        if (cancelled) return;
        const logo = resolveTenantBrandLogo(res?.data?.tenant, res?.data?.teacher);
        setTeacherLogo(logo || readDocumentTenantIcon());
      })
      .catch(() => {
        if (!cancelled) {
          setTeacherLogo((prev) => prev || readDocumentTenantIcon());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSubdomain]);

  const branding = useMemo(() => {
    return {
      teacherName: resolveTeacherDisplayName(user),
      teacherTitle: resolveTeacherTitle(user),
      phone: resolveTeacherPhone(user),
      watermarkLogo: pickTeacherBrandLogo(teacherLogo, user),
    };
  }, [user, teacherLogo]);

  const selectedTheme = getThemeById(selectedThemeId);

  const openExtraction = () => {
    if (!selectedThemeId) {
      toast({
        title: "اختر إطارًا أولًا",
        description: "حدد أحد الإطارات الستة ثم ابدأ الاستخراج",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    extractModal.onOpen();
  };

  const handleConfirmDrafts = async (drafts) => {
    const pages = mapDraftsToFramedPages(drafts, selectedThemeId);
    if (!pages.length) {
      throw new Error("لا توجد أسئلة صالحة للعرض");
    }
    setFramedPages(pages);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleDownloadPdf = async () => {
    if (!framedPages.length) return;
    setExporting(true);
    setExportProgress({ current: 0, total: framedPages.length });
    try {
      await exportFramedQuestionsPdf({
        pages: framedPages,
        branding,
        title: `${branding.teacherName}-${selectedTheme?.name || "اطار"}`,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });
      toast({
        title: "تم التنزيل",
        description: `تم حفظ ${framedPages.length} صفحة بنفس تصميم الإطار`,
        status: "success",
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "فشل التنزيل",
        description: err?.message || "تعذر إنشاء ملف PDF",
        status: "error",
        isClosable: true,
      });
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <DailyQuizPageShell maxW="7xl">
      <DailyQuizHero
        eyebrow="أدوات المدرس"
        title="استخراج الأسئلة"
        subtitle="اختر إطار PDF، استخرج الأسئلة بالذكاء الاصطناعي، ثم نزّلها بنفس التصميم."
        icon={MdAutoAwesome}
        badges={
          <>
            <Badge
              colorScheme="blackAlpha"
              borderRadius="full"
              px={3}
              py={1}
              bg="whiteAlpha.300"
            >
              {PDF_FRAME_THEMES.length} إطارات
            </Badge>
            <Badge
              colorScheme="blackAlpha"
              borderRadius="full"
              px={3}
              py={1}
              bg="whiteAlpha.300"
            >
              {branding.teacherName}
            </Badge>
          </>
        }
      />

      <DailyQuizSurface p={{ base: 4, md: 5 }} mb={5}>
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={3}
          direction={{ base: "column", md: "row" }}
        >
          <VStack align="start" spacing={1}>
            <Heading as="h2" size="sm" color={theme.heading}>
              1) اختر شكل الإطار
            </Heading>
            <Text fontSize="sm" color={theme.muted}>
              الإطار المحدد:{" "}
              <Text as="span" fontWeight="800" color={theme.heading}>
                {selectedTheme?.name}
              </Text>
            </Text>
          </VStack>
          <HStack spacing={2} flexWrap="wrap">
            <Button
              leftIcon={<FaMagic />}
              colorScheme="purple"
              borderRadius="xl"
              onClick={openExtraction}
            >
              استخراج أسئلة على الإطار
            </Button>
          </HStack>
        </Flex>
      </DailyQuizSurface>

      {/* موبايل: Collapse مقفول — اضغط لعرض الإطارات */}
      <Box display={{ base: "block", md: "none" }} mb={5}>
        <Button
          w="100%"
          variant="outline"
          colorScheme="blue"
          borderRadius="xl"
          py={6}
          rightIcon={framesOpen ? <FaChevronUp /> : <FaChevronDown />}
          onClick={() => setFramesOpen((v) => !v)}
          justifyContent="space-between"
          fontWeight="800"
        >
          {framesOpen
            ? "إخفاء الإطارات"
            : `اضغط لعرض الإطارات (${selectedTheme?.name || ""})`}
        </Button>
        <Collapse in={framesOpen} animateOpacity>
          <SimpleGrid columns={1} spacing={4} mt={4}>
            {MOCK_PDF_PAGES.map((page) => (
              <PdfQuestionFrame
                key={page.id}
                page={page}
                branding={branding}
                selected={page.themeId === selectedThemeId}
                onSelect={() => {
                  setSelectedThemeId(page.themeId);
                  setFramesOpen(false);
                }}
              />
            ))}
          </SimpleGrid>
        </Collapse>
      </Box>

      {/* ديسكتوب: شبكة الإطارات ظاهرة */}
      <SimpleGrid
        display={{ base: "none", md: "grid" }}
        columns={{ md: 2, xl: 3 }}
        spacing={{ base: 4, md: 5 }}
        mb={6}
      >
        {MOCK_PDF_PAGES.map((page) => (
          <PdfQuestionFrame
            key={page.id}
            page={page}
            branding={branding}
            selected={page.themeId === selectedThemeId}
            onSelect={() => setSelectedThemeId(page.themeId)}
          />
        ))}
      </SimpleGrid>

      {framedPages.length > 0 ? (
        <Box ref={resultsRef}>
          <DailyQuizSurface p={{ base: 4, md: 5 }} mb={5}>
            <Flex
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              gap={3}
              direction={{ base: "column", md: "row" }}
            >
              <VStack align="start" spacing={1}>
                <Heading as="h2" size="sm" color={theme.heading}>
                  2) الأسئلة المستخرجة ({framedPages.length})
                </Heading>
                <Text fontSize="sm" color={theme.muted}>
                  كل سؤال في صفحة بنفس تصميم «{selectedTheme?.name}».
                </Text>
              </VStack>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  leftIcon={<FaDownload />}
                  colorScheme="blue"
                  borderRadius="xl"
                  onClick={handleDownloadPdf}
                  isLoading={exporting}
                  loadingText={
                    exportProgress
                      ? `${exportProgress.current}/${exportProgress.total}`
                      : "جاري التصدير"
                  }
                >
                  تنزيل PDF
                </Button>
                <Button
                  leftIcon={<FaTrash />}
                  variant="outline"
                  colorScheme="red"
                  borderRadius="xl"
                  onClick={() => setFramedPages([])}
                  isDisabled={exporting}
                >
                  مسح النتائج
                </Button>
              </HStack>
            </Flex>
          </DailyQuizSurface>

          <VStack align="stretch" spacing={5} mb={10}>
            {framedPages.map((page) => (
              <ScaledSheetPreview
                key={page.id}
                bg={theme.cardBg}
                borderColor={theme.cardBorder}
              >
                <PdfQuestionFrame
                  page={page}
                  branding={branding}
                  variant="sheet"
                />
              </ScaledSheetPreview>
            ))}
          </VStack>
        </Box>
      ) : (
        <DailyQuizSurface p={{ base: 6, md: 8 }} textAlign="center" mb={8}>
          <Icon as={MdAutoAwesome} boxSize={10} color="purple.400" mb={3} />
          <Heading size="sm" mb={2} color={theme.heading}>
            جاهز للاستخراج
          </Heading>
          <Text fontSize="sm" color={theme.muted} mb={4} maxW="480px" mx="auto">
            بعد اختيار الإطار اضغط «استخراج أسئلة على الإطار»، راجع المسودة، ثم
            طبّقها — ستظهر كل سؤال كصفحة PDF قابلة للتنزيل.
          </Text>
          <Button
            leftIcon={<FaMagic />}
            colorScheme="purple"
            borderRadius="xl"
            onClick={openExtraction}
          >
            بدء الاستخراج
          </Button>
        </DailyQuizSurface>
      )}

      <AiQuestionExtractionModal
        isOpen={extractModal.isOpen}
        onClose={extractModal.onClose}
        examTitle={`إطار ${selectedTheme?.name || ""}`}
        confirmLabel="تطبيق على الإطار"
        onConfirmDrafts={handleConfirmDrafts}
      />
    </DailyQuizPageShell>
  );
}
