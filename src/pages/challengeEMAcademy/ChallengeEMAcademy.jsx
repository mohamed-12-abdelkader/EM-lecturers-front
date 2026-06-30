import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Heading,
  Icon,
  Text,
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
  Badge,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Spinner,
  useToast,
  NumberInput,
  NumberInputField,
  Container,
  SimpleGrid,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaGamepad,
  FaTrophy,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaUsers,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import { getSocketEndpoint } from "../../utils/socketEndpoint";
import { io } from 'socket.io-client';

const ChallengeEMAcademy = () => {
  const toast = useToast();
  const gameModal = useDisclosure();
  const authHeader = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  }), []);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Game invite state
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);
  const [inviteeIds, setInviteeIds] = useState([""]); // Array of input values
  const [questionsCount, setQuestionsCount] = useState(10);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [outgoingInvitations, setOutgoingInvitations] = useState(null);
  const [latestInvitation, setLatestInvitation] = useState(null);
  const invitationModal = useDisclosure();
  const socketRef = useRef(null);

  // Fetch subjects when game modal opens initially
  useEffect(() => {
    if (gameModal.isOpen && subjects.length === 0 && !subjectsLoading) {
      (async () => {
        try {
          setSubjectsLoading(true);
          const res = await baseUrl.get('/api/question-banks/student/subjects', { headers: authHeader });
          setSubjects(res?.data?.data || []);
        } catch (e) {
          toast({ title: 'تعذر جلب المواد', status: 'error' });
        } finally {
          setSubjectsLoading(false);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameModal.isOpen]);

  const handleSubjectChange = async (e) => {
    const val = e.target.value;
    setSelectedSubjectId(val);
    setSelectedChapterId("");
    setChapters([]);
    setLessons([]);
    setSelectedLessonIds([]);
    if (!val) return;
    try {
      setChaptersLoading(true);
      const res = await baseUrl.get(`/api/question-banks/student/subjects/${val}/chapters`, { headers: authHeader });
      setChapters(res?.data?.data || []);
    } catch (e) {
      toast({ title: 'تعذر جلب الفصول', status: 'error' });
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleChapterChange = async (e) => {
    const val = e.target.value;
    setSelectedChapterId(val);
    if (!val) { setLessons([]); return; }
    try {
      setLessonsLoading(true);
      const res = await baseUrl.get(`/api/question-banks/student/chapters/${val}/lessons`, { headers: authHeader });
      setLessons(res?.data?.data || []);
    } catch (e) {
      toast({ title: 'تعذر جلب الدروس', status: 'error' });
    } finally {
      setLessonsLoading(false);
    }
  };

  const toggleLessonSelection = (lessonId) => {
    setSelectedLessonIds((prev) => prev.includes(lessonId)
      ? prev.filter((id) => id !== lessonId)
      : [...prev, lessonId]
    );
  };

  const handleInviteeChange = (index, value) => {
    const newInviteeIds = [...inviteeIds];
    newInviteeIds[index] = value;
    setInviteeIds(newInviteeIds);
  };

  const addInviteeInput = () => {
    if (inviteeIds.length < 8) {
      setInviteeIds([...inviteeIds, ""]);
    } else {
      toast({ title: 'لا يمكن إضافة أكثر من 8 طلاب', status: 'warning' });
    }
  };

  const removeInviteeInput = (index) => {
    if (inviteeIds.length > 1) {
      const newInviteeIds = inviteeIds.filter((_, i) => i !== index);
      setInviteeIds(newInviteeIds);
    }
  };

  const handleSendInvite = async () => {
    // Validate and extract invitee IDs
    const validInviteeIds = inviteeIds
      .map((id) => String(id).trim())
      .filter(Boolean)
      .map((id) => Number(id))
      .filter((n) => !Number.isNaN(n) && n > 0);

    if (validInviteeIds.length === 0) {
      toast({ title: 'أدخل أكواد الأصدقاء (IDs) صحيحة', status: 'warning' });
      return;
    }

    if (selectedLessonIds.length === 0) {
      toast({ title: 'اختر درساً واحداً على الأقل', status: 'warning' });
      return;
    }

    setIsSendingInvite(true);
    try {
      const payload = {
        inviteeIds: validInviteeIds,
        lessonIds: selectedLessonIds,
        questionsCount: Number(questionsCount) || 10,
      };
      const res = await baseUrl.post('/api/game/invite', payload, { headers: authHeader });
      if (res?.data) {
        toast({ title: 'تم إرسال الدعوة بنجاح', status: 'success' });
        gameModal.onClose();
        setSelectedSubjectId("");
        setSelectedChapterId("");
        setChapters([]);
        setLessons([]);
        setSelectedLessonIds([]);
        setInviteeIds([""]);
        setQuestionsCount(10);
        // Refresh outgoing invitations
        fetchOutgoingInvitations();
      }
    } catch (e) {
      toast({ title: 'تعذر إرسال الدعوة', status: 'error' });
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Fetch outgoing invitations (silent - no loading state)
  const fetchOutgoingInvitations = async () => {
    try {
      const res = await baseUrl.get('/api/game/invitations/latest-outgoing', { headers: authHeader });
      if (res?.data?.success && res?.data?.data) {
        setOutgoingInvitations(res.data.data);
      } else {
        setOutgoingInvitations(null);
      }
    } catch (e) {
      // Silent fail - no invitation or error
      setOutgoingInvitations(null);
    }
  };

  useEffect(() => {
    fetchOutgoingInvitations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeader]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const tokenOnly = (localStorage.getItem('Authorization') || '').replace(/^Bearer\s+/i, '') || localStorage.getItem('token');
    const socket = io(getSocketEndpoint(), {
      path: '/socket.io',
      withCredentials: true,
      auth: tokenOnly ? { token: tokenOnly } : {},
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected for outgoing invitations');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (e) => {
      console.error('Socket connect_error:', e);
    });

    // Handler for outgoing invitation updates
    const handleOutgoingUpdate = (payload) => {
      console.log('📥 Received outgoing invitation update:', payload);
      if (payload?.invitationGroup || payload?.data) {
        const invitationGroup = payload.invitationGroup || payload.data;
        console.log('📨 Setting outgoing invitations:', invitationGroup);
        setOutgoingInvitations(invitationGroup);
      }
    };

    // Listen to multiple possible event names for outgoing invitations
    socket.on('game:outgoing-invitation-updated', handleOutgoingUpdate);
    socket.on('game:invitation-status-changed', handleOutgoingUpdate);
    socket.on('game:outgoing-updated', handleOutgoingUpdate);
    socket.on('outgoing:invitation-updated', handleOutgoingUpdate);
    socket.on('invitation:outgoing-updated', handleOutgoingUpdate);

    // Listen for invitation status changes (accept/reject)
    socket.on('game:invitation-status-changed', (payload) => {
      console.log('🔄 Invitation status changed:', payload);
      if (payload?.invitationGroup || payload?.data) {
        setOutgoingInvitations(payload.invitationGroup || payload.data);
      } else {
        // Refresh silently if we don't have full data
        fetchOutgoingInvitations();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "orange", icon: FaHourglassHalf, text: "في الانتظار" },
      accepted: { color: "green", icon: FaCheckCircle, text: "مقبولة" },
      rejected: { color: "red", icon: FaTimesCircle, text: "مرفوضة" },
      expired: { color: "gray", icon: FaClock, text: "منتهية" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge colorScheme={config.color} variant="solid" borderRadius="full" px={3} py={1}>
        <HStack spacing={1}>
          <Icon as={config.icon} boxSize={3} />
          <Text fontSize="xs">{config.text}</Text>
        </HStack>
      </Badge>
    );
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Heading size="2xl" color="blue.600" mb={4}>
            🎮 تحدّي EM Academy
          </Heading>
          <Text fontSize="lg" color="gray.600">
            اختر دروسك، دع أصدقاءك، وابدأ التحدي!
          </Text>
        </Box>

        {/* Create Challenge Card */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          p={8}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Icon as={FaGamepad} w={20} h={20} color="blue.500" />
            <Heading size="lg" color="blue.700">
              ابدأ تحدي جديد
            </Heading>
            <Text fontSize="md" color="gray.600" maxW="500px">
              اختر الدروس التي تريد التحدي فيها، ادع أصدقاءك، وابدأ لعبة تعليمية ممتعة!
            </Text>
            <Button
              onClick={gameModal.onOpen}
              colorScheme="blue"
              size="lg"
              borderRadius="full"
              px={8}
              leftIcon={<FaTrophy />}
              bgGradient="linear(135deg, blue.500, blue.600)"
              _hover={{ bgGradient: "linear(135deg, blue.600, blue.700)" }}
              color="white"
              fontWeight="bold"
            >
              إنشاء تحدي جديد
            </Button>
          </VStack>
        </Box>

        {/* Outgoing Invitations */}
        {outgoingInvitations ? (
          <Box
            bg={cardBg}
            borderRadius="2xl"
            p={6}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <HStack justify="space-between" align="center">
                <Heading size="lg" color="blue.700">
                  دعوتك الأخيرة
                </Heading>
                <Button size="sm" variant="ghost" onClick={fetchOutgoingInvitations}>
                  تحديث
                </Button>
              </HStack>

              {/* Summary Cards */}
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Box bg="orange.50" p={4} borderRadius="lg" border="1px solid" borderColor="orange.200">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaHourglassHalf} color="orange.600" />
                    <Text fontSize="sm" color="orange.700" fontWeight="semibold">في الانتظار</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.800">{outgoingInvitations.summary?.pending || 0}</Text>
                </Box>
                <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaCheckCircle} color="green.600" />
                    <Text fontSize="sm" color="green.700" fontWeight="semibold">مقبولة</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="green.800">{outgoingInvitations.summary?.accepted || 0}</Text>
                </Box>
                <Box bg="red.50" p={4} borderRadius="lg" border="1px solid" borderColor="red.200">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaTimesCircle} color="red.600" />
                    <Text fontSize="sm" color="red.700" fontWeight="semibold">مرفوضة</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="red.800">{outgoingInvitations.summary?.rejected || 0}</Text>
                </Box>
                <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FaClock} color="gray.600" />
                    <Text fontSize="sm" color="gray.700" fontWeight="semibold">منتهية</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">{outgoingInvitations.summary?.expired || 0}</Text>
                </Box>
              </SimpleGrid>

              {/* Game Info */}
              <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200">
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>عدد الأسئلة</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.800">{outgoingInvitations.questionsCount}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>إجمالي المدعوين</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.800">{outgoingInvitations.totalInvited}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>ينتهي في</Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.800">
                      {new Date(outgoingInvitations.expiresAt).toLocaleString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>

              {/* Lessons */}
              {outgoingInvitations.lessonNames && outgoingInvitations.lessonNames.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={3} color="gray.700">الدروس المختارة:</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {outgoingInvitations.lessonNames.map((lesson) => (
                      <Badge key={lesson.id} colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                        {lesson.name}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Invitations List */}
              <Box>
                <Text fontWeight="semibold" mb={3} color="gray.700">قائمة المدعوين:</Text>
                <VStack spacing={3} align="stretch">
                  {outgoingInvitations.invitations?.map((invitation) => (
                    <Box
                      key={invitation.id}
                      bg="white"
                      p={4}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack justify="space-between" align="center">
                        <HStack spacing={3} flex={1}>
                          <Icon as={FaUsers} color="blue.500" boxSize={5} />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="bold" color="gray.800">{invitation.inviteeName}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {invitation.statusMessage || invitation.status}
                            </Text>
                          </VStack>
                        </HStack>
                        {getStatusBadge(invitation.status)}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* Start Game Button */}
              {outgoingInvitations.canStartGame && (
                <Button
                  colorScheme="green"
                  size="lg"
                  borderRadius="full"
                  leftIcon={<FaGamepad />}
                  bgGradient="linear(135deg, green.500, green.600)"
                  _hover={{ bgGradient: "linear(135deg, green.600, green.700)" }}
                  color="white"
                  fontWeight="bold"
                >
                  ابدأ اللعبة الآن
                </Button>
              )}
            </VStack>
          </Box>
        ) : (
          <Box
            bg={cardBg}
            borderRadius="2xl"
            p={8}
            border="1px solid"
            borderColor={borderColor}
            textAlign="center"
          >
            <VStack spacing={4}>
              <Icon as={FaTrophy} w={16} h={16} color="gray.400" />
              <Text fontSize="lg" color="gray.600">لا توجد دعوات صادرة حالياً</Text>
              <Text fontSize="sm" color="gray.500">قم بإنشاء تحدي جديد لبدء اللعبة مع أصدقائك</Text>
            </VStack>
          </Box>
        )}

        {/* Game Challenge Modal */}
        <Modal isOpen={gameModal.isOpen} onClose={gameModal.onClose} isCentered size="xl">
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
            <ModalHeader bg="blue.300" py={6}>
              <HStack spacing={3}>
                <Box
                  w="54px"
                  h="54px"
                  bgGradient="linear(135deg, blue.400 0%,blue.600 100%)"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FaGamepad} w="26px" h="26px" color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="white">العب وتحدَّي أصحابك</Heading>
                  <Text fontSize="sm" color="white">أدخل التفاصيل للبدء</Text>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalBody bg="white" py={6}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>اختر المادة</FormLabel>
                  <Select placeholder="اختر المادة" bg="gray.50" value={selectedSubjectId} onChange={handleSubjectChange}>
                    {subjectsLoading ? (
                      <option>جاري التحميل...</option>
                    ) : (
                      subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </Select>
                </FormControl>

                <FormControl isDisabled={!selectedSubjectId}>
                  <FormLabel>اختر الفصل</FormLabel>
                  <Select placeholder="اختر الفصل" bg="gray.50" value={selectedChapterId} onChange={handleChapterChange}>
                    {chaptersLoading ? (
                      <option>جاري التحميل...</option>
                    ) : (
                      chapters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </Select>
                </FormControl>

                <FormControl isDisabled={!selectedChapterId}>
                  <FormLabel>اختر الدروس (يمكن اختيار أكثر من درس)</FormLabel>
                  {lessonsLoading ? (
                    <HStack><Spinner size="sm" /><Text>جاري تحميل الدروس...</Text></HStack>
                  ) : (
                    <VStack align="stretch" spacing={2} maxH="220px" overflowY="auto" p={2} border="1px solid" borderColor="gray.100" borderRadius="md" bg="gray.50">
                      {lessons.map((lesson) => (
                        <HStack key={lesson.id} justify="space-between" bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.100">
                          <Checkbox isChecked={selectedLessonIds.includes(lesson.id)} onChange={() => toggleLessonSelection(lesson.id)}>
                            {lesson.name}
                          </Checkbox>
                          <Badge colorScheme="blue" variant="subtle">{lesson.questions_count} سؤال</Badge>
                        </HStack>
                      ))}
                      {lessons.length === 0 && (
                        <Text color="gray.500" textAlign="center">لا توجد دروس لهذا الفصل</Text>
                      )}
                    </VStack>
                  )}
                  {selectedLessonIds.length > 0 && (
                    <Text mt={2} fontSize="sm" color="blue.600">الدروس المحددة: {selectedLessonIds.length}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>أكواد أصدقائك (IDs)</FormLabel>
                  <VStack spacing={2} align="stretch">
                    {inviteeIds.map((inviteeId, index) => (
                      <HStack key={index} spacing={2}>
                        <Input
                          placeholder={`كود الطالب ${index + 1}`}
                          bg="gray.50"
                          value={inviteeId}
                          onChange={(e) => handleInviteeChange(index, e.target.value)}
                          type="number"
                          isDisabled={isSendingInvite}
                        />
                        {inviteeIds.length > 1 && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeInviteeInput(index)}
                            isDisabled={isSendingInvite}
                          >
                            <Icon as={FaMinus} />
                          </Button>
                        )}
                        {index === inviteeIds.length - 1 && inviteeIds.length < 8 && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={addInviteeInput}
                            isDisabled={isSendingInvite}
                          >
                            <Icon as={FaPlus} />
                          </Button>
                        )}
                      </HStack>
                    ))}
                    <Text fontSize="xs" color="gray.500">
                      يمكنك إضافة حتى {8 - inviteeIds.length} طالب إضافي
                    </Text>
                  </VStack>
                </FormControl>

                <FormControl maxW="200px">
                  <FormLabel>عدد الأسئلة</FormLabel>
                  <NumberInput 
                    min={1} 
                    max={50} 
                    value={questionsCount} 
                    onChange={(v) => setQuestionsCount(Number(v))}
                    isDisabled={isSendingInvite}
                  >
                    <NumberInputField bg="gray.50" />
                  </NumberInput>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack w="full" justify="space-between">
                <Button onClick={gameModal.onClose} variant="ghost">إلغاء</Button>
                <Button
                  colorScheme="blue"
                  bgGradient="linear(135deg, #3b82f6 0%, #2563eb 100%)"
                  _hover={{ bgGradient: "linear(135deg, #2563eb 0%, #1d4ed8 100%)" }}
                  borderRadius="xl"
                  onClick={handleSendInvite}
                  isLoading={isSendingInvite}
                  loadingText="جاري الإرسال..."
                  leftIcon={!isSendingInvite ? <FaTrophy /> : undefined}
                  isDisabled={isSendingInvite}
                >
                  {isSendingInvite ? "جاري الإرسال..." : "إرسال الدعوة"}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default ChallengeEMAcademy;
