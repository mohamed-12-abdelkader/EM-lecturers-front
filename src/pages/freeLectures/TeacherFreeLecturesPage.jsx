import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Switch,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaExternalLinkAlt,
  FaPlay,
  FaPlus,
  FaSync,
  FaTrash,
  FaEdit,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { MdOndemandVideo } from "react-icons/md";
import {
  apiErrorMessage,
  createTeacherFreeLecture,
  deleteTeacherFreeLecture,
  fetchTeacherFreeLectures,
  updateTeacherFreeLecture,
  validateFreeLectureForm,
} from "../../api/teacherFreeLecturesApi";

const EMPTY_FORM = {
  title: "",
  link: "",
  isPublished: true,
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function LectureFormModal({ isOpen, onClose, mode, initial, onSaved, busy, setBusy }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      title: initial?.title ?? "",
      link: initial?.link ?? "",
      isPublished: initial?.isPublished ?? true,
    });
    setImageFile(null);
    setRemoveImage(false);
    setPreviewUrl(initial?.imageUrl ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen, initial]);

  useEffect(() => {
    if (!imageFile) return undefined;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleSave = async () => {
    const error = validateFreeLectureForm({
      title: form.title,
      link: form.link,
      imageFile,
    });
    if (error) {
      toast({ title: error, status: "warning", isClosable: true });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: form.title,
        link: form.link,
        isPublished: form.isPublished,
        imageFile,
        removeImage: mode === "edit" && removeImage && !imageFile,
      };

      if (mode === "create") {
        await createTeacherFreeLecture(payload, localStorage.getItem("token"));
        toast({ title: "تمت إضافة المحاضرة", status: "success", isClosable: true });
      } else {
        await updateTeacherFreeLecture(initial.id, payload, localStorage.getItem("token"));
        toast({ title: "تم تحديث المحاضرة", status: "success", isClosable: true });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل حفظ المحاضرة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent dir="rtl">
        <ModalHeader>{mode === "create" ? "إضافة محاضرة مجانية" : "تعديل المحاضرة"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>اسم المحاضرة</FormLabel>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: مقدمة في الكهرباء — الجزء الأول"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رابط المحاضرة</FormLabel>
              <Input
                value={form.link}
                onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                dir="ltr"
                textAlign="left"
              />
              <FormHelperText>YouTube، Zoom، Google Drive، أو أي رابط http/https</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>صورة تعريفية</FormLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                display="none"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) setRemoveImage(false);
                }}
              />
              <HStack spacing={3} flexWrap="wrap">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  اختيار صورة
                </Button>
                {(previewUrl || initial?.imageUrl) && !removeImage ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewUrl("");
                      setRemoveImage(true);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    إزالة الصورة
                  </Button>
                ) : null}
              </HStack>
              <FormHelperText>jpg, png, webp, gif — حد أقصى 5MB</FormHelperText>
              {previewUrl ? (
                <Box mt={3} overflow="hidden" rounded="lg" borderWidth="1px">
                  <Image src={previewUrl} alt="" maxH="180px" w="full" objectFit="cover" />
                </Box>
              ) : null}
            </FormControl>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <FormLabel mb={0}>نشر على الصفحة العامة</FormLabel>
                <FormHelperText mt={0}>
                  عند الإيقاف لن تظهر المحاضرة في قائمة المحاضرات المجانية
                </FormHelperText>
              </Box>
              <Switch
                colorScheme="blue"
                isChecked={form.isPublished}
                onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={busy}>
            إلغاء
          </Button>
          <Button colorScheme="blue" isLoading={busy} loadingText="جاري الحفظ..." onClick={handleSave}>
            {mode === "create" ? "إضافة" : "حفظ التعديلات"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function TeacherFreeLecturesPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();
  const cancelRef = useRef();

  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState([]);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heading = useColorModeValue("gray.800", "gray.100");
  const panelBg = useColorModeValue("white", "gray.800");

  const stats = useMemo(() => {
    const published = lectures.filter((l) => l.isPublished).length;
    return {
      total: lectures.length,
      published,
      hidden: lectures.length - published,
    };
  }, [lectures]);

  const loadLectures = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setLectures(await fetchTeacherFreeLectures(token));
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل المحاضرات"),
        status: "error",
        isClosable: true,
      });
      setLectures([]);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  const openCreate = () => {
    setEditingLecture(null);
    formModal.onOpen();
  };

  const openEdit = (lecture) => {
    setEditingLecture(lecture);
    formModal.onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleteBusy(true);
    try {
      await deleteTeacherFreeLecture(deleteTarget.id, token);
      toast({ title: "تم حذف المحاضرة", status: "success", isClosable: true });
      deleteDialog.onClose();
      setDeleteTarget(null);
      loadLectures();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل حذف المحاضرة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" className="mt-[80px]">
      <Box bgGradient={heroBg} color="white" py={{ base: 8, md: 10 }}>
        <Container maxW="container.xl">
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={4}
          >
            <HStack spacing={4} align="start">
              <Flex
                w="12"
                h="12"
                rounded="xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={MdOndemandVideo} boxSize={6} />
              </Flex>
              <Box>
                <Heading size="lg" fontWeight="bold">
                  المحاضرات المجانية
                </Heading>
                <Text mt={1} color="whiteAlpha.900" fontSize="sm">
                  أضف محاضرات برابط خارجي وصورة تعريفية — تظهر للطلاب على الصفحة العامة
                </Text>
              </Box>
            </HStack>

            <HStack spacing={2} flexWrap="wrap">
              <Button
                leftIcon={<FaSync />}
                variant="outline"
                colorScheme="whiteAlpha"
                borderColor="whiteAlpha.400"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={loadLectures}
                isLoading={loading}
              >
                تحديث
              </Button>
              <Button leftIcon={<FaPlus />} colorScheme="orange" onClick={openCreate}>
                محاضرة جديدة
              </Button>
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mt={6}>
            {[
              { label: "إجمالي المحاضرات", value: stats.total, accent: "white" },
              { label: "منشورة", value: stats.published, accent: "orange.200" },
              { label: "مخفية", value: stats.hidden, accent: "blue.200" },
            ].map((item) => (
              <Box
                key={item.label}
                bg="whiteAlpha.150"
                borderWidth="1px"
                borderColor="whiteAlpha.250"
                rounded="xl"
                px={4}
                py={3}
              >
                <Text fontSize="xs" color="whiteAlpha.800">
                  {item.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={item.accent}>
                  {item.value.toLocaleString("ar-EG")}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} h="280px" rounded="xl" />
            ))}
          </SimpleGrid>
        ) : lectures.length === 0 ? (
          <Center
            py={16}
            bg={panelBg}
            borderWidth="1px"
            borderColor={border}
            rounded="xl"
            flexDirection="column"
            gap={4}
          >
            <Flex w="14" h="14" rounded="xl" bg="blue.50" align="center" justify="center">
              <Icon as={MdOndemandVideo} boxSize={7} color="blue.500" />
            </Flex>
            <Text color={heading} fontWeight="semibold">
              لا توجد محاضرات مجانية بعد
            </Text>
            <Text color={muted} fontSize="sm">
              أضف أول محاضرة برابط YouTube أو Zoom لتظهر للطلاب
            </Text>
            <Button colorScheme="blue" leftIcon={<FaPlus />} onClick={openCreate}>
              إضافة محاضرة
            </Button>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {lectures.map((lecture) => (
              <Box
                key={lecture.id}
                bg={cardBg}
                borderWidth="1px"
                borderColor={border}
                rounded="xl"
                overflow="hidden"
                shadow="sm"
                transition="all 0.2s"
                _hover={{ shadow: "md", borderColor: "blue.200" }}
              >
                <Box position="relative" h="160px" bg="gray.100">
                  {lecture.imageUrl ? (
                    <Image src={lecture.imageUrl} alt={lecture.title} w="full" h="full" objectFit="cover" />
                  ) : (
                    <Center h="full" bg="blue.50">
                      <Icon as={FaPlay} boxSize={8} color="blue.400" />
                    </Center>
                  )}
                  <Badge
                    position="absolute"
                    top={3}
                    right={3}
                    colorScheme={lecture.isPublished ? "green" : "gray"}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Icon as={lecture.isPublished ? FaEye : FaEyeSlash} boxSize={3} />
                    {lecture.isPublished ? "منشورة" : "مخفية"}
                  </Badge>
                </Box>

                <Box p={4}>
                  <Heading size="sm" noOfLines={2} color={heading} mb={2}>
                    {lecture.title}
                  </Heading>
                  <Text fontSize="xs" color={muted} mb={3}>
                    {formatDate(lecture.createdAt)}
                  </Text>

                  <HStack spacing={2} mb={3}>
                    <Button
                      as="a"
                      href={lecture.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      flex={1}
                      variant="outline"
                      colorScheme="blue"
                      leftIcon={<FaExternalLinkAlt />}
                    >
                      فتح الرابط
                    </Button>
                  </HStack>

                  <HStack justify="flex-end" spacing={1}>
                    <IconButton
                      aria-label="تعديل"
                      icon={<FaEdit />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => openEdit(lecture)}
                    />
                    <IconButton
                      aria-label="حذف"
                      icon={<FaTrash />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => {
                        setDeleteTarget(lecture);
                        deleteDialog.onOpen();
                      }}
                    />
                  </HStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Container>

      <LectureFormModal
        isOpen={formModal.isOpen}
        onClose={formModal.onClose}
        mode={editingLecture ? "edit" : "create"}
        initial={editingLecture}
        onSaved={loadLectures}
        busy={formBusy}
        setBusy={setFormBusy}
      />

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف المحاضرة
            </AlertDialogHeader>
            <AlertDialogBody>
              هل تريد حذف «{deleteTarget?.title}»؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={deleteDialog.onClose} isDisabled={deleteBusy}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} isLoading={deleteBusy}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
