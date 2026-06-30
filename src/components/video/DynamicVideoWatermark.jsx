import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";

const POSITIONS = [
  { top: "8%", left: "6%" },
  { top: "12%", right: "8%" },
  { bottom: "18%", left: "10%" },
  { bottom: "22%", right: "6%" },
  { top: "42%", left: "28%" },
  { top: "55%", right: "22%" },
];

export default function DynamicVideoWatermark({ profile, overlay }) {
  const [posIndex, setPosIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPosIndex((i) => (i + 1) % POSITIONS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const pos = POSITIONS[posIndex];
  const lines = [
    profile?.name,
    profile?.email,
    profile?.ip && profile.ip !== "—" ? `IP: ${profile.ip}` : null,
    profile?.viewId ? `ID: ${String(profile.viewId).slice(0, 12)}` : null,
    profile?.time,
  ].filter(Boolean);

  return (
    <Box
      position="absolute"
      inset={0}
      pointerEvents="none"
      zIndex={20}
      overflow="hidden"
      opacity={overlay ? 0.95 : 1}
    >
      <Box
        position="absolute"
        {...pos}
        px={3}
        py={2}
        borderRadius="md"
        bg="blackAlpha.500"
        borderWidth="1px"
        borderColor="whiteAlpha.300"
        transform="rotate(-12deg)"
        transition="all 0.8s ease-in-out"
        maxW="70%"
      >
        {lines.map((line) => (
          <Text
            key={line}
            fontSize="xs"
            fontWeight="bold"
            color="whiteAlpha.900"
            lineHeight="short"
            userSelect="none"
            fontFamily="'Cairo', 'Tajawal', sans-serif"
          >
            {line}
          </Text>
        ))}
      </Box>

      {/* طبقة شبكة خفيفة لردع التسجيل */}
      <Box
        position="absolute"
        inset={0}
        opacity={0.04}
        backgroundImage="repeating-linear-gradient(45deg, white 0, white 1px, transparent 1px, transparent 12px)"
      />
    </Box>
  );
}
