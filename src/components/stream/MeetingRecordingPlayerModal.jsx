import {
  Box,
  Center,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useMemo, useState, useEffect } from "react";
import { FaVideo } from "react-icons/fa";
import { getYouTubeEmbedUrl, isYouTubeUrl } from "../../utils/youtubeEmbed";

function getBunnyEmbedSrc(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.includes("iframe.mediadelivery.net/embed/")) {
    return trimmed.includes("?") ? trimmed : `${trimmed}?autoplay=false&preload=true`;
  }
  const match = trimmed.match(/embed\/([^/]+)\/([^/?#]+)/);
  if (match) {
    return `https://iframe.mediadelivery.net/embed/${match[1]}/${match[2]}?autoplay=false&preload=true`;
  }
  const guidMatch = trimmed.match(/\/([0-9a-f-]{36})(?:[/?#]|$)/i);
  const libraryMatch = trimmed.match(/library\/(\d+)/i);
  if (guidMatch && libraryMatch) {
    return `https://iframe.mediadelivery.net/embed/${libraryMatch[1]}/${guidMatch[1]}?autoplay=false&preload=true`;
  }
  return null;
}

function resolvePlayback(url) {
  if (!url) return { type: "unknown", embedSrc: null };
  if (isYouTubeUrl(url) || url.includes("youtube.com") || url.includes("youtu.be")) {
    const embedSrc = getYouTubeEmbedUrl(url, {
      enablejsapi: 1,
      playsinline: 1,
      modestbranding: 1,
      controls: 1,
      rel: 0,
    });
    return { type: "youtube", embedSrc };
  }
  const bunnySrc = getBunnyEmbedSrc(url);
  if (bunnySrc) return { type: "bunny", embedSrc: bunnySrc };
  if (/^https?:\/\//i.test(url)) return { type: "external", embedSrc: url };
  return { type: "unknown", embedSrc: null };
}

export default function MeetingRecordingPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  title = "تسجيل المحاضرة",
}) {
  const [loading, setLoading] = useState(true);
  const bg = useColorModeValue("gray.50", "gray.900");
  const playback = useMemo(() => resolvePlayback(videoUrl), [videoUrl]);

  useEffect(() => {
    if (isOpen) setLoading(true);
  }, [isOpen, videoUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" overflow="hidden" mx={3}>
        <ModalHeader dir="rtl" display="flex" alignItems="center" gap={2} py={4}>
          <Icon as={FaVideo} color="blue.500" />
          <Text noOfLines={1}>{title}</Text>
        </ModalHeader>
        <ModalCloseButton left={3} right="auto" />
        <ModalBody pb={6} pt={0} px={{ base: 3, md: 5 }}>
          <Box
            position="relative"
            w="full"
            bg={bg}
            borderRadius="xl"
            overflow="hidden"
            sx={{ aspectRatio: "16 / 9" }}
          >
            {loading ? (
              <Center position="absolute" inset={0} zIndex={1}>
                <Spinner size="lg" color="blue.400" thickness="3px" />
              </Center>
            ) : null}

            {playback.embedSrc ? (
              <Box
                as="iframe"
                src={playback.embedSrc}
                title={title}
                w="full"
                h="full"
                border="0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                onLoad={() => setLoading(false)}
              />
            ) : (
              <Center h="full" px={6} textAlign="center" dir="rtl">
                <Text color="gray.500" fontSize="sm">
                  تعذّر تشغيل التسجيل. قد يكون لا يزال قيد المعالجة — حاول لاحقاً.
                </Text>
              </Center>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
