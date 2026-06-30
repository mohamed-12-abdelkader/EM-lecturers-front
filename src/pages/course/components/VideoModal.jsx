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
  Button,
  Icon,
} from "@chakra-ui/react";

import { FaVideo, FaRegFileAlt, FaListOl, FaCheck, FaTimes, FaFilm } from "react-icons/fa";

const VideoModal = ({ isOpen, onClose, type, data, lectureId, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    video_url: data?.video_url || "",
    title: data?.title || "",
    position: data?.position || 1,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        video_url: data.video_url || "",
        title: data.title || "",
        position: data.position || 1,
      });
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === "edit") {
      onSubmit(data.id, formData);
    } else {
      onSubmit(lectureId, formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? undefined : onClose} closeOnOverlayClick={!loading} size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" boxShadow="2xl">
        <ModalHeader display="flex" alignItems="center" gap={2} fontWeight="bold" fontSize="xl" color="blue.600">
          <Icon as={FaFilm} />
          {type === "add" ? "إضافة فيديو جديد" : "تعديل الفيديو"}
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={5} align="stretch">
              {/* رابط الفيديو */}
              <FormControl isRequired>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <FaVideo /> رابط الفيديو
                </FormLabel>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="أدخل رابط الفيديو"
                  borderRadius="lg"
                />
              </FormControl>

              {/* عنوان الفيديو */}
              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <FaRegFileAlt /> عنوان الفيديو (اختياري)
                </FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الفيديو"
                  borderRadius="lg"
                />
              </FormControl>

              {/* ترتيب الفيديو */}
              <FormControl isRequired>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <FaListOl /> ترتيب الفيديو
                </FormLabel>
                <Input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                  placeholder="أدخل ترتيب الفيديو"
                  borderRadius="lg"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              colorScheme="red"
              mr={3}
              onClick={onClose}
              leftIcon={<FaTimes />}
              borderRadius="xl"
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
              leftIcon={<FaCheck />}
              borderRadius="xl"
            >
              {type === "add" ? "إضافة" : "تعديل"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default VideoModal;
