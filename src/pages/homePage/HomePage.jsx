import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Heading,
  Icon,
  Text,
  Flex,
  Input,
  useBreakpointValue,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Avatar,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Card,
  CardBody,
  Container,
  Spinner,
  Skeleton,
  useToast,
  IconButton,
  Select,
  Center,
} from "@chakra-ui/react";
import {
  FaTrophy,
  FaBookOpen,
  FaLightbulb,
  FaRocket,
  FaQrcode,
  FaCamera,
  FaGift,
  FaBell,
  FaChevronLeft,
  FaChalkboardTeacher,
  FaUser,
  FaComments,
  FaTimes,
  FaRobot,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import UserType from "../../Hooks/auth/userType";
import baseUrl from "../../api/baseUrl";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { getSocketEndpoint } from "../../utils/socketEndpoint";
import { Html5Qrcode } from "html5-qrcode";
import { io } from "socket.io-client";
import { Howl } from "howler";
import MyCourses from "../../components/courses/MyCourses";
import MyTeacher from "../myTeacher/MyTeacher";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import ScientificChatPanel from "../../components/scientificChat/ScientificChatPanel";
import HomeProHero from "./components/HomeProHero";
import HomeProStats from "./components/HomeProStats";
import HomeProQuickActions from "./components/HomeProQuickActions";

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const ENABLE_GRADE_FEED = false;
const ENABLE_GAME_INVITATIONS = false;
const LIVE_STREAM_POLL_MS = 12000;
const SUPPORT_CHAT_SOUND_DATA_URI =
  "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YTAAAAAAgICAgP///wAAAP///4CAgIAAAP///wAAAIKCgoKCgoIAAA==";

const isCourseFree = (course) => {
  const price = Number(course?.price);
  return course?.is_free === true || (!Number.isNaN(price) && price <= 0);
};

const HomePage = () => {
  // --- Logic & State (Preserved) ---
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const { isOpen, onOpen, onClose } = useDisclosure(); // For course activation modal
  const invitationModal = useDisclosure(); // For game invite
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [userData] = UserType();
  const navigate = useNavigate();
  const location = useLocation();

  // Notifications & Feed
  const [competitionNotifications, setCompetitionNotifications] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [liveBannerNotification, setLiveBannerNotification] = useState(null);
  const liveLastTopIdRef = useRef(null);
  const liveInitializedRef = useRef(false);

  // QR Scanner
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [activationResult, setActivationResult] = useState(null);
  const [selectedCourseForActivation, setSelectedCourseForActivation] = useState(null);
  const [activationCode, setActivationCode] = useState("");
  const [isActivatingCode, setIsActivatingCode] = useState(false);
  const [activatingFreeCourseId, setActivatingFreeCourseId] = useState(null);
  const supportChatModal = useDisclosure();
  const [supportChatCourseId, setSupportChatCourseId] = useState("");
  const token = localStorage.getItem("token");
  const supportSentSoundRef = useRef(null);
  const supportReceivedSoundRef = useRef(null);

  const [coursesLoading, setCoursesLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const sectionsLoading = coursesLoading || teachersLoading;
  const [teacherDisplayName, setTeacherDisplayName] = useState("");
  const [teacherAvatar, setTeacherAvatar] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    }),
    [],
  );
  const toast = useToast();
  const tenantSubdomain = getTenantSubdomain();

  // Socket & Invites
  const [latestInvitation, setLatestInvitation] = useState(null);
  const socketRef = useRef(null);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const playChatOpenSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.32, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      // New stronger, clearer "triple chime" signature
      const oscA = audioCtx.createOscillator();
      const gainA = audioCtx.createGain();
      oscA.type = "sawtooth";
      oscA.frequency.setValueAtTime(660, audioCtx.currentTime);
      oscA.frequency.exponentialRampToValueAtTime(920, audioCtx.currentTime + 0.12);
      gainA.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainA.gain.exponentialRampToValueAtTime(1.2, audioCtx.currentTime + 0.03);
      gainA.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);
      oscA.connect(gainA);
      gainA.connect(masterGain);
      oscA.start(audioCtx.currentTime);
      oscA.stop(audioCtx.currentTime + 0.17);

      const oscB = audioCtx.createOscillator();
      const gainB = audioCtx.createGain();
      oscB.type = "square";
      oscB.frequency.setValueAtTime(1040, audioCtx.currentTime + 0.11);
      oscB.frequency.exponentialRampToValueAtTime(1420, audioCtx.currentTime + 0.25);
      gainB.gain.setValueAtTime(0.0001, audioCtx.currentTime + 0.11);
      gainB.gain.exponentialRampToValueAtTime(1.05, audioCtx.currentTime + 0.15);
      gainB.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
      oscB.connect(gainB);
      gainB.connect(masterGain);
      oscB.start(audioCtx.currentTime + 0.11);
      oscB.stop(audioCtx.currentTime + 0.31);

      const oscC = audioCtx.createOscillator();
      const gainC = audioCtx.createGain();
      oscC.type = "triangle";
      oscC.frequency.setValueAtTime(1360, audioCtx.currentTime + 0.22);
      oscC.frequency.exponentialRampToValueAtTime(1820, audioCtx.currentTime + 0.4);
      gainC.gain.setValueAtTime(0.0001, audioCtx.currentTime + 0.22);
      gainC.gain.exponentialRampToValueAtTime(0.95, audioCtx.currentTime + 0.27);
      gainC.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.46);
      oscC.connect(gainC);
      gainC.connect(masterGain);
      oscC.start(audioCtx.currentTime + 0.22);
      oscC.stop(audioCtx.currentTime + 0.47);

      setTimeout(() => {
        audioCtx.close();
      }, 620);
    } catch (e) {
      // Fallback beep in case WebAudio is blocked.
      try {
        const fallbackAudio = new Audio(
          "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YTAAAAAAgICAgP///wAAAP///4CAgIAAAP///wAAAIKCgoKCgoIAAA=="
        );
        fallbackAudio.volume = 1;
        fallbackAudio.play().catch(() => {});
      } catch {
        // ignore completely
      }
    }
  };

  const playLiveNotificationSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.34, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      const pulse = (start, from, to, dur, type = "square", vol = 1.1) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, audioCtx.currentTime + start);
        osc.frequency.exponentialRampToValueAtTime(
          to,
          audioCtx.currentTime + start + dur,
        );
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(
          vol,
          audioCtx.currentTime + start + 0.03,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + start + dur + 0.04,
        );
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + dur + 0.05);
      };

      pulse(0, 560, 910, 0.2, "square", 1.15);
      pulse(0.17, 900, 1380, 0.2, "triangle", 1.05);
      pulse(0.34, 1180, 1720, 0.22, "sawtooth", 1.0);

      setTimeout(() => {
        audioCtx.close();
      }, 780);
    } catch {
      // ignore sound failures
    }
  };

  const playSupportMessageSound = async (type = "sent") => {
    try {
      const sound =
        type === "sent"
          ? supportSentSoundRef.current
          : supportReceivedSoundRef.current;
      sound?.play();
    } catch {
      // ignore sound failures
    }
  };

  useEffect(() => {
    supportSentSoundRef.current = new Howl({
      src: [SUPPORT_CHAT_SOUND_DATA_URI],
      volume: 0.55,
      rate: 1.25,
      html5: false,
    });
    supportReceivedSoundRef.current = new Howl({
      src: [SUPPORT_CHAT_SOUND_DATA_URI],
      volume: 0.95,
      rate: 0.85,
      html5: false,
    });

    return () => {
      supportSentSoundRef.current?.unload();
      supportReceivedSoundRef.current?.unload();
    };
  }, []);

  const enrolledForChat = useMemo(
    () => availableCourses.filter((c) => c?.is_enrolled),
    [availableCourses],
  );

  const activeSupportCourseId =
    supportChatCourseId || enrolledForChat[0]?.id || "";
  const activeSupportCourse = useMemo(
    () =>
      enrolledForChat.find(
        (c) => String(c.id) === String(activeSupportCourseId),
      ),
    [enrolledForChat, activeSupportCourseId],
  );

  const openSupportChat = () => {
    void playChatOpenSound();
    const firstId = enrolledForChat[0]?.id;
    setSupportChatCourseId(firstId ? String(firstId) : "");
    supportChatModal.onOpen();
  };

  const openCourseActivationModal = (course) => {
    setSelectedCourseForActivation(course || null);
    setActivationCode("");
    onOpen();
  };

  const markCourseEnrolled = (courseId) => {
    setAvailableCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, is_enrolled: true, access_status: "open" } : c,
      ),
    );
  };

  const handleActivateFreeCourse = async (course) => {
    if (!course?.id) return;
    try {
      setActivatingFreeCourseId(course.id);
      await baseUrl.post(
        "/api/course/activate-free",
        { course_id: course.id },
        { headers: authHeader },
      );
      markCourseEnrolled(course.id);
      toast({
        title: "تم تفعيل الكورس المجاني بنجاح",
        status: "success",
      });
      navigate(`/CourseDetailsPage/${course.id}`);
    } catch (error) {
      toast({
        title: "فشل الدخول للكورس",
        description: error?.response?.data?.message || "حاول مجدداً.",
        status: "error",
      });
    } finally {
      setActivatingFreeCourseId(null);
    }
  };

  const activateCourseWithCode = async () => {
    const code = activationCode.trim();
    const courseId = selectedCourseForActivation?.id;
    if (!code) {
      toast({
        title: "أدخل كود التفعيل أولاً",
        status: "warning",
      });
      return;
    }
    if (!courseId) {
      toast({
        title: "اختر الكورس أولاً",
        description: "يجب تحديد الكورس قبل التفعيل بالكود",
        status: "warning",
      });
      return;
    }
    try {
      setIsActivatingCode(true);
      const res = await baseUrl.post(
        "/api/course/activate",
        { code, course_id: Number(courseId) },
        {
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
        },
      );
      markCourseEnrolled(courseId);
      toast({
        title: res?.data?.message || "تم تفعيل الكورس بنجاح",
        status: "success",
      });
      onClose();
      setActivationCode("");
      setSelectedCourseForActivation(null);
      navigate(`/CourseDetailsPage/${courseId}`);
    } catch (error) {
      toast({
        title: error?.response?.data?.message || "فشل تفعيل الكورس بالكود",
        status: "error",
      });
    } finally {
      setIsActivatingCode(false);
    }
  };

  const fetchLiveStreamNotifications = async ({ withSound = false } = {}) => {
    try {
      const res = await baseUrl.get("/api/notifications/live-stream", {
        headers: authHeader,
        params: { limit: 20, offset: 0 },
      });
      const notifications = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : [];
      const latest = notifications[0] || null;
      setLiveBannerNotification(latest);

      const latestId = latest?.id || null;
      if (!liveInitializedRef.current) {
        liveInitializedRef.current = true;
        liveLastTopIdRef.current = latestId;
        return;
      }

      if (
        withSound &&
        latestId &&
        liveLastTopIdRef.current &&
        latestId !== liveLastTopIdRef.current
      ) {
        void playLiveNotificationSound();
      }
      liveLastTopIdRef.current = latestId;
    } catch {
      // keep silent and avoid UI jitter on polling errors
    }
  };

  const handleEnterLiveStream = () => {
    const meetingId =
      liveBannerNotification?.meeting_id ||
      liveBannerNotification?.metadata?.meeting_id;
    if (meetingId) {
      navigate(`/meeting/${meetingId}`);
      return;
    }
    const courseId = liveBannerNotification?.course_id;
    if (courseId) {
      navigate(`/CourseDetailsPage/${courseId}`);
      return;
    }
    navigate("/lectures_taple");
  };

  // --- API Functions ---

  const activateCourseWithQR = async (qrData) => {
    try {
      const response = await baseUrl.post(
        "api/course/scan-qr-activate",
        { qr_data: qrData },
        { headers: authHeader },
      );
      if (response.data.success) {
        setActivationResult({
          success: true,
          message: response.data.message || "تم تفعيل الكورس بنجاح!",
          courseName: response.data.course_name || "الكورس الجديد",
        });
        setShowSuccessModal(true);
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (error) {
      let errorMessage =
        error.response?.data?.message || "حدث خطأ في تفعيل الكورس";
      let errorReason =
        error.response?.data?.reason || "يرجى المحاولة مرة أخرى";
      if (
        errorMessage.includes("Activation code has been fully used") ||
        errorMessage.includes("fully used")
      ) {
        errorMessage = "هذا الكود مستخدم من قبل";
        errorReason = "تم استخدام كود التفعيل هذا مسبقاً.";
      }
      setActivationResult({
        success: false,
        message: errorMessage,
        reason: errorReason,
      });
      setShowErrorModal(true);
    }
  };

  const startQrScanner = async () => {
    setIsScanning(true);
    try {
      const element = document.getElementById("qr-reader");
      if (!element) return setIsScanning(false);

      const html5Qrcode = new Html5Qrcode("qr-reader");
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setIsScanning(false);
            html5Qrcode
              .stop()
              .then(() => {
                html5Qrcode.clear();
                setQrScanner(null);
                setIsQrScannerOpen(false);
                activateCourseWithQR(decodedText);
              })
              .catch(() => {
                html5Qrcode.clear();
                setQrScanner(null);
                setIsQrScannerOpen(false);
                activateCourseWithQR(decodedText);
              });
          },
          () => { },
        );
        setQrScanner(html5Qrcode);
      } catch (err) {
        console.error("Camera permission error:", err);
        setIsScanning(false);
      }
    } catch (error) {
      console.error("Error starting scanner:", error);
      setIsScanning(false);
    }
  };

  const closeQrScanner = async () => {
    setIsScanning(false);
    if (qrScanner) {
      try {
        if ((await qrScanner.getState()) === 2) await qrScanner.stop();
        qrScanner.clear();
        setQrScanner(null);
      } catch (e) {
        console.error(e);
      }
    }
    setIsQrScannerOpen(false);
  };

  useEffect(() => {
    if (isQrScannerOpen && !qrScanner) {
      const timer = setTimeout(startQrScanner, 500);
      return () => clearTimeout(timer);
    }
  }, [isQrScannerOpen]);

  useEffect(() => {
    if (!isQrScannerOpen && qrScanner) closeQrScanner();
  }, [isQrScannerOpen]);

  // Feed Fetching
  const fetchGradeFeed = async () => {
    try {
      setFeedLoading(true);
      setFeedError("");
      const res = await baseUrl.get("/api/notifications/grade-feed", {
        headers: authHeader,
      });
      const feed = res?.data?.feed || [];
      const mapped = feed.map((n, idx) => ({
        id: `${n.type}-${n.item_id}-${idx}`,
        title: n.title,
        message:
          n.description ||
          (n.type === "league" ? "دوري جديد متاح لصفك" : "مسابقة جديدة لصفك"),
        time: formatDateTime(n.created_at),
        type: n.type,
        urgent: n.type === "league",
        itemId: n.item_id,
        imageUrl: n.image_url,
      }));
      setCompetitionNotifications(mapped);
    } catch (e) {
      setFeedError("تعذر جلب إشعارات الصف");
      setCompetitionNotifications([]);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (!ENABLE_GRADE_FEED) return;
    fetchGradeFeed();
  }, [authHeader]);

  useEffect(() => {
    let stopped = false;
    fetchLiveStreamNotifications({ withSound: false });
    const timer = setInterval(() => {
      if (stopped) return;
      fetchLiveStreamNotifications({ withSound: true });
    }, LIVE_STREAM_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [authHeader]);

  // Socket Logic
  const fetchLatestInvitation = async () => {
    try {
      const res = await baseUrl.get("/api/game/invitations/latest", {
        headers: authHeader,
      });
      if (res?.data?.success && res?.data?.data) {
        setLatestInvitation(res.data.data);
        if (res.data.data.status === "pending") invitationModal.onOpen();
      } else {
        setLatestInvitation(null);
      }
    } catch (e) {
      setLatestInvitation(null);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!latestInvitation) return;
    try {
      const res = await baseUrl.post(
        `/api/game/accept/${latestInvitation.id}`,
        {},
        { headers: authHeader },
      );
      if (res?.data?.success) {
        toast({ title: "تم قبول الدعوة!", status: "success" });
        invitationModal.onClose();
        setLatestInvitation(null);
      } else {
        toast({
          title: res?.data?.message || "فشل قبول الدعوة",
          status: "error",
        });
      }
    } catch (e) {
      toast({
        title: e.response?.data?.message || "فشل قبول الدعوة",
        status: "error",
      });
    }
  };

  const handleRejectInvitation = async () => {
    if (!latestInvitation) return;
    try {
      const res = await baseUrl.post(
        `/api/game/reject/${latestInvitation.id}`,
        {},
        { headers: authHeader },
      );
      if (res?.data?.success) {
        toast({ title: "تم رفض الدعوة", status: "info" });
        invitationModal.onClose();
        setLatestInvitation(null);
      }
    } catch (e) {
      toast({
        title: e.response?.data?.message || "فشل رفض الدعوة",
        status: "error",
      });
    }
  };

  useEffect(() => {
    if (!ENABLE_GAME_INVITATIONS) return;
    fetchLatestInvitation();
  }, [authHeader]);

  useEffect(() => {
    if (!ENABLE_GAME_INVITATIONS) return;
    const processNewInvitation = (invitation) => {
      if (!invitation) return;
      setLatestInvitation(invitation);
      if (invitation.status === "pending") invitationModal.onOpen();
    };

    const tokenOnly =
      (localStorage.getItem("Authorization") || "").replace(
        /^Bearer\s+/i,
        "",
      ) || localStorage.getItem("token");
    const socket = io(getSocketEndpoint(), {
      path: "/socket.io",
      withCredentials: true,
      auth: tokenOnly ? { token: tokenOnly } : {},
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (user?.id) {
        socket.emit("game:join-room", { userId: user?.id });
        socket.emit("join", `user-${user?.id}`);
        socket.emit("subscribe", {
          type: "game-invitations",
          userId: user?.id,
        });
      }
      fetchLatestInvitation();
    });

    const handleInvitationEvent = (payload) => {
      let invitation =
        payload?.invitation ||
        payload?.data?.invitation ||
        (payload?.id ? payload : null);
      if (invitation) processNewInvitation(invitation);
      else fetchLatestInvitation();
    };

    const eventNames = [
      "game:invitation-received",
      "game:new-invitation",
      "game:invitation",
      "invitation:new",
      "invitation:received",
    ];
    eventNames.forEach((evt) => socket.on(evt, handleInvitationEvent));

    return () => {
      socket.disconnect();
    };
  }, [invitationModal, user?.id]);

  useEffect(() => {
    const fallbackName = tenantSubdomain
      ? decodeURIComponent(tenantSubdomain).replace(/-/g, " ")
      : "مدرسك";
    let mounted = true;

    if (!tenantSubdomain) {
      setTeacherDisplayName("مدرسك");
      setTeacherAvatar("");
      setAvailableCourses([]);
      setCoursesLoading(false);
      return;
    }

    (async () => {
      try {
        setCoursesLoading(true);
        const res = await baseUrl.get(
          `/api/student/teacher-platform/${encodeURIComponent(tenantSubdomain)}/courses`,
          { headers: authHeader },
        );
        const payload = res?.data?.data || {};
        const displayName = payload?.platform?.display_name;
        const avatar = payload?.platform?.teacher_avatar;
        if (!mounted) return;
        setTeacherDisplayName(displayName || fallbackName);
        setTeacherAvatar(avatar || "");
        setAvailableCourses(Array.isArray(payload?.courses) ? payload.courses : []);
      } catch {
        if (!mounted) return;
        setTeacherDisplayName(fallbackName);
        setTeacherAvatar("");
        setAvailableCourses([]);
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tenantSubdomain, authHeader]);

  // --- UI Styling (براند: blue.500 & orange.500) ---
  const mainLinks = [
    {
      name: "دوري Next",
      href: "/leagues",
      icon: FaTrophy,
      iconBg: "orange.500",
      desc: "نافس وتحدى زملائك",
    },
    {
      name: "بنك الأسئلة",
      href: "/question_bank",
      icon: FaLightbulb,
      iconBg: "blue.500",
      desc: "تدرب على آلاف الأسئلة",
    },
    {
      name: "Next سوشيال",
      href: "/social",
      icon: FaRocket,
      iconBg: "orange.500",
      desc: "مجتمع طلابي متفاعل",
    },
    {
      name: "محاضريني",
      href: "/my_teachers",
      icon: FaBookOpen,
      iconBg: "blue.500",
      desc: "تابع دروسك وتقدمك",
    },
  ];

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const blurBlue = useColorModeValue(0.06, 0.08);
  const blurOrange = useColorModeValue(0.05, 0.07);
  const linkCardShadow = useColorModeValue(
    "0 16px 40px rgba(66, 153, 225, 0.12)",
    "0 16px 40px rgba(0,0,0,0.35)",
  );
  const mainLinkCardShadow = useColorModeValue(
    "0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.06)",
    "0 0 0 1px rgba(255,255,255,0.08), 0 0 28px rgba(255,255,255,0.12), 0 0 48px rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.2), 0 12px 28px rgba(0,0,0,0.25)"
  );
  const mainLinkCardShadowHover = useColorModeValue(
    "0 16px 40px rgba(66, 153, 225, 0.12)",
    "0 0 0 1px rgba(255,255,255,0.12), 0 0 36px rgba(255,255,255,0.18), 0 0 56px rgba(255,255,255,0.08), 0 16px 40px rgba(0,0,0,0.35)"
  );
  const cardShadow = useColorModeValue(
    "0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08), 0 12px 28px rgba(0,0,0,0.06)",
    "0 0 0 1px rgba(255,255,255,0.06), 0 0 24px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.2), 0 12px 28px rgba(0,0,0,0.25)"
  );
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const modalText = useColorModeValue("gray.700", "gray.300");
  const modalTextMuted = useColorModeValue("gray.600", "gray.400");
  const inviteHeaderBg = useColorModeValue(
    "linear(to-br, blue.500, blue.600)",
    "linear(to-br, blue.600, blue.700)",
  );
  const successIconColor = useColorModeValue("green.500", "green.400");
  const successTextColor = useColorModeValue("green.600", "green.300");
  const errorIconColor = useColorModeValue("red.500", "red.400");
  const errorTextColor = useColorModeValue("red.600", "red.300");
  const enrolledCount = availableCourses.filter((c) => c?.is_enrolled).length;
  const availableToJoin = availableCourses.filter((c) => !c?.is_enrolled).length;
  const studentId =
    user?.id ?? userData?.id ?? user?.student_id ?? userData?.student_id ?? null;
  const pageBgColor = useColorModeValue("#F4F7FB", "gray.950");
  const courseCardShadow = useColorModeValue(
    "0 10px 30px rgba(15,23,42,0.06)",
    "0 12px 32px rgba(0,0,0,0.35)",
  );
  const courseCardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const courseCardHoverShadow = useColorModeValue(
    "0 16px 36px rgba(37,99,235,0.14)",
    "0 16px 38px rgba(30,64,175,0.45)",
  );
  const courseImageBg = useColorModeValue("gray.100", "gray.700");
  const courseBadgeBg = useColorModeValue("whiteAlpha.900", "blackAlpha.700");
  const courseBadgeColor = useColorModeValue("blue.700", "blue.200");
  const supportBubbleBg = useColorModeValue("white", "gray.800");
  const supportBubbleBorder = useColorModeValue("blue.100", "blue.800");
  const supportBubbleText = useColorModeValue("gray.700", "gray.200");
  const supportChatShellBg = useColorModeValue("white", "gray.800");
  const supportChatHeaderGradient = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.800, blue.700)",
  );
  const supportChatCourseBarBg = useColorModeValue("blue.50", "gray.900");
  const supportChatCourseBarBorder = useColorModeValue("blue.100", "gray.700");
  const liveBannerBg = useColorModeValue("orange.50", "orange.900");
  const liveBannerBorder = useColorModeValue("orange.300", "orange.500");
  const liveBannerShadow = useColorModeValue(
    "0 12px 30px rgba(251,146,60,0.22)",
    "0 14px 32px rgba(0,0,0,0.4)",
  );
  const liveIconBg = useColorModeValue("orange.500", "orange.400");
  const liveTitleColor = useColorModeValue("orange.800", "orange.100");
  const liveHeadlineColor = useColorModeValue("orange.900", "orange.50");
  const liveMsgColor = useColorModeValue("orange.800", "orange.200");
  const liveMetaColor = useColorModeValue("orange.700", "orange.300");
  const liveDismissHover = useColorModeValue("orange.100", "orange.800");
  const sectionCardBg = useColorModeValue("white", "gray.900");
  const sectionBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <Box bg={pageBgColor} minH="calc(100vh - 80px)" pb={{ base: 28, lg: 10 }}>
      <VStack spacing={5} align="stretch">
        {liveBannerNotification ? (
          <Box px={{ base: 3, md: 4 }} pt={3}>
            <Card
              bg={liveBannerBg}
              borderWidth="1px"
              borderColor={liveBannerBorder}
              borderRadius="2xl"
              boxShadow={liveBannerShadow}
              w="100%"
            >
              <CardBody py={3.5} px={{ base: 3, md: 4 }}>
                <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                  <HStack align="start" spacing={3} flex={1}>
                    <Box
                      mt={0.5}
                      w="40px"
                      h="40px"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={liveIconBg}
                      color="white"
                    >
                      <Icon as={FaBell} boxSize={4} />
                    </Box>
                    <VStack align="start" spacing={0.5}>
                      <HStack spacing={2}>
                        <Text fontSize="xs" fontWeight="black" color={liveTitleColor}>
                          تنبيه مباشر
                        </Text>
                        <Badge bg="red.500" color="white" borderRadius="full" px={2} py={0.5} fontSize="10px" fontWeight="black">
                          LIVE
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" fontWeight="black" color={liveHeadlineColor}>
                        {liveBannerNotification.title || "بث مباشر جديد"}
                      </Text>
                      <Text fontSize="xs" color={liveMsgColor} lineHeight="1.6">
                        {liveBannerNotification.message}
                      </Text>
                      <Text fontSize="11px" color={liveMetaColor} fontWeight="bold">
                        {formatDateTime(liveBannerNotification.created_at)}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2} ms="auto">
                    <Button
                      size="sm"
                      bg="blue.500"
                      color="white"
                      borderRadius="lg"
                      _hover={{ bg: "blue.600" }}
                      onClick={handleEnterLiveStream}
                      fontWeight="black"
                    >
                      دخول إلى البث
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="lg"
                      borderColor={liveBannerBorder}
                      color={liveMetaColor}
                      _hover={{ bg: liveDismissHover }}
                      onClick={() => setLiveBannerNotification(null)}
                    >
                      إخفاء
                    </Button>
                  </HStack>
                </Flex>
              </CardBody>
            </Card>
          </Box>
        ) : null}

        <HomeProHero
          studentName={user?.name}
          studentId={studentId}
          teacherName={teacherDisplayName}
          teacherAvatar={teacherAvatar}
          onStartLearning={() => navigate("/my-courses")}
          onContinue={() => navigate("/lectures_taple")}
          onActivateWithQr={() => setIsQrScannerOpen(true)}
        />

        <HomeProStats
          enrolledCount={enrolledCount}
          coursesCount={availableCourses.length}
          availableToJoin={availableToJoin}
        />

        <HomeProQuickActions onActivateWithQr={() => setIsQrScannerOpen(true)} />

        {/* My Courses */}
        <Box px={{ base: 4, md: 6 }} maxW="7xl" w="full" mx="auto">
          <Box
            bg={sectionCardBg}
            borderWidth="1px"
            borderColor={sectionBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="sm"
          >
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              px={{ base: 4, md: 5 }}
              py={4}
              borderBottomWidth="1px"
              borderColor={sectionBorder}
            >
              <VStack align="flex-start" spacing={0}>
                <Text fontWeight="black" fontSize="lg" color={headingColor}>
                  كورساتي
                </Text>
                <Text fontSize="sm" color={subtextColor}>
                  المحتوى الذي اشتركت به
                </Text>
              </VStack>
              <Button
                as={Link}
                to="/my-courses"
                size="sm"
                variant="ghost"
                colorScheme="blue"
                borderRadius="lg"
                rightIcon={<Icon as={FaChevronLeft} />}
              >
                عرض الكل
              </Button>
            </Flex>
            <Box px={{ base: 2, md: 3 }} py={3}>
              <MyCourses embedded />
            </Box>
          </Box>
        </Box>

        {/* Available courses */}
        <Box px={{ base: 4, md: 6 }} maxW="7xl" w="full" mx="auto" pb={2}>
          <Box
            bg={sectionCardBg}
            borderWidth="1px"
            borderColor={sectionBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="sm"
          >
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              px={{ base: 4, md: 5 }}
              py={4}
              borderBottomWidth="1px"
              borderColor={sectionBorder}
            >
              <VStack align="flex-start" spacing={0}>
                <Text fontWeight="black" fontSize="lg" color={headingColor}>
                  كورسات المنصة
                </Text>
                <Text fontSize="sm" color={subtextColor}>
                  اكتشف المحتوى المتاح للاشتراك
                </Text>
              </VStack>
              {coursesLoading ? (
                <HStack spacing={2} color={subtextColor}>
                  <Spinner size="sm" color="blue.500" thickness="3px" />
                  <Text fontSize="xs" fontWeight="medium">
                    جاري التحميل...
                  </Text>
                </HStack>
              ) : (
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  {availableCourses.length} كورس
                </Badge>
              )}
            </Flex>

            <Box p={{ base: 3, md: 4 }}>
              {coursesLoading ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 3, md: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <Card
                      key={`course-skeleton-${i}`}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={courseCardBorder}
                      borderRadius="2xl"
                      overflow="hidden"
                      boxShadow={courseCardShadow}
                    >
                      <Skeleton h="168px" startColor="gray.100" endColor="gray.200" />
                      <Box p={4}>
                        <Skeleton height="16px" mb={3} borderRadius="md" />
                        <Skeleton height="12px" width="60%" mb={4} borderRadius="md" />
                        <Skeleton height="40px" borderRadius="xl" />
                      </Box>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 3, md: 4 }}>
                  {availableCourses.map((course) => {
                    const free = isCourseFree(course);
                    const enrolled = !!course.is_enrolled;
                    return (
                      <Card
                        key={course.id}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={courseCardBorder}
                        borderRadius="2xl"
                        overflow="hidden"
                        boxShadow={courseCardShadow}
                        w="100%"
                        h="full"
                        display="flex"
                        flexDirection="column"
                        transition="all 0.22s ease"
                        _hover={{
                          transform: "translateY(-4px)",
                          boxShadow: courseCardHoverShadow,
                          borderColor: "blue.200",
                        }}
                      >
                        <Box
                          position="relative"
                          flexShrink={0}
                          w="full"
                          h={{ base: "150px", md: "168px" }}
                          overflow="hidden"
                          bg={courseImageBg}
                        >
                          <Box
                            as="img"
                            src={
                              course.avatar ||
                              "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
                            }
                            alt={course.title}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                          <Box
                            position="absolute"
                            inset={0}
                            bgGradient="linear(to-t, blackAlpha.700 0%, transparent 55%)"
                          />
                          <Badge
                            position="absolute"
                            top={3}
                            left={3}
                            bg={courseBadgeBg}
                            color={courseBadgeColor}
                            borderRadius="full"
                            px={2.5}
                            py={1}
                            fontSize="10px"
                            fontWeight="black"
                          >
                            {course?.grade?.name || "عام"}
                          </Badge>
                          <Badge
                            position="absolute"
                            top={3}
                            right={3}
                            colorScheme={enrolled ? "green" : free ? "green" : "orange"}
                            variant={enrolled || free ? "solid" : "subtle"}
                            borderRadius="full"
                            px={2.5}
                            py={1}
                            fontSize="10px"
                            fontWeight="bold"
                          >
                            {enrolled ? "مشترك" : free ? "مجاني" : "متاح"}
                          </Badge>
                          <Box position="absolute" bottom={3} right={3} left={3}>
                            <Text
                              color="white"
                              fontSize="md"
                              fontWeight="black"
                              noOfLines={2}
                              lineHeight="1.35"
                              textShadow="0 2px 8px rgba(0,0,0,0.45)"
                            >
                              {course.title}
                            </Text>
                          </Box>
                        </Box>

                        <Box
                          p={4}
                          flex="1"
                          display="flex"
                          flexDirection="column"
                          gap={3}
                        >
                          <HStack justify="space-between" fontSize="xs" color={subtextColor}>
                            <HStack spacing={2} minW={0}>
                              <Text noOfLines={1} fontWeight="medium">
                                {teacherDisplayName || "مستر"}
                              </Text>
                            </HStack>
                            <Text fontWeight="black" color={free ? "green.500" : "orange.500"}>
                              {free ? "مجاني" : `${course.price} جنيه`}
                            </Text>
                          </HStack>

                          {course.description ? (
                            <Text fontSize="sm" color={subtextColor} noOfLines={2} lineHeight="1.7">
                              {course.description}
                            </Text>
                          ) : (
                            <Box flex="1" />
                          )}

                          <Box mt="auto">
                            {enrolled || free ? (
                              <Button
                                size="sm"
                                w="full"
                                h="40px"
                                bg="blue.500"
                                color="white"
                                _hover={{ bg: "blue.600" }}
                                borderRadius="xl"
                                fontSize="sm"
                                fontWeight="bold"
                                rightIcon={<Icon as={FaChevronLeft} boxSize={3} />}
                                onClick={() => navigate(`/CourseDetailsPage/${course.id}`)}
                              >
                                دخول للكورس
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                w="full"
                                h="40px"
                                bg="orange.500"
                                color="white"
                                _hover={{ bg: "orange.600" }}
                                borderRadius="xl"
                                fontSize="sm"
                                fontWeight="bold"
                                onClick={() => openCourseActivationModal(course)}
                              >
                                اشترك الآن
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
              {!coursesLoading && availableCourses.length === 0 ? (
                <Center
                  py={12}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor={courseCardBorder}
                >
                  <VStack spacing={2}>
                    <Text fontWeight="black" color={headingColor}>
                      لا توجد كورسات متاحة حالياً
                    </Text>
                    <Text fontSize="sm" color={subtextColor}>
                      تابع المنصة لاحقاً لظهور محتوى جديد.
                    </Text>
                  </VStack>
                </Center>
              ) : null}
            </Box>
          </Box>
        </Box>
      </VStack>

      {/* Floating scientific support chat — desktop only; mobile/tablet use bottom nav */}
      <Box
        display={{ base: "none", lg: "block" }}
        position="fixed"
        bottom="20px"
        left="16px"
        zIndex={30}
        dir="ltr"
      >
        <VStack spacing={2} align="flex-start">
          <MotionBox
            dir="rtl"
            position="relative"
            maxW={{ base: "200px", sm: "240px", md: "285px" }}
            bg={supportBubbleBg}
            borderWidth="1px"
            borderColor={supportBubbleBorder}
            borderRadius="2xl"
            px={{ base: 3, md: 3.5 }}
            py={{ base: 2, md: 2.5 }}
            boxShadow={useColorModeValue(
              "0 14px 32px rgba(37,99,235,0.18)",
              "0 16px 36px rgba(0,0,0,0.45)",
            )}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            _after={{
              content: '""',
              position: "absolute",
              bottom: "-7px",
              left: "38px",
              width: "14px",
              height: "14px",
              bg: supportBubbleBg,
              borderBottom: "1px solid",
              borderRight: "1px solid",
              borderColor: supportBubbleBorder,
              transform: "rotate(45deg)",
            }}
          >
            <HStack spacing={2} mb={1}>
              <Flex
                boxSize={7}
                borderRadius="lg"
                bgGradient="linear(to-br, blue.500, blue.600)"
                align="center"
                justify="center"
                color="white"
                flexShrink={0}
              >
                <Icon as={FaRobot} boxSize={3.5} />
              </Flex>
              <Box minW={0}>
                <Text fontSize={{ base: "11px", md: "12px" }} fontWeight="black" color="blue.500">
                  المساعد العلمي
                </Text>
                <Badge
                  colorScheme="green"
                  fontSize="0.55rem"
                  borderRadius="full"
                  px={2}
                  mt={0.5}
                >
                  متصل
                </Badge>
              </Box>
            </HStack>
            <Text
              fontSize={{ base: "11px", md: "12px" }}
              fontWeight="semibold"
              color={supportBubbleText}
              lineHeight="1.55"
              noOfLines={2}
            >
              اسأل عن الدرس — إجابات من مواد الكورس فقط
            </Text>
          </MotionBox>

          <Box ml={{ base: "24px", md: "28px" }} position="relative">
            <Box
              position="absolute"
              inset="-6px"
              borderRadius="full"
              bg="blue.400"
              opacity={0.22}
              filter="blur(8px)"
              pointerEvents="none"
            />
            <IconButton
              icon={<Icon as={FaComments} />}
              aria-label="فتح المساعد العلمي"
              borderRadius="full"
              size={{ base: "lg", md: "lg" }}
              w={{ base: "52px", md: "56px" }}
              h={{ base: "52px", md: "56px" }}
              bgGradient="linear(to-br, blue.500, blue.600)"
              color="white"
              borderWidth="2px"
              borderColor="white"
              boxShadow={useColorModeValue(
                "0 12px 28px rgba(37,99,235,0.38)",
                "0 14px 32px rgba(30,64,175,0.55)",
              )}
              _hover={{
                bgGradient: "linear(to-br, blue.600, blue.700)",
                transform: "translateY(-2px) scale(1.02)",
              }}
              _active={{ transform: "translateY(0) scale(0.98)" }}
              transition="all 0.2s"
              onClick={openSupportChat}
            />
          </Box>
        </VStack>
      </Box>

      {/* Course activation modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "md" }}>
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 6 }}
          borderRadius={{ base: 0, md: "2xl" }}
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
        >
          <ModalHeader
            bg={useColorModeValue("blue.50", "blue.900")}
            borderBottomWidth="1px"
            borderColor={modalBorder}
          >
            <Text fontWeight="black" color={useColorModeValue("blue.700", "blue.200")}>
              تفعيل الكورس
            </Text>
            <Text fontSize="xs" color={modalTextMuted} mt={1}>
              {selectedCourseForActivation?.title || "اختر طريقة التفعيل المناسبة"}
            </Text>
          </ModalHeader>
          <ModalBody py={5}>
            <VStack spacing={4} align="stretch">
              <Box
                borderWidth="1px"
                borderColor={useColorModeValue("orange.200", "orange.500")}
                bg={useColorModeValue("orange.50", "orange.900")}
                borderRadius="xl"
                p={3}
              >
                <Text fontSize="sm" color={useColorModeValue("orange.800", "orange.100")} fontWeight="black" mb={2}>
                  1) التفعيل بكود الاشتراك
                </Text>
                <Input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="أدخل كود التفعيل"
                  borderColor={useColorModeValue("orange.300", "orange.400")}
                  bg={useColorModeValue("white", "gray.700")}
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #dd6b20" }}
                  mb={2.5}
                />
                <Button
                  w="full"
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.600" }}
                  onClick={activateCourseWithCode}
                  isLoading={isActivatingCode}
                  borderRadius="lg"
                  fontWeight="black"
                >
                  تفعيل بالكود الآن
                </Button>
              </Box>

              <Box
                borderWidth="1px"
                borderColor={useColorModeValue("blue.200", "blue.500")}
                bg={useColorModeValue("blue.50", "blue.900")}
                borderRadius="xl"
                p={3}
              >
                <Text fontSize="sm" color={useColorModeValue("blue.800", "blue.100")} fontWeight="black" mb={2}>
                  2) التفعيل عبر QR
                </Text>
                <Text fontSize="xs" color={modalTextMuted} mb={2.5}>
                  استخدم الكاميرا لمسح كود الـ QR الخاص بالكورس مباشرة.
                </Text>
                <Button
                  w="full"
                  variant="outline"
                  borderColor={useColorModeValue("blue.300", "blue.500")}
                  color={useColorModeValue("blue.700", "blue.200")}
                  _hover={{ bg: useColorModeValue("blue.100", "blue.800") }}
                  onClick={() => {
                    onClose();
                    setIsQrScannerOpen(true);
                  }}
                  leftIcon={<Icon as={FaQrcode} />}
                  borderRadius="lg"
                  fontWeight="bold"
                >
                  فتح الماسح بالكاميرا
                </Button>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* QR scanner modal */}
      <Modal isOpen={isQrScannerOpen} onClose={closeQrScanner} isCentered size={{ base: "full", md: "lg" }}>
        <ModalOverlay bg="blackAlpha.650" />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 6 }}
          borderRadius={{ base: 0, md: "2xl" }}
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
        >
          <ModalHeader borderBottomWidth="1px" borderColor={modalBorder}>
            <Text fontWeight="black">تفعيل الكورس عبر QR</Text>
          </ModalHeader>
          <ModalBody py={4}>
            <VStack spacing={3}>
              <Box
                id="qr-reader"
                w="full"
                maxW="420px"
                minH={{ base: "340px", md: "320px" }}
                borderRadius="xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                bg={useColorModeValue("gray.50", "gray.800")}
              />
              <Text fontSize="xs" color={modalTextMuted}>
                وجّه الكاميرا إلى كود QR الخاص بالتفعيل
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="ghost" onClick={closeQrScanner}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={supportChatModal.isOpen}
        onClose={supportChatModal.onClose}
        size={{ base: "full", md: "md" }}
        motionPreset="slideInBottom"
        scrollBehavior="inside"
      >
        <ModalOverlay
          bg="blackAlpha.500"
          backdropFilter="blur(8px)"
        />
        <ModalContent
          position={{ base: "fixed", md: "fixed" }}
          bottom={{ base: 0, md: "max(100px, calc(env(safe-area-inset-bottom) + 88px))" }}
          left={{ base: 0, md: "max(16px, env(safe-area-inset-left))" }}
          right={{ base: 0, md: "auto" }}
          top={{ base: 0, md: "auto" }}
          m={0}
          maxW={{ base: "100vw", md: "min(560px, calc(100vw - 32px))" }}
          w={{ base: "100vw", md: "min(560px, calc(100vw - 32px))" }}
          h={{ base: "100dvh", md: "min(78vh, 720px)" }}
          maxH={{ base: "100dvh", md: "min(78vh, 720px)" }}
          borderRadius={{ base: 0, md: "2xl" }}
          overflow="hidden"
          bg={supportChatShellBg}
          borderWidth={{ base: 0, md: "1px" }}
          borderColor={modalBorder}
          boxShadow={{
            base: "none",
            md: useColorModeValue(
              "0 24px 64px rgba(37,99,235,0.22), 0 8px 24px rgba(0,0,0,0.12)",
              "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
            ),
          }}
          display="flex"
          flexDirection="column"
        >
          <ModalHeader
            p={0}
            borderBottomWidth="0"
            flexShrink={0}
          >
            <Box
              position="relative"
              overflow="hidden"
              bgGradient={supportChatHeaderGradient}
              color="white"
              px={{ base: 4, md: 5 }}
              py={{ base: 4, md: 4 }}
              pt={{ base: "max(16px, env(safe-area-inset-top))", md: 4 }}
            >
              <Box
                position="absolute"
                top="-30px"
                right="-20px"
                w="120px"
                h="120px"
                borderRadius="full"
                bg="whiteAlpha.150"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="-40px"
                left="-10px"
                w="90px"
                h="90px"
                borderRadius="full"
                bg="orange.400"
                opacity={0.15}
                pointerEvents="none"
              />
              <Flex align="center" justify="space-between" gap={3} position="relative">
                <HStack spacing={3} align="center" minW={0} flex={1}>
                  <Flex
                    boxSize={{ base: 11, md: 12 }}
                    borderRadius="xl"
                    bg="whiteAlpha.200"
                    border="1px solid"
                    borderColor="whiteAlpha.350"
                    align="center"
                    justify="center"
                    flexShrink={0}
                    boxShadow="0 8px 20px rgba(0,0,0,0.12)"
                  >
                    <Icon as={FaRobot} boxSize={{ base: 5, md: 6 }} />
                  </Flex>
                  <Box minW={0}>
                    <HStack spacing={2} flexWrap="wrap">
                      <Text fontWeight="black" fontSize={{ base: "md", md: "lg" }} lineHeight="1.2">
                        المساعد العلمي
                      </Text>
                      <Badge
                        bg="green.400"
                        color="white"
                        fontSize="0.6rem"
                        borderRadius="full"
                        px={2}
                      >
                        RAG
                      </Badge>
                    </HStack>
                    <Text
                      fontSize={{ base: "xs", md: "sm" }}
                      color="whiteAlpha.900"
                      mt={1}
                      lineHeight="1.6"
                      noOfLines={2}
                    >
                      إجابات من مواد الكورس — يمكنك إرفاق صور للسؤال
                    </Text>
                  </Box>
                </HStack>
                <IconButton
                  aria-label="إغلاق الشات"
                  icon={<Icon as={FaTimes} />}
                  onClick={supportChatModal.onClose}
                  size="sm"
                  variant="ghost"
                  color="white"
                  borderRadius="xl"
                  bg="whiteAlpha.200"
                  border="1px solid"
                  borderColor="whiteAlpha.350"
                  _hover={{ bg: "whiteAlpha.300" }}
                  flexShrink={0}
                />
              </Flex>
            </Box>

            {enrolledForChat.length > 0 && (
              <Box
                px={{ base: 4, md: 5 }}
                py={3}
                bg={supportChatCourseBarBg}
                borderBottom="1px solid"
                borderColor={supportChatCourseBarBorder}
              >
                {enrolledForChat.length > 1 ? (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color={subtextColor} mb={1.5}>
                      الكورس النشط
                    </Text>
                    <Select
                      size="sm"
                      borderRadius="xl"
                      value={String(activeSupportCourseId)}
                      onChange={(e) => setSupportChatCourseId(e.target.value)}
                      bg={useColorModeValue("white", "gray.800")}
                      borderColor={supportChatCourseBarBorder}
                      fontWeight="semibold"
                      iconColor="blue.500"
                      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #63b3ed" }}
                    >
                      {enrolledForChat.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </Select>
                  </Box>
                ) : (
                  <HStack spacing={2} minW={0}>
                    <Flex
                      boxSize={8}
                      borderRadius="lg"
                      bg={useColorModeValue("blue.100", "blue.900")}
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Icon as={FaBookOpen} color="blue.500" boxSize={3.5} />
                    </Flex>
                    <Box minW={0}>
                      <Text fontSize="xs" color={subtextColor} fontWeight="medium">
                        الكورس
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color={headingColor} noOfLines={1}>
                        {activeSupportCourse?.title || enrolledForChat[0]?.title}
                      </Text>
                    </Box>
                  </HStack>
                )}
              </Box>
            )}
          </ModalHeader>

          <ModalBody
            py={0}
            px={0}
            flex="1"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            minH={0}
            bg={useColorModeValue("gray.50", "gray.900")}
          >
            {enrolledForChat.length === 0 ? (
              <Center flex={1} px={6} py={10}>
                <VStack spacing={5} maxW="sm" textAlign="center">
                  <Flex
                    boxSize={16}
                    borderRadius="2xl"
                    bgGradient="linear(to-br, blue.500, blue.600)"
                    align="center"
                    justify="center"
                    color="white"
                    boxShadow="0 12px 32px rgba(59,130,246,0.35)"
                  >
                    <Icon as={FaBookOpen} boxSize={7} />
                  </Flex>
                  <Box>
                    <Text fontWeight="black" fontSize="lg" color={headingColor} mb={2}>
                      اشترك في كورس أولاً
                    </Text>
                    <Text color={subtextColor} lineHeight="1.85" fontSize="sm">
                      المساعد العلمي يجيب من المواد التي يرفعها المدرس. بعد الاشتراك في كورس يمكنك
                      طرح أسئلتك هنا أو من صفحة الكورس.
                    </Text>
                  </Box>
                  <Button
                    as={Link}
                    to="/scientific-chat"
                    colorScheme="blue"
                    size="md"
                    borderRadius="xl"
                    rightIcon={<Icon as={FaExternalLinkAlt} />}
                    onClick={supportChatModal.onClose}
                  >
                    صفحة المساعد العلمي
                  </Button>
                </VStack>
              </Center>
            ) : (
              <Box flex={1} minH={0} display="flex" flexDirection="column">
                <ScientificChatPanel
                  key={String(activeSupportCourseId)}
                  mode="course"
                  courseId={activeSupportCourseId}
                  token={token}
                  compact
                  subtitle="إجابات من مواد الكورس فقط — يمكنك إرفاق صور"
                />
              </Box>
            )}
          </ModalBody>

          {enrolledForChat.length > 0 && (
            <Box
              px={4}
              py={2.5}
              borderTop="1px solid"
              borderColor={modalBorder}
              bg={supportChatShellBg}
              flexShrink={0}
              pb={{ base: "max(10px, env(safe-area-inset-bottom))", md: 2.5 }}
            >
              <Button
                as={Link}
                to="/scientific-chat"
                size="xs"
                variant="ghost"
                colorScheme="blue"
                w="full"
                borderRadius="lg"
                fontWeight="semibold"
                rightIcon={<Icon as={FaExternalLinkAlt} boxSize={3} />}
                onClick={supportChatModal.onClose}
              >
                فتح في صفحة كاملة
              </Button>
            </Box>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HomePage;
