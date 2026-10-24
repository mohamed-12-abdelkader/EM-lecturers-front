import { useEffect, useMemo, useRef } from "react";
import { Badge, Box, Flex, Grid, Image, Text, VStack } from "@chakra-ui/react";
import { FaBookOpen, FaGraduationCap, FaLightbulb, FaPhoneAlt, FaUserGraduate } from "react-icons/fa";
import FormattedQuestionText from "../../../components/question/FormattedQuestionText";
import { getThemeById } from "../mockPdfFrames";

const PLATFORM_LOGO = "/Picsart_25-08-26_23-28-39-014.png";

const MATH_TEXT_SX = {
  fontFamily:
    '"Noto Sans Arabic", "Noto Naskh Arabic", "Segoe UI Symbol", "Cambria Math", Tahoma, sans-serif',
  fontFeatureSettings: '"liga" 1, "calt" 1',
  textRendering: "optimizeLegibility",
  wordBreak: "break-word",
};

/** جدول markdown بسيط (| a | b |) لعرض جداول الفيزياء/الاختيارات */
function MarkdownTable({ content, primary, ink, soft, sheet }) {
  const rows = useMemo(() => {
    const lines = String(content || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = [];
    for (const line of lines) {
      if (!line.includes("|")) continue;
      // صف فاصل markdown: |---|---|
      if (/^\|?[\s:-|]+$/.test(line)) continue;
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
      if (cells.length) parsed.push(cells);
    }
    return parsed;
  }, [content]);

  if (!rows.length) {
    return (
      <Text
        as="pre"
        whiteSpace="pre-wrap"
        fontSize={sheet ? "13px" : "9px"}
        fontWeight="700"
        style={{ color: ink, ...MATH_TEXT_SX }}
        dir="auto"
      >
        {content}
      </Text>
    );
  }

  const colCount = Math.max(...rows.map((r) => r.length));

  return (
    <Box
      overflowX="auto"
      borderRadius="lg"
      border="1.5px solid"
      style={{ borderColor: `${primary}55`, background: soft }}
    >
      <Box
        as="table"
        w="100%"
        style={{ borderCollapse: "collapse", direction: "rtl" }}
      >
        <tbody>
          {rows.map((row, ri) => (
            <tr key={`tr-${ri}`}>
              {Array.from({ length: colCount }).map((_, ci) => {
                const cell = row[ci] ?? "";
                const Tag = ri === 0 ? "th" : "td";
                return (
                  <Box
                    as={Tag}
                    key={`td-${ri}-${ci}`}
                    px={sheet ? 2.5 : 1.5}
                    py={sheet ? 2 : 1}
                    fontSize={sheet ? "13px" : "9px"}
                    fontWeight={ri === 0 ? 900 : 700}
                    textAlign="center"
                    style={{
                      color: ink,
                      border: `1px solid ${primary}33`,
                      background: ri === 0 ? `${primary}14` : "transparent",
                      ...MATH_TEXT_SX,
                    }}
                    dir="auto"
                  >
                    <FormattedQuestionText
                      value={cell}
                      fontSize="inherit"
                      fontWeight="inherit"
                      lineHeight="1.55"
                      color="inherit"
                      sx={MATH_TEXT_SX}
                    />
                  </Box>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

function QuestionFigures({ figures, primary, soft, sheet }) {
  const list = Array.isArray(figures) ? figures.filter((f) => f?.url) : [];
  if (!list.length) return null;

  const multi = list.length > 1;

  return (
    <VStack align="stretch" spacing={sheet ? 3 : 2}>
      <Grid
        templateColumns={
          multi
            ? sheet
              ? "1fr 1fr"
              : { base: "1fr", sm: "1fr 1fr" }
            : "1fr"
        }
        gap={sheet ? 3 : 2}
      >
        {list.map((fig, i) => (
          <Box key={fig.url || i}>
            <Box
              borderRadius="xl"
              overflow="hidden"
              border="2px solid"
              style={{ borderColor: primary, background: soft }}
              maxH={sheet ? (multi ? "220px" : "300px") : multi ? "90px" : "120px"}
              boxShadow={`0 8px 24px -12px ${primary}55`}
            >
              <Image
                src={fig.url}
                alt={fig.label || "شكل السؤال"}
                w="100%"
                maxH={sheet ? (multi ? "220px" : "300px") : multi ? "90px" : "120px"}
                objectFit="contain"
                mx="auto"
                crossOrigin="anonymous"
              />
            </Box>
            {fig.label ? (
              <Text
                mt={1}
                fontSize={sheet ? "12px" : "8px"}
                textAlign="center"
                fontWeight="800"
                style={{ color: primary }}
                noOfLines={2}
              >
                {fig.label}
              </Text>
            ) : null}
          </Box>
        ))}
      </Grid>
    </VStack>
  );
}

function FrameDecorations({ shape, primary, secondary }) {
  if (shape === "angled") {
    return (
      <>
        <Box
          position="absolute"
          top={0}
          insetInline={0}
          h="14px"
          style={{ background: secondary }}
          clipPath="polygon(0 0, 100% 0, 90% 100%, 10% 100%)"
          opacity={0.95}
          zIndex={2}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom={0}
          insetInline={0}
          h="22px"
          style={{ background: primary }}
          clipPath="polygon(4% 0, 96% 0, 100% 100%, 0 100%)"
          opacity={0.95}
          zIndex={2}
          pointerEvents="none"
        />
      </>
    );
  }

  if (shape === "ribbon") {
    return (
      <>
        <Box
          position="absolute"
          top="12px"
          insetInlineStart="-4px"
          w="18px"
          h="62%"
          style={{ background: secondary }}
          borderRadius="md"
          opacity={0.9}
          zIndex={2}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          top="12px"
          insetInlineEnd="-4px"
          w="18px"
          h="62%"
          style={{ background: secondary }}
          borderRadius="md"
          opacity={0.9}
          zIndex={2}
          pointerEvents="none"
        />
      </>
    );
  }

  if (shape === "soft") {
    return (
      <>
        <Box
          position="absolute"
          top="-5px"
          insetInlineStart="20%"
          w="60%"
          h="12px"
          style={{ background: secondary }}
          borderRadius="full"
          opacity={0.8}
          zIndex={2}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-4px"
          insetInlineEnd="14%"
          w="36%"
          h="10px"
          style={{ background: primary }}
          borderRadius="full"
          opacity={0.85}
          zIndex={2}
          pointerEvents="none"
        />
      </>
    );
  }

  if (shape === "geometric") {
    return (
      <>
        <Box
          position="absolute"
          top={0}
          insetInlineStart={0}
          w="48px"
          h="48px"
          style={{ background: secondary }}
          clipPath="polygon(0 0, 100% 0, 0 100%)"
          opacity={0.95}
          zIndex={2}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom={0}
          insetInlineEnd={0}
          w="56px"
          h="56px"
          style={{ background: primary }}
          clipPath="polygon(100% 0, 100% 100%, 0 100%)"
          opacity={0.95}
          zIndex={2}
          pointerEvents="none"
        />
      </>
    );
  }

  if (shape === "double") {
    return (
      <Box
        position="absolute"
        inset="7px"
        border="2px dashed"
        style={{ borderColor: secondary }}
        borderRadius="xl"
        pointerEvents="none"
        opacity={0.65}
        zIndex={2}
      />
    );
  }

  // waves
  return (
    <Box
      as="svg"
      position="absolute"
      bottom={0}
      insetInline={0}
      w="100%"
      h="34px"
      viewBox="0 0 400 34"
      preserveAspectRatio="none"
      pointerEvents="none"
      aria-hidden
      zIndex={2}
    >
      <path
        d="M0 16 C70 0 130 32 200 16 C270 0 330 30 400 12 L400 34 L0 34 Z"
        fill={primary}
        opacity="0.95"
      />
      <path
        d="M0 22 C90 8 150 30 230 18 C310 6 350 28 400 20 L400 34 L0 34 Z"
        fill={secondary}
        opacity="0.88"
      />
    </Box>
  );
}

function CornerIcons({ primary, secondary, sheet }) {
  const size = sheet ? 18 : 12;
  // داخل منطقة المحتوى فقط — مش فوق الفوتر عشان ما يقصّش النص
  return (
    <>
      <Box
        position="absolute"
        bottom={sheet ? "72px" : "48px"}
        insetInlineStart={sheet ? "20px" : "12px"}
        zIndex={3}
        style={{ color: primary }}
        opacity={0.45}
        pointerEvents="none"
      >
        <FaBookOpen size={size} />
      </Box>
      <Box
        position="absolute"
        bottom={sheet ? "72px" : "48px"}
        insetInlineEnd={sheet ? "20px" : "12px"}
        zIndex={3}
        style={{ color: secondary }}
        opacity={0.55}
        pointerEvents="none"
      >
        <FaLightbulb size={size} />
      </Box>
    </>
  );
}

/**
 * دائرة اختيار مرسومة على Canvas — توسيط دقيق للحروف العربية عند تصدير PDF.
 */
function OptionKeyCircle({ label, primary, soft, sheet }) {
  const size = sheet ? 34 : 20;
  const fontSize = sheet ? 15 : 10;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 1.5;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = soft || "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = primary;
    ctx.stroke();

    ctx.fillStyle = primary;
    ctx.font = `700 ${fontSize}px Tahoma, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // تعويض بصري بسيط لخط أساس الحروف العربية في Canvas
    ctx.fillText(String(label ?? ""), cx, cy + fontSize * 0.06);
  }, [label, primary, soft, size, fontSize]);

  return (
    <Box as="span" display="inline-block" flexShrink={0} lineHeight={0} w={`${size}px`} h={`${size}px`}>
      <canvas ref={canvasRef} width={size} height={size} aria-label={String(label)} />
    </Box>
  );
}

function MockFigure({ type, primary, soft, imageUrl, sheet = false }) {
  if (type === "image" && imageUrl) {
    return (
      <Box
        borderRadius="xl"
        overflow="hidden"
        border="2px solid"
        style={{ borderColor: primary, background: soft }}
        maxH={sheet ? "300px" : "120px"}
        boxShadow={`0 8px 24px -12px ${primary}55`}
      >
        <Image
          src={imageUrl}
          alt="شكل السؤال"
          w="100%"
          maxH={sheet ? "300px" : "120px"}
          objectFit="contain"
          mx="auto"
          crossOrigin="anonymous"
        />
      </Box>
    );
  }

  if (type === "none" || !type) return null;

  if (type === "circuit") {
    return (
      <Box as="svg" viewBox="0 0 140 110" w="100%" maxW="160px" mx="auto" aria-hidden>
        <rect x="8" y="8" width="124" height="94" rx="10" fill={soft} stroke={primary} strokeWidth="1.8" />
        <circle cx="30" cy="55" r="5" fill={primary} />
        <text x="22" y="42" fontSize="10" fill={primary}>a</text>
        <circle cx="70" cy="28" r="5" fill={primary} />
        <text x="62" y="18" fontSize="10" fill={primary}>b</text>
        <circle cx="110" cy="55" r="5" fill={primary} />
        <text x="102" y="42" fontSize="10" fill={primary}>c</text>
        <circle cx="70" cy="78" r="5" fill={primary} />
        <text x="62" y="98" fontSize="10" fill={primary}>d</text>
        <path d="M35 55 H50 L55 45 L60 65 L65 45 L70 55 H75" fill="none" stroke={primary} strokeWidth="1.6" />
        <path d="M75 55 H105" fill="none" stroke={primary} strokeWidth="1.6" />
        <path d="M70 33 V73" fill="none" stroke={primary} strokeWidth="1.6" />
      </Box>
    );
  }

  const labels = {
    formula: "P = I²R",
    triangle: "△",
    flask: "⚗",
    cell: "⊕",
    text: "أ ب",
  };

  return (
    <Flex
      align="center"
      justify="center"
      h={sheet ? "140px" : "100px"}
      borderRadius="xl"
      style={{ background: soft, border: `2px solid ${primary}`, color: primary }}
      fontWeight="900"
      fontSize={type === "formula" ? (sheet ? "xl" : "md") : "2xl"}
      dir="ltr"
    >
      {labels[type] || "?"}
    </Flex>
  );
}

/**
 * إطار صفحة PDF — card للاختيار / sheet للتصدير.
 * ألوان عبر style الصريح حتى يظهر النص بوضوح في html2canvas.
 */
export default function PdfQuestionFrame({
  page,
  branding = {},
  selected = false,
  onSelect,
  variant = "card",
}) {
  const isSheet = variant === "sheet";
  const theme = getThemeById(page.themeId);
  const {
    primary,
    secondary,
    accent,
    surface,
    soft,
    ink,
    shape,
    name: themeName,
  } = theme;

  const teacherName = String(
    branding.teacherName || page.teacherName || "المدرس",
  ).trim();
  const teacherTitle = String(
    branding.teacherTitle || page.teacherTitle || "مدرس",
  ).trim();
  const phone = String(branding.phone || page.phone || "").trim();
  const watermarkSrc = branding.watermarkLogo || null;
  const figures = Array.isArray(page.figures)
    ? page.figures.filter((f) => f?.url)
    : page.questionImage
      ? [
          {
            url: page.questionImage,
            label: page.figureLabel || "شكل السؤال",
            imageType: "question_figure",
          },
        ]
      : [];
  const mockFigureType =
    !figures.length &&
    page.figureType &&
    page.figureType !== "none" &&
    page.figureType !== "image"
      ? page.figureType
      : null;
  const hasFigure = figures.length > 0 || Boolean(mockFigureType);
  const pageOptions = Array.isArray(page.options) ? page.options : [];
  const hasOptions =
    page.hasOptions !== false && pageOptions.length > 0;
  const hasImageOptions = Boolean(page.hasImageOptions) && hasOptions;
  const questionTable = page.questionTable?.content ? page.questionTable : null;
  // جدول الاختيارات كمرجع بصري فقط إن لم تكن الاختيارات مصوّرة
  const showOptionsTableImage = figures.some(
    (f) => f.imageType === "options_table",
  );
  const verses = Array.isArray(page.verses) ? page.verses : [];
  const isCropLayout =
    page.layout === "crop" && Boolean(page.cropImageUrl || page.questionImage);
  const cropImageUrl = page.cropImageUrl || page.questionImage || null;
  const interactive = Boolean(onSelect) && !isSheet;

  return (
    <Box
      as={interactive ? "button" : "div"}
      type={interactive ? "button" : undefined}
      onClick={interactive ? onSelect : undefined}
      w={isSheet ? "1120px" : "100%"}
      minH={isSheet ? "792px" : undefined}
      maxW={isSheet ? "1120px" : undefined}
      textAlign="start"
      cursor={interactive ? "pointer" : "default"}
      transition="transform 0.18s ease, box-shadow 0.18s ease"
      transform={selected && !isSheet ? "translateY(-2px)" : undefined}
      _hover={interactive ? { transform: "translateY(-3px)" } : undefined}
      outline={selected && !isSheet ? `3px solid ${accent}` : "none"}
      outlineOffset="3px"
      borderRadius={isSheet ? "2xl" : "2xl"}
      overflow={isSheet ? "visible" : "hidden"}
      boxShadow={
        selected && !isSheet
          ? `0 18px 42px -16px ${primary}aa`
          : `0 12px 32px -14px ${primary}77`
      }
      style={{
        background: surface,
        border: `${shape === "double" ? 3 : 2.5}px solid ${primary}`,
        overflow: isSheet ? "visible" : "hidden",
      }}
      position="relative"
      dir="rtl"
      aria-pressed={interactive ? selected : undefined}
      aria-label={`إطار ${themeName} — صفحة ${page.pageNumber}`}
      data-framed-sheet={isSheet ? "true" : undefined}
      className={isSheet ? "framed-question-sheet" : undefined}
    >
      {/* الزخارف السفلية على معاينة الكارت فقط — في الـ sheet تسبب قصّ نص الفوتر في PDF */}
      {!isSheet ? (
        <FrameDecorations shape={shape} primary={primary} secondary={secondary} />
      ) : (
        <Box
          position="absolute"
          top={0}
          insetInline={0}
          h="6px"
          style={{ background: secondary }}
          opacity={0.85}
          zIndex={2}
          pointerEvents="none"
        />
      )}
      <CornerIcons primary={primary} secondary={secondary} sheet={isSheet} />

      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        gap={isSheet ? 3 : 1.5}
        px={isSheet ? 5 : 2.5}
        py={isSheet ? 4 : 2}
        position="relative"
        zIndex={4}
        minH={isSheet ? "88px" : "44px"}
        style={{
          background: `linear-gradient(120deg, ${primary} 0%, ${primary} 62%, ${accent} 140%)`,
          overflow: "visible",
        }}
      >
        <Box
          position="absolute"
          inset={0}
          opacity={0.15}
          pointerEvents="none"
          style={{
            backgroundImage: `repeating-linear-gradient(-32deg, transparent, transparent 10px, ${secondary}33 10px, ${secondary}33 12px)`,
          }}
        />

        <Flex align="center" gap={2} flexShrink={0} position="relative">
          <Image
            src={PLATFORM_LOGO}
            alt="EM Lectures"
            h={isSheet ? "42px" : "28px"}
            w={isSheet ? "42px" : "28px"}
            objectFit="contain"
            borderRadius="lg"
            bg="black"
            p="1px"
            boxShadow="0 0 0 2px rgba(255,255,255,0.25)"
          />
          {isSheet ? (
            <Box style={{ color: secondary }}>
              <FaGraduationCap size={22} />
            </Box>
          ) : null}
        </Flex>

        {/* بطاقة المدرس — padding كافٍ + بدون noOfLines عشان html2canvas ما يقصّش الحروف */}
        <Box
          position="relative"
          flex="1"
          maxW={isSheet ? "440px" : "220px"}
          mx={1}
          style={{
            background: "#FFFFFF",
            border: `2.5px solid ${secondary}`,
            borderRadius: shape === "ribbon" ? "12px" : "999px",
            boxShadow: `0 6px 18px -8px ${secondary}99`,
            padding: isSheet ? "12px 22px" : "6px 12px",
            textAlign: "center",
            overflow: "visible",
          }}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: isSheet ? 4 : 2,
            }}
          >
            <span style={{ color: primary, display: "inline-flex", flexShrink: 0 }}>
              <FaUserGraduate size={isSheet ? 14 : 10} />
            </span>
            <span
              style={{
                color: primary,
                fontSize: isSheet ? 17 : 11,
                fontWeight: 900,
                lineHeight: 1.45,
                whiteSpace: "nowrap",
                overflow: "visible",
                fontFamily: 'Tahoma, "Noto Sans Arabic", Arial, sans-serif',
              }}
            >
              {teacherName}
            </span>
          </Box>
          <span
            style={{
              display: "block",
              color: secondary,
              fontSize: isSheet ? 13 : 9,
              fontWeight: 800,
              lineHeight: 1.45,
              whiteSpace: "nowrap",
              overflow: "visible",
              fontFamily: 'Tahoma, "Noto Sans Arabic", Arial, sans-serif',
            }}
          >
            {teacherTitle}
          </span>
        </Box>

        {phone ? (
          <Flex
            align="center"
            gap={1.5}
            px={isSheet ? 3 : 1.5}
            py={isSheet ? 2 : 0.5}
            borderRadius="full"
            flexShrink={0}
            position="relative"
            style={{
              background: "rgba(0,0,0,0.28)",
              border: `1px solid ${secondary}88`,
            }}
          >
            <Flex
              w={isSheet ? "22px" : "16px"}
              h={isSheet ? "22px" : "16px"}
              borderRadius="full"
              align="center"
              justify="center"
              style={{ background: secondary, color: primary }}
            >
              <FaPhoneAlt size={isSheet ? 10 : 7} />
            </Flex>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: isSheet ? 13 : 9,
                fontWeight: 800,
                direction: "ltr",
                whiteSpace: "nowrap",
                lineHeight: 1.4,
                fontFamily: "Tahoma, Arial, sans-serif",
              }}
            >
              {phone}
            </span>
          </Flex>
        ) : (
          <Box w={isSheet ? "42px" : "28px"} flexShrink={0} />
        )}
      </Flex>

      {/* Body */}
      <Box
        px={isSheet ? 7 : 3}
        pt={isSheet ? 5 : 3}
        pb={isSheet ? 14 : 8}
        position="relative"
        zIndex={1}
        minH={isSheet ? "620px" : "210px"}
        overflow="hidden"
        style={{ background: surface }}
      >
        {/* زخرفة خلفية ناعمة */}
        <Box
          position="absolute"
          top="-40px"
          insetInlineEnd="-60px"
          w="220px"
          h="220px"
          borderRadius="full"
          pointerEvents="none"
          style={{ background: soft, opacity: 0.7 }}
        />

        {watermarkSrc ? (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w={isSheet ? "300px" : { base: "150px", sm: "190px" }}
            h={isSheet ? "300px" : { base: "150px", sm: "190px" }}
            pointerEvents="none"
            zIndex={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            opacity={0.12}
          >
            <Image
              src={watermarkSrc}
              alt=""
              aria-hidden
              maxW="100%"
              maxH="100%"
              objectFit="contain"
              userSelect="none"
              crossOrigin="anonymous"
            />
          </Box>
        ) : null}

        {isCropLayout && cropImageUrl ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            position="relative"
            zIndex={1}
            minH={isSheet ? "560px" : "180px"}
            gap={isSheet ? 3 : 2}
          >
            {page.sourceNumber ? (
              <Badge
                alignSelf="flex-start"
                colorScheme="blackAlpha"
                bg={`${primary}18`}
                color={primary}
                borderRadius="full"
                px={3}
                py={1}
                fontWeight="900"
                fontSize={isSheet ? "sm" : "xs"}
              >
                سؤال {page.sourceNumber}
              </Badge>
            ) : null}
            <Box
              w="100%"
              flex="1"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="xl"
              overflow="hidden"
              border="1.5px solid"
              style={{ borderColor: `${primary}33`, background: soft }}
              p={isSheet ? 3 : 1.5}
            >
              <Image
                src={cropImageUrl}
                alt={
                  page.sourceNumber
                    ? `سؤال ${page.sourceNumber}`
                    : `صفحة ${page.pageNumber}`
                }
                maxW="100%"
                maxH={isSheet ? "540px" : "200px"}
                objectFit="contain"
                mx="auto"
                crossOrigin="anonymous"
              />
            </Box>
          </Flex>
        ) : (
        <Grid
          templateColumns={
            hasFigure && !hasImageOptions
              ? isSheet
                ? "0.95fr 1.05fr"
                : { base: "1fr", sm: "0.9fr 1.1fr" }
              : "1fr"
          }
          gap={isSheet ? 6 : 3}
          alignItems="start"
          position="relative"
          zIndex={1}
        >
          {hasFigure && !hasImageOptions ? (
            <Box order={{ base: 2, sm: 1 }}>
              {figures.length > 0 ? (
                <QuestionFigures
                  figures={figures}
                  primary={primary}
                  soft={soft}
                  sheet={isSheet}
                />
              ) : (
                <>
                  <MockFigure
                    type={mockFigureType}
                    primary={primary}
                    soft={soft}
                    sheet={isSheet}
                  />
                  {page.figureLabel ? (
                    <Text
                      mt={2}
                      fontSize={isSheet ? "13px" : "9px"}
                      textAlign="center"
                      fontWeight="800"
                      style={{ color: primary }}
                    >
                      {page.figureLabel}
                    </Text>
                  ) : null}
                </>
              )}
            </Box>
          ) : null}

          <VStack
            align="stretch"
            spacing={isSheet ? 4 : 2}
            order={{ base: 1, sm: 2 }}
            pb={isSheet ? 12 : 8}
          >
            {page.poetry && verses.length > 0 ? (
              <VStack align="stretch" spacing={isSheet ? 2 : 1}>
                {page.introText ? (
                  <Box
                    fontSize={isSheet ? "15px" : "10px"}
                    fontWeight="800"
                    style={{ color: ink }}
                    dir="auto"
                  >
                    <FormattedQuestionText
                      value={page.introText}
                      fontSize="inherit"
                      fontWeight="inherit"
                      lineHeight="1.7"
                      color="inherit"
                      sx={MATH_TEXT_SX}
                    />
                  </Box>
                ) : null}
                {verses.map((verse, vi) => (
                  <Flex
                    key={`verse-${vi}`}
                    gap={isSheet ? 4 : 2}
                    justify="space-between"
                    px={isSheet ? 3 : 1.5}
                    py={isSheet ? 2 : 1}
                    borderRadius="lg"
                    style={{
                      background: soft,
                      border: `1px solid ${primary}33`,
                    }}
                    dir="rtl"
                  >
                    <Box flex="1" textAlign="right">
                      <FormattedQuestionText
                        value={verse.firstHemistich || ""}
                        fontSize={isSheet ? "15px" : "10px"}
                        fontWeight="700"
                        lineHeight="1.8"
                        color={ink}
                        sx={MATH_TEXT_SX}
                      />
                    </Box>
                    <Box flex="1" textAlign="left">
                      <FormattedQuestionText
                        value={verse.secondHemistich || ""}
                        fontSize={isSheet ? "15px" : "10px"}
                        fontWeight="700"
                        lineHeight="1.8"
                        color={ink}
                        sx={MATH_TEXT_SX}
                      />
                    </Box>
                  </Flex>
                ))}
                {page.promptText ? (
                  <Box
                    fontSize={isSheet ? "18px" : "11px"}
                    fontWeight="800"
                    lineHeight="1.9"
                    style={{ color: ink }}
                    dir="auto"
                  >
                    <FormattedQuestionText
                      value={page.promptText}
                      fontSize="inherit"
                      fontWeight="inherit"
                      lineHeight="inherit"
                      color="inherit"
                      sx={MATH_TEXT_SX}
                    />
                  </Box>
                ) : null}
              </VStack>
            ) : (
              <Box
                fontSize={isSheet ? "18px" : "11px"}
                fontWeight="800"
                lineHeight="1.9"
                whiteSpace="pre-wrap"
                noOfLines={isSheet ? undefined : 5}
                style={{ color: ink }}
                dir="auto"
              >
                <FormattedQuestionText
                  value={page.questionText}
                  fontSize="inherit"
                  fontWeight="inherit"
                  lineHeight="inherit"
                  color="inherit"
                  sx={MATH_TEXT_SX}
                />
              </Box>
            )}

            {hasFigure && hasImageOptions ? (
              <QuestionFigures
                figures={figures.filter((f) => f.imageType !== "choice_option")}
                primary={primary}
                soft={soft}
                sheet={isSheet}
              />
            ) : null}

            {questionTable &&
            (questionTable.role === "data" ||
              (questionTable.role === "options" && !showOptionsTableImage)) ? (
              <Box>
                <Text
                  mb={1}
                  fontSize={isSheet ? "12px" : "8px"}
                  fontWeight="900"
                  style={{ color: primary }}
                >
                  {questionTable.role === "options"
                    ? "جدول الاختيارات"
                    : "جدول البيانات"}
                </Text>
                <MarkdownTable
                  content={questionTable.content}
                  primary={primary}
                  ink={ink}
                  soft={soft}
                  sheet={isSheet}
                />
              </Box>
            ) : null}

            {hasOptions ? (
              hasImageOptions ? (
                <Grid
                  templateColumns={
                    isSheet
                      ? "1fr 1fr"
                      : { base: "1fr 1fr", sm: "1fr 1fr" }
                  }
                  gap={isSheet ? 3 : 1.5}
                >
                  {pageOptions.map((opt) => (
                    <Flex
                      key={opt.key}
                      direction="column"
                      align="center"
                      gap={isSheet ? 2 : 1}
                      minW={0}
                      p={isSheet ? 2.5 : 1.5}
                      borderRadius="lg"
                      style={{
                        background: soft,
                        border: `1px solid ${primary}33`,
                      }}
                    >
                      <OptionKeyCircle
                        label={opt.key}
                        primary={primary}
                        soft="#FFFFFF"
                        sheet={isSheet}
                      />
                      {opt.imageUrl ? (
                        <Image
                          src={opt.imageUrl}
                          alt={`اختيار ${opt.key}`}
                          maxH={isSheet ? "140px" : "56px"}
                          w="100%"
                          objectFit="contain"
                          borderRadius="md"
                          crossOrigin="anonymous"
                        />
                      ) : null}
                      {opt.text ? (
                        <Box
                          fontSize={isSheet ? "13px" : "9px"}
                          fontWeight="700"
                          textAlign="center"
                          style={{ color: ink }}
                          dir="auto"
                        >
                          <FormattedQuestionText
                            value={opt.text}
                            fontSize="inherit"
                            fontWeight="inherit"
                            lineHeight="1.5"
                            color="inherit"
                            sx={MATH_TEXT_SX}
                          />
                        </Box>
                      ) : null}
                    </Flex>
                  ))}
                </Grid>
              ) : (
                <Grid templateColumns="1fr 1fr" gap={isSheet ? 3 : 1.5}>
                  {pageOptions.map((opt) => (
                    <Flex
                      key={opt.key}
                      align="center"
                      gap={isSheet ? 2.5 : 1.5}
                      minW={0}
                      p={isSheet ? 2.5 : 0}
                      borderRadius="lg"
                      style={
                        isSheet
                          ? {
                              background: soft,
                              border: `1px solid ${primary}22`,
                            }
                          : undefined
                      }
                    >
                      <OptionKeyCircle
                        label={opt.key}
                        primary={primary}
                        soft="#FFFFFF"
                        sheet={isSheet}
                      />
                      <Box
                        fontSize={isSheet ? "15px" : "10px"}
                        fontWeight="700"
                        noOfLines={isSheet ? undefined : 2}
                        lineHeight="1.7"
                        style={{ color: ink }}
                        minW={0}
                        flex="1"
                        dir="auto"
                      >
                        <FormattedQuestionText
                          value={opt.text || "—"}
                          fontSize="inherit"
                          fontWeight="inherit"
                          lineHeight="inherit"
                          color="inherit"
                          sx={MATH_TEXT_SX}
                        />
                      </Box>
                    </Flex>
                  ))}
                </Grid>
              )
            ) : null}
          </VStack>
        </Grid>
        )}
      </Box>

      {/* Footer — اسم المدرس كامل بدون قصّ */}
      <Flex
        px={isSheet ? 5 : 3}
        justify="space-between"
        align="center"
        position="relative"
        zIndex={5}
        minH={isSheet ? "52px" : "32px"}
        style={{
          background: soft,
          borderTop: `1px solid ${primary}33`,
          paddingTop: isSheet ? 14 : 8,
          paddingBottom: isSheet ? 14 : 8,
          overflow: "visible",
        }}
      >
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            overflow: "visible",
          }}
        >
          <span style={{ color: primary, display: "inline-flex", flexShrink: 0 }}>
            <FaUserGraduate size={isSheet ? 14 : 10} />
          </span>
          <span
            style={{
              color: primary,
              fontSize: isSheet ? 14 : 10,
              fontWeight: 900,
              lineHeight: 1.5,
              whiteSpace: "nowrap",
              overflow: "visible",
              fontFamily: 'Tahoma, "Noto Sans Arabic", Arial, sans-serif',
            }}
          >
            {teacherName}
          </span>
        </Box>
        <span
          style={{
            color: ink,
            opacity: 0.7,
            fontSize: isSheet ? 13 : 9,
            fontWeight: 800,
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            fontFamily: 'Tahoma, "Noto Sans Arabic", Arial, sans-serif',
          }}
        >
          صفحة {page.pageNumber}
        </span>
      </Flex>
    </Box>
  );
}

export { PLATFORM_LOGO };
