import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Heading,
  Text,
  useToast,
  Container,
  Image,
  IconButton,
  Spinner,
  SimpleGrid,
  Badge,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon
} from "@chakra-ui/react";
import {
  FaUpload,
  FaTimes,
  FaPlus,
  FaSearch,
  FaBook,
  FaGraduationCap,
  FaEye,
  FaEdit,
  FaTrash,
  FaBookOpen,
  FaLayerGroup,
  FaChevronLeft,
  FaChevronRight,
  FaDollarSign,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import {
  createQuestionBank,
  deleteQuestionBank,
  fetchQuestionBanks,
  getBankCounts,
  updateQuestionBank,
} from "../../api/questionBankApi";

const QuestionBankDashboard = () => {
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    grade_id: "",
    is_active: true,
    price: 0
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Data states
  const [grades, setGrades] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);

  // Loading states
  const [gradesLoading, setGradesLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Error states
  const [gradesError, setGradesError] = useState(null);
  const [banksError, setBanksError] = useState(null);

  // Filter & pagination
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBanks, setTotalBanks] = useState(0);
  const searchTimeoutRef = useRef(null);
  const PAGE_SIZE = 12;

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();

  // Edit and delete states
  const [editingBank, setEditingBank] = useState(null);
  const [deletingBank, setDeletingBank] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toast = useToast();

  // Fetch grades from API
  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      setGradesError(null);

      const response = await baseUrl.get("/api/users/grades");
      setGrades(response.data.grades);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "حدث خطأ في جلب الصفوف";
      setGradesError(errorMsg);
      console.error("Error fetching grades:", err);
    } finally {
      setGradesLoading(false);
    }
  };

  // Fetch question banks from API (pagination + filters)
  const loadQuestionBanks = useCallback(async () => {
    try {
      setBanksLoading(true);
      setBanksError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const result = await fetchQuestionBanks({
        page,
        limit: PAGE_SIZE,
        grade_id: selectedGradeFilter || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
        search: debouncedSearch,
      });

      const banks = result.question_banks || [];
      setQuestionBanks(banks);
      setFilteredBanks(banks);
      setTotalPages(result.totalPages || 1);
      setTotalBanks(result.total || banks.length);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "حدث خطأ في جلب بنوك الأسئلة";
      setBanksError(errorMsg);
      setQuestionBanks([]);
      setFilteredBanks([]);
    } finally {
      setBanksLoading(false);
    }
  }, [page, selectedGradeFilter, activeFilter, debouncedSearch, toast]);

  // Create question bank
  const handleCreateQuestionBank = async (submitFormData) => {
    try {
      setSubmitLoading(true);
      await createQuestionBank(submitFormData);
      toast({
        title: "نجح",
        description: "تم إنشاء بنك الأسئلة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في إنشاء بنك الأسئلة";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [selectedGradeFilter, activeFilter]);

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    loadQuestionBanks();
  }, [loadQuestionBanks]);

  const pageSummary = useMemo(() => {
    return questionBanks.reduce(
      (acc, bank) => {
        const counts = getBankCounts(bank);
        acc.subjects += counts.subjects;
        acc.books += counts.books;
        acc.chapters += counts.chapters;
        acc.lessons += counts.lessons;
        acc.questions += counts.questions;
        return acc;
      },
      { subjects: 0, books: 0, chapters: 0, lessons: 0, questions: 0 },
    );
  }, [questionBanks]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.grade_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم بنك الأسئلة والصف",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append("name", formData.name);
    submitFormData.append("description", formData.description);
    submitFormData.append("grade_id", formData.grade_id);
    submitFormData.append("is_active", formData.is_active);
    submitFormData.append("price", formData.price ?? 0);

    if (selectedImage) {
      submitFormData.append("image", selectedImage);
    }

    const result = await handleCreateQuestionBank(submitFormData);

    if (result.success) {
      setFormData({
        name: "",
        description: "",
        grade_id: "",
        is_active: true,
        price: 0
      });
      setSelectedImage(null);
      setImagePreview(null);
      onClose();
      loadQuestionBanks();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      grade_id: "",
      is_active: true,
      price: 0
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle edit button click
  const handleEditClick = (bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      description: bank.description || "",
      grade_id: bank.grade_id,
      is_active: bank.is_active,
      price: bank.price ?? 0
    });
    setImagePreview(bank.image_url);
    onEditOpen();
  };

  // Handle delete button click
  const handleDeleteClick = (bank) => {
    setDeletingBank(bank);
    onDeleteOpen();
  };

  const handleUpdateQuestionBank = async (submitFormData) => {
    try {
      setEditLoading(true);
      await updateQuestionBank(editingBank.id, submitFormData);
      toast({
        title: "نجح",
        description: "تم تحديث بنك الأسئلة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في تحديث بنك الأسئلة";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteQuestionBank = async () => {
    try {
      setDeleteLoading(true);
      await deleteQuestionBank(deletingBank.id);
      toast({
        title: "نجح",
        description: "تم حذف بنك الأسئلة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في حذف بنك الأسئلة";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.grade_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم بنك الأسئلة والصف",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append("name", formData.name);
    submitFormData.append("description", formData.description);
    submitFormData.append("grade_id", formData.grade_id);
    submitFormData.append("is_active", formData.is_active);
    submitFormData.append("price", formData.price ?? 0);

    if (selectedImage) {
      submitFormData.append("image", selectedImage);
    }

    const result = await handleUpdateQuestionBank(submitFormData);

    if (result.success) {
      onEditClose();
      loadQuestionBanks();
      resetForm();
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    const result = await handleDeleteQuestionBank();

    if (result.success) {
      onDeleteClose();
      loadQuestionBanks();
      setDeletingBank(null);
    }
  };

  if (gradesError || banksError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" p={6} bg="red.50" borderRadius="lg">
          <Text color="red.600">
            {gradesError && `خطأ في تحميل الصفوف: ${gradesError}`}
            {banksError && `خطأ في تحميل بنوك الأسئلة: ${banksError}`}
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="#f5f7fb"
      dir="rtl"
      pb={{ base: 24, md: 16 }}
      position="relative"
    >
      <Container maxW="1180px" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <VStack spacing={6} align="stretch">
          <VStack spacing={1.5} textAlign="center">
            <Heading color="gray.900" fontSize={{ base: "xl", md: "2xl" }} fontWeight="black">
              بنوك الأسئلة
            </Heading>
            <Text color="gray.500" fontSize="sm">
              إدارة وتنظيم بنوك الأسئلة حسب الصفوف والمحتوى الدراسي
            </Text>
            <HStack
              spacing={2}
              flexWrap="wrap"
              justify="center"
              fontSize="xs"
              color="gray.500"
              bg="white"
              px={4}
              py={2}
              borderRadius="full"
              border="1px solid"
              borderColor="gray.100"
            >
              <Badge colorScheme="blue" variant="subtle" borderRadius="full">بنك</Badge>
              <Icon as={FaChevronLeft} boxSize={2.5} color="gray.300" />
              <Badge colorScheme="purple" variant="subtle" borderRadius="full">مادة</Badge>
              <Icon as={FaChevronLeft} boxSize={2.5} color="gray.300" />
              <Badge colorScheme="orange" variant="subtle" borderRadius="full">كتاب</Badge>
              <Icon as={FaChevronLeft} boxSize={2.5} color="gray.300" />
              <Badge colorScheme="green" variant="subtle" borderRadius="full">فصل</Badge>
              <Icon as={FaChevronLeft} boxSize={2.5} color="gray.300" />
              <Badge colorScheme="teal" variant="subtle" borderRadius="full">درس</Badge>
            </HStack>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3}>
            {[
              { label: "إجمالي البنوك", value: totalBanks, color: "blue" },
              { label: "مواد", value: pageSummary.subjects, color: "purple" },
              { label: "كتب", value: pageSummary.books, color: "orange" },
              { label: "فصول", value: pageSummary.chapters, color: "green" },
              { label: "دروس", value: pageSummary.lessons, color: "teal" },
              { label: "أسئلة", value: pageSummary.questions, color: "cyan" },
            ].map((item) => (
              <Box
                key={item.label}
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="xl"
                p={4}
                textAlign="center"
                boxShadow="0 10px 30px rgba(15,23,42,0.04)"
              >
                <Text fontSize="2xl" fontWeight="black" color={`${item.color}.500`}>
                  {item.value}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {item.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          <Flex
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "center" }}
            justify="space-between"
            gap={3}
          >
            <InputGroup maxW={{ base: "full", lg: "460px" }} order={{ base: 2, lg: 1 }}>
              <InputRightElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputRightElement>
              <InputLeftElement pointerEvents="none" w="58px">
                <Badge colorScheme="blue" variant="subtle" borderRadius="md" fontSize="9px">
                  ALT + K
                </Badge>
              </InputLeftElement>
              <Input
                placeholder="ابحث عن بنك الأسئلة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
                h="46px"
                pr={10}
                pl="64px"
                borderRadius="xl"
                borderColor="gray.200"
                boxShadow="0 10px 30px rgba(15,23,42,0.04)"
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(49,130,206,0.12)" }}
              />
            </InputGroup>

            <HStack
              spacing={3}
              justify={{ base: "stretch", lg: "flex-end" }}
              order={{ base: 1, lg: 2 }}
              flexWrap="wrap"
            >
              <Select
                placeholder="كل الحالات"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                w={{ base: "full", sm: "170px" }}
                bg="white"
                h="46px"
                borderRadius="xl"
                borderColor="gray.200"
                color="gray.700"
                boxShadow="0 10px 30px rgba(15,23,42,0.04)"
              >
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </Select>
              <Select
                placeholder="كل الصفوف"
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                w={{ base: "full", sm: "210px" }}
                bg="white"
                h="46px"
                borderRadius="xl"
                borderColor="gray.200"
                color="gray.700"
                boxShadow="0 10px 30px rgba(15,23,42,0.04)"
                _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 3px rgba(237,137,54,0.12)" }}
              >
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Select>
              <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                {totalBanks} بنك
              </Text>
            </HStack>
          </Flex>

          {banksLoading ? (
            <Box textAlign="center" py={20} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100">
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color="gray.500" mt={4}>
                جاري تحميل بنوك الأسئلة...
              </Text>
            </Box>
          ) : filteredBanks.length === 0 ? (
            <Box textAlign="center" py={20} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100">
              <Icon as={FaBookOpen} boxSize={10} color="gray.300" mb={4} />
              <Text color="gray.600" fontWeight="bold">
                لا توجد بنوك أسئلة
              </Text>
              <Text color="gray.400" fontSize="sm" mt={2}>
                {debouncedSearch || selectedGradeFilter || activeFilter
                  ? "جرّب تغيير معايير البحث أو الفلترة"
                  : "ابدأ بإنشاء أول بنك أسئلة"}
              </Text>
            </Box>
          ) : (
            <>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
              {filteredBanks.map((bank) => {
                  const counts = getBankCounts(bank);
                  const isActive = bank.is_active !== false;
                  const isFree = bank.price == null || !Number(bank.price);

                  return (
                    <Box
                      key={bank.id}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.100"
                      borderRadius="2xl"
                      p={5}
                      minH="320px"
                      boxShadow="0 16px 40px rgba(15,23,42,0.06)"
                      transition="all 0.22s ease"
                      _hover={{
                        transform: "translateY(-5px)",
                        borderColor: "blue.200",
                        boxShadow: "0 22px 55px rgba(37,99,235,0.14)",
                      }}
                    >
                      <Flex justify="space-between" align="start" mb={4}>
                        <Badge
                          bg={isActive ? "blue.50" : "gray.100"}
                          color={isActive ? "blue.600" : "gray.500"}
                          borderRadius="full"
                          px={3}
                          py={1}
                          fontSize="10px"
                        >
                          {isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        <Flex
                          w={11}
                          h={11}
                          borderRadius="xl"
                          bg={isActive ? "blue.50" : "orange.50"}
                          color={isActive ? "blue.500" : "orange.500"}
                          align="center"
                          justify="center"
                        >
                          <Icon as={FaBook} boxSize={5} />
                        </Flex>
                      </Flex>

                      <Heading size="sm" color="gray.900" noOfLines={2} minH="40px" lineHeight="1.7">
                        {bank.name}
                      </Heading>
                      <Text color="gray.500" fontSize="xs" mt={2} noOfLines={2} minH="34px">
                        {bank.description || "بنك أسئلة منظم: مادة → كتاب → فصل → درس → أسئلة"}
                      </Text>

                      <HStack spacing={3} mt={4} color="gray.500" fontSize="xs" flexWrap="wrap">
                        <HStack spacing={1}>
                          <Icon as={FaGraduationCap} color="orange.500" />
                          <Text>{bank.grade_name || "غير محدد"}</Text>
                        </HStack>
                      </HStack>

                      <SimpleGrid columns={3} spacing={2} mt={4}>
                        {[
                          { icon: FaLayerGroup, label: "مواد", value: counts.subjects, color: "purple.500" },
                          { icon: FaBookOpen, label: "كتب", value: counts.books, color: "orange.500" },
                          { icon: FaBook, label: "فصول", value: counts.chapters, color: "green.500" },
                          { icon: FaBookOpen, label: "دروس", value: counts.lessons, color: "teal.500" },
                          { icon: FaSearch, label: "أسئلة", value: counts.questions, color: "blue.500" },
                        ].map((item) => (
                          <Box key={item.label} bg="gray.50" borderRadius="lg" p={2} textAlign="center">
                            <Icon as={item.icon} color={item.color} boxSize={3} mb={1} />
                            <Text fontWeight="bold" color="gray.800" fontSize="sm">
                              {item.value}
                            </Text>
                            <Text fontSize="10px" color="gray.500">
                              {item.label}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>

                      <Flex align="center" justify="space-between" mt={5} gap={3}>
                        <Text color={isFree ? "orange.500" : "gray.700"} fontSize="sm" fontWeight="black">
                          {isFree ? "مجاني" : `${bank.price} جنيه`}
                        </Text>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="تعديل"
                            icon={<FaEdit />}
                            size="xs"
                            variant="ghost"
                            color="orange.500"
                            onClick={() => handleEditClick(bank)}
                          />
                          <IconButton
                            aria-label="حذف"
                            icon={<FaTrash />}
                            size="xs"
                            variant="ghost"
                            color="red.400"
                            onClick={() => handleDeleteClick(bank)}
                          />
                        </HStack>
                      </Flex>

                      <Link to={`/question-bank/${bank.id}`} style={{ textDecoration: "none" }}>
                        <Button
                          mt={4}
                          w="full"
                          h="40px"
                          borderRadius="xl"
                          bg={isActive ? "blue.500" : "white"}
                          color={isActive ? "white" : "gray.700"}
                          border="1px solid"
                          borderColor={isActive ? "blue.500" : "gray.200"}
                          leftIcon={<FaEye />}
                          _hover={{
                            bg: isActive ? "blue.600" : "orange.50",
                            borderColor: isActive ? "blue.600" : "orange.200",
                          }}
                        >
                          إدارة المحتوى
                        </Button>
                      </Link>
                    </Box>
                  );
                })}

              <Button
                minH="238px"
                bg="whiteAlpha.700"
                border="2px dashed"
                borderColor="gray.200"
                borderRadius="2xl"
                color="gray.500"
                flexDirection="column"
                gap={3}
                onClick={onOpen}
                _hover={{ bg: "blue.50", borderColor: "blue.200", color: "blue.500" }}
              >
                <Flex w={12} h={12} borderRadius="full" bg="blue.50" color="blue.500" align="center" justify="center">
                  <Icon as={FaPlus} />
                </Flex>
                <Box>
                  <Text fontWeight="bold">إضافة بنك جديد</Text>
                  <Text fontSize="xs" color="gray.400">
                    ابدأ بنك أسئلة منظم
                  </Text>
                </Box>
              </Button>
            </SimpleGrid>

            {totalPages > 1 && (
              <Flex justify="center" align="center" gap={3} pt={2}>
                <IconButton
                  aria-label="الصفحة السابقة"
                  icon={<FaChevronRight />}
                  size="sm"
                  variant="outline"
                  isDisabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
                <Text fontSize="sm" color="gray.600">
                  صفحة {page} من {totalPages}
                </Text>
                <IconButton
                  aria-label="الصفحة التالية"
                  icon={<FaChevronLeft />}
                  size="sm"
                  variant="outline"
                  isDisabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              </Flex>
            )}
            </>
          )}
        </VStack>
      </Container>

      <Button
        position="fixed"
        left={{ base: 4, md: 8 }}
        bottom={{ base: 4, md: 8 }}
        zIndex={20}
        bg="blue.500"
        color="white"
        h="48px"
        px={6}
        borderRadius="full"
        leftIcon={<FaPlus />}
        boxShadow="0 18px 38px rgba(37,99,235,0.28)"
        onClick={onOpen}
        _hover={{ bg: "blue.600", transform: "translateY(-2px)" }}
      >
        إنشاء بنك أسئلة جديد
      </Button>

      {/* Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="blue.500" color="white">
            <HStack>
              <Icon as={FaPlus} />
              <Text>إنشاء بنك أسئلة جديد</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />

          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم بنك الأسئلة</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم بنك الأسئلة"
                />
              </FormControl>

              <FormControl>
                <FormLabel>الوصف</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="أدخل وصف بنك الأسئلة"
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>الصف الدراسي</FormLabel>
                <Select
                  name="grade_id"
                  value={formData.grade_id}
                  onChange={handleInputChange}
                  placeholder="اختر الصف الدراسي"
                >
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>السعر</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaDollarSign} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    name="price"
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <InputRightElement pr={3}>
                    <Text fontSize="sm" color="gray.500">
                      جنيه
                    </Text>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>حالة النشاط</FormLabel>
                <Select
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleInputChange}
                >
                  <option value={true}>نشط</option>
                  <option value={false}>غير نشط</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>صورة بنك الأسئلة</FormLabel>
                {!imagePreview ? (
                  <Button
                    as="label"
                    htmlFor="image-upload"
                    leftIcon={<FaUpload />}
                    variant="outline"
                    w="full"
                    cursor="pointer"
                  >
                    اختر صورة
                  </Button>
                ) : (
                  <Box position="relative">
                    <Image
                      src={imagePreview}
                      alt="معاينة"
                      maxH="200px"
                      w="full"
                      objectFit="cover"
                      borderRadius="md"
                    />
                    <IconButton
                      icon={<FaTimes />}
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="red"
                      size="sm"
                      onClick={removeImage}
                      aria-label="إزالة الصورة"
                    />
                  </Box>
                )}
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  display="none"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                bg="blue.500"
                color="white"
                onClick={handleSubmit}
                isLoading={submitLoading}
                leftIcon={<FaPlus />}
                _hover={{ bg: "blue.600" }}
              >
                إنشاء
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader bg="orange.500" color="white">
            <HStack>
              <Icon as={FaEdit} />
              <Text>تعديل بنك الأسئلة</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />

          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم بنك الأسئلة</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>الوصف</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>الصف الدراسي</FormLabel>
                <Select
                  name="grade_id"
                  value={formData.grade_id}
                  onChange={handleInputChange}
                >
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>السعر</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaDollarSign} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    name="price"
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                  <InputRightElement pr={3}>
                    <Text fontSize="sm" color="gray.500">
                      جنيه
                    </Text>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>حالة النشاط</FormLabel>
                <Select
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleInputChange}
                >
                  <option value={true}>نشط</option>
                  <option value={false}>غير نشط</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>صورة بنك الأسئلة</FormLabel>
                {!imagePreview ? (
                  <Button
                    as="label"
                    htmlFor="edit-image-upload"
                    leftIcon={<FaUpload />}
                    variant="outline"
                    w="full"
                    cursor="pointer"
                  >
                    اختر صورة
                  </Button>
                ) : (
                  <Box position="relative">
                    <Image
                      src={imagePreview}
                      alt="معاينة"
                      maxH="200px"
                      w="full"
                      objectFit="cover"
                      borderRadius="md"
                    />
                    <IconButton
                      icon={<FaTimes />}
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="red"
                      size="sm"
                      onClick={removeImage}
                      aria-label="إزالة الصورة"
                    />
                  </Box>
                )}
                <Input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  display="none"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onEditClose}>
                إلغاء
              </Button>
              <Button
                bg="orange.500"
                color="white"
                onClick={handleEditSubmit}
                isLoading={editLoading}
                leftIcon={<FaEdit />}
                _hover={{ bg: "orange.600" }}
              >
                تحديث
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد الحذف</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} textAlign="center">
              <Icon as={FaTrash} boxSize={16} color="red.500" />
              <Text fontSize="lg" fontWeight="bold">
                هل أنت متأكد من حذف بنك الأسئلة؟
              </Text>
              <Text color="gray.600">"{deletingBank?.name}"</Text>
              <Text color="red.500" fontSize="sm">
                هذا الإجراء لا يمكن التراجع عنه
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onDeleteClose}>
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                isLoading={deleteLoading}
                leftIcon={<FaTrash />}
              >
                حذف
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default QuestionBankDashboard;