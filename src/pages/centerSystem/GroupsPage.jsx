import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  Button,
  useDisclosure,
  VStack,
  Center,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { IoAddCircleOutline, IoPeopleOutline } from 'react-icons/io5';
import baseUrl from '../../api/baseUrl';
import GroupCard from '../../components/centerSystem/GroupCard';
import AddGroupModal from '../../components/centerSystem/AddGroupModal';
import EditGroupModal from '../../components/centerSystem/EditGroupModal';
import { useStudyGroups } from '../../Hooks/centerSystem/useStudyGroups';

const GroupsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [grades, setGrades] = useState([]);
  const toast = useToast();

  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const primarySoftBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subColor = useColorModeValue('gray.600', 'gray.400');

  const {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useStudyGroups();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await baseUrl.get('/api/teacher/grades', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.grades) setGrades(res.data.grades);
      } catch (e) {
        console.error('Fetch grades error:', e);
      }
    };
    fetchGrades();
  }, []);

  const handleAddGroup = async (groupData) => {
    const result = await createGroup(groupData);
    if (result.success) {
      toast({ title: 'تم إنشاء المجموعة بنجاح', status: 'success' });
      onClose();
    } else {
      toast({ title: result.error, status: 'error' });
    }
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    onEditOpen();
  };

  const handleUpdateGroup = async (groupId, groupData) => {
    const result = await updateGroup(groupId, groupData);
    if (result.success) {
      toast({ title: 'تم تحديث المجموعة بنجاح', status: 'success' });
      onEditClose();
      setSelectedGroup(null);
    } else {
      toast({ title: result.error, status: 'error' });
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const result = await deleteGroup(groupId);
    if (result.success) {
      toast({ title: 'تم حذف المجموعة بنجاح', status: 'success' });
    } else {
      toast({ title: result.error, status: 'error' });
    }
  };

  if (loading && groups.length === 0) {
    return (
      <Center py={20} minH="40vh" bg={pageBg}>
        <VStack spacing={4}>
          <Spinner size="xl" color={primaryColor} thickness="3px" />
          <Text color={subColor}>جاري تحميل المجموعات...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={6} bg={pageBg} minH="40vh">
        <Alert status="error" borderRadius="lg" bg="white" _dark={{ bg: 'gray.800' }}>
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} bg={pageBg} minH="100vh">
      <Box mb={8}>
        <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
              المجموعات الدراسية
            </Text>
            <Text fontSize="sm" color={subColor}>
              {groups.length} مجموعة
            </Text>
          </VStack>
          <Button
            leftIcon={<IoAddCircleOutline />}
            bg={primaryColor}
            color="white"
            _hover={{ opacity: 0.9 }}
            onClick={onOpen}
            size="lg"
            borderRadius="xl"
            fontWeight="semibold"
          >
            إنشاء مجموعة
          </Button>
        </Flex>
      </Box>

      {groups.length === 0 ? (
        <Center py={20} bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')} borderStyle="dashed">
          <VStack spacing={6}>
            <Box p={5} bg={primarySoftBg} borderRadius="2xl">
              <Icon as={IoPeopleOutline} boxSize={12} color={primaryColor} />
            </Box>
            <Text fontSize="xl" fontWeight="semibold" color={headingColor}>لا توجد مجموعات</Text>
            <Text color={subColor} textAlign="center" maxW="280px">أنشئ مجموعة جديدة لبدء إدارة الطلاب والحضور</Text>
            <Button bg={primaryColor} color="white" onClick={onOpen} size="lg" borderRadius="xl" _hover={{ opacity: 0.9 }} leftIcon={<IoAddCircleOutline />}>
              إنشاء أول مجموعة
            </Button>
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              loading={loading}
            />
          ))}
        </SimpleGrid>
      )}

      <AddGroupModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={handleAddGroup}
        loading={loading}
        grades={grades}
      />

      <EditGroupModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onUpdate={handleUpdateGroup}
        group={selectedGroup}
        loading={loading}
      />
    </Box>
  );
};

export default GroupsPage;
