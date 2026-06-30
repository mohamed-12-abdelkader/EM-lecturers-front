import React from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  IconButton,
  Button,
  Tooltip,
  useColorModeValue,
  Center,
  useToast,
  SimpleGrid,
  Progress,
} from "@chakra-ui/react";
import {
  FaLock,
  FaEdit,
  FaTrash,
  FaPlus,
  FaVideo,
  FaFilePdf,
  FaEye,
  FaEyeSlash,
  FaComments,
  FaTasks,
  FaCog,
  FaPlay,
  FaDownload,
  FaPen,
  FaCheckCircle,
  FaRedo,
} from "react-icons/fa";
import baseUrl from "../../../api/baseUrl";
import { Link } from "react-router-dom";

const StatChip = ({ icon, label, value, colorScheme = "blue" }) => (
  <HStack
    spacing={2}
    px={3}
    py={2}
    borderRadius="full"
    bg={`${colorScheme}.50`}
    border="1px solid"
    borderColor={`${colorScheme}.100`}
    _dark={{ bg: `${colorScheme}.900`, borderColor: `${colorScheme}.700` }}
  >
    <Icon as={icon} color={`${colorScheme}.500`} boxSize={3.5} />
    <Text fontSize="xs" fontWeight="semibold" color={`${colorScheme}.700`} _dark={{ color: `${colorScheme}.200` }}>
      {value} {label}
    </Text>
  </HStack>
);

const SectionPanel = ({ children, accentColor = "blue", title, icon, action }) => (
  <Box
    bg="white"
    borderRadius="2xl"
    border="1px solid"
    borderColor="gray.100"
    _dark={{ bg: "gray.800", borderColor: "gray.700" }}
    overflow="hidden"
    boxShadow="sm"
  >
    <Flex
      align="center"
      justify="space-between"
      gap={3}
      px={{ base: 4, md: 5 }}
      py={3}
      bg={`${accentColor}.50`}
      _dark={{ bg: `${accentColor}.900`, borderColor: `${accentColor}.800` }}
      borderBottom="1px solid"
      borderColor={`${accentColor}.100`}
    >
      <HStack spacing={3}>
        <Center
          w="10"
          h="10"
          borderRadius="xl"
          bg="white"
          _dark={{ bg: `${accentColor}.800` }}
          boxShadow="sm"
        >
          <Icon as={icon} color={`${accentColor}.500`} boxSize={4} />
        </Center>
        <Text fontWeight="bold" fontSize="md" color="gray.800" _dark={{ color: "white" }}>
          {title}
        </Text>
      </HStack>
      {action}
    </Flex>
    <Box px={{ base: 4, md: 5 }} py={4}>
      {children}
    </Box>
  </Box>
);

const getVideoStatus = (video) => {
  if (video.is_completed) {
    return { label: "مكتمل", colorScheme: "green", icon: FaCheckCircle };
  }
  if (video.is_watched) {
    return { label: "تمت المشاهدة", colorScheme: "blue", icon: FaEye };
  }
  return { label: "لم يُشاهد", colorScheme: "gray", icon: FaPlay };
};

const getExamStatus = (exam) => {
  if (!exam) return null;
  if (exam.is_solved) {
    return { label: "تم الحل", colorScheme: "green", cta: "عرض النتيجة", icon: FaCheckCircle };
  }
  if (exam.in_progress || exam.is_started) {
    return { label: "قيد التنفيذ", colorScheme: "orange", cta: "متابعة الواجب", icon: FaPen };
  }
  return { label: "لم يُبدأ", colorScheme: "gray", cta: "ابدأ الواجب", icon: FaPen };
};

const formatViewedAt = (dateStr, formatDate) => {
  if (!dateStr) return null;
  return formatDate ? formatDate(dateStr) : new Date(dateStr).toLocaleDateString("ar-EG");
};

