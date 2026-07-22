import { useEffect, useState } from "react";
import {
  FormControl,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaBroadcastTower } from "react-icons/fa";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import CourseFormModal, {
  CourseModalFieldCard,
  CourseModalFieldLabel,
  useCourseModalInputProps,
} from "../CourseFormModal";

const CreateStreamModal = ({ isOpen, onClose, onSuccess, courseId }) => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const inputProps = useCourseModalInputProps("blue");

  useEffect(() => {
    if (isOpen) setTitle("");
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("الرجاء إدخال عنوان البث");
      return;
    }

    setLoading(true);
    try {
      const { data } = await baseUrl.post(
        "/api/meeting",
        { title: title.trim(), course_id: courseId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
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
    <CourseFormModal
      isOpen={isOpen}
      onClose={onClose}
      loading={loading}
      size={{ base: "full", md: "md" }}
      icon={FaBroadcastTower}
      accent="blue"
      title="إنشاء بث مباشر"
      subtitle="ابدأ جلسة بث مباشرة للطلاب داخل هذا الكورس"
      onSubmit={handleSubmit}
      submitLabel="بدء البث"
      loadingText="جاري الإنشاء..."
      submitColorScheme="blue"
    >
      <VStack spacing={3} align="stretch">
        <CourseModalFieldCard>
          <FormControl isRequired>
            <CourseModalFieldLabel icon={FaBroadcastTower}>
              عنوان البث (الحصة)
            </CourseModalFieldLabel>
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة ليلة الامتحان"
              isDisabled={loading}
              autoFocus
              {...inputProps}
            />
            <Text mt={2} fontSize="xs" color="gray.500">
              سيظهر العنوان للطلاب في قائمة البث المباشر
            </Text>
          </FormControl>
        </CourseModalFieldCard>
      </VStack>
    </CourseFormModal>
  );
};

export default CreateStreamModal;
