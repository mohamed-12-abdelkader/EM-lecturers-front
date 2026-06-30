import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center,
  Image,
  useColorModeValue,
} from "@chakra-ui/react";
import FormattedQuestionText from "../../../components/question/FormattedQuestionText";
import {
  fetchExamBuilderQuestionPreview,
  apiErrorMessage,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
} from "../../../api/examBuilderChatbotApi";

export default function QuestionPreviewModal({ isOpen, onClose, source, questionId }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const border = useColorModeValue("gray.200", "gray.700");
  const rowBg = useColorModeValue("gray.50", "gray.900");
  const correctBg = useColorModeValue("green.50", "green.900");

  useEffect(() => {
    if (!isOpen || !source || !questionId) {
      setPreview(null);
      setError(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchExamBuilderQuestionPreview(source, questionId);
        setPreview(data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, source, questionId]);

  const question = preview?.question;
  const options = question?.options ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl" dir="rtl" mx={4}>
        <ModalHeader fontSize="md">معاينة السؤال</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {loading ? (
            <Center py={10}>
              <Spinner color="blue.500" />
            </Center>
          ) : error ? (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          ) : question ? (
            <VStack align="stretch" spacing={4}>
              <HStack flexWrap="wrap" spacing={2}>
                {preview.chapter_name && (
                  <Badge colorScheme="blue" variant="subtle">
                    {preview.chapter_name}
                  </Badge>
                )}
                {preview.lesson_name && (
                  <Badge colorScheme="gray" variant="subtle">
                    {preview.lesson_name}
                  </Badge>
                )}
                <Badge variant="outline">
                  {QUESTION_TYPE_LABELS[question.question_type] || question.question_type}
                </Badge>
                {question.difficulty_level && (
                  <Badge colorScheme="orange" variant="subtle">
                    {DIFFICULTY_LABELS[question.difficulty_level] || question.difficulty_level}
                  </Badge>
                )}
              </HStack>

              <Box p={3} borderWidth="1px" borderColor={border} borderRadius="lg">
                <FormattedQuestionText
                  value={question.question_text}
                  fontSize="sm"
                  lineHeight="1.75"
                  fontWeight="semibold"
                />
              </Box>

              {question.media_url && (
                <Image
                  src={question.media_url}
                  alt="صورة السؤال"
                  maxH="200px"
                  mx="auto"
                  objectFit="contain"
                  borderRadius="md"
                />
              )}

              {options.length > 0 && (
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    الاختيارات
                  </Text>
                  {options.map((opt, idx) => {
                    const isCorrect =
                      question.correct_answer_index != null &&
                      Number(question.correct_answer_index) === idx;
                    return (
                      <Box
                        key={idx}
                        p={2.5}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={isCorrect ? "green.300" : border}
                        bg={isCorrect ? correctBg : rowBg}
                      >
                        <HStack align="start" spacing={2}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.500" mt={0.5}>
                            {String.fromCharCode(65 + idx)}
                          </Text>
                          <FormattedQuestionText
                            value={opt.text_content || opt.text}
                            fontSize="sm"
                            lineHeight="1.6"
                          />
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </VStack>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
