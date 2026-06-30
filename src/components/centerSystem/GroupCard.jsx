import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Button,
  IconButton,
  Badge,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { LuClock3, LuUsers, LuCalendar } from 'react-icons/lu';
import { MdEdit, MdDelete } from 'react-icons/md';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

const GroupCard = ({ group, onEdit, onDelete, loading = false }) => {
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const primarySoftBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatDays = (daysString) => {
    if (!daysString) return '';
    return daysString.split(',').join('، ');
  };

  const handleDelete = () => {
    onDelete(group.id);
    onClose();
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('[role="button"]')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <>
      <Link to={`/group_details/${group.id}`} style={{ textDecoration: 'none' }}>
        <Box
          w="full"
          maxW="sm"
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="2xl"
          overflow="hidden"
          bg={cardBg}
          boxShadow="sm"
          _hover={{
            boxShadow: 'md',
            transform: 'translateY(-2px)',
            borderColor: primaryColor,
          }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={handleCardClick}
        >
          <Box bg={primaryColor} _dark={{ bg: 'blue.600' }} p={5} position="relative">
            <HStack position="absolute" top={2} right={2} spacing={1}>
              <Tooltip label="تعديل المجموعة" hasArrow>
                <IconButton
                  icon={<MdEdit />}
                  size="sm"
                  bg="whiteAlpha.300"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.400' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(group);
                  }}
                  aria-label="تعديل المجموعة"
                />
              </Tooltip>
              <Tooltip label="حذف المجموعة" hasArrow>
                <IconButton
                  icon={<MdDelete />}
                  size="sm"
                  bg="red.400"
                  color="white"
                  _hover={{ bg: 'red.500' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpen();
                  }}
                  aria-label="حذف المجموعة"
                />
              </Tooltip>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color="white" noOfLines={2} pr={10}>
              {group.name}
            </Text>
          </Box>

          <VStack align="stretch" spacing={4} p={5} bg={cardBg}>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                <HStack spacing={1}>
                  <Icon as={LuUsers} boxSize={3.5} />
                  <Text>{group.students_count ?? 0} طالب</Text>
                </HStack>
              </Badge>
              {group.teacher_name && (
                <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                  {group.teacher_name}
                </Badge>
              )}
            </HStack>

            <VStack align="stretch" spacing={2}>
              <HStack spacing={2} color={primaryColor}>
                <Icon as={LuClock3} boxSize={4} />
                <Text fontSize="sm" fontWeight="medium" color={subTextColor}>
                  {formatTime(group.start_time)} - {formatTime(group.end_time)}
                </Text>
              </HStack>
              <HStack spacing={2} color={primaryColor}>
                <Icon as={LuCalendar} boxSize={4} />
                <Text fontSize="sm" fontWeight="medium" color={subTextColor}>
                  {formatDays(group.days)}
                </Text>
              </HStack>
            </VStack>

            <Text fontSize="xs" color={subTextColor} pt={1}>
              تم الإنشاء: {new Date(group.created_at).toLocaleDateString('ar-EG')}
            </Text>
          </VStack>
        </Box>
      </Link>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف المجموعة
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف مجموعة "{group.name}"؟ لا يمكن التراجع عن هذه العملية.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={loading}
                loadingText="جاري الحذف..."
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default GroupCard;
