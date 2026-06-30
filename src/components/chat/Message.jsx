// src/components/chatSystem/Message.jsx
import React from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';

const Message = ({ message, sender, timestamp, isMine }) => {
    return (
        <Flex justify={isMine ? 'flex-end' : 'flex-start'}>
            <Box
                bg={isMine ? 'teal.500' : 'gray.200'}
                color={isMine ? 'white' : 'black'}
                px={3}
                py={2}
                borderRadius="lg"
                maxWidth="70%"
            >
                {!isMine && <Text fontWeight="bold" fontSize="xs" mb={1}>{sender}</Text>}
                <Text fontSize="sm">{message}</Text>
                <Text fontSize="xx-small" color={isMine ? 'gray.200' : 'gray.600'} textAlign="end" mt={1}>
                    {timestamp}
                </Text>
            </Box>
        </Flex>
    );
};

export default Message;