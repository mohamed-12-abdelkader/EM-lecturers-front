import React from "react";
import { Box, Flex, Image, useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import logoImg from "../../img/next logo.png";

/**
 * شاشة تحميل بالبراند: لوجو في المنتصف + انيميشن انتظار + شريط تقدم تحت اللوجو.
 * استخدمها كشاشة كاملة أو داخل Container بـ flex: 1.
 *
 * @param {Object} props
 * @param {number} [props.progress] - اختياري: رقم 0–1 لشريط تحميل محدد؛ بدونه الشريط indeterminate (متحرك).
 */
export default function BrandLoadingScreen({ progress }) {
  const hasDeterminate = typeof progress === "number";
  const trackBg = useColorModeValue("blue.50", "whiteAlpha.100");

  const NAVBAR_HEIGHT = 72;

  return (
    <Flex
      position="fixed"
      top={`${NAVBAR_HEIGHT}px`}
      left={0}
      right={0}
      bottom={0}
      zIndex={900}
      justify="center"
      align="center"
      direction="column"
      bg={useColorModeValue("white", "gray.900")}
      px={8}
    >
      <Box h="1" w="full" position="absolute" top={0} left={0} right={0} bgGradient="linear(to-r, blue.500, orange.500)" />
      <motion.div
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        initial={{ opacity: 0.9, scale: 1 }}
        animate={{
          opacity: [0.9, 1, 0.9],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src={logoImg}
          alt="Next Edu School"
          maxH={{ base: "100px", md: "120px" }}
          w="auto"
          objectFit="contain"
          mb={8}
        />
      </motion.div>

      <Box w="full" maxW="280px" h="4px" borderRadius="full" bg={trackBg} overflow="hidden" position="relative">
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
