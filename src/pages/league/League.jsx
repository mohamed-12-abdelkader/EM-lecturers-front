import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Image,
  VStack,
  HStack,
  Badge,
  IconButton,
  useColorModeValue,
  Container,
  Heading,
  Divider,
  Collapse,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  AlertTitle,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Stack,
  Tag,
  Tooltip,
  ScaleFade,
  Fade,
  Input,
  Textarea,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
} from "@chakra-ui/react";
import baseUrl from "../../api/baseUrl";
import UserType from "../../Hooks/auth/userType";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import CelebrationInterface from "../../components/celebration/CelebrationInterface";

const League = () => {
  const { id } = useParams();
  const [userData, isAdmin, isTeacher, student] = UserType();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  // Chakra UI color mode values
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.300");
  const headerBg = useColorModeValue("white", "gray.800");
  const gradientBg = useColorModeValue(
    "linear(to-br, blue.50, purple.50)",
    "linear(to-br, gray.800, gray.900)"
  );

  // Match creation form states
  const [matchName, setMatchName] = useState("");
  const [matchDescription, setMatchDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [matchImageFile, setMatchImageFile] = useState(null);
  const [matchImagePreview, setMatchImagePreview] = useState("");
  const matchImageInputRef = useRef(null);

  // Enrolled students (admin only)
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Matches (read/manage)
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");
  const [isEditMatch, setIsEditMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [deletingMatch, setDeletingMatch] = useState(false);

  // Leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLeague, setLeaderboardLeague] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState("");
  const [lbPagination, setLbPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    has_more: false,
  });

  // Tournament details collapse
  const [isTournamentDetailsCollapsed, setIsTournamentDetailsCollapsed] =
    useState(true);

  // Time selection helpers
  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    }),
    []
  );

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await baseUrl.get(`/api/leagues/${id}`, {
        headers: authHeader,
      });
      // API returns the league object directly
      setTournament(res?.data ?? res?.data?.data);
    } catch (e) {
      setError("فشل في جلب تفاصيل الدوري");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      setMatchesError("");
      const res = await baseUrl.get(`/api/leagues/${id}/matches`, {
        headers: authHeader,
      });
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setMatches(list);
    } catch (e) {
      setMatchesError("فشل في جلب المباريات");
    } finally {
      setMatchesLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setStudentsError("");
      const res = await baseUrl.get(`/api/leagues/${id}/students`, {
        headers: authHeader,
      });
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setStudents(list);
    } catch (e) {
      setStudentsError("فشل في جلب الطلاب المشتركين");
    } finally {
      setStudentsLoading(false);
    }
  };

  const openStudentsModal = async () => {
    try {
      if (isAdmin) {
        await fetchStudents();
      }
    } finally {
      setIsStudentsOpen(true);
    }
  };

  const closeStudentsModal = () => setIsStudentsOpen(false);

  const handleDeleteStudent = async (studentId) => {
    if (!studentId) return;
    try {
      setDeletingStudentId(studentId);
      await baseUrl.delete(`/api/leagues/${id}/students/${studentId}`, {
        headers: authHeader,
      });
      setStudents((prev) =>
        prev.filter((s) => (s.student_id ?? s.id) !== studentId)
      );
    } catch (e) {
      setStudentsError("فشل حذف اشتراك الطالب");
    } finally {
      setDeletingStudentId(null);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTournamentDetails();
      fetchMatches();
    }
  }, [id, authHeader]);

  useEffect(() => {
    if (id && isAdmin) {
      fetchStudents();
    }
  }, [id, isAdmin, authHeader]);

  const resetMatchForm = () => {
    setMatchName("");
    setMatchDescription("");
    setStartDate("");
    setStartTime("");
    setEndTime("");
    setDurationMinutes("");
    setIsVisible(true);
    setMatchImageFile(null);
    setMatchImagePreview("");
    try {
      if (matchImageInputRef?.current) matchImageInputRef.current.value = "";
    } catch {}
    setCreateError("");
    setCreateMsg("");
    setIsEditMatch(false);
    setEditingMatch(null);
  };

  const handleCreateMatch = async (e) => {
    e?.preventDefault?.();
    try {
      setCreating(true);
      setCreateError("");
      setCreateMsg("");

      // Validate time window ONLY if both are provided
      if (startTime && endTime && startDate) {
        const start = new Date(`${startDate}T${startTime}:00`);
        const end = new Date(`${startDate}T${endTime}:00`);
        if (!(end > start)) {
          setCreateError("وقت النهاية يجب أن يكون بعد وقت البداية");
          setCreating(false);
          return;
        }
      }

      const endpoint =
        isEditMatch && editingMatch
          ? `/api/leagues/matches/${editingMatch.id}`
          : `/api/leagues/${id}/matches`;
      const method = isEditMatch && editingMatch ? "put" : "post";

      // Prepare JSON payload
      // If fields are empty strings, send them as null (or undefined to be skipped if that's what backend prefers, but usually null closes the field)
      const payload = {
        name: matchName,
        description: matchDescription || undefined,
        // Send null if empty string to clear the value in DB
        start_date: startDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        duration_minutes: durationMinutes
          ? parseInt(durationMinutes)
          : undefined,
        is_visible: isVisible, // Default visibility
      };

      // Remove undefined fields
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      // If there's an image, use FormData, otherwise use JSON
      if (matchImageFile) {
        const form = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== undefined) {
            // Append null as empty string or string "null"? Usually empty string is safer forFormData if backend handles it,
            // but if backend expects explicit null for Dates, JSON is better.
            // Form data transmits everything as strings. Let's assume standard behavior:
            // If value is null, don't append it? Or append empty string?
            // The user prompt said: "send dates as null in DB".
            // We'll trust the payload construction above for JSON, but for FormData we might need care.
            if (payload[key] === null) {
              // Skip appending if you want it to be null? Or append empty string?
              // Let's assume sending empty string clears it.
              form.append(key, "");
            } else {
              form.append(
                key,
                typeof payload[key] === "boolean"
                  ? payload[key].toString()
                  : payload[key]
              );
            }
          }
        });
        form.append("image", matchImageFile);
        await baseUrl[method](endpoint, form, {
          headers: { ...authHeader, "Content-Type": "multipart/form-data" },
        });
      } else {
        await baseUrl[method](endpoint, payload, {
          headers: { ...authHeader, "Content-Type": "application/json" },
        });
      }

      setCreateMsg(
        isEditMatch ? "تم تحديث المباراة بنجاح" : "تم إنشاء المباراة بنجاح"
      );
      await fetchMatches();
      setTimeout(() => {
        setIsCreateMatchOpen(false);
        resetMatchForm();
      }, 700);
    } catch (e) {
      setCreateError(
        isEditMatch ? "فشل تحديث المباراة." : "فشل إنشاء المباراة."
      );
    } finally {
      setCreating(false);
    }
  };

  const openEditMatch = (match) => {
    setIsEditMatch(true);
    setEditingMatch(match);
    setMatchName(match.name || "");
    setMatchDescription(match.description || "");
    setIsVisible(Boolean(match.is_visible));
    setStartDate(match.start_date || "");
    setStartTime(match.start_time || "");
    setEndTime(match.end_time || "");
    setDurationMinutes(match.duration_minutes || "");
    setMatchImageFile(null);
    setIsCreateMatchOpen(true);
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      await baseUrl.delete(`/api/leagues/matches/${matchId}`, {
        headers: authHeader,
      });
      await fetchMatches();
    } catch (e) {
      // swallow; you can add toast later
    }
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;
    try {
      setDeletingMatch(true);
      await baseUrl.delete(`/api/leagues/matches/${matchToDelete.id}`, {
        headers: authHeader,
      });
      await fetchMatches();
      setMatchToDelete(null);
    } catch (e) {
      // ignore
    } finally {
      setDeletingMatch(false);
    }
  };

  const handleToggleMatchVisibility = async (matchId) => {
    try {
      await baseUrl.patch(
        `/api/leagues/matches/${matchId}/toggle-visibility`,
        {},
        { headers: authHeader }
      );
      await fetchMatches();
    } catch (e) {
      // ignore
    }
  };

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bg} pt="100px" pb={12} dir="rtl">
        <Container maxW="container.md">
          <Flex minH="60vh" align="center" justify="center">
            <Alert
              status="error"
              maxW="md"
              borderRadius="2xl"
              borderWidth="1px"
              flexDirection="column"
              alignItems="center"
              py={8}
            >
              <AlertIcon boxSize="6" />
              <AlertTitle mt={2}>خطأ</AlertTitle>
              <Text mt={2}>{error}</Text>
              <Button
                as={Link}
                to="/leagues"
                mt={4}
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.600" }}
                borderRadius="xl"
              >
                العودة للدوريات
              </Button>
            </Alert>
          </Flex>
        </Container>
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Box minH="100vh" bg={bg} pt="100px" pb={12} dir="rtl">
        <Container maxW="container.md">
          <Flex minH="60vh" align="center" justify="center">
            <VStack
              spacing={4}
              p={8}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="lg" color={textColor}>
                الدوري غير موجود
              </Heading>
              <Button
                as={Link}
                to="/leagues"
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.600" }}
                borderRadius="xl"
              >
                العودة للدوريات
              </Button>
            </VStack>
          </Flex>
        </Container>
      </Box>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (value) => {
    if (value === "" || value == null) return "مجاني";
    const n = Number(value);
    if (Number.isNaN(n)) return "غير متاح";
    return `${n.toLocaleString("ar-EG")} ج.م`;
  };

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

  const isMatchAvailableNow = (m) => {
    try {
      if (!m) return false;
      // 1. If manually hidden, it's not available to start
      if (!m.is_visible) return false;

      // 2. If no dates are set, and it's visible -> It is Open/Available
      if (!m.start_date || !m.start_time || !m.end_time) return true;

      // 3. If dates are set, check window
      const now = new Date();
      // Note: This logic assumes start/end are on the SAME DAY (startDate).
      // If backend supports multi-day matches, this parsing needs to change.
      // Based on previous code: `new Date(`${m.start_date}T${m.start_time}:00`)` supports same-day.
      const start = new Date(`${m.start_date}T${m.start_time}:00`);
      const end = new Date(`${m.start_date}T${m.end_time}:00`);

      return now >= start && now <= end;
    } catch {
      return false;
    }
  };

  const fetchLeaderboard = async (offset = 0, limit = 10) => {
    if (!id) return;
    try {
      setLbLoading(true);
      setLbError("");
      const { data } = await baseUrl.get(`/api/leagues/${id}/leaderboard`, {
        params: { offset, limit },
        headers: authHeader,
      });
      const board = data?.leaderboard || [];
      const league = data?.league || null;
      const pagination = data?.pagination || {
        total: board.length,
        limit,
        offset,
        has_more: false,
      };
      setLeaderboard(board);
      setLeaderboardLeague(league);
      setLbPagination({
        total: Number(pagination.total || 0),
        limit: Number(pagination.limit || limit),
        offset: Number(pagination.offset || offset),
        has_more: Boolean(pagination.has_more),
      });
    } catch (e) {
      setLbError("فشل في جلب المتصدرين");
      setLeaderboard([]);
    } finally {
      setLbLoading(false);
    }
  };

  const openLeaderboard = async () => {
    await fetchLeaderboard(0, lbPagination.limit || 10);
    setShowLeaderboard(true);
  };
  const closeLeaderboard = () => setShowLeaderboard(false);
  const nextLeaderboardPage = async () => {
    const next = lbPagination.offset + lbPagination.limit;
    await fetchLeaderboard(next, lbPagination.limit);
  };
  const prevLeaderboardPage = async () => {
    const prev = Math.max(0, lbPagination.offset - lbPagination.limit);
    await fetchLeaderboard(prev, lbPagination.limit);
  };

  return (
    <Box minH="100vh" bg={gradientBg} pt="72px" dir="rtl">
      {/* Header Section - براند */}
      <Box
        bg={headerBg}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top="72px"
        zIndex={40}
        backdropFilter="blur(10px)"
      >
        <Box h="1" w="full" bgGradient="linear(to-r, blue.500, orange.500)" />
        <Container maxW="7xl" py={6}>
          <Flex
            align="center"
            justify="space-between"
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Flex align="center" gap={4}>
              <IconButton
                as={Link}
                to="/leagues"
                aria-label="العودة للدوريات"
                icon={
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                }
                variant="ghost"
                colorScheme="gray"
              />
              <Box
                w={12}
                h={12}
                bgGradient="linear(to-r, blue.500, blue.600)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
              >
                <svg width="24" height="24" fill="white" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color={textColor}>
                  {tournament.name}
                </Heading>
                <HStack spacing={4}>
                  <Text fontSize="sm" color={subTextColor}>
                    {tournament.grade_name}
                  </Text>
                  <Badge bg="blue.500" color="white" borderRadius="full" px={2}>
                    {tournament.matches_count} مباراة
                  </Badge>
                </HStack>
              </VStack>
            </Flex>

            <HStack spacing={3}>
              {(isAdmin || student) && (
                <Button
                  onClick={openLeaderboard}
                  colorScheme="yellow"
                  size="lg"
                  leftIcon={
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  }
                  _hover={{ transform: "scale(1.05)" }}
                  transition="all 0.2s"
                >
                  عرض متصدرين الدوري
                </Button>
              )}

              {isAdmin && (
                <>
                  <Button
                    onClick={openStudentsModal}
                    colorScheme="green"
                    size="lg"
                  >
                    الطلاب المشتركين
                  </Button>
                  <Button
                    onClick={() => setIsCreateMatchOpen(true)}
                    colorScheme="blue"
                    size="lg"
                    leftIcon={
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    }
                    _hover={{ transform: "scale(1.05)" }}
                    transition="all 0.2s"
                  >
                    إنشاء مباراة جديدة
                  </Button>
                </>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Celebration Interface */}
      <CelebrationInterface
        isOpen={showLeaderboard}
        onClose={closeLeaderboard}
        leaderboard={leaderboard}
        leagueName={
          leaderboardLeague ? leaderboardLeague.name : tournament?.name
        }
        autoPlay={true}
      />
      {!showLeaderboard && (
        <Container maxW="7xl" py={8}>
          {/* Tournament Details Card */}
          <Card
            bg={cardBg}
            border="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            mb={8}
            overflow="hidden"
          >
            <Box
              h="1"
              w="full"
              bgGradient="linear(to-r, blue.500, orange.500)"
            />
            {/* Header with Collapse Button */}
            <CardHeader
              bg={useColorModeValue("gray.50", "gray.700")}
              borderBottom="1px"
              borderColor={borderColor}
            >
              <Flex align="center" justify="space-between">
                <HStack spacing={3}>
                  <Box color="blue.500">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Box>
                  <Heading size="lg" color={textColor}>
                    تفاصيل الدوري
                  </Heading>
                </HStack>
                <Button
                  onClick={() =>
                    setIsTournamentDetailsCollapsed(
                      !isTournamentDetailsCollapsed
                    )
                  }
                  variant="outline"
                  size="sm"
                  rightIcon={
                    <Box
                      transform={
                        isTournamentDetailsCollapsed
                          ? "rotate(180deg)"
                          : "rotate(0deg)"
                      }
                      transition="transform 0.2s"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Box>
                  }
                >
                  {isTournamentDetailsCollapsed
                    ? "عرض التفاصيل"
                    : "إخفاء التفاصيل"}
                </Button>
              </Flex>
            </CardHeader>

            {/* Collapsible Content */}
            <Collapse in={!isTournamentDetailsCollapsed} animateOpacity>
              <Box>
                {/* Tournament Image */}
                <Box position="relative" overflow="hidden">
                  {tournament.image_url ? (
                    <Image
                      src={tournament.image_url}
                      alt={tournament.name}
                      w="full"
                      h="400px"
                      objectFit="cover"
                    />
                  ) : (
                    <Box
                      w="full"
                      h="400px"
                      bgGradient="linear(to-br, blue.100, purple.100)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box color="blue.300">
                        <svg
                          width="64"
                          height="64"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </Box>
                    </Box>
                  )}

                  {/* Price Badge */}
                  <Box position="absolute" top={4} right={4}>
                    {tournament.price == null ? (
                      <Badge
                        colorScheme="green"
                        variant="solid"
                        p={2}
                        borderRadius="full"
                      >
                        <HStack spacing={1}>
                          <svg
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <Text>مجاني</Text>
                        </HStack>
                      </Badge>
                    ) : (
                      <Badge
                        colorScheme="orange"
                        variant="solid"
                        p={2}
                        borderRadius="full"
                      >
                        <HStack spacing={1}>
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          <Text>{formatPrice(tournament.price)}</Text>
                        </HStack>
                      </Badge>
                    )}
                  </Box>

                  {/* Status Badges */}
                  <VStack
                    position="absolute"
                    top={4}
                    left={4}
                    spacing={2}
                    align="start"
                  >
                    {typeof tournament.is_visible !== "undefined" && (
                      <Badge
                        colorScheme={tournament.is_visible ? "blue" : "gray"}
                        variant="solid"
                        p={2}
                        borderRadius="full"
                      >
                        {tournament.is_visible ? "ظاهر" : "مخفي"}
                      </Badge>
                    )}
                    {typeof tournament.is_subscribed !== "undefined" && (
                      <Badge
                        colorScheme={
                          tournament.is_subscribed ? "green" : "gray"
                        }
                        variant="solid"
                        p={2}
                        borderRadius="full"
                      >
                        {tournament.is_subscribed ? "مشترك" : "غير مشترك"}
                      </Badge>
                    )}
                  </VStack>
                </Box>

                {/* Tournament Info */}
                <CardBody p={8}>
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                    gap={6}
                    mb={6}
                  >
                    <Card
                      bg={useColorModeValue("gray.50", "gray.700")}
                      textAlign="center"
                    >
                      <CardBody>
                        <Text
                          fontSize="2xl"
                          fontWeight="bold"
                          color={textColor}
                          mb={1}
                        >
                          {tournament.matches_count}
                        </Text>
                        <Text fontSize="sm" color={subTextColor}>
                          مباراة
                        </Text>
                      </CardBody>
                    </Card>

                    <Card
                      bg={useColorModeValue("gray.50", "gray.700")}
                      textAlign="center"
                    >
                      <CardBody>
                        <Text fontSize="sm" color={subTextColor} mb={1}>
                          الفترة
                        </Text>
                        <Text
                          fontSize="md"
                          fontWeight="semibold"
                          color={textColor}
                        >
                          {formatDate(tournament.start_date)} →{" "}
                          {formatDate(tournament.end_date)}
                        </Text>
                      </CardBody>
                    </Card>

                    <Card
                      bg={useColorModeValue("gray.50", "gray.700")}
                      textAlign="center"
                    >
                      <CardBody>
                        <Text
                          fontSize="2xl"
                          fontWeight="bold"
                          color={textColor}
                          mb={1}
                        >
                          {tournament.grade_name}
                        </Text>
                        <Text fontSize="sm" color={subTextColor}>
                          الصف الدراسي
                        </Text>
                      </CardBody>
                    </Card>
                  </Grid>

                  {tournament.description && (
                    <Card bg={useColorModeValue("gray.50", "gray.700")} mb={6}>
                      <CardBody>
                        <Heading size="md" color={textColor} mb={2}>
                          الوصف
                        </Heading>
                        <Text color={subTextColor} lineHeight="tall">
                          {tournament.description}
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </CardBody>
              </Box>
            </Collapse>
          </Card>

          {/* Students Modal (Admin) */}
          {isAdmin && (
            <Modal
              isOpen={isStudentsOpen}
              onClose={closeStudentsModal}
              size="4xl"
            >
              <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
              <ModalContent maxH="85vh" overflow="hidden">
                <ModalHeader
                  bgGradient="linear(to-r, green.500, green.600)"
                  color="white"
                  borderTopRadius="md"
                >
                  <HStack justify="space-between" align="center">
                    <Heading size="lg">
                      الطلاب المشتركين ({students.length})
                    </Heading>
                    <ModalCloseButton color="white" />
                  </HStack>
                </ModalHeader>
                <ModalBody p={6} overflowY="auto">
                  {/* Delete confirmation */}
                  {studentToDelete && (
                    <Alert status="error" mb={4} borderRadius="lg">
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>تأكيد حذف اشتراك الطالب</AlertTitle>
                        <Text fontSize="sm">
                          سيتم حذف اشتراك{" "}
                          <Text as="span" fontWeight="bold">
                            {studentToDelete.student_name}
                          </Text>{" "}
                          ولن يتمكن من الوصول للدوري.
                        </Text>
                        <HStack mt={3} justify="end">
                          <Button
                            size="sm"
                            onClick={() => setStudentToDelete(null)}
                          >
                            إلغاء
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() =>
                              studentToDelete &&
                              handleDeleteStudent(studentToDelete.student_id)
                            }
                            isLoading={
                              deletingStudentId === studentToDelete?.student_id
                            }
                            loadingText="جارٍ الحذف..."
                          >
                            تأكيد الحذف
                          </Button>
                        </HStack>
                      </Box>
                    </Alert>
                  )}

                  {studentsLoading ? (
                    <VStack py={6}>
                      <Spinner size="lg" color="green.500" />
                      <Text color={subTextColor}>جارِ تحميل الطلاب...</Text>
                    </VStack>
                  ) : studentsError ? (
                    <Alert status="error" borderRadius="lg">
                      <AlertIcon />
                      <Text>{studentsError}</Text>
                    </Alert>
                  ) : students.length === 0 ? (
                    <Text textAlign="center" color={subTextColor} py={6}>
                      لا يوجد طلاب مشتركين بعد
                    </Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                          <Tr>
                            <Th color={textColor}>الاسم</Th>
                            <Th color={textColor}>البريد الإلكتروني</Th>
                            <Th color={textColor}>الصف</Th>
                            <Th color={textColor}>تاريخ الاشتراك</Th>
                            <Th color={textColor}>إجراءات</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {students.map((s) => (
                            <Tr
                              key={s.subscription_id}
                              _hover={{
                                bg: useColorModeValue("gray.50", "gray.700"),
                              }}
                            >
                              <Td color={textColor}>{s.student_name}</Td>
                              <Td color={subTextColor}>{s.student_email}</Td>
                              <Td color={subTextColor}>
                                {s.grade_name || `الصف ${s.grade_id}`}
                              </Td>
                              <Td color={subTextColor}>
                                {formatDateTime(s.joined_at)}
                              </Td>
                              <Td>
                                <Tooltip label="حذف الطالب">
                                  <IconButton
                                    size="sm"
                                    colorScheme="red"
                                    variant="solid"
                                    icon={
                                      <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    }
                                    onClick={() => setStudentToDelete(s)}
                                  />
                                </Tooltip>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </ModalBody>
              </ModalContent>
            </Modal>
          )}

          {/* Matches Section */}
          <Card
            bg={cardBg}
            border="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <CardHeader borderBottom="1px" borderColor={borderColor}>
              <HStack spacing={3}>
                <Box color="blue.500">
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </Box>
                <Heading size="lg" color={textColor}>
                  المباريات ({matches?.length || 0})
                </Heading>
              </HStack>
            </CardHeader>

            <CardBody p={8}>
              {matchesLoading ? (
                <VStack py={12}>
                  <Spinner size="lg" color="blue.500" />
                  <Text color={subTextColor}>جارِ تحميل المباريات...</Text>
                </VStack>
              ) : matchesError ? (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  <Text>{matchesError}</Text>
                </Alert>
              ) : !matches || matches.length === 0 ? (
                <VStack py={12} spacing={4}>
                  <Box
                    w={16}
                    h={16}
                    bg={useColorModeValue("gray.100", "gray.700")}
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box color={useColorModeValue("gray.400", "gray.500")}>
                      <svg
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </Box>
                  </Box>
                  <Heading size="md" color={textColor}>
                    لا توجد مباريات حالياً
                  </Heading>
                  <Text color={subTextColor} textAlign="center">
                    ابدأ بإنشاء أول مباراة في هذا الدوري
                  </Text>
                  {isAdmin && (
                    <Button
                      onClick={() => setIsCreateMatchOpen(true)}
                      colorScheme="blue"
                      leftIcon={
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      }
                    >
                      إنشاء مباراة الآن
                    </Button>
                  )}
                </VStack>
              ) : (
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  }}
                  gap={6}
                >
                  {matches.map((match, index) => (
                    <ScaleFade key={match.id} in={true} delay={index * 0.1}>
                      <Card
                        bg={cardBg}
                        border="1px"
                        borderColor={borderColor}
                        _hover={{
                          shadow: "lg",
                          transform: "translateY(-4px)",
                          transition: "all 0.3s",
                        }}
                        overflow="hidden"
                      >
                        {/* Match Image */}
                        <Box position="relative" h="32" overflow="hidden">
                          {match.image_url ? (
                            <Image
                              src={match.image_url}
                              alt={match.name}
                              w="full"
                              h="full"
                              objectFit="cover"
                              _hover={{ transform: "scale(1.1)" }}
                              transition="transform 0.5s"
                            />
                          ) : (
                            <Box
                              w="full"
                              h="full"
                              bgGradient="linear(to-br, blue.100, purple.100)"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Box color="blue.300">
                                <svg
                                  width="32"
                                  height="32"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                  />
                                </svg>
                              </Box>
                            </Box>
                          )}

                          {/* Visibility Badge */}
                          <Box position="absolute" top={2} left={2}>
                            <Badge
                              colorScheme={match.is_visible ? "green" : "gray"}
                              variant="solid"
                              p={1}
                              borderRadius="full"
                              fontSize="xs"
                            >
                              {match.is_visible ? "ظاهر" : "مخفي"}
                            </Badge>
                          </Box>
                        </Box>

                        {/* Match Content */}
                        <CardBody p={4}>
                          <Heading
                            size="md"
                            color={textColor}
                            mb={2}
                            _hover={{ color: "blue.500" }}
                            transition="color 0.2s"
                          >
                            {match.name}
                          </Heading>

                          {match.description && (
                            <Text
                              fontSize="sm"
                              color={subTextColor}
                              noOfLines={2}
                              mb={3}
                            >
                              {match.description}
                            </Text>
                          )}

                          <Flex align="center" justify="space-between" mt={2}>
                            <HStack spacing={2}>
                              {(() => {
                                try {
                                  if (!match.is_visible) {
                                    return (
                                      <Badge
                                        colorScheme="red"
                                        variant="subtle"
                                        fontSize="xs"
                                      >
                                        مغلقة
                                      </Badge>
                                    );
                                  }
                                  const available = isMatchAvailableNow(match);
                                  return (
                                    <Badge
                                      colorScheme={
                                        available ? "green" : "orange"
                                      }
                                      variant="subtle"
                                      fontSize="xs"
                                    >
                                      {available ? "متاحة للحل" : "لم تبدأ بعد"}
                                    </Badge>
                                  );
                                } catch {
                                  return null;
                                }
                              })()}
                              {match.start_time && match.end_time && (
                                <Text fontSize="xs" color={subTextColor}>
                                  {match.start_time} → {match.end_time}
                                </Text>
                              )}
                            </HStack>
                            <HStack spacing={2}>
                              {isAdmin && (
                                <>
                                  <Tooltip label="تعديل">
                                    <IconButton
                                      size="sm"
                                      colorScheme="blue"
                                      variant="ghost"
                                      icon={
                                        <svg
                                          width="16"
                                          height="16"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                      }
                                      onClick={() => openEditMatch(match)}
                                    />
                                  </Tooltip>
                                  <Tooltip
                                    label={match.is_visible ? "إخفاء" : "إظهار"}
                                  >
                                    <IconButton
                                      size="sm"
                                      colorScheme={
                                        match.is_visible ? "green" : "gray"
                                      }
                                      variant="ghost"
                                      icon={
                                        match.is_visible ? (
                                          <svg
                                            width="16"
                                            height="16"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                          </svg>
                                        ) : (
                                          <svg
                                            width="16"
                                            height="16"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.07.41-2.07 1.125-2.925M6.223 6.223A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.137-.41 2.2-1.123 3.063M3 3l18 18"
                                            />
                                          </svg>
                                        )
                                      }
                                      onClick={() =>
                                        handleToggleMatchVisibility(match.id)
                                      }
                                    />
                                  </Tooltip>
                                  <Tooltip label="حذف">
                                    <IconButton
                                      size="sm"
                                      colorScheme="red"
                                      variant="ghost"
                                      icon={
                                        <svg
                                          width="16"
                                          height="16"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                      }
                                      onClick={() => setMatchToDelete(match)}
                                    />
                                  </Tooltip>
                                  <Button
                                    as={Link}
                                    to={`/matche/${match.id}`}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                  >
                                    عرض المباراة
                                  </Button>
                                </>
                              )}
                              {!isAdmin &&
                                (() => {
                                  const availableNow =
                                    isMatchAvailableNow(match);
                                  return (
                                    <Button
                                      as={Link}
                                      to={`/matche/${match.id}`}
                                      size="sm"
                                      colorScheme={
                                        availableNow ? "blue" : "gray"
                                      }
                                      variant={
                                        availableNow ? "solid" : "outline"
                                      }
                                      isDisabled={!availableNow}
                                    >
                                      {availableNow
                                        ? "بدء المباراة"
                                        : "غير متاحة"}
                                    </Button>
                                  );
                                })()}
                            </HStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    </ScaleFade>
                  ))}
                </Grid>
              )}
            </CardBody>
          </Card>
        </Container>
      )}

      {/* Create Match Modal */}
      <Modal
        isOpen={isCreateMatchOpen}
        onClose={() => {
          setIsCreateMatchOpen(false);
          resetMatchForm();
        }}
        size="2xl"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent maxH="90vh" overflow="hidden">
          <ModalHeader
            bgGradient="linear(to-r, blue.500, purple.600)"
            color="white"
            borderTopRadius="md"
          >
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Box
                  w={10}
                  h={10}
                  bg="whiteAlpha.200"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="lg">إنشاء مباراة جديدة</Heading>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    أضف مباراة جديدة للدوري
                  </Text>
                </VStack>
              </HStack>
              <ModalCloseButton color="white" />
            </HStack>
          </ModalHeader>

          <ModalBody p={8} overflowY="auto">
            <VStack spacing={6} as="form" onSubmit={handleCreateMatch}>
              {/* Match Name */}
              <Box w="full">
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color={textColor}
                  mb={2}
                >
                  <HStack spacing={2}>
                    <Box color="blue.500">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </Box>
                    <Text>اسم المباراة</Text>
                  </HStack>
                </Text>
                <Input
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="مثال: المرحلة الأولى"
                  required
                  bg={cardBg}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px blue.500",
                  }}
                />
              </Box>

              {/* Description */}
              <Box w="full">
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color={textColor}
                  mb={2}
                >
                  <HStack spacing={2}>
                    <Box color="blue.500">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </Box>
                    <Text>الوصف (اختياري)</Text>
                  </HStack>
                </Text>
                <Textarea
                  value={matchDescription}
                  onChange={(e) => setMatchDescription(e.target.value)}
                  placeholder="وصف المباراة وأهدافها..."
                  rows={3}
                  resize="none"
                  bg={cardBg}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px blue.500",
                  }}
                />
              </Box>

              {/* Date & Time + Visibility */}
              <Grid
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                gap={6}
                w="full"
              >
                {/* Date & Time Removed per request */}
                <Box display="none">
                  {/* Hidden inputs if needed or just remove completely. 
                      User asked to delete, so I will remove the UI elements.
                      I am leaving this comment to mark where they were. 
                  */}
                </Box>

                <FormControl>
                  <FormLabel>
                    <HStack spacing={2}>
                      <Box color="blue.500">
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        مدة المباراة (بالدقائق)
                      </Text>
                    </HStack>
                  </FormLabel>
                  <NumberInput
                    value={durationMinutes}
                    onChange={(valueString) => setDurationMinutes(valueString)}
                    min={1}
                    bg={cardBg}
                    borderColor={borderColor}
                  >
                    <NumberInputField
                      placeholder="مثال: 60"
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px blue.500",
                      }}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText fontSize="xs" color={subTextColor} mt={1}>
                    المدة الزمنية للمباراة بالدقائق
                  </FormHelperText>
                </FormControl>

                <Box gridColumn={{ base: "1", md: "1 / -1" }}>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={textColor}
                    mb={2}
                  >
                    <HStack spacing={2}>
                      <Box color="blue.500">
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Box>
                      <Text>حالة الظهور</Text>
                    </HStack>
                  </Text>
                  <Checkbox
                    isChecked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    colorScheme="blue"
                    size="md"
                  >
                    ظاهر للطلاب
                  </Checkbox>
                </Box>
              </Grid>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 ml-2 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    صورة المباراة (اختياري)
                  </span>
                </label>
                <div className="relative">
                  <input
                    ref={matchImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setMatchImageFile(file);
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setMatchImagePreview(url);
                      } else {
                        setMatchImagePreview("");
                      }
                    }}
                    className="w-full px-4 py-3 border border-dashed border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                {(matchImagePreview ||
                  (isEditMatch && editingMatch?.image_url)) && (
                  <div className="mt-3">
                    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50">
                      <img
                        src={matchImagePreview || editingMatch?.image_url}
                        alt="preview"
                        className="w-full max-h-56 object-cover"
                      />
                    </div>
                    {matchImagePreview && (
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMatchImageFile(null);
                            setMatchImagePreview("");
                            try {
                              if (matchImageInputRef?.current)
                                matchImageInputRef.current.value = "";
                            } catch {}
                          }}
                          className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
                        >
                          إزالة الصورة
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              {createError && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  <Text>{createError}</Text>
                </Alert>
              )}
              {createMsg && (
                <Alert status="success" borderRadius="lg">
                  <AlertIcon />
                  <Text>{createMsg}</Text>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          {/* Modal Footer */}
          <Flex
            justify="flex-end"
            gap={4}
            p={8}
            borderTop="1px"
            borderColor={borderColor}
          >
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateMatchOpen(false);
                resetMatchForm();
              }}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateMatch}
              isLoading={creating}
              loadingText="جارٍ الإنشاء..."
            >
              إنشاء المباراة
            </Button>
          </Flex>
        </ModalContent>
      </Modal>

      {/* Delete Match Confirmation Modal */}
      <Modal
        isOpen={!!matchToDelete}
        onClose={() => setMatchToDelete(null)}
        size="md"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader
            bgGradient="linear(to-r, red.500, pink.600)"
            color="white"
          >
            <HStack justify="space-between" align="center">
              <Heading size="md">تأكيد حذف المباراة</Heading>
              <ModalCloseButton color="white" />
            </HStack>
          </ModalHeader>
          <ModalBody p={6}>
            <Text color={textColor}>
              سيتم حذف "{matchToDelete?.name}" نهائياً. هذا الإجراء لا يمكن
              التراجع عنه.
            </Text>
          </ModalBody>
          <Flex
            justify="flex-end"
            gap={3}
            p={6}
            borderTop="1px"
            borderColor={borderColor}
          >
            <Button variant="outline" onClick={() => setMatchToDelete(null)}>
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmDeleteMatch}
              isLoading={deletingMatch}
              loadingText="جارٍ الحذف..."
            >
              حذف نهائي
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
      <ScrollToTop />
    </Box>
  );
};

export default League;
