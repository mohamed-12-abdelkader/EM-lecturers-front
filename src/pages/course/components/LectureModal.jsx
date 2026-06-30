import React, { useState, useEffect } from "react";
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton, 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Button,
  HStack, // Added for icon and text alignment in header
  Text,   // Added for text styling
  Icon,   // Added for icons
  useColorModeValue // For responsive colors
} from "@chakra-ui/react";
import { FaPlusCircle, FaEdit, FaBookOpen, FaClipboardList, FaSortNumericUpAlt } from "react-icons/fa"; // Added specific icons

const LectureModal = ({ isOpen, onClose, type, data, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: data?.title || '',
    description: data?.description || '',
    position: data?.position || 1
  });

  useEffect(() => {
    if (data) {
      setFormData({
        title: data.title || '',
        description: data.description || '',
        position: data.position || 1
      });
    } else {
      // Reset form when opening for 'add' type or when data is null/undefined
      setFormData({
        title: '',
        description: '',
        position: 1
      });
    }
  }, [data, isOpen]); // Added isOpen to dependency array to reset on modal open

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'edit') {
      onSubmit(data.id, formData);
    } else {
      onSubmit(formData);
    }
    // onClose(); // Let the parent component handle closing after onSubmit completes (e.g., after successful API call)
  };

  // Define colors for dark/light mode
  const modalBg = useColorModeValue("white", "gray.700");
  const headerColor = useColorModeValue("blue.700", "blue.200");
  const labelColor = useColorModeValue("gray.700", "gray.300");
  const inputBorderColor = useColorModeValue("blue.200", "gray.600");
  const inputFocusBorderColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg"> {/* isCentered and size="lg" for better presentation */}
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" /> {/* Darker, blurred overlay */}
      <ModalContent 
        dir="rtl" // RTL direction for Arabic text
        fontFamily="'Changa', sans-serif"
        bg={modalBg}
        borderRadius="xl" // More rounded corners for modern look
        shadow="2xl" // Stronger shadow
        p={{ base: 4, md: 6 }} // Add padding inside content
      >
        <ModalHeader pb={4}> {/* Increased padding bottom */}
          <HStack spacing={3} justifyContent="center"> {/* Center align header content */}
            <Icon 
              as={type === 'add' ? FaPlusCircle : FaEdit} 
              color={type === 'add' ? "green.500" : "blue.500"} 
              boxSize={{ base: 6, md: 7 }} // Responsive icon size
            />
            <Text 
              fontSize={{ base: "xl", md: "2xl" }} 
              fontWeight="bold" 
              color={headerColor}
            >
              {type === 'add' ? 'إضافة محاضرة جديدة' : 'تعديل المحاضرة'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton size="lg" top={5} right={5} /> {/* Larger close button */}
        <form onSubmit={handleSubmit}>
          <ModalBody py={6}> {/* Increased vertical padding */}
            <VStack spacing={6}> {/* Increased spacing between form controls */}
              <FormControl isRequired>
                <FormLabel fontSize="lg" fontWeight="semibold" color={labelColor}>
                  <HStack spacing={2} alignItems="center">
                    <Icon as={FaBookOpen} />
                    <Text>عنوان المحاضرة</Text>
                  </HStack>
                </FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="أدخل عنوان المحاضرة هنا"
                  size="lg" // Larger input field
                  borderRadius="lg" // More rounded corners
                  border="2px solid"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: useColorModeValue("blue.300", "gray.500") }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 2px ${useColorModeValue("rgba(66, 153, 225, 0.6)", "rgba(144,205,244,0.6)")}` // Focus shadow
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="lg" fontWeight="semibold" color={labelColor}>
                  <HStack spacing={2} alignItems="center">
                    <Icon as={FaClipboardList} />
                    <Text>وصف المحاضرة (اختياري)</Text>
                  </HStack>
                </FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="يمكنك إضافة وصف مفصل للمحاضرة"
                  rows={4} // More rows for description
                  size="lg"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: useColorModeValue("blue.300", "gray.500") }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 2px ${useColorModeValue("rgba(66, 153, 225, 0.6)", "rgba(144,205,244,0.6)")}`
                  }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="lg" fontWeight="semibold" color={labelColor}>
                  <HStack spacing={2} alignItems="center">
                    <Icon as={FaSortNumericUpAlt} />
                    <Text>ترتيب المحاضرة</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: parseInt(e.target.value)})}
                  placeholder="مثال: 1"
                  min={1} // Ensure position is at least 1
                  size="lg"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={inputBorderColor}
                  _hover={{ borderColor: useColorModeValue("blue.300", "gray.500") }}
                  _focus={{ 
                    borderColor: inputFocusBorderColor, 
                    boxShadow: `0 0 0 2px ${useColorModeValue("rgba(66, 153, 225, 0.6)", "rgba(144,205,244,0.6)")}`
                  }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter pt={6}> {/* Increased vertical padding */}
            <HStack spacing={4} width="full" justifyContent="flex-end"> {/* Align buttons to the right */}
              <Button 
                variant="ghost" 
                colorScheme="gray" 
                mr={3} 
                onClick={onClose} 
                isDisabled={loading}
                size="lg"
                borderRadius="full"
                px={6}
                _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
              >
                إلغاء
              </Button>
              <Button 
                colorScheme="blue" 
                type="submit" 
                isLoading={loading}
                loadingText={type === 'add' ? 'جاري الإضافة...' : 'جاري التعديل...'}
                leftIcon={<Icon as={type === 'add' ? FaPlusCircle : FaEdit} />}
                size="lg"
                borderRadius="full"
                px={6}
                shadow="md"
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.3s ease-in-out"
              >
                {type === 'add' ? 'إضافة' : 'تعديل'}
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default LectureModal;
