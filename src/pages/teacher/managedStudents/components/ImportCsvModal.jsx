import React, { useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  Box,
  HStack,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";

const ImportCsvModal = ({ isOpen, onClose, onImport, importing, result }) => {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const mutedBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file?.name || "");
  };

  const handleImport = () => {
    const file = inputRef.current?.files?.[0];
    if (file) onImport(file);
  };

  const handleClose = () => {
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl" dir="rtl">
        <ModalHeader fontSize="md">استيراد طلاب من CSV</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box p={4} bg={mutedBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                الأعمدة المدعومة
              </Text>
              <Text fontSize="xs" color="gray.500" lineHeight="tall">
                name / الاسم — grade / الصف — phone / هاتف الطالب — parent_phone / ولي الأمر —
                group / المجموعة
              </Text>
            </Box>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              {fileName || "اختر ملف CSV"}
            </Button>

            {result && (
              <Box p={4} borderWidth="1px" borderColor={border} borderRadius="lg">
                <HStack spacing={3} mb={3} flexWrap="wrap">
                  <Badge colorScheme="blue">الصفوف: {result.total_rows}</Badge>
                  <Badge colorScheme="green">ناجح: {result.created_count}</Badge>
                  <Badge colorScheme="red">فاشل: {result.failed_count}</Badge>
                </HStack>
                <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto">
                  {(result.results || []).map((row) => (
                    <HStack
                      key={row.row}
                      justify="space-between"
                      fontSize="xs"
                      p={2}
                      bg={mutedBg}
                      borderRadius="md"
                    >
                      <Text noOfLines={1} flex="1">
                        صف {row.row}: {row.name || "—"}
                      </Text>
                      {row.success ? (
                        <Badge colorScheme="green">{row.student_code}</Badge>
                      ) : (
                        <Text color="red.500" noOfLines={1} maxW="50%">
                          {row.error}
                        </Text>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose}>
            إغلاق
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleImport}
            isLoading={importing}
            isDisabled={!fileName}
          >
            بدء الاستيراد
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportCsvModal;
