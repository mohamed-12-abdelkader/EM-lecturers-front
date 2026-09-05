import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  Icon,
  useColorModeValue,
  Container,
  Button,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import SecureVideoPlayer from "../../components/video/SecureVideoPlayer";
import VideoQualityMenu from "../../components/video/VideoQualityMenu";
import {
  fetchSecurePlayback,
  sendPlaybackHeartbeat,
} from "../../api/videoSecurityApi";

const MotionBox = motion(Box);

const HEARTBEAT_MS = 30000;

/** في التطوير أو على localhost / *.localhost يُسمح بـ HTTP للتجربة */
function isPlaybackContextAllowed() {
  if (typeof window === "undefined") return true;
  if (window.location.protocol === "https:") return true;
  if (import.meta.env.DEV) return true;

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (host.endsWith(".localhost")) return true;

  return false;
}

const Video = () => {
  const { videoId, token: urlToken } = useParams();
  const navigate = useNavigate();

  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState(null);
  const videoElRef = useRef(null);
  const qualitySetterRef = useRef(null);

  const mainBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const shadow = useColorModeValue("xl", "dark-lg");
  const playerBg = useColorModeValue("black", "gray.900");

  const getToken = useCallback(() => {
    if (urlToken) return decodeURIComponent(urlToken);
    return localStorage.getItem("token") || "";
  }, [urlToken]);

  const authToken = getToken();

  useEffect(() => {
    if (!isPlaybackContextAllowed()) {
      setError("يجب فتح الفيديو عبر HTTPS لأسباب أمنية.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        if (!authToken) {
          setError("لم يتم العثور على رمز الوصول. يرجى تسجيل الدخول.");
          return;
        }
        const data = await fetchSecurePlayback(videoId, authToken);
        setPlayback(data);
        setError("");
      } catch (err) {
        console.error("خطأ في جلب التشغيل:", err);
        setError(err?.response?.data?.message || "حدث خطأ في تحميل الفيديو");
      } finally {
        setLoading(false);
      }
    };

    if (videoId) load();
    setQuality(null);
    qualitySetterRef.current = null;
  }, [videoId, authToken]);

  useEffect(() => {
    if (!playback?.sessionId || !videoId) return undefined;

    const tick = () => {
      const video = videoElRef.current;
      sendPlaybackHeartbeat(videoId, playback.sessionId, authToken, {
        current_time: video?.currentTime ?? 0,
        paused: video?.paused ?? true,
      });
    };

    tick();
    const id = window.setInterval(tick, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [playback?.sessionId, videoId, authToken]);

  const onPlayerReady = useCallback((_player, videoEl) => {
    if (videoEl) videoElRef.current = videoEl;
  }, []);

  const onQualityReady = useCallback((nextQuality) => {
    qualitySetterRef.current = nextQuality?.setQuality || null;
    setQuality(
      nextQuality
        ? { options: nextQuality.options, value: nextQuality.value ?? 0 }
        : null,
    );
  }, []);

  const onQualityChange = useCallback((value) => {
    qualitySetterRef.current?.(value);
    setQuality((current) => (current ? { ...current, value } : current));
  }, []);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={mainBg} pt={{ base: "80px", md: "100px" }}>
        <VStack spacing={6}>
          <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" emptyColor="gray.200" />
          <Text fontWeight="bold" color="blue.500" fontSize="lg">
            جاري تحميل الفيديو...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={mainBg} pt={{ base: "80px", md: "100px" }} px={4}>
        <VStack spacing={6} bg={cardBg} p={10} borderRadius="2xl" shadow={shadow} border="1px dashed" borderColor="red.200" maxW="md" textAlign="center">
          <Icon as={FaExclamationTriangle} boxSize={12} color="red.400" />
          <VStack spacing={2}>
            <Heading size="md" color="red.500">تعذر تشغيل الفيديو</Heading>
            <Text color="gray.500">{error}</Text>
          </VStack>
          <Button colorScheme="red" onClick={() => navigate(-1)} rightIcon={<FaArrowRight />} borderRadius="xl">
            العودة
          </Button>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={mainBg}
      pt={{ base: "100px", md: "120px" }}
      pb="40px"
      px={{ base: 4, md: 8 }}
    >
      <Container maxW="container.xl" p={0}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          bg={cardBg}
          borderRadius={{ base: "xl", md: "3xl" }}
          shadow={shadow}
          overflow="hidden"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Flex px={{ base: 4, md: 8 }} py={4} align="center" justify="space-between" flexWrap="wrap" gap={3}>
            <HStack spacing={3} flexWrap="wrap">
              <Text fontSize="sm" color="gray.500">
                مشغل الفيديو
              </Text>
              <VideoQualityMenu
                options={quality?.options}
                value={quality?.value}
                onChange={onQualityChange}
              />
              {playback?.streamType === "bunny" ? (
                <Text fontSize="xs" color="gray.500">
                  غيّر الجودة من إعدادات مشغل الفيديو
                </Text>
              ) : null}
            </HStack>
            <Button size="md" colorScheme="blue" onClick={() => navigate(-1)} rightIcon={<FaArrowRight />}>
              العودة للدرس
            </Button>
          </Flex>

          {!playback ? (
            <Box px={{ base: 4, md: 8 }} pb={8}>
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <AlertTitle fontSize="md">لا توجد بيانات تشغيل</AlertTitle>
                <AlertDescription fontSize="sm">أعد تحميل الصفحة أو حاول لاحقاً.</AlertDescription>
              </Alert>
            </Box>
          ) : (
            <Box position="relative" p={{ base: 0, md: 6 }} bg={playerBg}>
              <Box position="relative" maxW="1100px" mx="auto" borderRadius={{ base: "none", md: "2xl" }} overflow="hidden">
                <SecureVideoPlayer
                  playback={playback}
                  authToken={authToken}
                  onPlayerReady={onPlayerReady}
                  onQualityReady={onQualityReady}
                />
              </Box>
            </Box>
          )}
        </MotionBox>
      </Container>
      <ScrollToTop />
    </Box>
  );
};

export default Video;
