import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Avatar,
  useColorMode,
  useColorModeValue,
  IconButton,
  extendTheme,
  ColorModeScript,
} from '@chakra-ui/react';

import {
  FiSend,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';
import { FaUserGraduate } from 'react-icons/fa';
import { AiOutlineRobot } from 'react-icons/ai';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

const subjects = [
  { id: 1, name: 'الرياضيات' },
  { id: 2, name: 'اللغة العربية' },
  { id: 3, name: 'العلوم' },
  { id: 4, name: 'التاريخ' },
];

const mockChats = {
  1: [
    { from: 'student', text: 'ما هو التفاضل؟' },
    { from: 'ai', text: 'التفاضل هو فرع من فروع الرياضيات يدرس التغير في الكميات.' },
  ],
  2: [
    { from: 'student', text: 'ما معنى الجملة الاسمية؟' },
    { from: 'ai', text: 'هي الجملة التي تبدأ باسم وتتكون من مبتدأ وخبر.' },
  ],
  3: [],
  4: [],
};

const ChatPage = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chats, setChats] = useState(mockChats);
  const [input, setInput] = useState('');
  const { colorMode, toggleColorMode } = useColorMode();

  const bgSidebar = useColorModeValue('gray.100', 'gray.800');
  const bgChat = useColorModeValue('gray.50', 'gray.700');
  const bubbleStudent = useColorModeValue('teal.100', 'teal.600');
  const bubbleAI = useColorModeValue('gray.200', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadow = useColorModeValue('md', 'dark-lg');

  const handleSend = () => {
    if (!input || selectedSubject === null) return;
    const updated = [...chats[selectedSubject], { from: 'student', text: input }];
    updated.push({
      from: 'ai',
      text: `إجابة تلقائية للسؤال: ${input}`,
    });
    setChats({ ...chats, [selectedSubject]: updated });
    setInput('');
  };

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {/* Header */}
      <Flex
        as="header"
        w="100%"
        h="64px"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 10 }}
        py={2}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow="sm"
        position="fixed"
        top={0}
        left={0}
        zIndex={10}
      >
        <HStack spacing={3}>
          <BsChatDots size={28} color="#319795" />
          <Text fontSize="2xl" fontWeight="bold" color="teal.600">
            منصة المحادثة
          </Text>
        </HStack>
        <IconButton
          aria-label="تبديل الوضع الليلي/النهاري"
          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
          onClick={toggleColorMode}
          variant="ghost"
          size="lg"
        />
      </Flex>

      <Flex h="100vh" direction={{ base: 'column', md: 'row' }} pt="64px">
        {/* Sidebar */}
        <Box
          w={{ base: '100%', md: '300px' }}
          h={{ base: 'auto', md: 'calc(100vh - 64px)' }}
          bg={bgSidebar}
          p={4}
          borderRight={{ md: '1px solid' }}
          borderColor={borderColor}
          boxShadow={{ md: 'md' }}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="xl" fontWeight="bold" color="teal.600">
              المواد الدراسية
            </Text>
          </Flex>
          <VStack align="stretch" spacing={3}>
            {subjects.map((subject) => (
              <Box
                key={subject.id}
                p={3}
                bg={selectedSubject === subject.id ? 'teal.400' : useColorModeValue('white', 'gray.700')}
                color={selectedSubject === subject.id ? 'white' : 'inherit'}
                borderRadius="md"
                cursor="pointer"
                boxShadow={selectedSubject === subject.id ? 'md' : undefined}
                border={selectedSubject === subject.id ? '2px solid #319795' : '1px solid'}
                borderColor={selectedSubject === subject.id ? 'teal.500' : borderColor}
                _hover={{ bg: 'teal.300', color: 'white', boxShadow: 'md' }}
                transition="all 0.2s"
                onClick={() => setSelectedSubject(subject.id)}
              >
                <HStack>
                  <BsChatDots />
                  <Text>{subject.name}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Chat Area */}
        <Flex flex="1" direction="column" p={{ base: 2, md: 6 }} bg={bgChat} minH="0">
          {selectedSubject ? (
            <Box
              flex="1"
              display="flex"
              flexDirection="column"
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
              boxShadow={shadow}
              bg={useColorModeValue('white', 'gray.800')}
              overflow="hidden"
              minH="0"
            >
              <Flex align="center" borderBottom="1px solid" borderColor={borderColor} px={4} py={3} bg={useColorModeValue('gray.50', 'gray.700')}>
                <BsChatDots size={22} color="#319795" />
                <Text fontSize="lg" fontWeight="bold" ml={2} color="teal.600">
                  محادثة: {subjects.find((s) => s.id === selectedSubject)?.name}
                </Text>
              </Flex>

              <VStack
                flex="1"
                overflowY="auto"
                spacing={4}
                align="stretch"
                px={4}
                py={4}
                bg={useColorModeValue('gray.50', 'gray.700')}
                minH={0}
              >
                {chats[selectedSubject].length === 0 && (
                  <Flex align="center" justify="center" h="100%">
                    <Text color="gray.400">لا توجد رسائل بعد، ابدأ المحادثة!</Text>
                  </Flex>
                )}
                {chats[selectedSubject].map((msg, idx) => (
                  <HStack
                    key={idx}
                    alignSelf={msg.from === 'student' ? 'flex-end' : 'flex-start'}
                    bg={msg.from === 'student' ? bubbleStudent : bubbleAI}
                    px={4}
                    py={2}
                    borderRadius="2xl"
                    maxW="80%"
                    boxShadow="sm"
                    spacing={3}
                    border={msg.from === 'student' ? '1.5px solid #319795' : '1px solid'}
                    borderColor={msg.from === 'student' ? 'teal.300' : borderColor}
                    transition="all 0.2s"
                  >
                    {msg.from === 'ai' && (
                      <Avatar size="sm" bg="gray.400" icon={<AiOutlineRobot />} />
                    )}
                    <Text fontSize="md">{msg.text}</Text>
                    {msg.from === 'student' && (
                      <Avatar size="sm" bg="teal.400" icon={<FaUserGraduate />} />
                    )}
                  </HStack>
                ))}
              </VStack>

              {/* Input */}
              <Box
                as="form"
                onSubmit={e => { e.preventDefault(); handleSend(); }}
                px={4}
                py={3}
                borderTop="1px solid"
                borderColor={borderColor}
                bg={useColorModeValue('white', 'gray.800')}
                position="relative"
              >
                <HStack>
                  <Input
                    placeholder="اكتب رسالتك..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderColor={borderColor}
                    borderRadius="xl"
                    _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1.5px #319795' }}
                  />
                  <Button
                    colorScheme="teal"
                    onClick={handleSend}
                    type="submit"
                    borderRadius="xl"
                    px={6}
                    boxShadow="sm"
                    _hover={{ bg: 'teal.500' }}
                  >
                    <FiSend />
                  </Button>
                </HStack>
              </Box>
            </Box>
          ) : (
            <Flex align="center" justify="center" flex="1" minH="300px">
              <Text fontSize="xl" color="gray.400">اختر مادة لبدء المحادثة</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default ChatPage;
