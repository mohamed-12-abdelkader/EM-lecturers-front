// src/components/chatSystem/ChatSidebar.jsx
import React from 'react';
import { VStack, Text, Flex, Avatar, Icon, HStack } from '@chakra-ui/react';
import { IoPeopleOutline, IoPersonOutline } from 'react-icons/io5';

const ChatSidebar = ({ chats, type, onSelectChat, activeChatId, activeChatType }) => {
    return (
        <VStack align="stretch" spacing={2}>
            {chats.map((chat) => (
                <Flex
                    key={chat.id}
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                    bg={activeChatId === chat.id && activeChatType === type ? 'teal.100' : 'transparent'}
                    onClick={() => onSelectChat(type, chat.id)}
                    align="center"
                    justifyContent="space-between" // لتوزيع العناصر
                >
                    <HStack> {/* لتجميع الأيقونة والنص */}
                        {type === 'group' ? (
                            <Icon as={IoPeopleOutline} boxSize="20px" color="teal.600" />
                        ) : (
                            <Avatar size="sm" name={chat.name} />
                        )}
                        <Text fontWeight={activeChatId === chat.id && activeChatType === type ? 'bold' : 'normal'}>
                            {chat.name}
                        </Text>
                    </HStack>
                    {type === 'group' && chat.students && (
                        <Text fontSize="xs" color="gray.500" mr={2}>{chat.students.length} طلاب</Text>
                    )}
                </Flex>
            ))}
        </VStack>
    );
};

export default ChatSidebar;