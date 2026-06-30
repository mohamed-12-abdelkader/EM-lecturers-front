import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Textarea,
  Tooltip,
  Badge,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Select,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUndo,
  FaRedo,
  FaCopy,
  FaRegSave,
  FaRocket,
  FaSync,
  FaChevronDown,
  FaEye,
  FaPalette,
  FaFont,
  FaMousePointer,
  FaImage,
  FaThLarge,
  FaMagic,
} from "react-icons/fa";

const MotionBox = motion(Box);

/** قيم افتراضية موسّعة لـ theme (تُدمج مع الوثيقة المرنة) */
export const BUILDER_THEME_DEFAULTS = {
  primary_color: "#2563eb",
  secondary_color: "#06b6d4",
  accent_color: "#8b5cf6",
  page_background_color: "#f8fafc",
  text_color: "#0f172a",
  font_family: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
  font_heading_size: "2rem",
  font_body_size: "1rem",
  font_weight_heading: "700",
  line_height_body: "1.75",
  letter_spacing_heading: "-0.02em",
  button_style: "rounded",
  button_size: "md",
  button_padding_y: "12",
  button_radius_px: "14",
  button_shadow_level: "2",
  button_border_style: "none",
  button_hover_animation: "lift",
  page_bg_type: "gradient",
  gradient_color_1: "#eff6ff",
  gradient_color_2: "#f0fdfa",
  gradient_angle: "135",
  gradient_direction: "to-br",
  page_bg_image_url: "",
  page_bg_blur: "0",
  page_bg_overlay: "0.35",
  page_bg_opacity: "1",
  page_bg_pattern_id: "none",
  page_bg_video_url: "",
  layout_max_width: "1100px",
  layout_content_align: "start",
  layout_section_padding: "48",
  layout_section_margin: "0",
  hero_min_height: "520",
  background_style: "gradient",
};

export function mergeBuilderTheme(theme) {
  return { ...BUILDER_THEME_DEFAULTS, ...(theme || {}) };
}

