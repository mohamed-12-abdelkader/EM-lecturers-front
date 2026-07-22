import React, { useEffect, useState } from "react";
import { Box, Flex, Image, useColorModeValue } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { fetchTenantPublic } from "../../api/tenantPublicApi";
import {
  readCachedTenantBrandLogo,
  readDocumentTenantIcon,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";

const BRAND_LOGO = "/Picsart_25-08-26_23-28-39-014.png";

/**
 * شاشة تحميل بالبراند: لوجو في المنتصف + انيميشن انتظار + شريط تقدم تحت اللوجو.
 * على subdomain المدرس يعرض لوجو المدرس (favicon / avatar)، وإلا لوجو الشركة.
 *
 * @param {Object} props
 * @param {number} [props.progress] - اختياري: رقم 0–1 لشريط تحميل محدد؛ بدونه الشريط indeterminate (متحرك).
 */
export default function BrandLoadingScreen({ progress }) {
  const hasDeterminate = typeof progress === "number";
  const trackBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const screenBg = useColorModeValue("white", "gray.900");
  const tenantSubdomain = getTenantSubdomain();

  const [logoSrc, setLogoSrc] = useState(() => {
    if (!tenantSubdomain) return BRAND_LOGO;
    return (
      readCachedTenantBrandLogo(tenantSubdomain) ||
      readDocumentTenantIcon() ||
      null
    );
  });
  const [logoAlt, setLogoAlt] = useState(
    tenantSubdomain ? tenantSubdomain : "EM Lectures",
  );

  useEffect(() => {
    if (!tenantSubdomain) {
      setLogoSrc(BRAND_LOGO);
      setLogoAlt("EM Lectures");
      return undefined;
    }

    // Instant from cache / current favicon while fetch runs
    const instant =
      readCachedTenantBrandLogo(tenantSubdomain) || readDocumentTenantIcon();
    if (instant) setLogoSrc(instant);

    let cancelled = false;
    fetchTenantPublic(tenantSubdomain)
      .then((res) => {
        if (cancelled) return;
        const tenant = res?.data?.tenant;
        const teacher = res?.data?.teacher;
        const icon = resolveTenantBrandLogo(tenant, teacher);
        // Never fall back to company logo on a teacher platform
        if (icon) setLogoSrc(icon);
        setLogoAlt(
          teacher?.name ||
            tenant?.display_name ||
            tenantSubdomain ||
            "EM Lectures",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLogoAlt(tenantSubdomain || "EM Lectures");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSubdomain]);

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
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={logoAlt}
            maxH={{ base: "140px", md: "180px" }}
            w="auto"
            objectFit="contain"
            mb={8}
          />
        ) : (
          <Box
            mb={8}
            h={{ base: "100px", md: "120px" }}
            w={{ base: "100px", md: "120px" }}
            borderRadius="2xl"
            bgGradient="linear(to-br, blue.400, orange.400)"
            opacity={0.85}
          />
        )}
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
