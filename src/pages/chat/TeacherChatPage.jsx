// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Flex, Text, VStack, Divider, InputGroup, InputLeftElement, Input, Icon,
    Avatar, Badge, IconButton, useBreakpointValue, useColorModeValue, Menu, MenuButton, MenuList, MenuItem,
    InputRightElement, useToast, Image, Switch, Spinner, HStack, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton,
    Button, Heading, Center,
} from '@chakra-ui/react';
import {
    IoSearchOutline, IoPeopleOutline, IoPersonOutline, IoArrowBackOutline,
    IoEllipsisVertical, IoHappyOutline, IoAttachOutline, IoMicOutline, IoSend,
    IoImageOutline, IoDocumentOutline, IoCameraOutline, IoPlayCircleOutline, IoCloseOutline, IoReturnUpBack,
    IoCreateOutline, IoTrashOutline, IoCheckmarkOutline, IoBookOutline, IoSchoolOutline, 
    IoLibraryOutline, IoRocketOutline, IoStarOutline, IoFlameOutline, IoHeartOutline,
    IoDiamondOutline, IoShieldOutline, IoFlashOutline, IoLeafOutline, IoPlanetOutline
} from 'react-icons/io5';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';
import baseUrl from '../../api/baseUrl';
import { getSocketEndpoint } from '../../utils/socketEndpoint';
import UserType from '../../Hooks/auth/userType';


