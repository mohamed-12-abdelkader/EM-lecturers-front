import {
  Box,
  Button,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { FaExternalLinkAlt, FaVideo } from "react-icons/fa";
import { getYouTubeEmbedUrl, isYouTubeUrl } from "../../utils/youtubeEmbed";

/**
 * يحوّل روابط Bunny Stream إلى رابط embed صالح للـ iframe.
 * أمثلة مدعومة:
 * - https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 * - https://iframe.mediadelivery.net/play/{libraryId}/{videoId}
 * - https://video.bunnycdn.com/play/{libraryId}/{videoId}
 * - أي رابط يحتوي embed|play / libraryId / guid
 */
export function getBunnyEmbedSrc(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  const asEmbed = (libraryId, videoId) =>
    `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&preload=true&responsive=true`;

  if (trimmed.includes("iframe.mediadelivery.net/embed/")) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set("autoplay", "true");
      u.searchParams.set("preload", "true");
      u.searchParams.set("responsive", "true");
      return u.toString();
    } catch {
      return trimmed.includes("?")
        ? `${trimmed}&autoplay=true`
        : `${trimmed}?autoplay=true&preload=true&responsive=true`;
    }
  }

  const embedMatch = trimmed.match(
    /(?:iframe\.mediadelivery\.net|mediadelivery\.net)\/(?:embed|play)\/([^/]+)\/([^/?#]+)/i,
  );
  if (embedMatch) return asEmbed(embedMatch[1], embedMatch[2]);

  const playMatch = trimmed.match(
    /video\.bunnycdn\.com\/play\/([^/]+)\/([^/?#]+)/i,
  );
  if (playMatch) return asEmbed(playMatch[1], playMatch[2]);

  const pathMatch = trimmed.match(/\/(?:embed|play)\/([^/]+)\/([^/?#]+)/i);
  if (pathMatch && /mediadelivery|bunny/i.test(trimmed)) {
    return asEmbed(pathMatch[1], pathMatch[2]);
  }

  const guidMatch = trimmed.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i);
  const libraryMatch = trimmed.match(/library[/=](\d+)/i);
  if (guidMatch && libraryMatch) return asEmbed(libraryMatch[1], guidMatch[1]);

  return null;
}

function isDirectMediaUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /\.(mp4|webm|ogg|m3u8)(\?|#|$)/i.test(url.trim());
}

function resolvePlayback(url) {
  if (!url) return { type: "unknown", src: null };

  if (isYouTubeUrl(url) || /youtube\.com|youtu\.be/i.test(url)) {
    const src = getYouTubeEmbedUrl(url, {
      enablejsapi: 1,
      playsinline: 1,
      modestbranding: 1,
      controls: 1,
      rel: 0,
      autoplay: 1,
    });
    return { type: "youtube", src };
  }

  const bunnySrc = getBunnyEmbedSrc(url);
  if (bunnySrc) return { type: "bunny", src: bunnySrc };

  if (isDirectMediaUrl(url)) return { type: "media", src: url.trim() };

  if (/^https?:\/\//i.test(url)) {
    // روابط خارجية غير معروفة: جرّب iframe، مع رابط فتح خارجي كاحتياطي
    return { type: "external", src: url.trim() };
  }

  return { type: "unknown", src: null };
}

export default function MeetingRecordingPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  title = "تسجيل المحاضرة",
}) {
  const [loading, setLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const videoRef = useRef(null);
  const bg = useColorModeValue("black", "black");
  const playback = useMemo(() => resolvePlayback(videoUrl), [videoUrl]);

  useEffect(() => {
    if (!isOpen) return undefined;
    setLoading(true);
    setMediaError(false);

    // لو onLoad ما اشتغلش (بعض المتصفحات مع iframe عبر النطاقات)
    const t = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(t);
  }, [isOpen, videoUrl]);

  useEffect(() => {
    if (!isOpen || playback.type !== "media") return undefined;
    const el = videoRef.current;
    if (!el) return undefined;
    const tryPlay = async () => {
      try {
        await el.play();
      } catch {
        // المتصفح قد يمنع autoplay — المستخدم يشغّل يدوياً
      } finally {
        setLoading(false);
      }
    };
    tryPlay();
    return undefined;
  }, [isOpen, playback.type, playback.src]);

  const markReady = () => setLoading(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      scrollBehavior="inside"
      isCentered
      // مهم: focus trap يمنع التفاعل مع iframe الفيديو داخل المودال
      trapFocus={false}
      blockScrollOnMount
      closeOnOverlayClick
    >
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent borderRadius="2xl" overflow="hidden" mx={3} bg="gray.900">
        <ModalHeader
          dir="rtl"
          display="flex"
          alignItems="center"
          gap={2}
          py={4}
          color="white"
        >
          <Icon as={FaVideo} color="blue.300" />
          <Text noOfLines={1} flex="1">
            {title}
          </Text>
          {playback.src ? (
            <Button
              as="a"
              href={videoUrl || playback.src}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              leftIcon={<FaExternalLinkAlt />}
              fontWeight="700"
            >
              فتح خارجي
            </Button>
          ) : null}
        </ModalHeader>
        <ModalCloseButton left={3} right="auto" color="white" />
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
              <Center
                position="absolute"
                inset={0}
                zIndex={2}
                pointerEvents="none"
                bg="blackAlpha.400"
              >
                <Spinner size="lg" color="blue.300" thickness="3px" />
              </Center>
            ) : null}

            {playback.type === "media" && playback.src ? (
              <video
                key={playback.src}
                ref={videoRef}
                src={playback.src}
                controls
                playsInline
                preload="auto"
                onLoadedData={markReady}
                onCanPlay={markReady}
                onError={() => {
                  setMediaError(true);
                  setLoading(false);
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "#000",
                  position: "absolute",
                  inset: 0,
                }}
              />
            ) : null}

            {(playback.type === "bunny" ||
              playback.type === "youtube" ||
              playback.type === "external") &&
            playback.src ? (
              <iframe
                key={playback.src}
                src={playback.src}
                title={title}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="origin"
                loading="eager"
                onLoad={markReady}
              />
            ) : null}

            {(!playback.src || mediaError) && !loading ? (
              <Center h="full" px={6} textAlign="center" dir="rtl">
                <Box>
                  <Text color="gray.300" fontSize="sm" mb={3}>
                    {mediaError
                      ? "تعذّر تشغيل الملف مباشرة."
                      : "تعذّر تضمين التسجيل في الصفحة."}
                  </Text>
                  {videoUrl ? (
                    <Button
                      as="a"
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      colorScheme="blue"
                      leftIcon={<FaExternalLinkAlt />}
                      borderRadius="lg"
                    >
                      فتح رابط التسجيل
                    </Button>
                  ) : null}
                </Box>
              </Center>
            ) : null}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
