import React from "react";
import { Box, Flex, Image, Text, useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import useBrandLoading from "./useBrandLoading";

const LOADING_HERO = "/images/brand-loading-hero.png";

/**
 * شاشة تحميل بالبراند.
 *
 * - الاستخدام العادي (`return <BrandLoadingScreen />`): يفعّل الـ overlay الموحّد ولا يُرندر DOM محلي.
 * - `overlay`: للـ host فقط — يُرندر واجهة التحميل فعلياً.
 *
 * @param {Object} props
 * @param {boolean} [props.overlay] - عرض الواجهة (Host).
 * @param {number} [props.progress] - 0–1 لشريط تقدم محدد.
 */
export default function BrandLoadingScreen({ overlay = false, progress }) {
  useBrandLoading(!overlay);

  if (!overlay) return null;
  return <BrandLoadingScreenView progress={progress} />;
}

function BrandLoadingScreenView({ progress }) {
  const hasDeterminate = typeof progress === "number";
  const screenBg = useColorModeValue("white", "gray.900");
  const subText = useColorModeValue("gray.500", "gray.400");
  const trackBg = useColorModeValue("blue.50", "whiteAlpha.200");
  /** يُخفي الخلفية السوداء المدمجة في ملف PNG على الخلفية الفاتحة */
  const heroBlend = useColorModeValue("screen", "normal");

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={9998}
      justify="center"
      align="center"
      direction="column"
      bg={screenBg}
      px={8}
    >
      <Box
        h="1"
        w="full"
        position="absolute"
        top={0}
        left={0}
        right={0}
        bgGradient="linear(to-r, blue.500, orange.500)"
      />

      <motion.div
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        initial={{ opacity: 0.85, scale: 0.96 }}
        animate={{
          opacity: [0.88, 1, 0.88],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Box
          boxSize={{ base: "220px", sm: "260px", md: "300px" }}
          borderRadius="50%"
          overflow="hidden"
          mb={4}
        >
          <Image
            src={LOADING_HERO}
            alt="جاري التحميل"
            w="full"
            h="full"
            objectFit="cover"
            draggable={false}
            userSelect="none"
            bg="transparent"
            mixBlendMode={heroBlend}
          />
        </Box>

        <Text fontSize="sm" fontWeight="semibold" color={subText} mb={6}>
          جاري التحميل…
        </Text>
      </motion.div>

      <Box
        w="full"
        maxW="280px"
        h="4px"
        borderRadius="full"
        bg={trackBg}
        overflow="hidden"
        position="relative"
      >
        {hasDeterminate ? (
          <Box
            h="full"
            w={`${Math.min(100, Math.max(0, progress * 100))}%`}
            bgGradient="linear(to-r, blue.500, orange.500)"
            borderRadius="full"
            transition="width 0.3s ease"
          />
        ) : (
          <IndeterminateBar />
        )}
      </Box>
    </Flex>
  );
}

function IndeterminateBar() {
  return (
    <motion.div
      style={{
        height: "100%",
        width: "40%",
        borderRadius: "9999px",
        background: "linear-gradient(to right, #3182CE, #ED8936)",
        position: "absolute",
        top: 0,
      }}
      animate={{ left: ["0%", "60%"] }}
      transition={{
        repeat: Infinity,
        duration: 1.2,
        ease: "easeInOut",
      }}
    />
  );
}