// --- خلفية المحادثة ---
const useChatBackground = () => {
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const patternOpacity = useColorModeValue(0.06, 0.1);
    return {
        backgroundColor: bgColor,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59,130,246,${patternOpacity}) 1px, transparent 0)`,
        backgroundSize: '22px 22px',
    };
};

// --- دالة اختيار أيقونة المجموعة ---
const getGroupIcon = (groupName, index) => {
    const icons = [
        IoBookOutline, IoSchoolOutline, IoLibraryOutline, IoRocketOutline, 
        IoStarOutline, IoFlameOutline, IoHeartOutline, IoDiamondOutline,
        IoShieldOutline, IoFlashOutline, IoLeafOutline, IoPlanetOutline
    ];
    
    // اختيار أيقونة بناءً على اسم المجموعة أو الفهرس
    const iconIndex = groupName ? 
        groupName.charCodeAt(0) % icons.length : 
        index % icons.length;
    
    return icons[iconIndex];
};

// --- دالة اختيار لون المجموعة ---
const getGroupColor = (groupName, index) => {
    const colors = [
        'blue', 'green', 'purple', 'orange', 'pink', 'cyan', 
        'teal', 'indigo', 'red', 'yellow', 'gray', 'emerald'
    ];
    
    const colorIndex = groupName ? 
        groupName.charCodeAt(0) % colors.length : 
        index % colors.length;
    
    return colors[colorIndex];
};


// --- ChatListItem ---
const ChatListItem = ({ chat, type, onSelectChat, isActive, index = 0 }) => {
    const sidebarItemHover = useColorModeValue('blue.50', 'whiteAlpha.100');
    const sidebarItemActive = useColorModeValue('blue.100', 'blue.900');
    const subText = useColorModeValue('gray.600', 'gray.400');
    const timeText = useColorModeValue('gray.500', 'gray.500');
    const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');
    const nameColor = useColorModeValue('gray.800', 'white');
    const GroupIcon = type === 'group' ? getGroupIcon(chat.name, index) : IoPersonOutline;
    const groupColor = getGroupColor(chat.name, index);

    return (
        <Flex
            align="center"
            px={3}
            py={2.5}
            mx={2}
            cursor="pointer"
            borderRadius="xl"
            _hover={{ bg: sidebarItemHover }}
            bg={isActive ? sidebarItemActive : 'transparent'}
            onClick={() => onSelectChat(type, chat.id)}
            border={isActive ? '1px solid' : '1px solid transparent'}
            borderColor={isActive ? 'blue.300' : 'transparent'}
            transition="all 0.15s ease"
        >
            <HStack spacing={3} w="full" minW={0}>
                {type === 'group' ? (
                    <Flex
                        boxSize={11}
                        borderRadius="xl"
                        bg={`${groupColor}.100`}
                        color={`${groupColor}.600`}
                        align="center"
                        justify="center"
                        flexShrink={0}
                        _dark={{ bg: `${groupColor}.900`, color: `${groupColor}.200` }}
                    >
                        <Icon as={GroupIcon} boxSize={5} />
                    </Flex>
                ) : (
                    <Avatar
                        size="sm"
                        src={chat.avatar || undefined}
                        name={chat.name}
                        bg="orange.400"
                        color="white"
                    />
                )}

                <Box flex="1" minW={0}>
                    <HStack justify="space-between" align="center" spacing={2}>
                        <Text fontWeight="700" fontSize="sm" noOfLines={1} color={nameColor}>
                            {chat.name}
                        </Text>
                        <Text fontSize="xs" color={timeText} whiteSpace="nowrap" flexShrink={0}>
                            {chat.time || ''}
                        </Text>
                    </HStack>

                    <HStack justify="space-between" align="center" spacing={2} mt={0.5}>
                        <Text fontSize="xs" color={subText} noOfLines={1}>
                            {chat.lastMessage || 'لا توجد رسائل'}
                        </Text>

                        {chat.unread > 0 && (
                            <Badge
                                minW="20px"
                                h="20px"
                                px={1.5}
                                borderRadius="full"
                                bg="orange.500"
                                color="white"
                                fontSize="0.65rem"
                                fontWeight="800"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {chat.unread > 99 ? '99+' : chat.unread}
                            </Badge>
                        )}
                    </HStack>
                </Box>
            </HStack>
        </Flex>
    );
};

// --- Sidebar ---
const Sidebar = ({ groups, contacts, onSelectGroup, onSelectContact, activeChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [listFilter, setListFilter] = useState('all');
    const sidebarBg = useColorModeValue('white', 'gray.800');
    const sidebarText = useColorModeValue('gray.800', 'white');
    const sidebarSubText = useColorModeValue('gray.600', 'gray.400');
    const searchBg = useColorModeValue('gray.50', 'gray.900');
    const searchBorder = useColorModeValue('gray.200', 'gray.600');
    const headerGradient = useColorModeValue(
        'linear(to-l, blue.600, blue.500)',
        'linear(to-l, blue.800, blue.700)'
    );

    const filteredGroups = useMemo(() => {
        return (groups || []).filter(chat => (chat.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [groups, searchTerm]);

    const filteredContacts = useMemo(() => {
        return (contacts || []).filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }, [contacts, searchTerm]);

    const showGroups = listFilter === 'all' || listFilter === 'groups';
    const showContacts = listFilter === 'all' || listFilter === 'students';

    return (
        <Box h="full" display="flex" flexDirection="column" bg={sidebarBg}>
            <Box
                px={4}
                py={4}
                bgGradient={headerGradient}
                color="white"
                position="relative"
                overflow="hidden"
            >
                <Box position="absolute" top="-20px" right="-10px" w="80px" h="80px" borderRadius="full" bg="whiteAlpha.150" />
                <HStack spacing={3} position="relative">
                    <Flex boxSize={10} borderRadius="xl" bg="whiteAlpha.200" align="center" justify="center">
                        <Icon as={IoPeopleOutline} boxSize={5} />
                    </Flex>
                    <Box minW={0}>
                        <Heading size="sm" fontWeight="black" noOfLines={1}>
                            رسائل المدرس
                        </Heading>
                        <Text fontSize="xs" color="whiteAlpha.900" mt={0.5}>
                            {(groups?.length || 0)} مجموعة • {(contacts?.length || 0)} طالب
                        </Text>
                    </Box>
                </HStack>
            </Box>

            <Box px={3} py={3} bg={sidebarBg}>
                <InputGroup size="sm" mb={3}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={IoSearchOutline} color={sidebarSubText} />
                    </InputLeftElement>
                    <Input
                        placeholder="ابحث في المحادثات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        bg={searchBg}
                        border="1px solid"
                        borderColor={searchBorder}
                        borderRadius="xl"
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #63b3ed' }}
                    />
                </InputGroup>

                <HStack spacing={1} bg={searchBg} p={1} borderRadius="xl" border="1px solid" borderColor={searchBorder}>
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'groups', label: 'مجموعات' },
                        { id: 'students', label: 'طلاب' },
                    ].map((tab) => (
                        <Button
                            key={tab.id}
                            size="xs"
                            flex={1}
                            borderRadius="lg"
                            fontWeight="bold"
                            variant={listFilter === tab.id ? 'solid' : 'ghost'}
                            colorScheme={listFilter === tab.id ? 'blue' : 'gray'}
                            onClick={() => setListFilter(tab.id)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </HStack>
            </Box>

            <Box flex="1" overflowY="auto" pb={3}>
                {showGroups && (
                    <>
                        <Text fontSize="xs" fontWeight="800" color={sidebarSubText} px={4} py={2} letterSpacing="wide">
                            المجموعات
                        </Text>
                        <VStack align="stretch" spacing={0.5}>
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map((chat, index) => (
                                    <ChatListItem
                                        key={chat.id}
                                        chat={chat}
                                        type="group"
                                        onSelectChat={() => onSelectGroup(chat.id)}
                                        isActive={activeChat?.type === 'group' && activeChat?.id === chat.id}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <Flex align="center" justify="center" py={8} flexDirection="column" px={4}>
                                    <Icon as={IoPeopleOutline} boxSize={10} color="gray.400" mb={2} />
                                    <Text fontSize="sm" color={sidebarSubText} textAlign="center" lineHeight="1.7">
                                        {searchTerm ? 'لا توجد مجموعات مطابقة' : 'لا توجد مجموعات متاحة'}
                                    </Text>
                                </Flex>
                            )}
                        </VStack>
                    </>
                )}

                {showGroups && showContacts && (
                    <Divider my={3} borderColor={useColorModeValue('gray.100', 'gray.700')} />
                )}

                {showContacts && (
                    <>
                        <Text fontSize="xs" fontWeight="800" color={sidebarSubText} px={4} py={2} letterSpacing="wide">
                            شات مباشر مع الطلاب
                        </Text>
                        <VStack align="stretch" spacing={0.5}>
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map((c, index) => (
                                    <ChatListItem
                                        key={`student-${c.id}`}
                                        chat={{
                                            id: c.id,
                                            name: c.name,
                                            avatar: c.avatar,
                                            lastMessage: c.lastMessage,
                                            time: c.time,
                                            unread: c.unread || 0,
                                        }}
                                        type="direct"
                                        onSelectChat={() => onSelectContact(c)}
                                        isActive={activeChat?.type === 'direct' && activeChat?.id === c.id}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <Flex align="center" justify="center" py={8} flexDirection="column" px={4}>
                                    <Icon as={IoPersonOutline} boxSize={10} color="gray.400" mb={2} />
                                    <Text fontSize="sm" color={sidebarSubText} textAlign="center" lineHeight="1.7">
                                        {searchTerm ? 'لا توجد نتائج مطابقة' : 'لا يوجد طلاب متاحين للشات'}
                                    </Text>
                                </Flex>
                            )}
                        </VStack>
                    </>
                )}
            </Box>
        </Box>
    );
};

// --- ChatHeader ---
const ChatHeader = ({ chatInfo, onBack, isMobile, canTogglePermission, allowStudentSend, onTogglePermission, togglingPermission, onOpenMembers, canViewMembers }) => {
    if (!chatInfo) return null;

    const headerBg = useColorModeValue('white', 'gray.800');
    const headerBorder = useColorModeValue('gray.200', 'gray.700');
    const headerText = useColorModeValue('gray.800', 'white');
    const headerSub = useColorModeValue('gray.600', 'gray.400');
    const iconColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <Flex
            px={{ base: 3, md: 4 }}
            py={{ base: 2.5, md: 3 }}
            borderBottom="1px solid"
            borderColor={headerBorder}
            align="center"
            bg={headerBg}
            minH={{ base: '64px', md: '72px' }}
            position="sticky"
            top="0"
            zIndex={5}
            boxShadow="sm"
        >
            {isMobile && (
                <IconButton
                    icon={<IoArrowBackOutline />}
                    onClick={onBack}
                    variant="ghost"
                    aria-label="العودة للمحادثات"
                    mr={2}
                    size="md"
                    color={iconColor}
                    borderRadius="xl"
                    _hover={{ bg: useColorModeValue('blue.50', 'whiteAlpha.100') }}
                />
            )}

            {chatInfo.isDirect ? (
                <Avatar size="md" src={chatInfo.avatar || undefined} name={chatInfo.name} bg="orange.400" />
            ) : (
                <Flex
                    boxSize={11}
                    borderRadius="xl"
                    bgGradient="linear(to-br, blue.500, blue.600)"
                    align="center"
                    justify="center"
                    color="white"
                >
                    <Icon as={IoPeopleOutline} boxSize={5} />
                </Flex>
            )}

            <Box ml={3} flex="1" minW={0}>
                <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="800" noOfLines={1} color={headerText}>
                    {chatInfo.name}
                </Text>
                <HStack spacing={2} mt={0.5}>
                    <Badge
                        colorScheme={chatInfo.isDirect ? 'orange' : 'blue'}
                        fontSize="0.6rem"
                        borderRadius="full"
                        px={2}
                    >
                        {chatInfo.isDirect ? 'شات مباشر' : 'مجموعة صفية'}
                    </Badge>
                    {!chatInfo.isDirect && allowStudentSend && (
                        <Badge colorScheme="green" fontSize="0.6rem" borderRadius="full" variant="subtle">
                            الطلاب يمكنهم الإرسال
                        </Badge>
                    )}
                </HStack>
            </Box>

            <HStack spacing={1} align="center">
                {canViewMembers && (
                    <IconButton
                        icon={<IoPersonOutline />}
                        onClick={onOpenMembers}
                        variant="ghost"
                        aria-label="عرض الأعضاء"
                        size="md"
                        color={iconColor}
                        borderRadius="xl"
                        _hover={{ bg: useColorModeValue('blue.50', 'whiteAlpha.100') }}
                    />
                )}

                {canTogglePermission && (
                    <HStack
                        spacing={2}
                        px={2}
                        py={1}
                        borderRadius="xl"
                        bg={useColorModeValue('gray.50', 'gray.900')}
                        display={{ base: 'none', sm: 'flex' }}
                    >
                        <Text fontSize="xs" color={headerSub} fontWeight="semibold" whiteSpace="nowrap">
                            سماح الطلاب
                        </Text>
                        <Switch
                            isChecked={allowStudentSend}
                            onChange={onTogglePermission}
                            isDisabled={togglingPermission}
                            colorScheme="blue"
                            size="sm"
                        />
                    </HStack>
                )}

                {canTogglePermission && (
                    <Box display={{ base: 'block', sm: 'none' }}>
                        <Switch
                            isChecked={allowStudentSend}
                            onChange={onTogglePermission}
                            isDisabled={togglingPermission}
                            colorScheme="blue"
                            size="sm"
                        />
                    </Box>
                )}
            </HStack>
        </Flex>
    );
};

// --- ChatMessage ---
const ChatMessage = ({ message, onReply, onEdit, onDelete, isEditing, isDeleting }) => {
    const isMine = message.isMine;
    const inBg = useColorModeValue('white', 'gray.800');
    const inText = useColorModeValue('gray.800', 'gray.100');
    const alignment = isMine ? 'flex-end' : 'flex-start';
    const hasAttachment = !!message.attachment_url;
    const attachmentType = message.attachment_type;
    const muted = useColorModeValue('gray.500', 'gray.400');
    const replyBorder = useColorModeValue('blue.400', 'blue.300');

    return (
        <Flex justify={alignment} mb={3} px={{ base: 1, md: 2 }} role="group">
            <Box
                maxWidth={{ base: '88%', md: '72%' }}
                position="relative"
            >
                {!isMine && message.sender && (
                    <Text fontWeight="bold" fontSize="xs" mb={1} color="blue.600" px={1}>
                        {message.sender}
                    </Text>
                )}
                <Box
                    bg={isMine ? undefined : inBg}
                    bgGradient={isMine ? 'linear(to-l, blue.500, blue.600)' : undefined}
                    color={isMine ? 'white' : inText}
                    px={4}
                    py={3}
                    borderRadius="2xl"
                    borderBottomRightRadius={isMine ? '6px' : '2xl'}
                    borderBottomLeftRadius={isMine ? '2xl' : '6px'}
                    boxShadow={isMine
                        ? '0 6px 20px -6px rgba(59,130,246,0.45)'
                        : useColorModeValue('sm', 'md')}
                    border={isMine ? 'none' : '1px solid'}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                {message.reply_to_preview && (
                    <Box
                        mb={2}
                        p={2}
                        borderRight="3px solid"
                        borderColor={isMine ? 'whiteAlpha.600' : replyBorder}
                        bg={isMine ? 'whiteAlpha.200' : useColorModeValue('blue.50', 'whiteAlpha.100')}
                        borderRadius="lg"
                    >
                        <Text fontSize="xs" fontWeight="700" mb={1} noOfLines={1} opacity={0.9}>
                            {message.reply_to_preview.sender || 'مستخدم'}
                        </Text>
                        <Text fontSize="xs" noOfLines={2} opacity={0.85}>
                            {message.reply_to_preview.text || (message.reply_to_preview.attachment_type === 'image' ? 'صورة' : message.reply_to_preview.attachment_name || 'مرفق')}
                        </Text>
                    </Box>
                )}

                {message.type === 'text' && (
                    <Text 
                        fontSize="md" 
                        lineHeight="1.6"
                        fontWeight="400"
                        wordBreak="break-word"
                        whiteSpace="pre-wrap"
                    >
                        {message.text}
                    </Text>
                )}

                {(message.type === 'image' || (hasAttachment && attachmentType === 'image')) && (
                    <Box>
                        <Image src={message.url || message.attachment_url} alt="Attached image" maxH="240px" objectFit="contain" borderRadius="md" mb={1} />
                        {message.text && message.text !== 'صورة' && <Text fontSize="sm">{message.text}</Text>}
                    </Box>
                )}

                {(message.type === 'audio' || (hasAttachment && attachmentType === 'audio')) && (
                    <Flex align="center">
                        <IconButton
                            icon={<IoPlayCircleOutline />}
                            size="sm"
                            variant="ghost"
                            colorScheme={isMine ? 'whiteAlpha' : 'teal'}
                            aria-label="Play audio"
                            onClick={() => console.log('Play audio:', message.url || message.attachment_url)}
                        />
                        <Text fontSize="sm" ml={2}>تسجيل صوتي ({message.duration || (message.duration_ms ? `${Math.round((message.duration_ms/1000))}s` : '0:05')})</Text>
                        {/* استخدام عنصر audio مخفي للتشغيل */}
                        {(message.url || message.attachment_url) && <audio src={message.url || message.attachment_url} style={{ display: 'none' }} controls />}
                    </Flex>
                )}

                {hasAttachment && attachmentType && attachmentType !== 'image' && attachmentType !== 'audio' && (
                    <Box>
                        <a href={message.attachment_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                            <Text fontSize="sm">{message.attachment_name || 'ملف مرفق'}</Text>
                        </a>
                        {message.text && <Text fontSize="sm" mt={1}>{message.text}</Text>}
                    </Box>
                )}

                <Flex justify="space-between" align="end" mt={2} gap={2}>
                    <HStack spacing={1} opacity={0.85}>
                        <IconButton
                            aria-label="reply"
                            icon={<IoReturnUpBack />}
                            size="xs"
                            variant="ghost"
                            color={isMine ? 'whiteAlpha.900' : 'blue.500'}
                            onClick={() => onReply?.(message)}
                            borderRadius="full"
                            _hover={{ bg: isMine ? 'whiteAlpha.300' : 'blue.50' }}
                        />
                        {isMine && message.type === 'text' && !hasAttachment && (
                            <Menu placement="top-start">
                                <MenuButton
                                    as={IconButton}
                                    icon={<IoEllipsisVertical />}
                                    size="xs"
                                    variant="ghost"
                                    color="whiteAlpha.900"
                                    aria-label="خيارات الرسالة"
                                    borderRadius="full"
                                    _hover={{ bg: 'whiteAlpha.300' }}
                                />
                                <MenuList
                                    bg={useColorModeValue('white', 'gray.800')}
                                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                                    borderRadius="xl"
                                    py={2}
                                    minW="140px"
                                >
                                    <MenuItem
                                        icon={<IoCreateOutline />}
                                        onClick={() => onEdit?.(message)}
                                        borderRadius="lg"
                                        mx={1}
                                        fontWeight="medium"
                                    >
                                        تعديل
                                    </MenuItem>
                                    <MenuItem
                                        icon={<IoTrashOutline />}
                                        onClick={() => onDelete?.(message.id)}
                                        color="red.500"
                                        borderRadius="lg"
                                        mx={1}
                                        fontWeight="medium"
                                    >
                                        حذف
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        )}
                    </HStack>
                    <VStack spacing={0} align="end" flexShrink={0}>
                        <Text fontSize="xs" color={isMine ? 'whiteAlpha.800' : muted} fontWeight="500">
                            {message.timestamp}
                        </Text>
                        {message.isEdited && (
                            <Text fontSize="xs" color={isMine ? 'whiteAlpha.700' : muted} fontStyle="italic">
                                (معدّلة)
                            </Text>
                        )}
                    </VStack>
                </Flex>
                </Box>
            </Box>
        </Flex>
    );
};

// --- MessagesContainer ---
const MessagesContainer = ({ messages, onReply, onEdit, onDelete, isEditing, isDeleting }) => {
    const messagesEndRef = useRef(null);
    const emptyColor = useColorModeValue('gray.500', 'gray.400');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <VStack
            flex="1"
            px={{ base: 2, md: 4 }}
            py={{ base: 3, md: 4 }}
            spacing={1}
            overflowY="auto"
            align="stretch"
            bg="transparent"
            minH={0}
        >
            {messages.length > 0 ? (
                messages.map((msg) => (
                    <ChatMessage
                        key={msg.id}
                        message={msg}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isEditing={isEditing}
                        isDeleting={isDeleting}
                    />
                ))
            ) : (
                <Center flex={1} flexDirection="column" gap={3} py={12}>
                    <Flex
                        boxSize={14}
                        borderRadius="2xl"
                        bgGradient="linear(to-br, blue.500, blue.600)"
                        align="center"
                        justify="center"
                        color="white"
                        opacity={0.9}
                    >
                        <Icon as={IoHappyOutline} boxSize={7} />
                    </Flex>
                    <Text textAlign="center" color={emptyColor} fontSize="sm" lineHeight="1.7">
                        لا توجد رسائل بعد. ابدأ المحادثة الآن.
                    </Text>
                </Center>
            )}
            <Box ref={messagesEndRef} h="1px" />
        </VStack>
    );
};

// --- SendButton ---
const SendButton = ({ onSend, disabled, isLoading }) => {
    return (
        <IconButton
            icon={<IoSend />}
            aria-label="إرسال الرسالة"
            size="sm"
            onClick={onSend}
            isDisabled={disabled}
            isLoading={isLoading}
            borderRadius="xl"
            color="white"
            bgGradient={disabled ? undefined : 'linear(to-l, orange.500, orange.400)'}
            bg={disabled ? 'gray.300' : undefined}
            boxShadow={disabled ? 'none' : '0 4px 14px rgba(249,115,22,0.35)'}
            _hover={disabled ? {} : { bgGradient: 'linear(to-l, orange.600, orange.500)' }}
            _active={{ transform: 'scale(0.96)' }}
            transition="all 0.15s ease"
        />
    );
};

// --- 8. مكون MessageInputBar ---
const MessageInputBar = ({ onSendMessage, onSendAttachment, disabled, replyTarget, onCancelReply, isSending, editingMessage, editText, setEditText, onSaveEdit, onCancelEdit }) => {
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);
    const toast = useToast();
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const inputBarBg = useColorModeValue('white', 'gray.800');
    const inputShellBg = useColorModeValue('gray.50', 'gray.900');
    const inputBorder = useColorModeValue('gray.200', 'gray.700');
    const iconColor = useColorModeValue('blue.600', 'blue.300');

    const handleSend = () => {
        if (disabled || !message.trim()) return;
        onSendMessage(message, 'text');
        setMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (editingMessage) {
                onSaveEdit(editingMessage.id, editText);
            } else {
            handleSend();
            }
        }
    };

    const handleSaveEdit = () => {
        if (!editText.trim()) return;
        onSaveEdit(editingMessage.id, editText);
    };

    const handleImageUploadClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (disabled) return;
        setPendingAttachment({ file, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null });
        e.target.value = '';
    };


    return (
        <Box position="sticky" bottom="0" zIndex={5}>
            {/* شريط تعديل الرسالة */}
            {editingMessage && (
                <Flex 
                    align="center" 
                    bg={useColorModeValue('blue.50','blue.900')} 
                    border="2px solid"
                    borderColor="blue.300"
                    px={4} 
                    py={3} 
                    borderRadius="xl" 
                    mx={4}
                    mb={3}
                    boxShadow="lg"
                    position="relative"
                    _before={{
                        content: '""',
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid',
                        borderBottomColor: 'blue.300'
                    }}
                >
                    <Box flex="1">
                        <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('blue.700','blue.200')} mb={2}>
                            ✏️ تعديل الرسالة
                        </Text>
                        <Text 
                            fontSize="sm" 
                            color={useColorModeValue('blue.600','blue.300')} 
                            noOfLines={2}
                            bg={useColorModeValue('white','blue.800')}
                            p={2}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={useColorModeValue('blue.200','blue.600')}
                        >
                            {editingMessage.text}
                        </Text>
                    </Box>
                    <HStack spacing={2} ml={4}>
                        <IconButton 
                            aria-label="حفظ التعديل" 
                            icon={<IoCheckmarkOutline />} 
                            size="md" 
                            colorScheme="green" 
                            variant="solid"
                            onClick={handleSaveEdit}
                            isDisabled={!editText.trim()}
                            borderRadius="full"
                            _hover={{
                                transform: 'scale(1.1)',
                                boxShadow: 'lg'
                            }}
                            transition="all 0.2s"
                        />
                        <IconButton 
                            aria-label="إلغاء التعديل" 
                            icon={<IoCloseOutline />} 
                            size="md" 
                            colorScheme="red" 
                            variant="solid"
                            onClick={onCancelEdit}
                            borderRadius="full"
                            _hover={{
                                transform: 'scale(1.1)',
                                boxShadow: 'lg'
                            }}
                            transition="all 0.2s"
                        />
                    </HStack>
                </Flex>
            )}

            {/* شريط الرد */}
            {replyTarget && !editingMessage && (
                <Flex 
                    align="center" 
                    bg={useColorModeValue('green.50','green.900')} 
                    border="2px solid"
                    borderColor="green.300"
                    px={4} 
                    py={3} 
                    borderRadius="xl" 
                    mx={4}
                    mb={3}
                    boxShadow="lg"
                    position="relative"
                    _before={{
                        content: '""',
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid',
                        borderBottomColor: 'green.300'
                    }}
                >
                    <Box flex="1">
                        <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('green.700','green.200')} mb={2}>
                            💬 الرد على {replyTarget.sender || 'مستخدم'}
                        </Text>
                        <Text 
                            fontSize="sm" 
                            color={useColorModeValue('green.600','green.300')} 
                            noOfLines={2}
                            bg={useColorModeValue('white','green.800')}
                            p={2}
                            borderRadius="md"
                            border="1px solid"
                            borderColor={useColorModeValue('green.200','green.600')}
                        >
                            {replyTarget.text || (replyTarget.attachment_type === 'image' ? 'صورة' : replyTarget.attachment_name || 'مرفق')}
                        </Text>
                    </Box>
                    <IconButton 
                        aria-label="إلغاء الرد" 
                        icon={<IoCloseOutline />} 
                        size="md" 
                        colorScheme="red" 
                        variant="solid"
                        onClick={onCancelReply} 
                        borderRadius="full"
                        ml={4}
                        _hover={{
                            transform: 'scale(1.1)',
                            boxShadow: 'lg'
                        }}
                        transition="all 0.2s"
                    />
                </Flex>
            )}

            {/* معاينة المرفق قبل الإرسال */}
            {pendingAttachment && (
                <Flex 
                    align="center" 
                    bg={useColorModeValue('purple.50','purple.900')} 
                    border="2px solid" 
                    borderColor="purple.300" 
                    px={4} 
                    py={3} 
                    borderRadius="xl" 
                    mx={4}
                    mb={3}
                    boxShadow="lg"
                    position="relative"
                    _before={{
                        content: '""',
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid',
                        borderBottomColor: 'purple.300'
                    }}
                >
                    <Box flex="1">
                        <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('purple.700','purple.200')} mb={2}>
                            📎 معاينة المرفق
                        </Text>
                        <Flex align="center">
                    {pendingAttachment.previewUrl ? (
                        <Image 
                            src={pendingAttachment.previewUrl} 
                            alt="preview" 
                                    boxSize="60px" 
                            objectFit="cover" 
                                    borderRadius="lg" 
                            mr={3} 
                                    border="2px solid"
                                    borderColor={useColorModeValue('purple.200','purple.600')}
                        />
                    ) : (
                                <Box 
                                    bg={useColorModeValue('white','purple.800')}
                                    p={3}
                                    borderRadius="lg"
                                    border="2px solid"
                                    borderColor={useColorModeValue('purple.200','purple.600')}
                                    mr={3}
                                >
                                    <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('purple.600','purple.300')}>
                                        📄 {pendingAttachment.file.name}
                                    </Text>
                                </Box>
                            )}
                        </Flex>
                    </Box>
                    <HStack spacing={2} ml={4}>
                    <IconButton 
                        aria-label="إزالة" 
                        icon={<IoCloseOutline />} 
                            size="md" 
                            colorScheme="red" 
                            variant="solid"
                        onClick={() => setPendingAttachment(null)} 
                            borderRadius="full"
                            _hover={{
                                transform: 'scale(1.1)',
                                boxShadow: 'lg'
                            }}
                            transition="all 0.2s"
                    />
                    <Button 
                        colorScheme="teal" 
                            size="md" 
                            borderRadius="full"
                        onClick={async () => {
                            if (!pendingAttachment) return;
                            try {
                                await onSendAttachment(pendingAttachment.file, { text: message });
                                setPendingAttachment(null);
                                setMessage('');
                            } catch {
                                // toast داخل onSendAttachment
                            }
                        }}
                            _hover={{
                                transform: 'scale(1.05)',
                                boxShadow: 'lg'
                            }}
                            transition="all 0.2s"
                    >
                        إرسال
                    </Button>
                    </HStack>
                </Flex>
            )}

            {/* شريط الإدخال الرئيسي */}
            <Flex
                p={{ base: 2, md: 3 }}
                pb={{ base: 'max(8px, env(safe-area-inset-bottom))', md: 3 }}
                bg={inputBarBg}
                align="center"
                borderTop="1px solid"
                borderColor={inputBorder}
                gap={2}
            >
                <Menu>
                    <MenuButton
                        as={IconButton}
                        icon={<IoAttachOutline />}
                        variant="ghost"
                        aria-label="إرفاق ملف"
                        size="md"
                        color={iconColor}
                        borderRadius="xl"
                        isDisabled={disabled}
                        _hover={{ bg: useColorModeValue('blue.50', 'whiteAlpha.100') }}
                    />
                    <MenuList borderRadius="xl">
                        <MenuItem icon={<IoImageOutline />} onClick={handleImageUploadClick}>
                            صورة / ملف
                        </MenuItem>
                    </MenuList>
                </Menu>

                <input
                    type="file"
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/*,video/*,application/zip,application/x-zip-compressed,application/x-7z-compressed"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                <Box
                    flex="1"
                    p={1.5}
                    borderRadius="2xl"
                    border="2px solid"
                    borderColor={inputBorder}
                    bg={inputShellBg}
                >
                    <InputGroup>
                        <Input
                            placeholder={editingMessage ? 'عدّل الرسالة...' : 'اكتب رسالة...'}
                            borderRadius="xl"
                            value={editingMessage ? editText : message}
                            onChange={(e) => (editingMessage ? setEditText(e.target.value) : setMessage(e.target.value))}
                            onKeyPress={handleKeyPress}
                            pr="3rem"
                            isDisabled={disabled}
                            border="none"
                            bg="transparent"
                            _focus={{ boxShadow: 'none' }}
                            fontSize="sm"
                        />
                        <InputRightElement width="3rem" pr={1}>
                            <SendButton
                                onSend={editingMessage ? handleSaveEdit : handleSend}
                                disabled={disabled || (editingMessage ? !editText.trim() : !message.trim())}
                                isLoading={isSending}
                            />
                        </InputRightElement>
                    </InputGroup>
                </Box>
            </Flex>
        </Box>
    );
};

// --- MainChatArea ---
const MainChatArea = ({ chatInfo, messages, onSendMessage, onBack, isMobile, canTogglePermission, allowStudentSend, onTogglePermission, togglingPermission, inputDisabled, onOpenMembers, canViewMembers, onSendAttachment, replyTarget, onSelectReply, isSending, onEditMessage, onDeleteMessage, editingMessage, editText, setEditText, onSaveEdit, onCancelEdit, isEditing, isDeleting }) => {
    const chatBgStyle = useChatBackground();
    return (
        <Flex direction="column" h="full" minH={0} style={chatBgStyle}>
            {/* Header */}
            <ChatHeader 
                chatInfo={chatInfo} 
                onBack={onBack} 
                isMobile={isMobile} 
                canTogglePermission={canTogglePermission} 
                allowStudentSend={allowStudentSend} 
                onTogglePermission={onTogglePermission} 
                togglingPermission={togglingPermission} 
                onOpenMembers={onOpenMembers} 
                canViewMembers={canViewMembers} 
            />

            {/* Messages Container */}
            <MessagesContainer 
                messages={messages} 
                onReply={onSelectReply} 
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                isEditing={isEditing}
                isDeleting={isDeleting}
            />

            {/* Notice: sending disabled for students */}
            {inputDisabled && (
                <Flex
                    px={4}
                    py={2.5}
                    bg={useColorModeValue('orange.50', 'orange.900')}
                    borderTop="1px solid"
                    borderColor={useColorModeValue('orange.200', 'orange.700')}
                    align="center"
                    justify="center"
                >
                    <Text fontSize="sm" color={useColorModeValue('orange.700', 'orange.200')} textAlign="center" fontWeight="semibold">
                        تم إيقاف إرسال الرسائل للطلاب من قبل المعلم.
                    </Text>
                </Flex>
            )}

            {/* Message Input Bar */}
            <MessageInputBar 
                onSendMessage={onSendMessage} 
                onSendAttachment={onSendAttachment} 
                disabled={inputDisabled} 
                replyTarget={replyTarget} 
                onCancelReply={() => onSelectReply(null)}
                isSending={isSending}
                editingMessage={editingMessage}
                editText={editText}
                setEditText={setEditText}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
            />
        </Flex>
    );
};


function getCurrentUserId(userData) {
    if (!userData) return null;
    return userData.id ?? userData._id ?? null;
}

function resolveGroupIdFromPayload(payload) {
    return payload?.group_id ?? payload?.chat_group_id ?? payload?.groupId ?? null;
}

function transformIncomingMessage(m, userData) {
    const userId = getCurrentUserId(userData);
    const hasAttachment = !!m?.attachment_url;
    const attachmentType = m?.attachment_type;
    return {
        id: m.id,
        sender: m.sender_name || m.sender || 'مستخدم',
        text: m.text,
        attachment_url: m.attachment_url,
        attachment_type: attachmentType,
        attachment_name: m.attachment_name,
        attachment_mime: m.attachment_mime,
        attachment_size: m.attachment_size,
        duration_ms: m.duration_ms ?? m.attachment_duration_ms,
        reply_to: m.reply_to_message_id || m.reply_to,
        reply_to_preview: m.reply
            ? {
                id: m.reply.id,
                sender: m.reply.sender_name,
                text: m.reply.text,
                attachment_type: m.reply.attachment_type,
                attachment_name: m.reply.attachment_name,
            }
            : m.reply_to_preview,
        timestamp: dayjs(m.created_at).format('h:mm A'),
        isMine: !!(userId && m.sender_id === userId),
        type: hasAttachment
            ? (attachmentType === 'image' ? 'image' : attachmentType === 'audio' ? 'audio' : 'file')
            : 'text',
        isEdited: !!m.is_edited,
    };
}

function appendMessageIfNew(prev, groupId, message) {
    if (!groupId || !message?.id) return prev;
    const existing = prev[groupId] || [];
    if (existing.some((x) => x.id === message.id)) return prev;
    return { ...prev, [groupId]: [...existing, message] };
}

function joinChatRooms(socket, groupsList, contactsList) {
    if (!socket?.connected) return;
    (groupsList || []).forEach((g) => {
        if (g?.id != null) socket.emit('chat:join-group', g.id);
    });
    (contactsList || []).forEach((c) => {
        if (c?.direct_chat_group_id) {
            socket.emit('chat:join-group', c.direct_chat_group_id);
        } else if (c?.id) {
            socket.emit('chat:join-direct', { otherId: c.id }, (resp) => {
                if (resp?.ok && resp.chat_group_id) {
                    socket.emit('chat:join-group', resp.chat_group_id);
                }
            });
        }
    });
}


// --- المكون الرئيسي ChatPage ---
const TeacherChat = () => {
    const [showSidebar, setShowSidebar] = useState(true);
    const isMobile = useBreakpointValue({ base: true, md: false });
    const toast = useToast();
    const [userData, isAdmin, isTeacher, student] = UserType();

    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [activeChatType, setActiveChatType] = useState('group'); // group | direct
    const [activeDirect, setActiveDirect] = useState(null); // { id, name, avatar, chat_group_id }
    const [messagesByGroup, setMessagesByGroup] = useState({});
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [togglingPermission, setTogglingPermission] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [replyTarget, setReplyTarget] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const socketRef = useRef(null);
    const groupsRef = useRef([]);
    const contactsRef = useRef([]);
    const userDataRef = useRef(userData);
    const activeGroupIdRef = useRef(activeGroupId);
    const activeChatTypeRef = useRef(activeChatType);
    const activeDirectRef = useRef(activeDirect);

    useEffect(() => { groupsRef.current = groups; }, [groups]);
    useEffect(() => { contactsRef.current = contacts; }, [contacts]);
    useEffect(() => { userDataRef.current = userData; }, [userData]);
    useEffect(() => { activeGroupIdRef.current = activeGroupId; }, [activeGroupId]);
    useEffect(() => { activeChatTypeRef.current = activeChatType; }, [activeChatType]);
    useEffect(() => { activeDirectRef.current = activeDirect; }, [activeDirect]);

    const authHeader = useMemo(() => {
        const raw = localStorage.getItem('Authorization') || localStorage.getItem('token');
        if (!raw) return undefined;
        return /^Bearer\s+/i.test(raw) ? raw : `Bearer ${raw}`;
    }, []);

    const socketEndpoint = useMemo(() => getSocketEndpoint(), []);

    // Fetch groups on mount
    useEffect(() => {
        let ignore = false;
        const fetchGroups = async () => {
            setIsLoadingGroups(true);
            try {
                const { data } = await baseUrl.get('/api/chat/groups', {
                    headers: authHeader ? { Authorization: authHeader } : {},
                });
                if (ignore) return;
                const apiGroups = (data?.groups || []).map(g => ({
                    id: g.id,
                    grade_id: g.grade_id,
                    name: g.name,
                    owner_teacher_id: g.owner_teacher_id,
                    allow_student_send: g.allow_student_send,
                    created_at: g.created_at,
                    lastMessage: '',
                    time: '',
                    unread: 0,
                }));
                setGroups(apiGroups);
                // Auto-select first group if none selected
                if (!activeGroupId && apiGroups.length > 0) {
                    setActiveGroupId(apiGroups[0].id);
                }
            } catch (err) {
                toast({ title: 'فشل تحميل المجموعات', status: 'error', duration: 3000, isClosable: true });
            } finally {
                setIsLoadingGroups(false);
            }
        };
        fetchGroups();
        return () => { ignore = true; };
    }, [authHeader, toast]);

    // Fetch contacts (Teacher: students)
    useEffect(() => {
        let ignore = false;
        const fetchContacts = async () => {
            if (!isTeacher) return;
            setContactsLoading(true);
            try {
                const { data } = await baseUrl.get('/api/chat/contacts', {
                    headers: authHeader ? { Authorization: authHeader } : {},
                });
                if (ignore) return;
                const list = (data?.contacts || [])
                    .filter(c => c?.type === 'student' && c?.student)
                    .map(c => ({
                        id: c.student.id,
                        name: c.student.name,
                        avatar: c.student.avatar,
                        direct_chat_group_id: c.direct_chat_group_id,
                        lastMessage: '',
                        time: '',
                        unread: 0,
                    }));
                setContacts(list);
            } catch (err) {
                toast({ title: 'فشل تحميل الطلاب', status: 'error', duration: 3000, isClosable: true });
                setContacts([]);
            } finally {
                setContactsLoading(false);
            }
        };
        fetchContacts();
        return () => { ignore = true; };
    }, [authHeader, isTeacher, toast]);

    // Connect socket once — لا يُعاد الاتصال عند تبديل المحادثة
    useEffect(() => {
        const tokenOnly = (localStorage.getItem('Authorization') || '').replace(/^Bearer\s+/i, '') || localStorage.getItem('token');
        const s = io(socketEndpoint, {
            path: '/socket.io',
            withCredentials: true,
            auth: tokenOnly ? { token: tokenOnly } : {},
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 12,
        });
        socketRef.current = s;

        const onConnect = () => {
            joinChatRooms(s, groupsRef.current, contactsRef.current);
        };

        const onNewMessage = (payload) => {
            const groupId = resolveGroupIdFromPayload(payload);
            if (!groupId) return;

            const transformed = transformIncomingMessage(payload, userDataRef.current);
            setMessagesByGroup((prev) => appendMessageIfNew(prev, groupId, transformed));

            const previewText = transformed.text
                || (transformed.attachment_type === 'image' ? 'صورة' : transformed.attachment_name || 'مرفق');

            const agId = activeGroupIdRef.current;
            const actType = activeChatTypeRef.current;
            const actDirect = activeDirectRef.current;

            setGroups((prev) => prev.map((g) => {
                if (g.id !== groupId) return g;
                const isActive = actType === 'group' && g.id === agId;
                return {
                    ...g,
                    lastMessage: previewText,
                    time: transformed.timestamp,
                    unread: isActive ? 0 : (g.unread || 0) + 1,
                };
            }));

            setContacts((prev) => prev.map((c) => {
                if (c.direct_chat_group_id !== groupId) return c;
                const isActive = actType === 'direct' && actDirect?.id === c.id;
                return {
                    ...c,
                    lastMessage: previewText,
                    time: transformed.timestamp,
                    unread: isActive ? 0 : (c.unread || 0) + 1,
                };
            }));
        };

        const onPermissionChanged = (payload) => {
            if (!payload?.groupId) return;
            setGroups((prev) => prev.map((g) => (
                g.id === payload.groupId
                    ? { ...g, allow_student_send: payload.allow_student_send }
                    : g
            )));
        };

        s.on('connect', onConnect);
        s.on('chat:new-message', onNewMessage);
        s.on('chat:permission-changed', onPermissionChanged);
        s.on('connect_error', (e) => {
            console.error('Socket connect_error:', e);
        });

        return () => {
            s.off('connect', onConnect);
            s.off('chat:new-message', onNewMessage);
            s.off('chat:permission-changed', onPermissionChanged);
            s.disconnect();
            socketRef.current = null;
        };
    }, [socketEndpoint]);

    // انضمام للغرف عند تحديث القوائم (بدون إعادة إنشاء الاتصال)
    useEffect(() => {
        joinChatRooms(socketRef.current, groups, contacts);
    }, [groups, contacts]);

    // Load history when selecting a group/direct chat
    useEffect(() => {
        const loadHistory = async () => {
            if (activeChatType === 'direct') {
                const otherId = activeDirect?.id;
                if (!otherId) return;
                const knownGroupId = activeDirect?.chat_group_id || contacts.find(c => c.id === otherId)?.direct_chat_group_id;
                if (knownGroupId) {
                    const alreadyLoaded = messagesByGroup[knownGroupId]?.length;
                    if (alreadyLoaded) return;
                }
                setIsLoadingHistory(true);
                try {
                    const { data } = await baseUrl.get(`/api/chat/direct/${otherId}/messages`, {
                        params: { limit: 50 },
                        headers: authHeader ? { Authorization: authHeader } : {},
                    });
                    const chatGroupId = data?.chat_group_id || knownGroupId;
                    const transformed = (data?.messages || []).map((m) => transformIncomingMessage(m, userData));
                    if (chatGroupId) {
                        setMessagesByGroup((prev) => {
                            if (prev[chatGroupId]?.length) return prev;
                            return { ...prev, [chatGroupId]: transformed };
                        });
                        setActiveDirect((prev) => (prev && prev.id === otherId ? { ...prev, chat_group_id: chatGroupId } : prev));
                        setContacts((prev) => prev.map((c) => (
                            c.id === otherId ? { ...c, direct_chat_group_id: chatGroupId, unread: 0 } : c
                        )));
                        socketRef.current?.emit('chat:join-group', chatGroupId);
                    }
                } catch (err) {
                    toast({ title: 'فشل تحميل الرسائل', status: 'error', duration: 3000, isClosable: true });
                } finally {
                    setIsLoadingHistory(false);
                }
                return;
            }

            if (!activeGroupId) return;
            if (messagesByGroup[activeGroupId]?.length) return;
            setIsLoadingHistory(true);
            try {
                const { data } = await baseUrl.get(`/api/chat/groups/${activeGroupId}/history`, {
                    params: { limit: 50 },
                    headers: authHeader ? { Authorization: authHeader } : {},
                });
                const transformed = (data?.messages || []).map((m) => transformIncomingMessage(m, userData));
                setMessagesByGroup((prev) => {
                    if (prev[activeGroupId]?.length) return prev;
                    return { ...prev, [activeGroupId]: transformed };
                });
                const last = transformed[transformed.length - 1];
                setGroups((prev) => prev.map((g) => (
                    g.id === activeGroupId
                        ? { ...g, lastMessage: last?.text || '', time: last?.timestamp || '' }
                        : g
                )));
            } catch (err) {
                toast({ title: 'فشل تحميل الرسائل', status: 'error', duration: 3000, isClosable: true });
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- لا نعيد التحميل عند كل رسالة realtime
    }, [activeGroupId, activeChatType, activeDirect?.id, authHeader, toast, userData, contacts]);

    const handleChatSelect = (id) => {
        setActiveChatType('group');
        setActiveDirect(null);
        setActiveGroupId(id);
        socketRef.current?.emit('chat:join-group', id);
        setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, unread: 0 } : g)));
        if (isMobile) {
            setShowSidebar(false);
        }
    };

    const handleDirectSelect = (contact) => {
        setActiveChatType('direct');
        setActiveGroupId(null);
        setActiveDirect({
            id: contact.id,
            name: contact.name,
            avatar: contact.avatar,
            chat_group_id: contact.direct_chat_group_id || null,
        });
        if (isMobile) setShowSidebar(false);
        const socket = socketRef.current;
        if (contact.direct_chat_group_id) {
            socket?.emit('chat:join-group', contact.direct_chat_group_id);
        } else {
            socket?.emit('chat:join-direct', { otherId: contact.id }, (resp) => {
                if (!resp?.ok || !resp.chat_group_id) return;
                setContacts((prev) => prev.map((c) => (
                    c.id === contact.id ? { ...c, direct_chat_group_id: resp.chat_group_id } : c
                )));
                setActiveDirect((prev) => (
                    prev?.id === contact.id ? { ...prev, chat_group_id: resp.chat_group_id } : prev
                ));
                socketRef.current?.emit('chat:join-group', resp.chat_group_id);
            });
        }
        setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c)));
    };

    const handleBackToSidebar = () => {
        if (isMobile) {
            setShowSidebar(true);
            setActiveGroupId(null);
            setActiveDirect(null);
        }
    };

    const getActiveChatInfo = () => {
        if (activeChatType === 'direct') {
            if (!activeDirect) return null;
            return {
                id: activeDirect.id,
                name: activeDirect.name,
                avatar: activeDirect.avatar,
                isDirect: true,
            };
        }
        if (!activeGroupId) return null;
        return groups.find(chat => chat.id === activeGroupId);
    };

    const getMessagesForChat = (id) => messagesByGroup[id] || [];

    const getActiveChatGroupId = () => {
        if (activeChatType === 'direct') {
            const otherId = activeDirect?.id;
            if (!otherId) return null;
            return activeDirect?.chat_group_id || contacts.find(c => c.id === otherId)?.direct_chat_group_id || null;
        }
        return activeGroupId;
    };

    const onSendMessage = async (content, messageType = 'text') => {
        if (activeChatType === 'direct') {
            const otherId = activeDirect?.id;
            if (!otherId) return;
            if (messageType !== 'text') return;
            try {
                setIsSending(true);
                const { data } = await baseUrl.post(`/api/chat/direct/${otherId}/messages`, { message: content }, {
                    headers: authHeader ? { Authorization: authHeader } : {},
                });
                const chatGroupId = data?.chat_group_id;
                const m = data?.message;
                if (chatGroupId) {
                    socketRef.current?.emit('chat:join-group', chatGroupId);
                    setActiveDirect(prev => prev && prev.id === otherId ? { ...prev, chat_group_id: chatGroupId } : prev);
                    setContacts(prev => prev.map(c => c.id === otherId ? { ...c, direct_chat_group_id: chatGroupId, lastMessage: m?.text || content, time: dayjs(m?.created_at || new Date()).format('h:mm A'), unread: 0 } : c));
                }
                if (chatGroupId && m) {
                    const transformed = transformIncomingMessage(
                        { ...m, sender_name: userData?.name || 'أنا' },
                        userData,
                    );
                    transformed.isMine = true;
                    setMessagesByGroup((prev) => appendMessageIfNew(prev, chatGroupId, transformed));
                }
                setReplyTarget(null);
            } catch (e) {
                toast({ title: 'تعذر إرسال الرسالة', status: 'error', duration: 2500, isClosable: true });
            } finally {
                setIsSending(false);
            }
            return;
        }

        if (!activeGroupId) return;
        if (messageType !== 'text') return;
        try {
            setIsSending(true);
            const body = { text: content };
            if (replyTarget?.id) body.reply_to = replyTarget.id;
            const { data } = await baseUrl.post(`/api/chat/groups/${activeGroupId}/messages`, body, {
                headers: authHeader ? { Authorization: authHeader } : {},
            });
            const m = data?.message;
            if (m) {
                const connected = !!(socketRef.current && socketRef.current.connected);
                if (!connected) {
                    const transformed = transformIncomingMessage(
                        { ...m, sender_name: userData?.name || 'أنا' },
                        userData,
                    );
                    transformed.isMine = true;
                    setMessagesByGroup((prev) => appendMessageIfNew(prev, activeGroupId, transformed));
                }
                setGroups((prev) => prev.map((g) => (
                    g.id === activeGroupId
                        ? { ...g, lastMessage: m.text, time: dayjs(m.created_at).format('h:mm A') }
                        : g
                )));
                setReplyTarget(null);
            }
        } catch (e) {
            toast({ title: 'تعذر إرسال الرسالة', status: 'error', duration: 2500, isClosable: true });
        } finally {
            setIsSending(false);
        }
    };

    const canTogglePermission = !!(isAdmin || isTeacher);
    const activeGroup = getActiveChatInfo();
    const allowStudentSend = activeChatType === 'group' ? activeGroup?.allow_student_send : true;
    const isStudent = !!student;
    const inputDisabled = activeChatType === 'group' && isStudent && activeGroup && activeGroup.allow_student_send === false;

    const onSendAttachment = async (file, extra = {}) => {
        if (activeChatType !== 'group') {
            toast({ title: 'غير متاح', description: 'المرفقات غير مدعومة في الشات المباشر حالياً.', status: 'info', duration: 2500, isClosable: true });
            return;
        }
        if (!activeGroupId) return;
        const form = new FormData();
        form.append('file', file);
        if (extra.text) form.append('text', extra.text);
        if (typeof extra.duration_ms === 'number') form.append('duration_ms', String(extra.duration_ms));
        try {
            const { data } = await baseUrl.post(`/api/chat/groups/${activeGroupId}/attachments`, form, {
                headers: {
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
            });
            const m = data?.message;
            if (m) {
                const connected = !!(socketRef.current && socketRef.current.connected);
                if (!connected) {
                    const transformed = transformIncomingMessage(
                        { ...m, sender_name: userData?.name || 'أنا' },
                        userData,
                    );
                    transformed.isMine = true;
                    setMessagesByGroup((prev) => appendMessageIfNew(prev, activeGroupId, transformed));
                }
                setGroups((prev) => prev.map((g) => (
                    g.id === activeGroupId
                        ? { ...g, lastMessage: m.text || 'مرفق', time: dayjs(m.created_at).format('h:mm A') }
                        : g
                )));
            }
        } catch (e) {
            toast({ title: 'تعذر رفع المرفق', status: 'error', duration: 2500, isClosable: true });
            throw e;
        }
    };

    const handleTogglePermission = async () => {
        if (!activeGroup) return;
        try {
            setTogglingPermission(true);
            const newValue = !activeGroup.allow_student_send;
            await baseUrl.patch(`/api/chat/groups/${activeGroup.id}/permission`, { allow_student_send: newValue }, {
                headers: authHeader ? { Authorization: authHeader } : {},
            });
            setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, allow_student_send: newValue } : g));
        } catch (e) {
            toast({ title: 'تعذر تغيير الصلاحية', status: 'error', duration: 2500, isClosable: true });
        } finally {
            setTogglingPermission(false);
        }
    };

    const canViewMembers = !!(isTeacher || isAdmin) && activeChatType === 'group';

    const openMembers = async () => {
        if (!activeGroupId || activeChatType !== 'group') return;
        setIsMembersOpen(true);
        setMembersLoading(true);
        try {
            const { data } = await baseUrl.get(`/api/chat/groups/${activeGroupId}/members`, {
                headers: authHeader ? { Authorization: authHeader } : {},
            });
            setMembers(data?.members || []);
        } catch (e) {
            toast({ title: 'تعذر تحميل الأعضاء', status: 'error', duration: 2500, isClosable: true });
        } finally {
            setMembersLoading(false);
        }
    };

    // دالة تعديل الرسالة
    const handleEditMessage = async (messageId, newText) => {
        if (!messageId || !newText.trim()) return;
        try {
            setIsEditing(true);
            await baseUrl.put(`/api/chat/messages/${messageId}`, { text: newText }, {
                headers: authHeader ? { Authorization: authHeader } : {},
            });
            
            // تحديث الرسالة في المحادثة المحلية
            setMessagesByGroup(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(groupId => {
                    updated[groupId] = updated[groupId].map(msg => 
                        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
                    );
                });
                return updated;
            });
            
            setEditingMessage(null);
            setEditText('');
            toast({ title: 'تم تعديل الرسالة بنجاح', status: 'success', duration: 2000, isClosable: true });
        } catch (e) {
            toast({ title: 'تعذر تعديل الرسالة', status: 'error', duration: 2500, isClosable: true });
        } finally {
            setIsEditing(false);
        }
    };

    // دالة حذف الرسالة
    const handleDeleteMessage = async (messageId) => {
        if (!messageId) return;
        try {
            setIsDeleting(true);
            await baseUrl.delete(`/api/chat/messages/${messageId}`, {
                headers: authHeader ? { Authorization: authHeader } : {},
            });
            
            // إزالة الرسالة من المحادثة المحلية
            setMessagesByGroup(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(groupId => {
                    updated[groupId] = updated[groupId].filter(msg => msg.id !== messageId);
                });
                return updated;
            });
            
            toast({ title: 'تم حذف الرسالة بنجاح', status: 'success', duration: 2000, isClosable: true });
        } catch (e) {
            toast({ title: 'تعذر حذف الرسالة', status: 'error', duration: 2500, isClosable: true });
        } finally {
            setIsDeleting(false);
        }
    };

    // دالة بدء تعديل الرسالة
    const startEditMessage = (message) => {
        setEditingMessage(message);
        setEditText(message.text);
    };

    // دالة إلغاء التعديل
    const cancelEdit = () => {
        setEditingMessage(null);
        setEditText('');
    };


    const pageBg = useColorModeValue('gray.100', 'gray.900');
    const shellBorder = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box
            minH={{ base: '100dvh', md: 'calc(100vh - 72px)' }}
            h={{ base: '100dvh', md: 'calc(100vh - 72px)' }}
            bg={pageBg}
            py={{ base: 0, md: 4 }}
            px={{ base: 0, md: 4 }}
            className="chat-page"
        >
            <Flex
                h="full"
                maxW="1440px"
                mx="auto"
                direction={{ base: 'column', md: 'row' }}
                borderRadius={{ base: 0, md: '2xl' }}
                overflow="hidden"
                boxShadow={{ base: 'none', md: '2xl' }}
                border={{ base: 'none', md: '1px solid' }}
                borderColor={shellBorder}
                bg={useColorModeValue('white', 'gray.800')}
            >
                <Box
                    w={{ base: '100%', md: '340px', lg: '380px' }}
                    h={{ base: showSidebar ? '100%' : 0, md: '100%' }}
                    flexShrink={0}
                    borderEnd={{ md: '1px solid' }}
                    borderColor={shellBorder}
                    overflow="hidden"
                    display={{ base: showSidebar ? 'flex' : 'none', md: 'flex' }}
                    flexDirection="column"
                >
                    {isLoadingGroups ? (
                        <Flex align="center" justify="center" h="full" py={6}>
                            <VStack spacing={4}>
                                <Spinner color="blue.500" size="lg" thickness="3px" />
                                <Text color="gray.500" fontSize="sm">جاري تحميل المحادثات...</Text>
                            </VStack>
                        </Flex>
                    ) : (
                        <Sidebar
                            groups={groups}
                            contacts={contacts}
                            onSelectGroup={handleChatSelect}
                            onSelectContact={handleDirectSelect}
                            activeChat={activeChatType === 'direct' ? { type: 'direct', id: activeDirect?.id } : { type: 'group', id: activeGroupId }}
                        />
                    )}
                </Box>

                <Box
                    flex="1"
                    h="full"
                    minH={0}
                    position="relative"
                    display={{ base: !showSidebar ? 'flex' : 'none', md: 'flex' }}
                    flexDirection="column"
                >
                    {(!activeGroupId && activeChatType !== 'direct') && !activeDirect ? (
                        <Flex
                            h="full"
                            align="center"
                            justify="center"
                            direction="column"
                            px={6}
                            textAlign="center"
                        >
                            <Flex
                                w={{ base: '100px', md: '120px' }}
                                h={{ base: '100px', md: '120px' }}
                                bgGradient="linear(to-br, blue.500, blue.600)"
                                borderRadius="3xl"
                                align="center"
                                justify="center"
                                mb={6}
                                boxShadow="0 16px 40px rgba(59,130,246,0.35)"
                            >
                                <Icon as={IoPeopleOutline} boxSize={{ base: 12, md: 14 }} color="white" />
                            </Flex>
                            <Heading size={{ base: 'md', md: 'lg' }} color={useColorModeValue('gray.700', 'gray.200')} fontWeight="black">
                                اختر محادثة للبدء
                            </Heading>
                            <Text fontSize={{ base: 'sm', md: 'md' }} color={useColorModeValue('gray.500', 'gray.400')} mt={2} maxW="sm" lineHeight="1.8">
                                اختر مجموعة صفية أو طالباً من القائمة لبدء المراسلة.
                            </Text>
                        </Flex>
                    ) : isLoadingHistory && !getMessagesForChat(getActiveChatGroupId())?.length ? (
                        <Flex h="full" align="center" justify="center" direction="column">
                            <VStack spacing={4}>
                                <Spinner color="blue.500" size="lg" thickness="3px" />
                                <Text fontSize="md" color={useColorModeValue('gray.500', 'gray.400')}>
                                    جاري تحميل الرسائل...
                                </Text>
                            </VStack>
                        </Flex>
                    ) : (
                        <MainChatArea
                            chatInfo={activeGroup}
                            messages={getMessagesForChat(getActiveChatGroupId())}
                            onSendMessage={onSendMessage}
                            onBack={handleBackToSidebar}
                            isMobile={isMobile}
                            canTogglePermission={canTogglePermission && activeChatType === 'group'}
                            allowStudentSend={!!allowStudentSend}
                            onTogglePermission={handleTogglePermission}
                            togglingPermission={togglingPermission}
                            inputDisabled={inputDisabled || isSending}
                            onOpenMembers={openMembers}
                            canViewMembers={canViewMembers}
                            onSendAttachment={onSendAttachment}
                            replyTarget={replyTarget}
                            onSelectReply={setReplyTarget}
                            isSending={isSending}
                            onEditMessage={startEditMessage}
                            onDeleteMessage={handleDeleteMessage}
                            editingMessage={editingMessage}
                            editText={editText}
                            setEditText={setEditText}
                            onSaveEdit={handleEditMessage}
                            onCancelEdit={cancelEdit}
                            isEditing={isEditing}
                            isDeleting={isDeleting}
                        />
                    )}
                </Box>
            </Flex>
            {canViewMembers && (
                <Drawer isOpen={isMembersOpen} placement="right" onClose={() => setIsMembersOpen(false)} size="sm">
                    <DrawerOverlay backdropFilter="blur(4px)" />
                    <DrawerContent borderLeftRadius="2xl">
                        <DrawerCloseButton />
                        <DrawerHeader borderBottomWidth="1px" fontWeight="black">
                            أعضاء المجموعة
                        </DrawerHeader>
                        <DrawerBody py={4}>
                            {membersLoading ? (
                                <Flex align="center" justify="center" py={6}>
                                    <Spinner color="blue.500" />
                                </Flex>
                            ) : members.length === 0 ? (
                                <Text color="gray.500" textAlign="center" py={8}>لا يوجد أعضاء.</Text>
                            ) : (
                                <VStack align="stretch" spacing={2}>
                                    {members.map((m) => (
                                        <Flex
                                            key={m.id}
                                            align="center"
                                            p={3}
                                            borderRadius="xl"
                                            bg={useColorModeValue('gray.50', 'gray.900')}
                                            border="1px solid"
                                            borderColor={useColorModeValue('gray.200', 'gray.700')}
                                        >
                                            <Avatar size="sm" name={m.name} mr={3} bg="blue.400" />
                                            <Box flex="1">
                                                <Text fontWeight="bold" fontSize="sm">{m.name}</Text>
                                                <Badge mt={1} colorScheme={m.role === 'teacher' ? 'blue' : 'orange'} fontSize="0.6rem" borderRadius="full">
                                                    {m.role === 'teacher' ? 'مدرس' : 'طالب'}
                                                </Badge>
                                            </Box>
                                        </Flex>
                                    ))}
                                </VStack>
                            )}
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            )}
        </Box>
    );
};

export default TeacherChat;