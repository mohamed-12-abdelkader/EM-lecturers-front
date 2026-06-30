import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Container,
  useColorModeValue,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  Tag,
  TagLabel,
  TagLeftIcon,
  HStack,
  VStack,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Divider,
  Text as ChakraText,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaEllipsisV,
  FaUser,
  FaClipboardList,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaClock,
  FaFileAlt,
  FaComments,
  FaEye,
} from "react-icons/fa";
import { MdOutlineDateRange } from "react-icons/md";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import useTasks from "../../Hooks/tasks/useTasks";
import useEmployees from "../../Hooks/tasks/useEmployees";
import TaskDetailsModal from "../../components/tasks/TaskDetailsModal";
import TaskStats from "../../components/tasks/TaskStats";

// Motion Components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

const TasksPage = () => {
  const [filteredTasks, setFilteredTasks] = useState([]); // المهام بعد الفلترة والفرز
  const [currentTask, setCurrentTask] = useState(null); // المهمة التي يتم تعديلها
  const [filterStatus, setFilterStatus] = useState("all"); // حالة الفلترة (all, pending, in_progress, completed, cancelled)
  const [searchTerm, setSearchTerm] = useState(""); // مصطلح البحث
  const [sortBy, setSortBy] = useState("due_date"); // معيار الفرز (due_date, employee, status, priority)
  const [sortOrder, setSortOrder] = useState("asc"); // ترتيب الفرز (asc, desc)
  const [isAdmin, setIsAdmin] = useState(false); // هل المستخدم ادمن أم لا
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null); // المهمة المختارة لعرض التفاصيل

  const { isOpen, onOpen, onClose } = useDisclosure(); // للتحكم في فتح/إغلاق المودال
  const { 
    isOpen: isDetailsOpen, 
    onOpen: onDetailsOpen, 
    onClose: onDetailsClose 
  } = useDisclosure(); // للتحكم في فتح/إغلاق مودال التفاصيل
  const toast = useToast(); // لإظهار الإشعارات

  // استخدام الـ hooks
  const {
    tasks,
    loading,
    error,
    fetchAllTasks,
    fetchMyTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    getTaskStats
  } = useTasks();

  const { employees, loading: employeesLoading } = useEmployees();

  // الألوان المتكيفة مع الثيم
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("blue.700", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentColor = useColorModeValue("blue.500", "blue.300");

  // تحديد نوع المستخدم عند تحميل الصفحة
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("User data:", user); // للتأكد من البيانات
    setIsAdmin(user.role === "admin");
  }, []);

  // جلب المهام عند تحميل الصفحة
  useEffect(() => {
    if (isAdmin) {
      fetchAllTasks();
    } else {
      fetchMyTasks();
    }
  }, [isAdmin]);

  // useEffect لتطبيق الفلترة والفرز كلما تغيرت المهام أو شروط الفلترة/الفرز
  useEffect(() => {
    let tempTasks = [...tasks];

    // 1. البحث
    if (searchTerm) {
      tempTasks = tempTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employees.find((emp) => emp.id === task.assigned_to)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. الفلترة حسب الحالة
    if (filterStatus !== "all") {
      tempTasks = tempTasks.filter((task) => {
        const now = new Date();
        const dueDate = new Date(task.due_date);
        if (filterStatus === "overdue" && task.status !== "completed") {
          return dueDate < now;
        }
        return task.status === filterStatus;
      });
    }

    // 3. الفرز
    tempTasks.sort((a, b) => {
      let valA, valB;
      if (sortBy === "due_date") {
        valA = new Date(a.due_date).getTime();
        valB = new Date(b.due_date).getTime();
      } else if (sortBy === "employee") {
        valA = employees.find((emp) => emp.id === a.assigned_to)?.name || "";
        valB = employees.find((emp) => emp.id === b.assigned_to)?.name || "";
      } else if (sortBy === "status") {
        const statusOrder = { pending: 1, in_progress: 2, completed: 3, cancelled: 4 };
        valA = statusOrder[a.status];
        valB = statusOrder[b.status];
      } else if (sortBy === "priority") {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        valA = priorityOrder[a.priority];
        valB = priorityOrder[b.priority];
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredTasks(tempTasks);
  }, [tasks, filterStatus, searchTerm, sortBy, sortOrder, employees]);

  // دالة لإضافة/تحديث مهمة
  const handleSaveTask = async (taskData) => {
    try {
    if (currentTask) {
      // تحديث مهمة موجودة
        await updateTask(currentTask.id, taskData);
    } else {
      // إضافة مهمة جديدة
        await createTask(taskData);
    }
    setCurrentTask(null);
    onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  // دالة لحذف مهمة
  const handleDeleteTask = async (taskId) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  // دالة لفتح المودال لإضافة مهمة جديدة
  const handleAddTaskClick = () => {
    setCurrentTask(null);
    onOpen();
  };

  // دالة لفتح المودال لتعديل مهمة
  const handleEditTaskClick = (task) => {
    setCurrentTask(task);
    onOpen();
  };

  // دالة لفتح مودال تفاصيل المهمة
  const handleViewTaskDetails = (task) => {
    setSelectedTaskForDetails(task);
    onDetailsOpen();
  };

  // دالة لتغيير حالة المهمة مباشرة من البطاقة
  const handleChangeTaskStatus = async (taskId, newStatus) => {
    try {
      if (newStatus === "completed") {
        await completeTask(taskId);
      } else {
        await updateTask(taskId, { status: newStatus });
      }
    } catch (error) {
      console.error("Error changing task status:", error);
    }
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-EG");
  };

  // دالة لتحديد لون الأولوية
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  // دالة لتحديد نص الأولوية
  const getPriorityText = (priority) => {
    switch (priority) {
      case "urgent":
        return "عاجلة";
      case "high":
        return "عالية";
      case "medium":
        return "متوسطة";
      case "low":
        return "منخفضة";
      default:
        return "غير محدد";
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <Box minH="100vh" bg={bgColor} pt={{ base: "120px", md: "150px" }} pb={10}>
        <Container maxW="container.xl">
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color={accentColor} />
          </Flex>
        </Container>
      </Box>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <Box minH="100vh" bg={bgColor} pt={{ base: "120px", md: "150px" }} pb={10}>
        <Container maxW="container.xl">
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>خطأ!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} pt={{ base: "120px", md: "150px" }} pb={10}>
      <Container maxW="container.xl">
        <MotionBox
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          textAlign="center"
          mb={10}
        >
          <Heading as="h1" size={{ base: "xl", md: "2xl" }} color={headingColor} mb={4}>
            {isAdmin ? "إدارة مهام الموظفين" : "مهامي"}
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color={subTextColor}>
            {isAdmin 
              ? "هنا يمكنك توزيع المهام على الموظفين ومتابعة تقدمهم وتحديث حالات المهام."
              : "هنا يمكنك رؤية مهامك وتحديث حالتها وإضافة تعليقات وملفات."
            }
          </Text>
        </MotionBox>

        {/* Action Bar: Add Task, Search, Filter, Sort */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          mb={8}
          p={4}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="md"
          border="1px solid"
          borderColor={borderColor}
          wrap="wrap"
          gap={4}
        >
          <MotionButton
            leftIcon={<FaPlus />}
            colorScheme="blue"
            size="lg"
            onClick={() => {
              setCurrentTask(null);
              onOpen();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            إضافة مهمة جديدة
          </MotionButton>

          <InputGroup maxW={{ base: "full", md: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="البحث عن مهمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg={useColorModeValue("gray.100", "gray.700")}
              borderRadius="md"
              borderColor={borderColor}
            />
          </InputGroup>

          <HStack spacing={4}>
            <Select
              placeholder="فلتر الحالة"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              bg={useColorModeValue("gray.100", "gray.700")}
              borderRadius="md"
              borderColor={borderColor}
              icon={<FaFilter />}
              minW={{ base: "full", md: "150px" }}
            >
              <option value="all">كل المهام</option>
              <option value="pending">في الانتظار</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغية</option>
              <option value="overdue">متأخرة</option>
            </Select>

            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FaSortAmountDown />}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderRadius="md"
                borderColor={borderColor}
                minW={{ base: "full", md: "150px" }}
              >
                الفرز حسب
              </MenuButton>
              <MenuList bg={cardBg} borderColor={borderColor}>
                <MenuItem onClick={() => { setSortBy("due_date"); setSortOrder("asc"); }}>
                  تاريخ الاستحقاق (الأقدم أولاً)
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("due_date"); setSortOrder("desc"); }}>
                  تاريخ الاستحقاق (الأحدث أولاً)
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("employee"); setSortOrder("asc"); }}>
                  اسم الموظف (أ - ي)
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("employee"); setSortOrder("desc"); }}>
                  اسم الموظف (ي - أ)
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("status"); setSortOrder("asc"); }}>
                  الحالة (في الانتظار أولاً)
                </MenuItem>
                <MenuItem onClick={() => { setSortBy("priority"); setSortOrder("desc"); }}>
                  الأولوية (عاجلة أولاً)
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Task Statistics - Only for Admin */}
        {isAdmin && (
          <Box mb={8}>
            <TaskStats />
          </Box>
        )}



        {/* Tasks Display */}
        {filteredTasks.length === 0 ? (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            textAlign="center"
            py={10}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            border="1px solid"
            borderColor={borderColor}
          >
            <Text fontSize="xl" color={subTextColor}>
              لا توجد مهام لعرضها حالياً.
            </Text>
          </MotionBox>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                employeeName={employees.find((emp) => emp.id === task.assigned_to)?.name}
                onEdit={isAdmin ? handleEditTaskClick : null}
                onDelete={isAdmin ? handleDeleteTask : null}
                onViewDetails={handleViewTaskDetails}
                onChangeStatus={handleChangeTaskStatus}
                cardBg={cardBg}
                textColor={textColor}
                subTextColor={subTextColor}
                borderColor={borderColor}
                accentColor={accentColor}
                formatDate={formatDate}
                getPriorityColor={getPriorityColor}
                getPriorityText={getPriorityText}
                isAdmin={isAdmin}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>

      {/* Add/Edit Task Modal */}
              {isAdmin && (
      <AddTaskModal
        isOpen={isOpen}
        onClose={() => {
          setCurrentTask(null);
          onClose();
        }}
        onSave={handleSaveTask}
        task={currentTask}
        employees={employees}
            employeesLoading={employeesLoading}
        headingColor={headingColor}
        cardBg={cardBg}
        textColor={textColor}
        subTextColor={subTextColor}
        borderColor={borderColor}
        accentColor={accentColor}
      />
        )}

        {/* Task Details Modal */}
        <TaskDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setSelectedTaskForDetails(null);
            onDetailsClose();
          }}
          task={selectedTaskForDetails}
          employeeName={selectedTaskForDetails ? employees.find((emp) => emp.id === selectedTaskForDetails.assigned_to)?.name : ""}
          formatDate={formatDate}
          getPriorityColor={getPriorityColor}
          getPriorityText={getPriorityText}
          isAdmin={isAdmin}
        />
        
      <ScrollToTop />
    </Box>
  );
};