function normalizeHex(hex) {
  if (!hex || typeof hex !== "string") return "#000000";
  let h = hex.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`.toLowerCase();
  }
  if (h.length === 7) return h.toLowerCase();
  return "#2563eb";
}

function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  const n = parseInt(h, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function rgbToHex(r, g, b) {
  const to = (x) => Math.max(0, Math.min(255, Math.round(Number(x) || 0)));
  return `#${[to(r), to(g), to(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

const PRESET_THEMES = [
  {
    id: "academic_blue",
    name: "أكاديمي أزرق",
    theme: {
      primary_color: "#1d4ed8",
      secondary_color: "#38bdf8",
      accent_color: "#6366f1",
      page_background_color: "#f1f5f9",
      text_color: "#0f172a",
      page_bg_type: "gradient",
      gradient_color_1: "#eff6ff",
      gradient_color_2: "#ecfeff",
      gradient_angle: "135",
      button_style: "rounded",
    },
  },
  {
    id: "premium_dark",
    name: "داكن فاخر",
    theme: {
      primary_color: "#3b82f6",
      secondary_color: "#22d3ee",
      accent_color: "#a78bfa",
      page_background_color: "#020617",
      text_color: "#f1f5f9",
      page_bg_type: "solid",
      button_style: "soft",
      button_shadow_level: "3",
    },
  },
  {
    id: "modern_teacher",
    name: "مدرّس عصري",
    theme: {
      primary_color: "#059669",
      secondary_color: "#14b8a6",
      accent_color: "#f59e0b",
      page_background_color: "#fafafa",
      text_color: "#171717",
      page_bg_type: "gradient",
      gradient_color_1: "#ecfdf5",
      gradient_color_2: "#f0fdfa",
      gradient_angle: "120",
      button_style: "pill",
    },
  },
  {
    id: "elegant_gold",
    name: "ذهبي أنيق",
    theme: {
      primary_color: "#b45309",
      secondary_color: "#eab308",
      accent_color: "#78350f",
      page_background_color: "#fffbeb",
      text_color: "#422006",
      page_bg_type: "gradient",
      gradient_color_1: "#fffbeb",
      gradient_color_2: "#fef3c7",
      gradient_angle: "160",
      button_style: "rounded",
    },
  },
  {
    id: "clean_minimal",
    name: "بسيط نظيف",
    theme: {
      primary_color: "#18181b",
      secondary_color: "#71717a",
      accent_color: "#3b82f6",
      page_background_color: "#ffffff",
      text_color: "#09090b",
      page_bg_type: "solid",
      button_style: "square",
      button_shadow_level: "0",
    },
  },
];

const FONT_CATALOG = [
  {
    category: "عربي احترافي",
    fonts: [
      { name: "قاهرة", stack: "'Cairo', 'Segoe UI', sans-serif" },
      { name: "تجوال", stack: "'Tajawal', 'Segoe UI', sans-serif" },
      { name: "المراعي", stack: "'Almarai', 'Segoe UI', sans-serif" },
    ],
  },
  {
    category: "عربي حديث",
    fonts: [
      { name: "نوتو سانس عربي", stack: "'Noto Sans Arabic', sans-serif" },
      { name: "آي بي إم بلكس عربي", stack: "'IBM Plex Sans Arabic', sans-serif" },
      { name: "تشانغا", stack: "'Changa', sans-serif" },
    ],
  },
  {
    category: "عربي رسمي",
    fonts: [
      { name: "أميري", stack: "'Amiri', 'Times New Roman', serif" },
      { name: "المسيري", stack: "'El Messiri', serif" },
      { name: "لطيف", stack: "'Lateef', serif" },
    ],
  },
  {
    category: "إنجليزي احترافي",
    fonts: [
      { name: "Inter", stack: "'Inter', 'Segoe UI', sans-serif" },
      { name: "Source Sans 3", stack: "'Source Sans 3', sans-serif" },
    ],
  },
  {
    category: "إنجليزي عصري",
    fonts: [
      { name: "DM Sans", stack: "'DM Sans', system-ui, sans-serif" },
      { name: "Outfit", stack: "'Outfit', system-ui, sans-serif" },
    ],
  },
];

const COLOR_PALETTES = [
  { id: "modern_blue", name: "Modern Blue", primary: "#2563eb", secondary: "#38bdf8", accent: "#6366f1" },
  { id: "premium_purple", name: "Premium Purple", primary: "#6d28d9", secondary: "#c084fc", accent: "#f472b6" },
  { id: "dark_elegant", name: "Dark Elegant", primary: "#0f172a", secondary: "#475569", accent: "#38bdf8" },
  { id: "education_green", name: "Education Green", primary: "#047857", secondary: "#34d399", accent: "#fbbf24" },
  { id: "luxury_gold", name: "Luxury Gold", primary: "#a16207", secondary: "#eab308", accent: "#78350f" },
];

const BUTTON_SHAPES = [
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
  { value: "soft", label: "Soft Rounded" },
  { value: "glass", label: "Glass" },
];

function copyText(text, toast) {
  navigator.clipboard.writeText(text).then(
    () =>
      toast?.({
        title: "تم النسخ",
        status: "success",
        duration: 2000,
        isClosable: true,
      }),
    () =>
      toast?.({
        title: "تعذّر النسخ",
        status: "error",
        duration: 2000,
        isClosable: true,
      }),
  );
}

function ColorField({ label, value, onChange, toast, hint }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("white", "gray.800");
  const hex = normalizeHex(value);
  const rgb = hexToRgb(hex);

  const setFromHex = (h) => onChange(normalizeHex(h));
  const setFromRgb = (r, g, b) => onChange(rgbToHex(r, g, b));

  return (
    <FormControl>
      <FormLabel fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.06em" color="gray.500">
        {label}
      </FormLabel>
      {hint ? (
        <FormHelperText mt={0} mb={2}>
          {hint}
        </FormHelperText>
      ) : null}
      <HStack align="flex-start" spacing={3} flexWrap="wrap">
        <Tooltip label="منتقي اللون" hasArrow placement="top">
          <Box position="relative" w="52px" h="52px" flexShrink={0}>
            <Box
              as="label"
              position="absolute"
              inset={0}
              borderRadius="xl"
              borderWidth="2px"
              borderColor={border}
              cursor="pointer"
              overflow="hidden"
              boxShadow="sm"
              bg={hex}
            >
              <Input
                type="color"
                value={hex}
                onChange={(e) => setFromHex(e.target.value)}
                position="absolute"
                opacity={0}
                w="160%"
                h="160%"
                top="-30%"
                left="-30%"
                cursor="pointer"
                p={0}
                border="none"
              />
            </Box>
          </Box>
        </Tooltip>
        <VStack align="stretch" flex={1} minW="160px" spacing={2}>
          <HStack>
            <Input
              size="sm"
              value={hex}
              onChange={(e) => setFromHex(e.target.value)}
              fontFamily="mono"
              dir="ltr"
              borderRadius="lg"
              bg={bg}
              borderColor={border}
            />
            <Tooltip label="نسخ HEX">
              <IconButton
                aria-label="نسخ"
                icon={<FaCopy />}
                size="sm"
                variant="ghost"
                onClick={() => copyText(hex, toast)}
              />
            </Tooltip>
          </HStack>
          <HStack spacing={2}>
            <NumberInput
              size="xs"
              maxW="72px"
              value={rgb.r}
              min={0}
              max={255}
              onChange={(_, v) => setFromRgb(v, rgb.g, rgb.b)}
            >
              <NumberInputField borderRadius="md" dir="ltr" placeholder="R" />
            </NumberInput>
            <NumberInput
              size="xs"
              maxW="72px"
              value={rgb.g}
              min={0}
              max={255}
              onChange={(_, v) => setFromRgb(rgb.r, v, rgb.b)}
            >
              <NumberInputField borderRadius="md" dir="ltr" placeholder="G" />
            </NumberInput>
            <NumberInput
              size="xs"
              maxW="72px"
              value={rgb.b}
              min={0}
              max={255}
              onChange={(_, v) => setFromRgb(rgb.r, rgb.g, v)}
            >
              <NumberInputField borderRadius="md" dir="ltr" placeholder="B" />
            </NumberInput>
            <Text fontSize="10px" color="gray.500" whiteSpace="nowrap">
              RGB
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </FormControl>
  );
}

function buttonRadiusFromStyle(t) {
  const px = Number(t.button_radius_px) || 14;
  const style = t.button_style || "rounded";
  if (style === "pill") return 9999;
  if (style === "square") return 4;
  if (style === "soft") return Math.max(px, 18);
  if (style === "glass") return 16;
  return px;
}

function buttonShadowFromLevel(level) {
  const n = Number(level) || 0;
  const shadows = [
    "none",
    "sm",
    "md",
    "lg",
    "0 20px 40px -12px rgba(15,23,42,0.35)",
  ];
  return shadows[Math.min(Math.max(n, 0), shadows.length - 1)];
}

function LivePreviewFrame({ theme, hero }) {
  const t = mergeBuilderTheme(theme);
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const heading = hero?.title?.trim() || "منصة تعليمية باسمك";
  const sub = hero?.subtitle?.trim() || "خطتك الدراسية، في مكان واحد.";
  const desc =
    hero?.description?.trim() ||
    "صفحة هبوط احترافية تعكس هوية المدرّس وتجربة تعلّم حديثة — هذه معاينة حية لكل التعديلات.";
  const cta1 = hero?.cta_label?.trim() || "ابدأ الآن";
  const cta2 = "تعرّف أكثر";

  const bgType = t.page_bg_type || "gradient";
  let pageBg = t.page_background_color;
  if (bgType === "gradient") {
    pageBg = `linear-gradient(${t.gradient_angle || 135}deg, ${t.gradient_color_1}, ${t.gradient_color_2})`;
  } else if (bgType === "solid") {
    pageBg = t.page_background_color;
  }

  const alignMap = { start: "flex-start", center: "center", end: "flex-end" };
  const alignItems = alignMap[t.layout_content_align] || "flex-start";

  const btnAnim =
    t.button_hover_animation === "glow"
      ? { _hover: { boxShadow: `0 0 0 3px ${t.primary_color}55`, transform: "translateY(-1px)" } }
      : t.button_hover_animation === "none"
        ? {}
        : { _hover: { transform: "translateY(-2px)", shadow: "lg" } };

  const br = buttonRadiusFromStyle(t);
  const sh = buttonShadowFromLevel(t.button_shadow_level);
  const padY = Number(t.button_padding_y) || 12;
  const sizes = { sm: "sm", md: "md", lg: "lg" };
  const sz = sizes[t.button_size] || "md";

  const isGlass = t.button_style === "glass";
  const primaryBtnProps = isGlass
    ? {
        bg: "whiteAlpha.200",
        color: "white",
        borderWidth: "1px",
        borderColor: "whiteAlpha.400",
        backdropFilter: "blur(12px)",
        _hover: { bg: "whiteAlpha.300" },
      }
    : {
        bg: t.primary_color,
        color: "white",
        _hover: { filter: "brightness(1.05)" },
      };

  return (
    <MotionBox
      layout
      borderRadius="2xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor={border}
      boxShadow="0 25px 50px -12px rgba(15, 23, 42, 0.18)"
      bg={cardBg}
      maxW="100%"
    >
      <Box
        minH={`${Math.min(Math.max(Number(t.hero_min_height) || 420, 320), 720)}px`}
        position="relative"
        bg={bgType === "image" && t.page_bg_image_url ? t.page_background_color : pageBg}
      >
        {bgType === "pattern" && t.page_bg_pattern_id !== "none" ? (
          <Box
            position="absolute"
            inset={0}
            opacity={0.35}
            pointerEvents="none"
            bg={
              t.page_bg_pattern_id === "grid"
                ? "repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(148,163,184,0.15) 11px, rgba(148,163,184,0.15) 12px), repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(148,163,184,0.15) 11px, rgba(148,163,184,0.15) 12px)"
                : t.page_bg_pattern_id === "dots"
                  ? "radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)"
                  : "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")"
            }
            backgroundSize={t.page_bg_pattern_id === "dots" ? "16px 16px" : "auto"}
          />
        ) : null}
        {bgType === "image" && t.page_bg_image_url ? (
          <Box
            position="absolute"
            inset={0}
            backgroundImage={`url(${t.page_bg_image_url})`}
            backgroundSize="cover"
            backgroundPosition="center"
            filter={`blur(${Number(t.page_bg_blur) || 0}px)`}
            transform="scale(1.05)"
          />
        ) : null}
        {bgType === "image" && t.page_bg_image_url ? (
          <Box
            position="absolute"
            inset={0}
            bg={`linear-gradient(to bottom, rgba(15,23,42,${Number(t.page_bg_overlay) || 0.35}), rgba(15,23,42,${Math.min(
              (Number(t.page_bg_overlay) || 0.35) + 0.2,
              0.9,
            )}))`}
          />
        ) : null}
        <Box
          position="relative"
          zIndex={1}
          px={{ base: 6, md: 10 }}
          py={{ base: 10, md: 14 }}
          maxW={t.layout_max_width || "1100px"}
          mx="auto"
          display="flex"
          flexDirection="column"
          alignItems={alignItems}
          textAlign={t.layout_content_align === "center" ? "center" : "start"}
          style={{
            paddingTop: `${Number(t.layout_section_padding) || 48}px`,
            marginTop: `${Number(t.layout_section_margin) || 0}px`,
          }}
        >
          <HStack mb={4} spacing={2} flexWrap="wrap" justify={alignItems === "center" ? "center" : "flex-start"}>
            <Badge
              px={3}
              py={1}
              borderRadius="full"
              bg={`${t.accent_color}22`}
              color={t.accent_color}
              fontWeight="700"
              fontSize="xs"
              letterSpacing="0.08em"
            >
              معاينة حية
            </Badge>
            {bgType === "video" ? (
              <Badge colorScheme="purple" borderRadius="full" fontSize="xs">
                وضع فيديو — يُعرض الرابط في الواجهة الأمامية
              </Badge>
            ) : null}
          </HStack>
          <Heading
            as="h1"
            fontSize={t.font_heading_size || "2rem"}
            fontWeight={t.font_weight_heading || "800"}
            letterSpacing={t.letter_spacing_heading || "-0.02em"}
            lineHeight="1.15"
            color={t.text_color}
            style={{ fontFamily: t.font_family }}
            maxW="20ch"
          >
            {heading}
          </Heading>
          <Text
            mt={3}
            fontSize="lg"
            fontWeight="600"
            color={t.secondary_color}
            style={{ fontFamily: t.font_family }}
          >
            {sub}
          </Text>
          <Text
            mt={5}
            fontSize={t.font_body_size || "1rem"}
            lineHeight={t.line_height_body || 1.75}
            color={t.text_color}
            opacity={0.85}
            maxW="52ch"
            style={{ fontFamily: t.font_family }}
          >
            {desc}
          </Text>
          <HStack mt={8} spacing={3} flexWrap="wrap" justify={alignItems === "center" ? "center" : "flex-start"}>
            <Button
              size={sz}
              px={8}
              py={padY / 4}
              borderRadius={`${br}px`}
              boxShadow={sh}
              fontWeight="700"
              {...primaryBtnProps}
              {...btnAnim}
              style={{ fontFamily: t.font_family }}
              borderStyle={t.button_border_style !== "none" ? t.button_border_style : undefined}
              borderWidth={t.button_border_style !== "none" ? "2px" : undefined}
              borderColor={t.primary_color}
            >
              {cta1}
            </Button>
            <Button
              size={sz}
              variant="outline"
              px={7}
              py={padY / 4}
              borderRadius={`${br}px`}
              borderColor={t.secondary_color}
              color={t.secondary_color}
              fontWeight="600"
              {...btnAnim}
              style={{ fontFamily: t.font_family }}
            >
              {cta2}
            </Button>
          </HStack>
        </Box>
      </Box>
    </MotionBox>
  );
}

