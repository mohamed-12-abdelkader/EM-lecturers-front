import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Avatar,
  Badge,
  useColorModeValue,
  Container,
  Heading,
  Divider,
  Spacer,
  IconButton,
  Tooltip, // New: For icon tooltips
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, // For image preview modal
  Image,
  Icon, // For displaying images in chat and preview
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaPaperPlane,
  FaUserCircle,
  FaUsers,
  FaBars,
  FaPlus, // New: For attaching files
  FaTimesCircle, // New: For removing selected file
  FaFileAlt, // New: Generic file icon
  FaDownload, // New: Download icon
} from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

// Mock Data - في تطبيق حقيقي هذه البيانات ستأتي من Backend/API
const currentUser = { id: "user1", name: "أحمد المبرمج", avatar: "https://bit.ly/dan-abramov" };

const teamMembers = [
  { id: "user1", name: "أحمد المبرمج", avatar: "https://bit.ly/dan-abramov", status: "online" },
  { id: "user2", name: "فاطمة المصممة", avatar: "https://bit://bit.ly/tioluwani-kolawole", status: "online" },
  { id: "user3", name: "علي محلل البيانات", avatar: "https://bit.ly/kent-c-dodds", status: "offline" },
  { id: "user4", name: "ليلى مديرة المشروع", avatar: "https://bit.ly/code-beast", status: "online" },
  { id: "user5", name: "يوسف QA", avatar: "https://bit.ly/ryan-florence", status: "offline" },
];

// Motion Components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionText = motion(Text);
const MotionButton = motion(Button);

const TeamChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // New: State for selected file
  const [imagePreview, setImagePreview] = useState(null); // New: State for image preview
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // New: State for image modal
  const [modalImageUrl, setModalImageUrl] = useState(""); // New: State for modal image URL

  const messagesEndRef = useRef(null); // Ref to scroll to the bottom of messages
  const fileInputRef = useRef(null); // Ref for file input

  // Colors for light and dark mode
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const chatContainerBg = useColorModeValue("white", "gray.800");
  const messageBgMe = useColorModeValue("blue.500", "blue.300");
  const messageColorMe = useColorModeValue("white", "gray.800");
  const messageBgOther = useColorModeValue("gray.200", "gray.700");
  const messageColorOther = useColorModeValue("gray.800", "whiteAlpha.900");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("blue.600", "blue.700");
  const headerColor = useColorModeValue("white", "white");
  const teamListBg = useColorModeValue("gray.50", "gray.700");
  const teamListNameColor = useColorModeValue("gray.800", "gray.100");
  const teamListStatusColor = useColorModeValue("gray.600", "gray.400");
  const onlineBadgeColor = "green";
  const offlineBadgeColor = "red";
  const filePreviewBg = useColorModeValue("blue.100", "blue.900");
  const filePreviewBorder = useColorModeValue("blue.200", "blue.800");
  const filePreviewTextColor = useColorModeValue("gray.800", "gray.100");


  // Simulate receiving messages (for demonstration)
  useEffect(() => {
    const initialMessages = [
      { id: "msg1", userId: "user1", type: "text", payload: "مرحباً يا فريق، ما هي آخر التحديثات اليوم؟", timestamp: "10:00 ص", date: "2025-06-08" },
      { id: "msg2", userId: "user2", type: "text", payload: "أهلاً أحمد! لقد انتهيت من تصميم الواجهة الرئيسية.", timestamp: "10:05 ص", date: "2025-06-08" },
      {
        id: "msg3",
        userId: "user3",
        type: "image",
        payload: "https://via.placeholder.com/150/FF0000/FFFFFF?text=Design", // Mock image URL
        fileName: "تصميم_واجهة.png",
        timestamp: "10:10 ص", date: "2025-06-08"
      },
      { id: "msg4", userId: "user1", type: "text", payload: "رائع يا فاطمة! علي، هل تحتاج مساعدة في أي شيء؟", timestamp: "10:15 ص", date: "2025-06-08" },
      {
        id: "msg5",
        userId: "user4",
        type: "file",
        payload: "https://example.com/project_docs.pdf", // Mock file URL
        fileName: "وثائق_المشروع.pdf",
        timestamp: "10:20 ص", date: "2025-06-08"
      },
    ];
    setMessages(initialMessages);
  }, []);

  // Scroll to the bottom of messages whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a URL for image preview if it's an image
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null); // Clear image preview for non-image files
      }
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  // Function to remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" && !selectedFile) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    const date = now.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });

    let message = {
      id: `msg${messages.length + 1}`,
      userId: currentUser.id, // Current user sends the message
      timestamp: timestamp,
      date: date,
    };

    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        message.type = "image";
        message.payload = imagePreview; // Use Base64 for preview, in real app this would be a URL
        message.fileName = selectedFile.name;
      } else {
        message.type = "file";
        message.payload = URL.createObjectURL(selectedFile); // For download link (in real app, this is cloud URL)
        message.fileName = selectedFile.name;
        message.fileType = selectedFile.type;
      }
      handleRemoveFile(); // Clear file input after sending
    } else {
      message.type = "text";
      message.payload = newMessage;
    }

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const getUserDetails = (userId) => {
    return teamMembers.find((member) => member.id === userId) || { name: "مستخدم غير معروف", avatar: "https://bit.ly/broken-link" };
  };

  // Variants for message animations
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Function to determine if a new date separator is needed
  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    const currentMsgDate = new Date(currentMessage.date).toDateString();
    const prevMsgDate = new Date(previousMessage.date).toDateString();
    return currentMsgDate !== prevMsgDate;
  };

  return (
    <div className="mt-[80px]">
      <div>
        {/* Chat Header */}
        <Flex bg={headerBg} color={headerColor} p={4} borderBottom="1px solid" borderColor={borderColor} alignItems="center" justifyContent="space-between">
          <HStack spacing={3}>
            <Avatar size="md" name="Team Chat" icon={<FaUsers />} bg="whiteAlpha.300" />
            <Heading as="h2" size="md" fontFamily="'Tajawal', sans-serif">
              دردشة الفريق
            </Heading>
          </HStack>
          <IconButton
            icon={<FaBars />}
            variant="ghost"
            aria-label="قائمة الفريق"
            color="white"
            display={{ base: "flex", md: "none" }}
          />
        </Flex>

        {/* Main Chat Area */}
        <Flex flex={1} bg={chatContainerBg}>
          {/* Team Members List (Hidden on small screens by default) */}
          <VStack
            w={{ base: "full", md: "250px" }}
            p={4}
            bg={teamListBg}
            borderLeft="1px solid"
            borderColor={borderColor}
            alignItems="flex-start"
            spacing={3}
            overflowY="auto"
            display={{ base: "none", md: "flex" }}
          >
            <Heading size="sm" mb={2} color={teamListNameColor}>أعضاء الفريق</Heading>
            {teamMembers.map((member) => (
              <HStack key={member.id} spacing={3} w="full" cursor="pointer" _hover={{ bg: useColorModeValue("gray.100", "gray.600"), borderRadius: "md" }} p={2}>
                <Avatar size="sm" name={member.name} src={member.avatar} />
                <Box>
                  <Text fontWeight="semibold" color={teamListNameColor}>{member.name}</Text>
                  <HStack spacing={1}>
                    <Badge colorScheme={member.status === "online" ? onlineBadgeColor : offlineBadgeColor} borderRadius="full" px={2}>
                      {member.status === "online" ? "متصل" : "غير متصل"}
                    </Badge>
                  </HStack>
                </Box>
              </HStack>
            ))}
          </VStack>

          {/* Messages Display Area */}
          <VStack flex={1} p={4} spacing={4} overflowY="auto" alignItems="flex-start">
            {messages.map((msg, index) => {
              const sender = getUserDetails(msg.userId);
              const isCurrentUser = msg.userId === currentUser.id;
              const prevMessage = messages[index - 1];
              const displayDateSeparator = shouldShowDate(msg, prevMessage);

              return (
                <React.Fragment key={msg.id}>
                  {displayDateSeparator && (
                    <Flex w="full" justifyContent="center" my={2}>
                      <Text
                        bg={useColorModeValue("gray.200", "gray.700")}
                        color={useColorModeValue("gray.600", "gray.300")}
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {msg.date === new Date().toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" })
                          ? "اليوم"
                          : msg.date
                        }
                      </Text>
                    </Flex>
                  )}
                  <MotionFlex
                    w="full"
                    justifyContent={isCurrentUser ? "flex-end" : "flex-start"}
                    initial="hidden"
                    animate="visible"
                    variants={messageVariants}
                    custom={index}
                  >
                    <HStack
                      spacing={isCurrentUser ? 2 : 3} // Reduce spacing for current user avatar
                      alignItems="flex-end"
                      flexDirection={isCurrentUser ? "row-reverse" : "row"}
                    >
                      <Avatar size={isCurrentUser ? "xs" : "sm"} name={sender.name} src={sender.avatar} />
                      <Box
                        bg={isCurrentUser ? messageBgMe : messageBgOther}
                        color={isCurrentUser ? messageColorMe : messageColorOther}
                        px={4}
                        py={2.5} // Slightly more vertical padding
                        borderRadius={isCurrentUser ? "2xl" : "xl"} // More rounded for current user
                        borderTopRightRadius={isCurrentUser ? "md" : "xl"} // Flat corner on the sender side
                        borderTopLeftRadius={isCurrentUser ? "xl" : "md"} // Flat corner on the sender side
                        maxW="70%"
                        wordBreak="break-word"
                        boxShadow="md" // Softer shadow
                      >
                        {!isCurrentUser && (
                          <Text fontSize="xs" fontWeight="bold" mb={1} color={useColorModeValue("blue.600", "blue.200")}>
                            {sender.name}
                          </Text>
                        )}

                        {msg.type === "text" && <Text>{msg.payload}</Text>}

                        {msg.type === "image" && (
                          <Box maxW="250px" borderRadius="lg" overflow="hidden" cursor="pointer"
                               onClick={() => { setModalImageUrl(msg.payload); setIsImageModalOpen(true); }}
                               _hover={{ opacity: 0.9 }}>
                            <Image src={msg.payload} alt="Attached image" objectFit="cover" w="full" h="auto" />
                            <Text fontSize="xs" mt={1} color={isCurrentUser ? "whiteAlpha.700" : "gray.500"} textAlign="right">
                              {msg.fileName}
                            </Text>
                          </Box>
                        )}

                        {msg.type === "file" && (
                          <VStack
                            alignItems="flex-start"
                            p={2}
                            bg={filePreviewBg}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={filePreviewBorder}
                          >
                            <HStack>
                              <Icon as={FaFileAlt} boxSize={5} color={useColorModeValue("blue.600", "blue.300")} />
                              <Text fontWeight="semibold" fontSize="sm" color={filePreviewTextColor}>
                                {msg.fileName}
                              </Text>
                            </HStack>
                            <Button
                              as="a"
                              href={msg.payload} // In real app, this would be a direct download URL
                              download={msg.fileName}
                              size="xs"
                              colorScheme="blue"
                              variant="ghost"
                              leftIcon={<FaDownload />}
                              mt={1}
                              color={useColorModeValue("blue.600", "blue.300")}
                            >
                              تحميل
                            </Button>
                          </VStack>
                        )}

                        <Text fontSize="xx-small" color={isCurrentUser ? "whiteAlpha.700" : "gray.500"} mt={1} textAlign={isCurrentUser ? "left" : "right"}>
                          {msg.timestamp}
                        </Text>
                      </Box>
                    </HStack>
                  </MotionFlex>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        </Flex>

        {/* Message Input Area */}
        <VStack p={4} borderTop="1px solid" borderColor={borderColor} bg={chatContainerBg} spacing={3}>
          {selectedFile && (
            <Flex
              w="full"
              p={2}
              borderRadius="md"
              bg={filePreviewBg}
              border="1px solid"
              borderColor={filePreviewBorder}
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              {imagePreview ? (
                <HStack spacing={3}>
                  <Image src={imagePreview} alt="Image preview" boxSize="50px" objectFit="cover" borderRadius="md" />
                  <Text fontSize="sm" color={filePreviewTextColor}>{selectedFile.name}</Text>
                </HStack>
              ) : (
                <HStack spacing={2}>
                  <Icon as={FaFileAlt} boxSize={5} color={useColorModeValue("blue.600", "blue.300")} />
                  <Text fontSize="sm" color={filePreviewTextColor}>{selectedFile.name}</Text>
                </HStack>
              )}
              <IconButton
                icon={<FaTimesCircle />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={handleRemoveFile}
                aria-label="Remove selected file"
              />
            </Flex>
          )}

          <HStack w="full" spacing={4}>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              display="none" // Hide the actual file input
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" // Allowed file types
            />
            <Tooltip label="إرفاق ملف" aria-label="إرفاق ملف">
              <IconButton
                icon={<FaPlus />}
                onClick={() => fileInputRef.current.click()} // Trigger click on hidden input
                size="lg"
                colorScheme="blue"
                borderRadius="full"
                aria-label="Attach file"
                _hover={{ transform: "scale(1.05)" }}
                _active={{ transform: "scale(0.95)" }}
              />
            </Tooltip>

            <Input
              flex={1}
              placeholder={selectedFile ? "" : "اكتب رسالتك..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              size="lg"
              borderRadius="full"
              bg={inputBg}
              borderColor={``}
              _hover={{ borderColor: useColorModeValue("blue.300", "blue.400") }}
              _focus={{ borderColor: useColorModeValue("blue.500", "blue.300"), boxShadow: `0 0 0 1px ${useColorModeValue("blue.500", "blue.300")}` }}
              color={messageColorOther}
              isDisabled={!!selectedFile && newMessage.trim() === ""} // Disable text input if file selected and no text
            />
            <Button
              ml={4}
              colorScheme="blue"
              onClick={handleSendMessage}
              size="lg"
              borderRadius="full"
              px={8}
              leftIcon={<IoSend />}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              as={motion.button}
              isDisabled={newMessage.trim() === "" && !selectedFile} // Disable if no text and no file
            >
              إرسال
            </Button>
          </HStack>
        </VStack>
      </div>

      {/* Image Preview Modal */}
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} isCentered size="xl">
        <ModalOverlay />
        <ModalContent bg={chatContainerBg} borderRadius="lg" overflow="hidden">
          <ModalHeader color={headerColor} bg={headerBg}>معاينة الصورة</ModalHeader>
          <ModalCloseButton color={headerColor} />
          <ModalBody p={0}>
            <Image src={modalImageUrl} alt="Full size preview" objectFit="contain" w="full" h="auto" maxH="70vh" />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => setIsImageModalOpen(false)}>إغلاق</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ScrollToTop />
    </div>
  );
};

export default TeamChat;