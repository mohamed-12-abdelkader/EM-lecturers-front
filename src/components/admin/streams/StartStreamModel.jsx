import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Text,
} from "@chakra-ui/react";
import { toast } from "react-toastify";
import baseUrl from "../../../api/baseUrl";

export default function StartStreamModal({ isOpen, onClose, refetch }) {
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startStreaming = async () => {
    if (!streamTitle) {
      toast.error("أدخل عنوان البث");
      return;
    }

    setIsLoading(true);
    try {
      await baseUrl.post(
        "/api/streams/create",
        {
          title: streamTitle,
          description: streamDescription,
        },
        { headers: { token: localStorage.getItem("token") } }
      );

      toast.success("تم بدء البث!");
      refetch();
      onClose();
      setStreamTitle("");
      setStreamDescription("");
    } catch (err) {
      toast.error("فشل بدء البث");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!isLoading ? onClose : () => {}}
      isCentered
      closeOnOverlayClick={!isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>ابدأ البث المباشر الآن</ModalHeader>
        {!isLoading && (
          <ModalCloseButton position="absolute" top={2} left={2} right="auto" />
        )}
        <ModalBody>
          <Text mb={2}>عنوان البث</Text>
          <Input
            placeholder="أدخل عنوان البث"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            mb={4}
            isDisabled={isLoading}
          />
          <Text mb={2}>الوصف (اختياري)</Text>
          <Input
            placeholder="أدخل وصف البث"
            value={streamDescription}
            onChange={(e) => setStreamDescription(e.target.value)}
            isDisabled={isLoading}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            marginLeft={4}
            onClick={onClose}
            isDisabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            colorScheme="teal"
            onClick={startStreaming}
            isLoading={isLoading}
          >
            بدء البث
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
