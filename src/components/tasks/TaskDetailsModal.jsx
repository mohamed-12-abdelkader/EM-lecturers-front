import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Textarea,
  Input,
  Box,
  Divider,
  Badge,
  Icon,
  Flex,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Link,
  Image,
} from "@chakra-ui/react";
import {
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaFileAlt,
  FaComments,
  FaDownload,
  FaEye,
  FaPaperPlane,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineDateRange } from "react-icons/md";
import useTasks from "../../Hooks/tasks/useTasks";

const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  employeeName,
  formatDate,
  getPriorityColor,
  getPriorityText,
  isAdmin,
}) => {
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { addTaskComment, getTaskComments, uploadTaskFile, getTaskFiles } = useTasks();

  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentColor = useColorModeValue("blue.500", "blue.300");

  // جلب التعليقات والملفات عند فتح المودال
  useEffect(() => {
    if (isOpen && task) {
      fetchComments();
      fetchAttachments();
    }
  }, [isOpen, task]);

  const fetchComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const commentsData = await getTaskComments(task.id);
      setComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchAttachments = async () => {
    if (!task) return;
    setLoadingAttachments(true);
    try {
      const attachmentsData = await getTaskFiles(task.id);
      setAttachments(attachmentsData);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !task) return;
    
    setSubmittingComment(true);
    try {
      await addTaskComment(task.id, comment);
      setComment("");
      await fetchComments(); // إعادة جلب التعليقات
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !task) return;
    
    setUploadingFile(true);
    try {
      await uploadTaskFile(task.id, selectedFile);
      setSelectedFile(null);
      await fetchAttachments(); // إعادة جلب الملفات
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "green";
      case "in_progress":
        return "blue";
      case "cancelled":
        return "red";
      case "pending":
        return "orange";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "مكتملة";
      case "in_progress":
        return "قيد التنفيذ";
      case "cancelled":
        return "ملغية";
      case "pending":
        return "في الانتظار";
      default:
        return "غير محدد";
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl" border="1px solid" borderColor={borderColor}>
        <ModalHeader color={textColor} borderBottom="1px solid" borderColor={borderColor} pb={3}>
          تفاصيل المهمة: {task.title}
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* معلومات المهمة الأساسية */}
            <Box p={4} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
              <VStack spacing={3} align="start">
                <HStack spacing={4} wrap="wrap">
                  <Badge colorScheme={getStatusColor(task.status)} variant="subtle" p={2}>
                    {getStatusText(task.status)}
                  </Badge>
                  <Badge colorScheme={getPriorityColor(task.priority)} variant="subtle" p={2}>
                    {getPriorityText(task.priority)}
                  </Badge>
                </HStack>
                
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {task.title}
                </Text>
                
                <Text color={subTextColor}>
                  {task.description || "لا يوجد وصف للمهمة"}
                </Text>

                <Divider />

                <VStack spacing={2} align="start" w="full">
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

                  {task.completed_at && (
                    <Flex align="center" color={subTextColor}>
                      <Icon as={FaClock} mr={2} color={accentColor} />
                      <Text fontSize="sm" fontWeight="medium">
                        تاريخ الإكمال: {formatDate(task.completed_at)}
                      </Text>
                    </Flex>
                  )}
                </VStack>
              </VStack>
            </Box>

            {/* التعليقات */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  التعليقات ({comments.length})
                </Text>
                <Icon as={FaComments} color={accentColor} />
              </HStack>

              {/* إضافة تعليق جديد */}
              <Box mb={4} p={4} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
                <VStack spacing={3}>
                  <Textarea
                    placeholder="أضف تعليقاً..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    bg={useColorModeValue("white", "gray.600")}
                    borderColor={borderColor}
                    color={textColor}
                    rows={3}
                  />
                  <Button
                    leftIcon={<FaPaperPlane />}
                    colorScheme="blue"
                    onClick={handleAddComment}
                    isLoading={submittingComment}
                    isDisabled={!comment.trim()}
                    size="sm"
                  >
                    إضافة تعليق
                  </Button>
                </VStack>
              </Box>

              {/* قائمة التعليقات */}
              {loadingComments ? (
                <Flex justify="center" py={4}>
                  <Spinner color={accentColor} />
                </Flex>
              ) : comments.length === 0 ? (
                <Text color={subTextColor} textAlign="center" py={4}>
                  لا توجد تعليقات بعد
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {comments.map((comment) => (
                    <Box
                      key={comment.id}
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                          {comment.employee_name || "مستخدم"}
                        </Text>
                        <Text fontSize="xs" color={subTextColor}>
                          {formatDate(comment.created_at)}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>
                        {comment.comment}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {/* الملفات المرفقة */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  الملفات المرفقة ({attachments.length})
                </Text>
                <Icon as={FaFileAlt} color={accentColor} />
              </HStack>

              {/* رفع ملف جديد */}
              <Box mb={4} p={4} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
                <VStack spacing={3}>
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    bg={useColorModeValue("white", "gray.600")}
                    borderColor={borderColor}
                    color={textColor}
                  />
                  <Button
                    leftIcon={<FaFileAlt />}
                    colorScheme="green"
                    onClick={handleUploadFile}
                    isLoading={uploadingFile}
                    isDisabled={!selectedFile}
                    size="sm"
                  >
                    رفع ملف
                  </Button>
                </VStack>
              </Box>

              {/* قائمة الملفات */}
              {loadingAttachments ? (
                <Flex justify="center" py={4}>
                  <Spinner color={accentColor} />
                </Flex>
              ) : attachments.length === 0 ? (
                <Text color={subTextColor} textAlign="center" py={4}>
                  لا توجد ملفات مرفقة
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Text fontSize="lg">{getFileIcon(attachment.file_name)}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="bold" color={textColor}>
                              {attachment.file_name}
                            </Text>
                            <Text fontSize="xs" color={subTextColor}>
                              {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<FaEye />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="عرض الملف"
                            onClick={() => window.open(attachment.file_path, '_blank')}
                          />
                          <IconButton
                            icon={<FaDownload />}
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            aria-label="تحميل الملف"
                            onClick={() => window.open(attachment.file_path, '_blank')}
                          />
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={3}>
          <Button variant="ghost" onClick={onClose} mr={3}>
            إغلاق
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TaskDetailsModal; 