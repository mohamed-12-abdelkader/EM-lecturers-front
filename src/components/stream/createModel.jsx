import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
} from "@chakra-ui/react";
import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const CreateStreamModal = ({ isOpen, onClose, onSuccess, courseId }) => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("الرجاء إدخال عنوان البث");
      return;
    }

    setLoading(true);
    try {
      const { data } = await baseUrl.post(
        "/api/meeting",
        { title, course_id: courseId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("تم إنشاء البث بنجاح");
      onSuccess?.(data);
      onClose();
      setTitle("");
    } catch {
      toast.error("فشل في إنشاء البث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>إنشاء بث مباشر جديد</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>عنوان البث (الحصة)</FormLabel>
              <Input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" ml={3} onClick={onClose}>
            إلغاء
          </Button>
          <Button colorScheme="blue" isLoading={loading} onClick={handleSubmit}>
            إنشاء
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateStreamModal;
