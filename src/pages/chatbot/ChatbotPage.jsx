import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  IconButton,
  VStack,
  HStack,
  Text,
  Avatar,
  useColorModeValue,
  Spacer,
  Divider,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast, // لإظهار الإشعارات
  Spinner, // للمؤشرات عند التحميل
  Image, // لعرض الصور المرفوعة
  Link as ChakraLink, // لروابط الملفات
  Heading
} from "@chakra-ui/react";
import {
  FaPaperPlane, // لإرسال الرسالة
  FaPaperclip, // لزر المرفقات
  FaFilePdf, // لأيقونة PDF
  FaImage, // لأيقونة الصورة
  FaPlus, // لزر جديد (محادثة جديدة)
  FaHistory, // لتاريخ المحادثات
  FaRobot, // أيقونة للchatbot
  FaUser, // أيقونة للمستخدم
  FaTimesCircle // لإغلاق مرفق
} from "react-icons/fa";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

// بيانات افتراضية للمحادثة (يمكن استبدالها ببيانات حقيقية من API)
const initialMessages = [
  { id: 1, text: "مرحباً! كيف يمكنني مساعدتك اليوم؟", sender: "bot" },
  { id: 2, text: "أريد أن أسأل عن نظرية فيثاغورس.", sender: "user" },
  { id: 3, text: "بالتأكيد، نظرية فيثاغورس هي: في أي مثلث قائم الزاوية، مربع طول الوتر يساوي مجموع مربعي طولي الضلعين الآخرين.", sender: "bot" },
];

