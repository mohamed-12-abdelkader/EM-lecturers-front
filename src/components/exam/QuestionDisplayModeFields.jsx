import React from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { getQuestionDisplayModeLabel, QUESTION_DISPLAY_MODES } from "../../utils/examFlowUtils";

export default function QuestionDisplayModeFields({
  value,
  onChange,
  questionsCount,
  showHint = true,
}) {
  const hintColor = useColorModeValue("gray.500", "gray.400");

  return (
    <FormControl isRequired>
      <FormLabel fontSize="sm" fontWeight="600">
        طريقة عرض الأسئلة للطالب
      </FormLabel>
      <RadioGroup
        value={value || QUESTION_DISPLAY_MODES.ORDERED}
        onChange={onChange}
      >
        <Stack spacing={2}>
          <Radio value={QUESTION_DISPLAY_MODES.ORDERED} colorScheme="blue">
            حسب الترتيب — أول {questionsCount || "N"} سؤال
          </Radio>
          <Radio value={QUESTION_DISPLAY_MODES.RANDOM} colorScheme="purple">
            عشوائي — {questionsCount || "N"} سؤال مختلف لكل طالب
          </Radio>
        </Stack>
      </RadioGroup>
      {showHint && (
        <Text mt={2} fontSize="xs" color={hintColor} lineHeight="1.7">
          الوضع الحالي: {getQuestionDisplayModeLabel(value)}.
          {" "}نفس الطالب يحصل على نفس الأسئلة عند استئناف المحاولة؛ المحاولة الجديدة تعيد الاختيار في الوضع العشوائي.
        </Text>
      )}
    </FormControl>
  );
}