// 2. مكون TaskCard.jsx
const TaskCard = ({
  task,
  employeeName,
  onEdit,
  onDelete,
  onViewDetails,
  onChangeStatus,
  cardBg,
  textColor,
  subTextColor,
  borderColor,
  accentColor,
  formatDate,
  getPriorityColor,
  getPriorityText,
  isAdmin,
}) => {
  const getStatusTagProps = (status) => {
    const now = new Date();
    const dueDate = new Date(task.due_date);
    let colorScheme = "gray";
    let icon = FaHourglassHalf;
    let label = "في الانتظار";

    if (status === "completed") {
      colorScheme = "green";
      icon = FaCheckCircle;
      label = "مكتملة";
    } else if (status === "cancelled") {
      colorScheme = "red";
      icon = FaTimesCircle;
      label = "ملغية";
    } else if (status === "in_progress") {
      colorScheme = "blue";
      icon = FaClock;
      label = "قيد التنفيذ";
    } else if (dueDate < now && status !== "completed" && status !== "cancelled") {
      colorScheme = "red";
      icon = FaExclamationTriangle;
      label = "متأخرة";
    } else if (status === "pending") {
      colorScheme = "orange";
      icon = FaHourglassHalf;
      label = "في الانتظار";
    }
    return { colorScheme, icon, label };
  };

  const { colorScheme, icon: StatusIcon, label: statusLabel } = getStatusTagProps(task.status);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      bg={cardBg}
      p={6}
      borderRadius="xl"
      boxShadow="lg"
      border="1px solid"
      borderColor={borderColor}
      _hover={{
        transform: "translateY(-5px)",
        boxShadow: "xl",
      }}
      position="relative"
      overflow="hidden"
    >
      {/* Small accent corner */}
      <Box
        position="absolute"
        top="0"
        right="0"
        w="50px"
        h="50px"
        bg={accentColor}
        clipPath="polygon(0 0, 100% 0, 100% 100%)"
        opacity={0.7}
      />

      <Flex justify="space-between" align="flex-start" mb={4}>
        <VStack align="start" spacing={2}>
        <Tag size="lg" colorScheme={colorScheme} borderRadius="full" pr={3}>
          <TagLeftIcon as={StatusIcon} boxSize="18px" />
          <TagLabel fontWeight="semibold">{statusLabel}</TagLabel>
        </Tag>
          <Badge colorScheme={getPriorityColor(task.priority)} variant="subtle">
            {getPriorityText(task.priority)}
          </Badge>
        </VStack>
        
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            variant="ghost"
            aria-label="خيارات المهمة"
            size="sm"
          />
          <MenuList bg={cardBg} borderColor={borderColor}>
              <MenuItem
                icon={<FaEye />}
                onClick={() => onViewDetails(task)}
                color={textColor}
              >
                عرض التفاصيل
              </MenuItem>

              {onEdit && (
            <MenuItem
              icon={<FaEdit />}
              onClick={() => onEdit(task)}
              color={textColor}
            >
              تعديل
            </MenuItem>
              )}
              {onDelete && (
            <MenuItem
              icon={<FaTrash />}
              onClick={() => onDelete(task.id)}
              color="red.400"
            >
              حذف
            </MenuItem>
              )}
            {task.status !== "completed" && task.status !== "cancelled" && (
              <MenuItem
                icon={<FaCheckCircle />}
                onClick={() => onChangeStatus(task.id, "completed")}
                color="green.400"
              >
                وضع كمكتملة
              </MenuItem>
            )}
            {task.status === "completed" && (
              <MenuItem
                icon={<FaHourglassHalf />}
                onClick={() => onChangeStatus(task.id, "pending")}
                color="orange.400"
              >
                إعادة فتح المهمة
              </MenuItem>
            )}
            {task.status === "pending" && (
              <MenuItem
                icon={<FaClock />}
                onClick={() => onChangeStatus(task.id, "in_progress")}
                color="blue.400"
              >
                بدء العمل
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </Flex>

      <Heading size="md" mb={2} color={textColor} pr={8}>
        {task.title}
      </Heading>
      <Text fontSize="sm" color={subTextColor} mb={3}>
        {task.description || "لا يوجد وصف"}
      </Text>

      <Divider my={3} />

      <VStack spacing={3} align="start">
        {isAdmin && (
        <Flex align="center" color={subTextColor}>
          <Icon as={FaUser} mr={2} color={accentColor} />
          <Text fontSize="sm" fontWeight="medium">
            الموظف: {employeeName || "غير محدد"}
          </Text>
        </Flex>
        )}
        
        <Flex align="center" color={subTextColor}>
          <Icon as={MdOutlineDateRange} mr={2} color={accentColor} />
          <Text fontSize="sm" fontWeight="medium">
            تاريخ الاستحقاق: {formatDate(task.due_date)}
          </Text>
        </Flex>

        <Flex align="center" color={subTextColor}>
          <Icon as={FaCalendarAlt} mr={2} color={accentColor} />
          <Text fontSize="sm" fontWeight="medium">
            تاريخ الإنشاء: {formatDate(task.created_at)}
          </Text>
        </Flex>

        {task.comments_count > 0 && (
          <Flex align="center" color={subTextColor}>
            <Icon as={FaComments} mr={2} color={accentColor} />
            <Text fontSize="sm" fontWeight="medium">
              التعليقات: {task.comments_count}
            </Text>
          </Flex>
        )}

        {task.attachments_count > 0 && (
          <Flex align="center" color={subTextColor}>
            <Icon as={FaFileAlt} mr={2} color={accentColor} />
            <Text fontSize="sm" fontWeight="medium">
              الملفات: {task.attachments_count}
            </Text>
          </Flex>
        )}
      </VStack>
    </MotionBox>
  );
};

// 3. مكون AddTaskModal.jsx
const AddTaskModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  task, 
  employees, 
  employeesLoading,
  headingColor, 
  cardBg, 
  textColor, 
  subTextColor, 
  borderColor, 
  accentColor 
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setAssignedTo(task.assigned_to);
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
      setPriority(task.priority);
      setStatus(task.status);
    } else {
      // Reset form when adding new task
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setPriority("medium");
      setStatus("pending");
    }
  }, [task, isOpen]); // Reset when modal opens for a new task

  const handleSubmit = () => {
    if (!title || !assignedTo || !dueDate) {
      alert("الرجاء ملء الحقول المطلوبة (العنوان، الموظف، تاريخ الاستحقاق).");
      return;
    }
    onSave({ title, description, assigned_to: parseInt(assignedTo), due_date: dueDate, priority, status });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl" border="1px solid" borderColor={borderColor}>
        <ModalHeader color={headingColor} borderBottom="1px solid" borderColor={borderColor} pb={3}>
          {task ? "تعديل المهمة" : "إضافة مهمة جديدة"}
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody py={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color={textColor}>عنوان المهمة</FormLabel>
              <Input
                placeholder="عنوان المهمة"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={textColor}>الوصف</FormLabel>
              <Textarea
                placeholder="تفاصيل المهمة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={textColor}>الموظف المسندة إليه</FormLabel>
              <Select
                placeholder={employeesLoading ? "جاري التحميل..." : "اختر موظفاً"}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderColor={borderColor}
                color={textColor}
                isDisabled={employeesLoading}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={textColor}>تاريخ الاستحقاق</FormLabel>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderColor={borderColor}
                color={textColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={textColor}>الأولوية</FormLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderColor={borderColor}
                color={textColor}
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </Select>
            </FormControl>

            {task && ( // فقط عند التعديل، يمكن تغيير الحالة
              <FormControl>
                <FormLabel color={textColor}>الحالة</FormLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  bg={useColorModeValue("gray.100", "gray.700")}
                  borderColor={borderColor}
                  color={textColor}
                >
                  <option value="pending">في الانتظار</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغية</option>
                </Select>
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={3}>
          <Button variant="ghost" onClick={onClose} mr={3} colorScheme="red">
            إلغاء
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} leftIcon={<Icon as={task ? FaEdit : FaPlus} />}>
            {task ? "حفظ التغييرات" : "إضافة المهمة"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TasksPage;