const ChatbotPage = () => {
   
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); // لتخزين الملف المرفق
  const [isLoading, setIsLoading] = useState(false); // لحالة التحميل
  const messagesEndRef = useRef(null); // للتحكم في التمرير التلقائي
  const fileInputRef = useRef(null); // للوصول إلى input type="file"
  const toast = useToast(); // لإظهار إشعارات للمستخدم

  // ألوان الثيم
  const bgColor = useColorModeValue("gray.100", "gray.900");
  const chatBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const userMessageBg = useColorModeValue("blue.500", "blue.400");
  const userMessageColor = useColorModeValue("white", "gray.900");
  const botMessageBg = useColorModeValue("gray.200", "gray.600");
  const botMessageColor = useColorModeValue("gray.800", "white");
  const sidebarBg = useColorModeValue("gray.50", "gray.700");
  const activeChatBg = useColorModeValue("blue.100", "blue.900");

  // التمرير التلقائي لأسفل المحادثة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // دالة إرسال الرسالة
  const handleSendMessage = () => {
    if (inputMessage.trim() === "" && !attachedFile) {
      toast({
        title: "لا يوجد محتوى",
        description: "الرجاء كتابة رسالة أو إرفاق ملف.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true); // بدء التحميل

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      file: attachedFile // إضافة الملف للرسالة
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputMessage("");
    setAttachedFile(null); // مسح الملف بعد الإرسال

    // محاكاة رد من الشات بوت بعد 1.5 ثانية
    setTimeout(() => {
      setIsLoading(false); // إنهاء التحميل
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: "شكراً لسؤالك! أنا أعمل على فهم طلبك...",
          sender: "bot",
        },
      ]);
      // هنا يمكنك إرسال الرسالة والملف إلى الـ API الخاص بالـ Chatbot
      // ومن ثم تحديث الـ messages بناءً على الرد الحقيقي.
    }, 1500);
  };

  // دالة التعامل مع رفع الملفات
  const handleFileAttach = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "حجم الملف كبير",
          description: "الحد الأقصى لحجم الملف هو 5 ميجابايت.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setAttachedFile(file);
      toast({
        title: "تم إرفاق الملف",
        description: `${file.name} جاهز للإرسال.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // دالة لإزالة الملف المرفق
  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // لإعادة تعيين قيمة input file
    }
    toast({
        title: "تم إزالة الملف",
        description: "تم إلغاء إرفاق الملف بنجاح.",
        status: "info",
        duration: 1500,
        isClosable: true,
    });
  };

  // دالة للتعامل مع الضغط على Enter في حقل الإدخال
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter للسطر الجديد
      event.preventDefault(); // لمنع إرسال السطر الجديد
      handleSendMessage();
    }
  };


  return (
    <Flex minH="92vh" bg={bgColor} direction={{ base: "column", md: "row" }}>
      {/* Sidebar - يمكن إخفاؤه على الشاشات الصغيرة */}
    

      {/* Main Chat Area */}
      <Flex flex={1} direction="column" bg={chatBg} borderRadius={{ base: "none", md: "xl" }} shadow="xl">
        {/* Chat Header */}
        <Flex
          p={5}
          bg={useColorModeValue("blue.600", "gray.700")}
          color="white"
          align="center"
          borderTopRadius={{ base: "none", md: "xl" }}
          justifyContent="space-between"
          shadow="sm"
        >
          <HStack spacing={3}>
            <Avatar icon={<FaRobot />} bg="whiteAlpha.900" color="blue.600" />
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">EM Academy Ai</Text>
              <Text fontSize="xs" color="gray.200">متصل الآن</Text>
            </VStack>
          </HStack>
          {/* هنا يمكن إضافة أزرار أخرى مثل "إعادة تعيين المحادثة" */}
        </Flex>

        {/* Messages Display Area */}
        <VStack flex={1} p={6} spacing={4} overflowY="auto" css={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.300', 'gray.600'), borderRadius: 'full' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
        }}>
          {messages.map((msg) => (
            <MotionBox
              key={msg.id}
              alignSelf={msg.sender === "user" ? "flex-end" : "flex-start"}
              bg={msg.sender === "user" ? userMessageBg : botMessageBg}
              color={msg.sender === "user" ? userMessageColor : botMessageColor}
              borderRadius="xl"
              p={4}
              maxW="70%"
              shadow="sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Text>{msg.text}</Text>
              {msg.file && (
                <Box mt={3} p={3} bg={useColorModeValue("whiteAlpha.800", "gray.700")} borderRadius="md" shadow="inner">
                  <HStack spacing={2} align="center">
                    {msg.file.type.startsWith("image/") ? (
                      <Image src={URL.createObjectURL(msg.file)} alt="attached image" boxSize="60px" objectFit="cover" borderRadius="md" />
                    ) : (
                      <Icon as={FaFilePdf} boxSize={6} color="red.500" />
                    )}
                    <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold" color={useColorModeValue("gray.800", "gray.200")}>{msg.file.name}</Text>
                        <Text fontSize="xs" color="gray.500">{(msg.file.size / (1024 * 1024)).toFixed(2)} MB</Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </MotionBox>
          ))}
          {isLoading && (
            <MotionBox
              alignSelf="flex-start"
              p={4}
              bg={botMessageBg}
              color={botMessageColor}
              borderRadius="xl"
              maxW="70%"
              shadow="sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HStack>
                <Spinner size="sm" />
                <Text>جاري الكتابة...</Text>
              </HStack>
            </MotionBox>
          )}
          <Box ref={messagesEndRef} /> {/* عنصر وهمي للتمرير */}
        </VStack>

        {/* Input Area */}
        <Box p={4} borderTop="1px solid" borderColor={useColorModeValue("gray.200", "gray.700")}>
          {attachedFile && (
            <MotionBox
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                p={2}
                mb={2}
                bg={useColorModeValue("blue.50", "gray.600")}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                maxW="full"
                shadow="sm"
            >
                <HStack spacing={2}>
                    {attachedFile.type.startsWith("image/") ? (
                        <Icon as={FaImage} color="blue.500" boxSize={5} />
                    ) : (
                        <Icon as={FaFilePdf} color="red.500" boxSize={5} />
                    )}
                    <Text fontSize="sm" fontWeight="medium" isTruncated maxW="200px">
                        {attachedFile.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">({(attachedFile.size / 1024).toFixed(0)} KB)</Text>
                </HStack>
                <IconButton
                    icon={<FaTimesCircle />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    aria-label="إزالة الملف"
                    onClick={handleRemoveAttachedFile}
                />
            </MotionBox>
          )}
          <HStack spacing={3}>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              bg={inputBg}
              borderRadius="full"
              p={6}
              fontSize="md"
              border="none"
              _focus={{ border: "2px solid", borderColor: "blue.400", boxShadow: "outline" }}
              onKeyPress={handleKeyPress}
            />
            {/* زر رفع الملفات */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaPaperclip />}
                colorScheme="gray"
                aria-label="إرفاق ملف"
                size="lg"
                isRound
                shadow="md"
                _hover={{ bg: useColorModeValue("gray.200", "gray.600") }}
              />
              <MenuList bg={chatBg} shadow="lg" py={2} borderRadius="lg">
                <MenuItem
                  icon={<FaImage />}
                  onClick={() => fileInputRef.current.click()}
                  _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                >
                  رفع صورة (PNG, JPG)
                </MenuItem>
                <MenuItem
                  icon={<FaFilePdf />}
                  onClick={() => fileInputRef.current.click()}
                  _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                >
                  رفع ملف PDF
                </MenuItem>
              </MenuList>
            </Menu>
            {/* Input الفعلي لرفع الملفات (مخفي) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              style={{ display: 'none' }}
              accept="image/*,.pdf" // تحديد أنواع الملفات
            />

            {/* زر الإرسال */}
            <IconButton
              icon={<FaPaperPlane />}
              colorScheme="blue"
              aria-label="إرسال"
              size="lg"
              isRound
              shadow="md"
              onClick={handleSendMessage}
              isLoading={isLoading}
              isDisabled={isLoading && !inputMessage.trim() && !attachedFile} // تعطيل الزر أثناء التحميل إذا كان لا يوجد ملف أو نص
            />
          </HStack>
        </Box>
      </Flex>
    </Flex>
  );
};

export default ChatbotPage;