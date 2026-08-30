import React from "react";
import {
  Box,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

export const ANSWERS_RELEASE_MODES = {
  IMMEDIATE: "immediate",
  AFTER_END: "after_end",
  AFTER_HOURS: "after_hours",
  SCHEDULED: "scheduled",
};

export function inferAnswersReleaseMode(data = {}) {
  const raw = String(data.answers_release_mode || data.answersReleaseMode || "").trim().toLowerCase();
  if (Object.values(ANSWERS_RELEASE_MODES).includes(raw)) return raw;
  if (data.show_answers_immediately ?? data.showAnswersImmediately) {
    return ANSWERS_RELEASE_MODES.IMMEDIATE;
  }
  if (data.show_answers_later || data.answers_release_date || data.answers_visible_at) {
    return ANSWERS_RELEASE_MODES.SCHEDULED;
  }
  if (Number(data.show_answers_after_hours) > 0) return ANSWERS_RELEASE_MODES.AFTER_HOURS;
  return ANSWERS_RELEASE_MODES.IMMEDIATE;
}

export function flagsFromAnswersReleaseMode(mode, extras = {}) {
  switch (mode) {
    case ANSWERS_RELEASE_MODES.AFTER_END:
      return {
        show_answers_immediately: false,
        show_answers_later: false,
        show_answers_after_hours: 0,
      };
    case ANSWERS_RELEASE_MODES.AFTER_HOURS:
      return {
        show_answers_immediately: false,
        show_answers_later: false,
        show_answers_after_hours: Number(extras.afterHours) > 0 ? Number(extras.afterHours) : 24,
      };
    case ANSWERS_RELEASE_MODES.SCHEDULED:
      return {
        show_answers_immediately: false,
        show_answers_later: true,
        show_answers_after_hours: 0,
      };
    default:
      return {
        show_answers_immediately: true,
        show_answers_later: false,
        show_answers_after_hours: 0,
      };
  }
}

/**
 * Show date, expire date, and answer-release radios shared by lecture/course exam create forms.
 */
export default function ExamStudentSettingsFields({
  formData,
  onPatch,
  showField = "show_at",
  expireField = "hide_at",
  scheduledField = "answers_release_date",
  loading = false,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const modalBg = useColorModeValue("gray.50", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.700", "gray.200");
  const mode = inferAnswersReleaseMode(formData);

  const patch = (partial) => onPatch(partial);

  return (
    <VStack spacing={4} align="stretch">
      <Box p={5} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder}>
        <HStack spacing={6} align="flex-start" flexDir={{ base: "column", md: "row" }}>
          <FormControl flex={1} w="full">
            <FormLabel fontWeight="600" color={labelColor}>
              تاريخ الظهور للطلاب
            </FormLabel>
            <Input
              type="datetime-local"
              value={formData[showField] || ""}
              onChange={(e) => patch({ [showField]: e.target.value })}
              isDisabled={loading}
              borderRadius="lg"
              size="lg"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              قبل هذا الموعد الامتحان لا يظهر للطلاب.
            </Text>
          </FormControl>
          <FormControl flex={1} w="full">
            <FormLabel fontWeight="600" color={labelColor}>
              تاريخ انتهاء الامتحان
            </FormLabel>
            <Input
              type="datetime-local"
              value={formData[expireField] || ""}
              onChange={(e) => patch({ [expireField]: e.target.value })}
              isDisabled={loading}
              borderRadius="lg"
              size="lg"
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              بعد الانتهاء يبقى ظاهراً ولا يمكن دخوله.
            </Text>
          </FormControl>
        </HStack>
      </Box>

      <Box p={5} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder}>
        <Text fontSize="md" fontWeight="600" color={labelColor} mb={1}>
          إظهار الإجابات للطلاب
        </Text>
        <Text fontSize="sm" color="gray.500" mb={3}>
          اختر متى تظهر الإجابات الصحيحة بعد حل الامتحان.
        </Text>
        <RadioGroup
          value={mode}
          onChange={(value) => {
            const flags = flagsFromAnswersReleaseMode(value, {
              afterHours: formData.show_answers_after_hours,
            });
            patch({ answers_release_mode: value, ...flags });
          }}
        >
          <Stack spacing={2}>
            <Radio value={ANSWERS_RELEASE_MODES.IMMEDIATE} colorScheme="blue">
              فوراً بعد التسليم
            </Radio>
            <Radio value={ANSWERS_RELEASE_MODES.AFTER_END} colorScheme="orange">
              بعد انتهاء الامتحان
            </Radio>
            <Radio value={ANSWERS_RELEASE_MODES.AFTER_HOURS} colorScheme="purple">
              بعد ساعات من تسليم الطالب
            </Radio>
            <Radio value={ANSWERS_RELEASE_MODES.SCHEDULED} colorScheme="teal">
              في موعد محدد
            </Radio>
          </Stack>
        </RadioGroup>

        {mode === ANSWERS_RELEASE_MODES.AFTER_HOURS && (
          <FormControl mt={4}>
            <FormLabel fontWeight="600">إظهار الإجابات بعد (ساعات)</FormLabel>
            <Input
              type="number"
              min={1}
              max={168}
              value={formData.show_answers_after_hours || 24}
              onChange={(e) =>
                patch({
                  show_answers_after_hours: parseInt(e.target.value, 10) || 24,
                })
              }
              isDisabled={loading}
              borderRadius="lg"
            />
          </FormControl>
        )}

        {mode === ANSWERS_RELEASE_MODES.SCHEDULED && (
          <FormControl mt={4} isRequired>
            <FormLabel fontWeight="600">موعد إظهار الإجابات</FormLabel>
            <Input
              type="datetime-local"
              value={formData[scheduledField] || ""}
              onChange={(e) => patch({ [scheduledField]: e.target.value })}
              isDisabled={loading}
              borderRadius="lg"
            />
          </FormControl>
        )}

        {mode === ANSWERS_RELEASE_MODES.AFTER_END && (
          <Box mt={3} p={3} bg={modalBg} borderRadius="lg">
            <Text fontSize="sm" color="gray.500">
              تظهر الإجابات لكل الطلاب بعد تاريخ انتهاء الامتحان.
            </Text>
          </Box>
        )}
      </Box>
    </VStack>
  );
}
