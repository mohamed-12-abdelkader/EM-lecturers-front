// src/components/chatSystem/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text, Input, InputRightElement, InputGroup, IconButton, VStack, Avatar } from '@chakra-ui/react';
import { IoPeopleOutline, IoSend } from 'react-icons/io5';
import Message from './Message'; // مكون الرسالة الواحدة

const ChatWindow = ({ chatData, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // للتمرير لأسفل عند إضافة رسائل جديدة
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    if (!chatData) {
        return (
            <Flex h="full" align="center" justify="center">
                <Text fontSize="xl" color="gray.500">اختر محادثة لعرض الرسائل</Text>
            </Flex>
        );
    }

    const isGroupChat = chatData.students !== undefined; // طريقة بسيطة للتفريق بين المجموعة والفرد

    return (
        <Flex direction="column" h="full" bg="white" borderRadius="lg" boxShadow="md">
            {/* رأس المحادثة */}
            <Flex p={4} borderBottom="1px solid" borderColor="gray.200" align="center">
                {isGroupChat ? (
                    <Avatar size="md" icon={<IoPeopleOutline fontSize="1.5rem" />} bg="teal.100" color="teal.700" />
                ) : (
                    <Avatar size="md" name={chatData.name} />
                )}
                <Box ml={3}>
                    <Text fontSize="xl" fontWeight="bold">{chatData.name}</Text>
                    {isGroupChat && <Text fontSize="sm" color="gray.500">{chatData.students.length} أعضاء</Text>}
                    {!isGroupChat && <Text fontSize="sm" color="gray.500">{chatData.grade}</Text>}
                </Box>
            </Flex>

            {/* منطقة عرض الرسائل */}
            <VStack flex="1" p={4} spacing={3} overflowY="auto" align="stretch">
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <Message
                            key={msg.id}
                            message={msg.text}
                            sender={msg.sender}
                            timestamp={msg.timestamp}
                            isMine={msg.sender === 'المدرس'} // نفترض أن المدرس هو المستخدم الحالي
                        />
                    ))
                ) : (
                    <Text textAlign="center" color="gray.500" mt={8}>لا توجد رسائل في هذه المحادثة حتى الآن.</Text>
                )}
                <div ref={messagesEndRef} /> {/* نقطة التمرير */}
            </VStack>

            {/* مربع إدخال الرسائل */}
            <Box p={4} borderTop="1px solid" borderColor="gray.200" >
                <InputGroup>
                    <Input
                    
                        placeholder="اكتب رسالة..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        pr="4.5rem" // مساحة للزر
                    />
                    <InputRightElement width="4.5rem">
                        <IconButton
                            h="1.75rem"
                            size="sm"
                            onClick={handleSend}
                            icon={<IoSend />}
                            colorScheme="teal"
                            aria-label="Send message"
                        />
                    </InputRightElement>
                </InputGroup>
            </Box>
        </Flex>
    );
};

export default ChatWindow;