const LectureCard = ({
  lecture,
  lectureIndex = 0,
  isTeacher,
  isAdmin,
  handleEditLecture,
  handleDeleteLecture,
  handleAddVideo,
  handleDeleteVideo,
  handleAddFile,
  handleDeleteFile,
  setExamModal,
  setDeleteExamDialog,
  examActionLoading,
  formatDate,
  ...props
}) => {
  const toast = useToast();
  const [visibilityLoading, setVisibilityLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(lecture.is_visible ?? true);
  const [lectureExam, setLectureExam] = React.useState(null);
  const [examLoading, setExamLoading] = React.useState(false);
  const [commentsStats, setCommentsStats] = React.useState({
    total: 0,
    loading: false,
  });
  const [essayExam, setEssayExam] = React.useState(null);
  const canManage = isTeacher || isAdmin;

  const cardBg = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const titleColor = useColorModeValue("gray.900", "white");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const numberBg = useColorModeValue("blue.600", "blue.400");
  const videoBorderCompleted = useColorModeValue("green.200", "green.700");
  const videoBorderWatched = useColorModeValue("blue.200", "blue.700");
  const videoBorderDefault = useColorModeValue("gray.100", "gray.700");
  const videoBgCompleted = useColorModeValue("green.50", "green.900");
  const videoBgWatched = useColorModeValue("blue.50", "blue.900");
  const videoBgDefault = useColorModeValue("gray.50", "gray.900");
  const examBgSolved = useColorModeValue("green.50", "green.900");
  const examBgProgress = useColorModeValue("orange.50", "orange.900");
  const examBgDefault = useColorModeValue("purple.50", "purple.900");
  const examBorderSolved = useColorModeValue("green.200", "green.700");
  const examBorderProgress = useColorModeValue("orange.200", "orange.700");
  const examBorderDefault = useColorModeValue("purple.200", "purple.700");
  const progressTrackBg = useColorModeValue("gray.100", "gray.700");

  const handleToggleVisibility = async (e) => {
    e.stopPropagation();
    setVisibilityLoading(true);
    try {
      const token = localStorage.getItem("token");
      await baseUrl.patch(
        `/api/course/lecture/${lecture.id}/visibility`,
        { is_visible: !isVisible },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsVisible(!isVisible);
    } catch (error) {
      toast({
        title: "تعذر تحديث حالة الإظهار",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setVisibilityLoading(false);
    }
  };

  const fetchLectureExam = async () => {
    if (!lecture.id) return;
    setExamLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/course/lecture/${lecture.id}/exam`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLectureExam(response.data.exam || response.data);
    } catch {
      setLectureExam(null);
    } finally {
      setExamLoading(false);
    }
  };

  const fetchCommentsStats = async () => {
    if (!lecture.id) return;
    setCommentsStats((prev) => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/lecture/${lecture.id}/comments/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommentsStats({ total: response.data.total || 0, loading: false });
    } catch {
      setCommentsStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchEssayExam = async () => {
    if (!lecture.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/essay-exams/lectures/${lecture.id}/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEssayExam(
        response.data.exams && response.data.exams.length > 0 ? response.data.exams[0] : null
      );
    } catch {
      setEssayExam(null);
    }
  };

  React.useEffect(() => {
    fetchCommentsStats();
    if (canManage) {
      fetchEssayExam();
      if (lecture.exam) {
        setLectureExam(lecture.exam);
      } else {
        fetchLectureExam();
      }
    }
  }, [lecture.id, lecture.exam, canManage]);

  const examToShow = canManage ? lectureExam || lecture.exam : lecture.exam;
  const progress = lecture.progress;
  const videosCount = progress?.total_videos ?? lecture.videos?.length ?? 0;
  const watchedVideos = progress?.watched_videos ?? lecture.videos?.filter((v) => v.is_watched).length ?? 0;
  const filesCount = lecture.files?.length || 0;
  const hasMainExam = !!examToShow;
  const hasEssayExam = !!essayExam;
  const totalExamsCount = Number(hasMainExam) + Number(hasEssayExam);
  const examStatus = getExamStatus(examToShow);
  const progressPercent =
    progress && progress.total_videos > 0
      ? Math.round((progress.watched_videos / progress.total_videos) * 100)
      : videosCount > 0
        ? Math.round((watchedVideos / videosCount) * 100)
        : 0;
  const isLectureComplete =
    progress?.all_videos_watched && (!hasMainExam || progress?.exam_solved);
  const isLockedForViewer = Boolean(lecture.locked) && !canManage;
  const lectureDescription = lecture.description || lecture.objective || "";

  const showVideosSection = videosCount > 0 || (lecture.videos?.length > 0) || canManage;
  const showFilesSection = filesCount > 0 || canManage;
  const showHomeworkSection = canManage || hasMainExam;

  const openExamModal = (type, data = null) => {
    setExamModal({ isOpen: true, type, lectureId: lecture.id, data });
  };

  const openDeleteExamDialog = (exam) => {
    setDeleteExamDialog({
      isOpen: true,
      examId: exam.id,
      title: exam.title || "واجب المحاضرة",
    });
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      overflow="hidden"
      border="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      boxShadow="md"
    >
      {/* ── Header ── */}
      <Flex
        direction={{ base: "column", md: "row" }}
        gap={4}
        p={{ base: 4, md: 5 }}
        bg={useColorModeValue("linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)", "gray.800")}
        borderBottom="1px solid"
        borderColor={useColorModeValue("blue.100", "gray.700")}
      >
        <HStack align="start" spacing={4} flex="1" minW={0}>
          <Center
            w="12"
            h="12"
            borderRadius="2xl"
            bg={numberBg}
            color="white"
            fontWeight="black"
            fontSize="lg"
            flexShrink={0}
            boxShadow="md"
          >
            {lectureIndex + 1}
          </Center>

          <VStack align="start" spacing={2} flex="1" minW={0}>
            <HStack spacing={2} wrap="wrap">
              <Badge
                colorScheme={lecture.locked ? "red" : "green"}
                borderRadius="full"
                px={3}
                py={0.5}
                fontSize="xs"
              >
                {lecture.locked ? "مغلق" : "مفتوح"}
              </Badge>
              {canManage && (
                <Badge
                  colorScheme={isVisible ? "blue" : "gray"}
                  borderRadius="full"
                  px={3}
                  py={0.5}
                  fontSize="xs"
                >
                  {isVisible ? "ظاهر للطلاب" : "مخفي"}
                </Badge>
              )}
              {!canManage && isLectureComplete && (
                <Badge colorScheme="green" borderRadius="full" px={3} py={0.5} fontSize="xs">
                  مكتملة
                </Badge>
              )}
            </HStack>

            <Text fontWeight="extrabold" fontSize={{ base: "lg", md: "xl" }} color={titleColor} lineHeight="short">
              {lecture.title}
            </Text>

            {lectureDescription && (
              <Text color={mutedColor} fontSize="sm" lineHeight="tall">
                {lectureDescription}
              </Text>
            )}

            {!canManage && progress && videosCount > 0 && (
              <Box w="full" pt={1}>
                <Flex justify="space-between" align="center" mb={1.5}>
                  <Text fontSize="xs" fontWeight="semibold" color={mutedColor}>
                    تقدم المحاضرة
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color={titleColor}>
                    {progress.watched_videos}/{progress.total_videos} فيديو
                    {hasMainExam && (
                      <Text as="span" color={progress.exam_solved ? "green.500" : "orange.500"}>
                        {" "}• {progress.exam_solved ? "الواجب محلول" : "الواجب لم يُحل"}
                      </Text>
                    )}
                  </Text>
                </Flex>
                <Progress
                  value={progressPercent}
                  size="sm"
                  borderRadius="full"
                  colorScheme={isLectureComplete ? "green" : "blue"}
                  bg={progressTrackBg}
                />
              </Box>
            )}

            <HStack spacing={2} wrap="wrap" pt={1}>
              {(videosCount > 0 || canManage) && (
                <StatChip icon={FaVideo} label="فيديو" value={videosCount} colorScheme="blue" />
              )}
              {(filesCount > 0 || canManage) && (
                <StatChip icon={FaFilePdf} label="ملف" value={filesCount} colorScheme="orange" />
              )}
              {(totalExamsCount > 0 || canManage) && (
                <StatChip icon={FaTasks} label="واجب" value={totalExamsCount} colorScheme="purple" />
              )}
              <StatChip
                icon={FaComments}
                label="تعليق"
                value={commentsStats.loading ? "…" : commentsStats.total}
                colorScheme="teal"
              />
            </HStack>
          </VStack>
        </HStack>

        {canManage && (
          <HStack spacing={1} alignSelf={{ base: "flex-end", md: "flex-start" }} flexShrink={0}>
            <Tooltip label="تعديل المحاضرة">
              <IconButton
                aria-label="edit lecture"
                icon={<Icon as={FaEdit} />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={() => handleEditLecture?.(lecture)}
              />
            </Tooltip>
            <Tooltip label="حذف المحاضرة">
              <IconButton
                aria-label="delete lecture"
                icon={<Icon as={FaTrash} />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleDeleteLecture?.(lecture.id, lecture.title || "المحاضرة")}
              />
            </Tooltip>
            <Tooltip label={isVisible ? "إخفاء عن الطلاب" : "إظهار للطلاب"}>
              <IconButton
                aria-label="toggle lecture visibility"
                icon={<Icon as={isVisible ? FaEye : FaEyeSlash} />}
                isLoading={visibilityLoading}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={handleToggleVisibility}
              />
            </Tooltip>
          </HStack>
        )}
      </Flex>

      {/* ── Body ── */}
      <Box p={{ base: 4, md: 5 }} bg={pageBg}>
        {isLockedForViewer ? (
          <Flex
            align="center"
            gap={4}
            p={5}
            borderRadius="2xl"
            bg="red.50"
            _dark={{ bg: "red.900" }}
            border="2px dashed"
            borderColor="red.300"
          >
            <Center w="14" h="14" borderRadius="full" bg="red.100" _dark={{ bg: "red.800" }} flexShrink={0}>
              <Icon as={FaLock} color="red.500" boxSize={6} />
            </Center>
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="md" color="red.700" _dark={{ color: "red.200" }}>
                هذه المحاضرة مغلقة
              </Text>
              <Text fontSize="sm" color="red.600" _dark={{ color: "red.300" }}>
                أكمل واجب المحاضرة السابقة بنجاح لفتح هذا المحتوى.
              </Text>
            </VStack>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            {showVideosSection && (
              <SectionPanel
                title="فيديوهات المحاضرة"
                icon={FaVideo}
                accentColor="blue"
                action={
                  canManage ? (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaPlus} />}
                      borderRadius="full"
                      onClick={() => handleAddVideo(lecture.id)}
                    >
                      إضافة فيديو
                    </Button>
                  ) : null
                }
              >
                {videosCount === 0 ? (
                  canManage && (
                    <Text color={mutedColor} fontSize="sm" textAlign="center" py={2}>
                      لم تُضف فيديوهات بعد
                    </Text>
                  )
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {lecture.videos.map((video, index) => {
                      const videoStatus = getVideoStatus(video);
                      const viewedLabel = formatViewedAt(video.viewed_at, formatDate);
                      const videoBtnLabel = video.is_completed
                        ? "إعادة المشاهدة"
                        : video.is_watched
                          ? "متابعة"
                          : "مشاهدة";

                      return (
                      <Flex
                        key={video.id}
                        align="center"
                        gap={4}
                        p={3}
                        borderRadius="xl"
                        border="2px solid"
                        borderColor={
                          video.is_completed
                            ? videoBorderCompleted
                            : video.is_watched
                              ? videoBorderWatched
                              : videoBorderDefault
                        }
                        bg={
                          video.is_completed
                            ? videoBgCompleted
                            : video.is_watched
                              ? videoBgWatched
                              : videoBgDefault
                        }
                        _hover={{ shadow: "sm" }}
                        transition="all 0.2s"
                        direction={{ base: "column", sm: "row" }}
                      >
                        <HStack flex="1" minW={0} w="full">
                          <Center
                            w="11"
                            h="11"
                            borderRadius="full"
                            bg={video.is_completed ? "green.500" : video.is_watched ? "blue.500" : "gray.400"}
                            color="white"
                            fontWeight="bold"
                            fontSize="sm"
                            flexShrink={0}
                          >
                            {video.is_completed ? (
                              <Icon as={FaCheckCircle} boxSize={4} />
                            ) : (
                              index + 1
                            )}
                          </Center>
                          <VStack align="start" spacing={1} minW={0} flex="1">
                            <HStack spacing={2} wrap="wrap">
                              <Text fontWeight="bold" fontSize="sm" color={titleColor} noOfLines={2}>
                                {video.title || `الفيديو ${index + 1}`}
                              </Text>
                              {!canManage && (
                                <Badge
                                  colorScheme={videoStatus.colorScheme}
                                  borderRadius="full"
                                  fontSize="10px"
                                  display="flex"
                                  alignItems="center"
                                  gap={1}
                                >
                                  <Icon as={videoStatus.icon} boxSize={2.5} />
                                  {videoStatus.label}
                                </Badge>
                              )}
                            </HStack>
                            {viewedLabel && !canManage && (
                              <Text fontSize="xs" color={mutedColor}>
                                آخر مشاهدة: {viewedLabel}
                              </Text>
                            )}
                            {video.duration && (
                              <Text fontSize="xs" color={mutedColor}>
                                المدة: {video.duration}
                              </Text>
                            )}
                          </VStack>
                        </HStack>

                        <HStack spacing={2} flexShrink={0}>
                          <Button
                            as={Link}
                            to={`/video/${video.id}`}
                            size="md"
                            colorScheme={video.is_completed ? "green" : "blue"}
                            leftIcon={<Icon as={video.is_completed ? FaRedo : FaPlay} />}
                            borderRadius="full"
                            px={6}
                            w={{ base: "full", sm: "auto" }}
                            variant={video.is_watched && !video.is_completed ? "outline" : "solid"}
                          >
                            {videoBtnLabel}
                          </Button>
                          {canManage && (
                            <IconButton
                              aria-label="delete video"
                              icon={<Icon as={FaTrash} />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDeleteVideo(video.id, video.title || "فيديو")}
                            />
                          )}
                        </HStack>
                      </Flex>
                    );})}
                  </VStack>
                )}
              </SectionPanel>
            )}

            {showFilesSection && (
              <SectionPanel
                title="ملفات المحاضرة"
                icon={FaFilePdf}
                accentColor="orange"
                action={
                  canManage ? (
                    <Button
                      size="sm"
                      colorScheme="orange"
                      leftIcon={<Icon as={FaPlus} />}
                      borderRadius="full"
                      onClick={() => handleAddFile(lecture.id)}
                    >
                      إضافة ملف
                    </Button>
                  ) : null
                }
              >
                {filesCount === 0 ? (
                  canManage && (
                    <Text color={mutedColor} fontSize="sm" textAlign="center" py={2}>
                      لم تُرفق ملفات بعد
                    </Text>
                  )
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {lecture.files.map((file) => (
                      <Flex
                        key={file.id}
                        align="center"
                        gap={3}
                        p={4}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={useColorModeValue("orange.100", "orange.800")}
                        bg={useColorModeValue("orange.50", "whiteAlpha.50")}
                        _hover={{ shadow: "md", borderColor: "orange.300" }}
                        transition="all 0.2s"
                      >
                        <Center
                          w="12"
                          h="12"
                          borderRadius="xl"
                          bg="white"
                          _dark={{ bg: "orange.900" }}
                          flexShrink={0}
                          boxShadow="sm"
                        >
                          <Icon as={FaFilePdf} color="orange.500" boxSize={5} />
                        </Center>
                        <VStack align="start" spacing={0} flex="1" minW={0}>
                          <Text fontWeight="bold" fontSize="sm" color={titleColor} noOfLines={2}>
                            {file.title || "ملف PDF"}
                          </Text>
                          <Text fontSize="xs" color={mutedColor}>
                            ملف مرفق
                          </Text>
                        </VStack>
                        <VStack spacing={1}>
                          {file.file_url && (
                            <Button
                              as="a"
                              href={file.file_url}
                              target="_blank"
                              size="sm"
                              colorScheme="orange"
                              leftIcon={<Icon as={FaDownload} />}
                              borderRadius="full"
                            >
                              تحميل
                            </Button>
                          )}
                          {canManage && (
                            <IconButton
                              aria-label="delete file"
                              icon={<Icon as={FaTrash} />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDeleteFile(file.id, file.title || "ملف")}
                            />
                          )}
                        </VStack>
                      </Flex>
                    ))}
                  </SimpleGrid>
                )}
              </SectionPanel>
            )}

            {showHomeworkSection && (
              <SectionPanel
                title="واجب المحاضرة"
                icon={FaTasks}
                accentColor="purple"
                action={null}
              >
                {examLoading && canManage ? (
                  <Text fontSize="sm" color={mutedColor} textAlign="center" py={2}>
                    جاري تحميل الواجب...
                  </Text>
                ) : hasMainExam ? (
                  <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "stretch", md: "center" }}
                    gap={4}
                    p={4}
                    borderRadius="xl"
                    bg={
                      examToShow.is_solved
                        ? examBgSolved
                        : examToShow.in_progress || examToShow.is_started
                          ? examBgProgress
                          : examBgDefault
                    }
                    border="2px solid"
                    borderColor={
                      examToShow.is_solved
                        ? examBorderSolved
                        : examToShow.in_progress || examToShow.is_started
                          ? examBorderProgress
                          : examBorderDefault
                    }
                  >
                    <Center
                      w="14"
                      h="14"
                      borderRadius="2xl"
                      bg={
                        examToShow.is_solved
                          ? "green.500"
                          : examToShow.in_progress || examToShow.is_started
                            ? "orange.500"
                            : "purple.500"
                      }
                      color="white"
                      flexShrink={0}
                      boxShadow="md"
                    >
                      <Icon as={examStatus?.icon || FaPen} boxSize={6} />
                    </Center>

                    <VStack align="start" spacing={1} flex="1">
                      <HStack spacing={2} wrap="wrap">
                        <Text fontWeight="bold" fontSize="md" color={titleColor}>
                          {examToShow.title || "واجب المحاضرة"}
                        </Text>
                        {!canManage && examStatus && (
                          <Badge colorScheme={examStatus.colorScheme} borderRadius="full" fontSize="xs">
                            {examStatus.label}
                          </Badge>
                        )}
                      </HStack>
                      {canManage ? (
                        <HStack spacing={4} fontSize="sm" color={mutedColor} wrap="wrap">
                          <HStack spacing={1}>
                            <Text fontWeight="semibold">الدرجة:</Text>
                            <Text>{examToShow.total_grade ?? "—"}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Text fontWeight="semibold">المدة:</Text>
                            <Text>{examToShow.duration ?? "—"} دقيقة</Text>
                          </HStack>
                        </HStack>
                      ) : (
                        <VStack align="start" spacing={0.5}>
                          {examToShow.student_submission?.score != null && (
                            <Text fontSize="sm" color="green.600" fontWeight="semibold">
                              درجتك: {examToShow.student_submission.score}
                            </Text>
                          )}
                          {progress && (
                            <Text fontSize="xs" color={mutedColor}>
                              {progress.exam_solved ? "أنهيت هذا الواجب بنجاح" : "أكمل الواجب لإتمام المحاضرة"}
                            </Text>
                          )}
                        </VStack>
                      )}
                    </VStack>

                    <HStack spacing={2} flexWrap="wrap">
                      {!canManage && (
                        <Button
                          as={Link}
                          to={`/ComprehensiveExam/${examToShow.id}`}
                          size="lg"
                          colorScheme={
                            examToShow.is_solved
                              ? "green"
                              : examToShow.in_progress || examToShow.is_started
                                ? "orange"
                                : "purple"
                          }
                          leftIcon={<Icon as={examStatus?.icon || FaPen} />}
                          borderRadius="full"
                          px={8}
                          w={{ base: "full", md: "auto" }}
                        >
                          {examStatus?.cta || "ابدأ الواجب"}
                        </Button>
                      )}
                      {canManage && (
                        <>
                          <Button
                            as={Link}
                            to={`/ComprehensiveExam/${examToShow.id}`}
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            leftIcon={<Icon as={FaCog} />}
                            borderRadius="full"
                          >
                            إدارة
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FaEdit} />}
                            colorScheme="purple"
                            borderRadius="full"
                            onClick={() => openExamModal("edit", examToShow)}
                          >
                            تعديل
                          </Button>
                          <IconButton
                            aria-label="delete homework"
                            icon={<Icon as={FaTrash} />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            isLoading={examActionLoading}
                            onClick={() => openDeleteExamDialog(examToShow)}
                          />
                        </>
                      )}
                    </HStack>
                  </Flex>
                ) : (
                  canManage && (
                    <Flex justify="center" py={2}>
                      <Button
                        size="md"
                        leftIcon={<Icon as={FaPlus} />}
                        colorScheme="purple"
                        borderRadius="full"
                        onClick={() => openExamModal("add", null)}
                      >
                        إضافة واجب للمحاضرة
                      </Button>
                    </Flex>
                  )
                )}
              </SectionPanel>
            )}

            {/* Footer */}
            <Flex
              justify="space-between"
              align="center"
              gap={3}
              p={4}
              borderRadius="xl"
              bg={useColorModeValue("white", "gray.800")}
              border="1px solid"
              borderColor={useColorModeValue("gray.100", "gray.700")}
              direction={{ base: "column", sm: "row" }}
            >
              <Text fontSize="xs" color={mutedColor}>
                {formatDate ? formatDate(lecture.created_at) : lecture.created_at}
              </Text>
              <Button
                as={Link}
                to={`/lecture/${lecture.id}/comments`}
                size="sm"
                colorScheme="teal"
                variant="outline"
                leftIcon={<Icon as={FaComments} />}
                borderRadius="full"
              >
                التعليقات
                {!commentsStats.loading && commentsStats.total > 0 && ` (${commentsStats.total})`}
              </Button>
            </Flex>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default LectureCard;
