import React, { useState, useEffect } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, VStack, FormControl, FormLabel, Input, Button } from "@chakra-ui/react";

const FileModal = ({ isOpen, onClose, type, data, lectureId, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    file_url: data?.file_url || '',
    filename: data?.filename || ''
  });

  useEffect(() => {
    if (data) {
      setFormData({
        file_url: data.file_url || '',
        filename: data.filename || ''
      });
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'edit') {
      onSubmit(data.id, formData);
    } else {
      onSubmit(lectureId, formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {type === 'add' ? 'إضافة ملف جديد' : 'تعديل الملف'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>رابط الملف</FormLabel>
                <Input
                  value={formData.file_url}
                  onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                  placeholder="أدخل رابط الملف"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>اسم الملف</FormLabel>
                <Input
                  value={formData.filename}
                  onChange={(e) => setFormData({...formData, filename: e.target.value})}
                  placeholder="أدخل اسم الملف"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={loading}>
              {type === 'add' ? 'إضافة' : 'تعديل'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default FileModal; 