export default function LandingPageBuilder({
  landing,
  setLanding,
  setHero,
  heroImageLocked,
  subdomainDraft,
  toast,
}) {
  const t = mergeBuilderTheme(landing.theme);
  const hero = landing.hero || {};

  const patchTheme = useCallback(
    (updates) => {
      setLanding((prev) => ({
        ...prev,
        theme: mergeBuilderTheme({ ...prev.theme, ...updates }),
      }));
    },
    [setLanding],
  );

  const historyRef = useRef([]);
  const historyPtr = useRef(-1);
  const skipHistory = useRef(false);
  const seeded = useRef(false);

  const pushHistory = useCallback(() => {
    const snap = JSON.stringify({
      hero: landing.hero,
      theme: mergeBuilderTheme(landing.theme),
    });
    let next = historyRef.current.slice(0, historyPtr.current + 1);
    if (next.length && next[next.length - 1] === snap) return;
    next.push(snap);
    if (next.length > 40) next = next.slice(-40);
    historyRef.current = next;
    historyPtr.current = next.length - 1;
  }, [landing.hero, landing.theme]);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const snap = JSON.stringify({
      hero: landing.hero,
      theme: mergeBuilderTheme(landing.theme),
    });
    historyRef.current = [snap];
    historyPtr.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- لقطة أولية فقط
  }, []);

  const applySnapshot = useCallback(
    (json) => {
      try {
        const { hero: h, theme: th } = JSON.parse(json);
        skipHistory.current = true;
        setLanding((prev) => ({ ...prev, hero: h || prev.hero, theme: mergeBuilderTheme(th || {}) }));
      } catch {
        /* ignore */
      }
    },
    [setLanding],
  );

  const undo = useCallback(() => {
    if (historyPtr.current <= 0) return;
    historyPtr.current -= 1;
    applySnapshot(historyRef.current[historyPtr.current]);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyPtr.current >= historyRef.current.length - 1) return;
    historyPtr.current += 1;
    applySnapshot(historyRef.current[historyPtr.current]);
  }, [applySnapshot]);

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false;
      return;
    }
    const id = setTimeout(() => pushHistory(), 400);
    return () => clearTimeout(id);
  }, [landing.theme, landing.hero, pushHistory]);

  useEffect(() => {
    const key = `landingBuilderDraft_${subdomainDraft || "anon"}`;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ hero: landing.hero, theme: mergeBuilderTheme(landing.theme) }),
        );
      } catch {
        /* ignore */
      }
    }, 900);
    return () => clearTimeout(id);
  }, [landing.hero, landing.theme, subdomainDraft]);

  const [autosavedAt, setAutosavedAt] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => setAutosavedAt(new Date()), 1000);
    return () => clearTimeout(id);
  }, [landing.theme, landing.hero]);

  const shellBg = useColorModeValue("#f4f6fb", "#0b0f1a");
  const panelBg = useColorModeValue("white", "gray.900");
  const panelBorder = useColorModeValue("gray.200", "gray.700");
  const toolbarBg = useColorModeValue("white", "gray.900");

  const resetDefaults = useCallback(() => {
    pushHistory();
    setLanding((prev) => ({
      ...prev,
      theme: { ...BUILDER_THEME_DEFAULTS },
    }));
    toast?.({ title: "تمت إعادة المظهر للافتراضي", status: "info", duration: 2500 });
  }, [setLanding, toast, pushHistory]);

  const applyFullPreset = useCallback(
    (preset) => {
      pushHistory();
      patchTheme({ ...BUILDER_THEME_DEFAULTS, ...preset.theme });
      toast?.({ title: `تم تطبيق: ${preset.name}`, status: "success", duration: 2200 });
    },
    [patchTheme, toast, pushHistory],
  );

  const saveDraftNow = useCallback(() => {
    const key = `landingBuilderDraft_${subdomainDraft || "anon"}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ hero: landing.hero, theme: mergeBuilderTheme(landing.theme) }),
      );
      toast?.({ title: "تم حفظ المسودة محلياً", status: "success", duration: 2000 });
    } catch {
      toast?.({ title: "تعذّر الحفظ", status: "error", duration: 2000 });
    }
  }, [landing, subdomainDraft, toast]);

  const publishHint = useCallback(() => {
    toast?.({
      title: "جاهز للنشر",
      description: "التصميم مضمّن في النموذج. أكمل باقي الحقول ثم اضغط «إنشاء المنصة» في أسفل الصفحة.",
      status: "info",
      duration: 4500,
      isClosable: true,
    });
  }, [toast]);

  const sliderTheme = "blue";

  return (
    <Box borderRadius="3xl" overflow="hidden" borderWidth="1px" borderColor={panelBorder} bg={shellBg}>
      <Flex
        wrap="wrap"
        gap={3}
        px={{ base: 4, md: 6 }}
        py={4}
        bg={toolbarBg}
        borderBottomWidth="1px"
        borderColor={panelBorder}
        align="center"
        justify="space-between"
      >
        <HStack spacing={2} flexWrap="wrap">
          <Badge colorScheme="purple" borderRadius="md" px={2} py={0.5}>
            Landing Builder
          </Badge>
          <Text fontSize="xs" color="gray.500" display={{ base: "none", md: "block" }}>
            {autosavedAt
              ? `حفظ تلقائي: ${autosavedAt.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </Text>
        </HStack>
        <Wrap spacing={2} justify="flex-end">
          <Tooltip label="تراجع" hasArrow>
            <IconButton aria-label="تراجع" icon={<FaUndo />} size="sm" variant="ghost" onClick={undo} />
          </Tooltip>
          <Tooltip label="إعادة" hasArrow>
            <IconButton aria-label="إعادة" icon={<FaRedo />} size="sm" variant="ghost" onClick={redo} />
          </Tooltip>
          <Button size="sm" leftIcon={<FaSync />} variant="ghost" onClick={resetDefaults}>
            افتراضي
          </Button>
          <Button size="sm" leftIcon={<FaRegSave />} variant="outline" onClick={saveDraftNow}>
            مسودة
          </Button>
          <Button size="sm" leftIcon={<FaRocket />} colorScheme="blue" onClick={publishHint}>
            نشر
          </Button>
        </Wrap>
      </Flex>

      <Grid
        templateColumns={{ base: "1fr", xl: "minmax(0,1fr) minmax(300px, 420px)" }}
        gap={{ base: 6, xl: 8 }}
        p={{ base: 4, md: 6 }}
      >
        <GridItem order={{ base: 2, xl: 1 }}>
          <Card shadow="sm" borderRadius="2xl" borderWidth="1px" borderColor={panelBorder} bg={panelBg}>
            <CardHeader pb={0}>
              <HStack>
                <Icon as={FaMagic} color="blue.500" />
                <Heading size="sm" fontWeight="800">
                  تخصيص صفحة الهبوط
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={4}>
              <Tabs variant="soft-rounded" colorScheme={sliderTheme}>
                <TabList flexWrap="wrap" gap={2} mb={6}>
                  <Tab borderRadius="full" fontWeight="600" fontSize="sm">
                    ألوان البراند
                  </Tab>
                  <Tab borderRadius="full" fontWeight="600" fontSize="sm">
                    الطباعة
                  </Tab>
                  <Tab borderRadius="full" fontWeight="600" fontSize="sm">
                    الأزرار
                  </Tab>
                  <Tab borderRadius="full" fontWeight="600" fontSize="sm">
                    الخلفية
                  </Tab>
                  <Tab borderRadius="full" fontWeight="600" fontSize="sm">
                    التخطيط
                  </Tab>
                  <Tab borderRadius="full" fontWeight="600" fontSize="sm">
                    محتوى الهيرو
                  </Tab>
                </TabList>

                <TabPanels>
                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={8}>
                      <Box>
                        <Text fontSize="xs" fontWeight="800" color="gray.500" letterSpacing="0.08em" mb={3}>
                          PALETTES جاهزة
                        </Text>
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                          {COLOR_PALETTES.map((p) => (
                            <Button
                              key={p.id}
                              h="auto"
                              py={4}
                              px={4}
                              borderRadius="xl"
                              variant="outline"
                              borderWidth="2px"
                              borderColor={panelBorder}
                              _hover={{ borderColor: "blue.400", shadow: "md" }}
                              onClick={() =>
                                patchTheme({
                                  primary_color: p.primary,
                                  secondary_color: p.secondary,
                                  accent_color: p.accent,
                                })
                              }
                            >
                              <VStack spacing={2} w="full">
                                <HStack spacing={0} justify="center">
                                  <Box w={8} h={8} borderRadius="md" bg={p.primary} />
                                  <Box w={8} h={8} borderRadius="md" bg={p.secondary} ml={-2} />
                                  <Box w={8} h={8} borderRadius="md" bg={p.accent} ml={-2} />
                                </HStack>
                                <Text fontSize="xs" fontWeight="700">
                                  {p.name}
                                </Text>
                              </VStack>
                            </Button>
                          ))}
                        </SimpleGrid>
                      </Box>
                      <Divider />
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                        <ColorField
                          label="Primary"
                          value={t.primary_color}
                          onChange={(v) => patchTheme({ primary_color: v })}
                          toast={toast}
                        />
                        <ColorField
                          label="Secondary"
                          value={t.secondary_color}
                          onChange={(v) => patchTheme({ secondary_color: v })}
                          toast={toast}
                        />
                        <ColorField
                          label="Accent"
                          value={t.accent_color}
                          onChange={(v) => patchTheme({ accent_color: v })}
                          toast={toast}
                        />
                        <ColorField
                          label="خلفية الصفحة (Solid)"
                          value={t.page_background_color}
                          onChange={(v) => patchTheme({ page_background_color: v })}
                          toast={toast}
                          hint="يُستخدم كأساس عند النوع Solid أو كطبقة تحت الصورة"
                        />
                        <ColorField
                          label="لون النص"
                          value={t.text_color}
                          onChange={(v) => patchTheme({ text_color: v })}
                          toast={toast}
                        />
                      </SimpleGrid>

                      <Box>
                        <Text fontSize="xs" fontWeight="800" color="gray.500" letterSpacing="0.08em" mb={3}>
                          ثيمات كاملة
                        </Text>
                        <Wrap spacing={2}>
                          {PRESET_THEMES.map((p) => (
                            <Button
                              key={p.id}
                              size="sm"
                              borderRadius="full"
                              variant="outline"
                              fontWeight="600"
                              onClick={() => applyFullPreset(p)}
                            >
                              {p.name}
                            </Button>
                          ))}
                        </Wrap>
                      </Box>
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={8}>
                      <FormControl>
                        <FormLabel fontWeight="700">عائلة الخط</FormLabel>
                        <Menu matchWidth>
                          <MenuButton
                            as={Button}
                            rightIcon={<FaChevronDown />}
                            borderRadius="xl"
                            variant="outline"
                            textAlign="start"
                            fontWeight="600"
                            py={6}
                            w="full"
                            style={{ fontFamily: t.font_family }}
                          >
                            اختر خطاً من القائمة
                          </MenuButton>
                          <MenuList borderRadius="xl" maxH="70vh" overflowY="auto" zIndex={30}>
                            {FONT_CATALOG.map((cat, ci) => (
                              <React.Fragment key={cat.category}>
                                <Text px={3} pt={2} pb={1} fontSize="xs" fontWeight="800" color="gray.500">
                                  {cat.category}
                                </Text>
                                {cat.fonts.map((f) => (
                                  <MenuItem
                                    key={f.stack}
                                    borderRadius="md"
                                    mx={1}
                                    onClick={() => patchTheme({ font_family: f.stack })}
                                  >
                                    <Text fontWeight="600" style={{ fontFamily: f.stack }}>
                                      {f.name}
                                    </Text>
                                  </MenuItem>
                                ))}
                                {ci < FONT_CATALOG.length - 1 ? <MenuDivider /> : null}
                              </React.Fragment>
                            ))}
                          </MenuList>
                        </Menu>
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl>
                          <FormLabel fontSize="sm">حجم العنوان</FormLabel>
                          <Input
                            value={t.font_heading_size}
                            onChange={(e) => patchTheme({ font_heading_size: e.target.value })}
                            borderRadius="lg"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">حجم النص</FormLabel>
                          <Input
                            value={t.font_body_size}
                            onChange={(e) => patchTheme({ font_body_size: e.target.value })}
                            borderRadius="lg"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">وزن العنوان</FormLabel>
                          <Input
                            value={t.font_weight_heading}
                            onChange={(e) => patchTheme({ font_weight_heading: e.target.value })}
                            borderRadius="lg"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">تباعد الأسطر</FormLabel>
                          <Input
                            value={t.line_height_body}
                            onChange={(e) => patchTheme({ line_height_body: e.target.value })}
                            borderRadius="lg"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormControl gridColumn={{ md: "1 / -1" }}>
                          <FormLabel fontSize="sm">تباعد الحروف (العناوين)</FormLabel>
                          <Input
                            value={t.letter_spacing_heading}
                            onChange={(e) => patchTheme({ letter_spacing_heading: e.target.value })}
                            borderRadius="lg"
                            dir="ltr"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={8}>
                      <FormControl>
                        <FormLabel fontWeight="700">شكل الزر</FormLabel>
                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                          {BUTTON_SHAPES.map((b) => (
                            <Button
                              key={b.value}
                              size="sm"
                              borderRadius="lg"
                              variant={t.button_style === b.value ? "solid" : "outline"}
                              colorScheme={t.button_style === b.value ? "blue" : "gray"}
                              onClick={() => patchTheme({ button_style: b.value })}
                            >
                              {b.label}
                            </Button>
                          ))}
                        </SimpleGrid>
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl>
                          <FormLabel fontSize="sm">حجم الزر</FormLabel>
                          <Select
                            borderRadius="lg"
                            value={t.button_size}
                            onChange={(e) => patchTheme({ button_size: e.target.value })}
                          >
                            <option value="sm">صغير</option>
                            <option value="md">متوسط</option>
                            <option value="lg">كبير</option>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">نمط الحد</FormLabel>
                          <Select
                            borderRadius="lg"
                            value={t.button_border_style}
                            onChange={(e) => patchTheme({ button_border_style: e.target.value })}
                          >
                            <option value="none">بدون</option>
                            <option value="solid">متصل</option>
                            <option value="dashed">متقطع</option>
                          </Select>
                        </FormControl>
                      </SimpleGrid>

                      <FormControl>
                        <FormLabel fontSize="sm">Padding عمودي (px)</FormLabel>
                        <Slider
                          value={Number(t.button_padding_y) || 12}
                          min={6}
                          max={28}
                          step={1}
                          onChange={(v) => patchTheme({ button_padding_y: String(v) })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t.button_padding_y}px
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">نصف قطر الزوايا (px)</FormLabel>
                        <Slider
                          value={Number(t.button_radius_px) || 14}
                          min={0}
                          max={32}
                          step={1}
                          onChange={(v) => patchTheme({ button_radius_px: String(v) })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">مستوى الظل</FormLabel>
                        <Slider
                          value={Number(t.button_shadow_level) || 0}
                          min={0}
                          max={4}
                          step={1}
                          onChange={(v) => patchTheme({ button_shadow_level: String(v) })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">حركة عند المرور</FormLabel>
                        <Select
                          borderRadius="lg"
                          value={t.button_hover_animation}
                          onChange={(e) => patchTheme({ button_hover_animation: e.target.value })}
                        >
                          <option value="lift">رفع خفيف</option>
                          <option value="glow">توهج</option>
                          <option value="none">بدون</option>
                        </Select>
                      </FormControl>
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={6}>
                      <FormControl>
                        <FormLabel fontWeight="700">نوع الخلفية</FormLabel>
                        <Select
                          borderRadius="lg"
                          value={t.page_bg_type}
                          onChange={(e) => patchTheme({ page_bg_type: e.target.value })}
                        >
                          <option value="solid">لون صلب</option>
                          <option value="gradient">تدرج</option>
                          <option value="image">صورة</option>
                          <option value="pattern">نمط</option>
                          <option value="video">فيديو</option>
                        </Select>
                      </FormControl>

                      {(t.page_bg_type === "gradient" || t.page_bg_type === "solid") && (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <ColorField
                            label="لون تدرج 1"
                            value={t.gradient_color_1}
                            onChange={(v) => patchTheme({ gradient_color_1: v })}
                            toast={toast}
                          />
                          <ColorField
                            label="لون تدرج 2"
                            value={t.gradient_color_2}
                            onChange={(v) => patchTheme({ gradient_color_2: v })}
                            toast={toast}
                          />
                          <FormControl gridColumn={{ md: "1 / -1" }}>
                            <FormLabel fontSize="sm">زاوية التدرج (درجة)</FormLabel>
                            <Slider
                              value={Number(t.gradient_angle) || 135}
                              min={0}
                              max={360}
                              step={5}
                              onChange={(v) => patchTheme({ gradient_angle: String(v) })}
                            >
                              <SliderTrack>
                                <SliderFilledTrack />
                              </SliderTrack>
                              <SliderThumb />
                            </Slider>
                          </FormControl>
                        </SimpleGrid>
                      )}

                      {t.page_bg_type === "image" && (
                        <>
                          <FormControl>
                            <FormLabel fontSize="sm">رابط الصورة</FormLabel>
                            <Input
                              dir="ltr"
                              borderRadius="lg"
                              value={t.page_bg_image_url}
                              onChange={(e) => patchTheme({ page_bg_image_url: e.target.value })}
                              placeholder="https://..."
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">Blur (px)</FormLabel>
                            <Slider
                              value={Number(t.page_bg_blur) || 0}
                              min={0}
                              max={24}
                              step={1}
                              onChange={(v) => patchTheme({ page_bg_blur: String(v) })}
                            >
                              <SliderTrack>
                                <SliderFilledTrack />
                              </SliderTrack>
                              <SliderThumb />
                            </Slider>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">شفافية الطبقة (0–1)</FormLabel>
                            <Slider
                              value={Number(t.page_bg_overlay) * 100 || 35}
                              min={0}
                              max={100}
                              step={5}
                              onChange={(v) => patchTheme({ page_bg_overlay: String(v / 100) })}
                            >
                              <SliderTrack>
                                <SliderFilledTrack />
                              </SliderTrack>
                              <SliderThumb />
                            </Slider>
                          </FormControl>
                        </>
                      )}

                      {t.page_bg_type === "pattern" && (
                        <FormControl>
                          <FormLabel fontSize="sm">معرّف النمط</FormLabel>
                          <Select
                            borderRadius="lg"
                            value={t.page_bg_pattern_id}
                            onChange={(e) => patchTheme({ page_bg_pattern_id: e.target.value })}
                          >
                            <option value="none">بدون</option>
                            <option value="dots">نقاط</option>
                            <option value="grid">شبكة</option>
                            <option value="noise">ضجيج ناعم</option>
                          </Select>
                          <FormHelperText>يُخزَّن كقيمة؛ يمكن للواجهة الأمامية ربطه بـ CSS.</FormHelperText>
                        </FormControl>
                      )}

                      {t.page_bg_type === "video" && (
                        <FormControl>
                          <FormLabel fontSize="sm">رابط الفيديو (خلفية)</FormLabel>
                          <Input
                            dir="ltr"
                            borderRadius="lg"
                            value={t.page_bg_video_url}
                            onChange={(e) => patchTheme({ page_bg_video_url: e.target.value })}
                            placeholder="رابط ملف فيديو أو استضافة"
                          />
                        </FormControl>
                      )}
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={6}>
                      <FormControl>
                        <FormLabel fontSize="sm">عرض المحتوى الأقصى</FormLabel>
                        <Input
                          dir="ltr"
                          value={t.layout_max_width}
                          onChange={(e) => patchTheme({ layout_max_width: e.target.value })}
                          borderRadius="lg"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">محاذاة المحتوى</FormLabel>
                        <Select
                          borderRadius="lg"
                          value={t.layout_content_align}
                          onChange={(e) => patchTheme({ layout_content_align: e.target.value })}
                        >
                          <option value="start">بداية</option>
                          <option value="center">وسط</option>
                          <option value="end">نهاية</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">ارتفاع قسم الهيرو (px)</FormLabel>
                        <Slider
                          value={Number(t.hero_min_height) || 520}
                          min={320}
                          max={720}
                          step={10}
                          onChange={(v) => patchTheme({ hero_min_height: String(v) })}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </FormControl>
                      <SimpleGrid columns={2} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">حشوة القسم (px)</FormLabel>
                          <NumberInput
                            value={t.layout_section_padding}
                            min={0}
                            max={120}
                            onChange={(_, v) => patchTheme({ layout_section_padding: String(v) })}
                          >
                            <NumberInputField borderRadius="lg" />
                          </NumberInput>
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm">هامش القسم (px)</FormLabel>
                          <NumberInput
                            value={t.layout_section_margin}
                            min={0}
                            max={80}
                            onChange={(_, v) => patchTheme({ layout_section_margin: String(v) })}
                          >
                            <NumberInputField borderRadius="lg" />
                          </NumberInput>
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={4}>
                      {[
                        ["title", "العنوان الرئيسي", "مثال: تعلّم معنا"],
                        ["subtitle", "العنوان الفرعي", ""],
                        ["description", "النص التعريفي", ""],
                        ["image_url", "رابط صورة الهيرو", ""],
                        ["cta_label", "نص الزر الرئيسي", ""],
                        ["cta_href", "وجهة الزر", ""],
                      ].map(([key, label, ph]) => (
                        <FormControl key={key}>
                          <FormLabel fontSize="sm">{label}</FormLabel>
                          {key === "description" ? (
                            <Textarea
                              borderRadius="lg"
                              rows={3}
                              placeholder={ph}
                              value={hero[key] || ""}
                              onChange={(e) => setHero(key, e.target.value)}
                              isDisabled={key === "image_url" && heroImageLocked}
                            />
                          ) : (
                            <Input
                              borderRadius="lg"
                              placeholder={ph}
                              value={hero[key] || ""}
                              onChange={(e) => setHero(key, e.target.value)}
                              dir={key.includes("url") || key.includes("href") ? "ltr" : undefined}
                              isDisabled={key === "image_url" && heroImageLocked}
                            />
                          )}
                        </FormControl>
                      ))}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem order={{ base: 1, xl: 2 }}>
          <Box position={{ base: "relative", xl: "sticky" }} top={{ xl: "24px" }} zIndex={5}>
            <HStack mb={3} spacing={2}>
              <Icon as={FaEye} color="blue.500" />
              <Text fontWeight="800" fontSize="sm" letterSpacing="-0.02em">
                معاينة حية
              </Text>
              <Badge colorScheme="green" borderRadius="full" fontSize="10px">
                STICKY
              </Badge>
            </HStack>
            <AnimatePresence mode="wait">
              <LivePreviewFrame key={JSON.stringify(t) + JSON.stringify(hero)} theme={t} hero={hero} />
            </AnimatePresence>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
