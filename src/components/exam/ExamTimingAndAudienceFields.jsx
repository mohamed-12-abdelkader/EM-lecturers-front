import React, { useMemo } from "react";
import {
  Box,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useTeacherCourseGroups } from "../../Hooks/course/useCourseGroups";

function DateTimeLocalInput({ value, onChange, isDisabled }) {
  const scheme = useColorModeValue("light", "dark");
  return (
    <Box w="full" dir="ltr">
      <Input
        type="datetime-local"
        value={value || ""}
        onChange={onChange}
        isDisabled={isDisabled}
        w="full"
        maxW="100%"
        dir="ltr"
        textAlign="left"
        borderRadius="lg"
        h="auto"
        minH="44px"
        py={2}
        lineHeight="normal"
        fontSize="md"
        sx={{
          display: "block",
          boxSizing: "border-box",
          colorScheme: scheme,
          WebkitAppearance: "auto",
          MozAppearance: "auto",
        }}
      />
    </Box>
  );
}

/**
 * Timing mode (relative vs fixed) + optional course-group audience for comprehensive exams.
 */
export default function ExamTimingAndAudienceFields({
  formData,
  onPatch,
  gradeId,
  loading = false,
  showAudience = true,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const hintColor = useColorModeValue("gray.500", "gray.400");

  const timingMode = formData.timing_mode === "fixed" ? "fixed" : "relative";
  const audienceType = formData.audience_type === "groups" ? "groups" : "all";
  const selectedGroupIds = Array.isArray(formData.group_ids)
    ? formData.group_ids.map(String)
    : [];

  const { data: groups = [], isLoading: groupsLoading } = useTeacherCourseGroups(
    gradeId || undefined,
    { enabled: showAudience },
  );
  const activeGroups = useMemo(
    () => (Array.isArray(groups) ? groups.filter((g) => g.status !== "inactive") : []),
    [groups],
  );

  return (
    <VStack spacing={4} align="stretch" w="full">
      <Box
        borderWidth="1px"
        borderColor={cardBorder}
        borderRadius="xl"
        bg={cardBg}
        p={4}
      >
        <Text fontWeight="700" fontSize="sm" mb={3}>
          نظام وقت الامتحان
        </Text>
        <RadioGroup
          value={timingMode}
          onChange={(value) => {
            if (value === "fixed") {
              onPatch({
                timing_mode: "fixed",
                duration_unlimited: false,
              });
            } else {
              onPatch({ timing_mode: "relative" });
            }
          }}
          isDisabled={loading}
        >
          <Stack spacing={3}>
            <Radio value="relative" colorScheme="blue">
              مدة تبدأ من دخول الطالب
            </Radio>
            <Text fontSize="xs" color={hintColor} pr={6} mt={-2}>
              كل طالب يحصل على المدة الكاملة من لحظة بدئه (النظام الحالي).
            </Text>
            <Radio value="fixed" colorScheme="purple">
              موعد بداية ونهاية ثابت
            </Radio>
            <Text fontSize="xs" color={hintColor} pr={6} mt={-2}>
              ينتهي الامتحان لجميع الطلاب في نفس الموعد؛ الوقت المتبقي = موعد النهاية − وقت الدخول.
            </Text>
          </Stack>
        </RadioGroup>

        {timingMode === "fixed" && (
          <SimpleFixedScheduleFields
            formData={formData}
            onPatch={onPatch}
            loading={loading}
          />
        )}
      </Box>

      {showAudience && (
        <Box
          borderWidth="1px"
          borderColor={cardBorder}
          borderRadius="xl"
          bg={cardBg}
          p={4}
        >
          <Text fontWeight="700" fontSize="sm" mb={3}>
            المجموعات المستهدفة
          </Text>
          <RadioGroup
            value={audienceType}
            onChange={(value) =>
              onPatch({
                audience_type: value,
                group_ids: value === "all" ? [] : formData.group_ids || [],
              })
            }
            isDisabled={loading || groupsLoading}
          >
            <Stack spacing={3}>
              <Radio value="all" colorScheme="green">
                جميع طلاب الكورس
              </Radio>
              <Radio value="groups" colorScheme="orange" isDisabled={!activeGroups.length}>
                مجموعات محددة فقط
              </Radio>
            </Stack>
          </RadioGroup>

          {!activeGroups.length && (
            <Text fontSize="xs" color={hintColor} mt={3}>
              لا توجد مجموعات نشطة لهذا الصف — الامتحان سيُتاح لجميع الطلاب كالمعتاد.
            </Text>
          )}

          {audienceType === "groups" && activeGroups.length > 0 && (
            <CheckboxGroup
              value={selectedGroupIds}
              onChange={(values) =>
                onPatch({
                  audience_type: "groups",
                  group_ids: values.map(Number).filter((id) => id > 0),
                })
              }
            >
              <Stack spacing={2} mt={3} maxH="180px" overflowY="auto">
                {activeGroups.map((group) => (
                  <Checkbox
                    key={group.id}
                    value={String(group.id)}
                    colorScheme="orange"
                    isDisabled={loading}
                  >
                    {group.name}
                    {group.students_count != null ? (
                      <Text as="span" fontSize="xs" color={hintColor} mr={2}>
                        ({group.students_count} طالب)
                      </Text>
                    ) : null}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          )}
        </Box>
      )}
    </VStack>
  );
}

function SimpleFixedScheduleFields({ formData, onPatch, loading }) {
  const hintColor = useColorModeValue("gray.500", "gray.400");
  return (
    <VStack spacing={3} align="stretch" mt={4}>
      <FormControl isRequired>
        <FormLabel fontSize="sm">موعد بداية الامتحان</FormLabel>
        <DateTimeLocalInput
          value={formData.available_from}
          isDisabled={loading}
          onChange={(e) => onPatch({ available_from: e.target.value })}
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel fontSize="sm">موعد نهاية الامتحان</FormLabel>
        <DateTimeLocalInput
          value={formData.visibility_end_date}
          isDisabled={loading}
          onChange={(e) => onPatch({ visibility_end_date: e.target.value })}
        />
      </FormControl>
      <Text fontSize="xs" color={hintColor}>
        الطالب الذي يدخل متأخراً يحصل فقط على الوقت المتبقي حتى موعد النهاية (بتوقيت السيرفر).
      </Text>
    </VStack>
  );
}

export function validateExamTimingAndAudience(form) {
  const timingMode = form.timing_mode === "fixed" ? "fixed" : "relative";
  if (timingMode === "fixed") {
    if (!form.available_from) {
      return "حدد موعد بداية الامتحان لنظام الموعد الثابت";
    }
    if (!form.visibility_end_date) {
      return "حدد موعد نهاية الامتحان لنظام الموعد الثابت";
    }
    const start = new Date(form.available_from);
    const end = new Date(form.visibility_end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "مواعيد الامتحان غير صالحة";
    }
    if (end.getTime() <= start.getTime()) {
      return "موعد النهاية يجب أن يكون بعد موعد البداية";
    }
  } else if (
    !form.duration_unlimited &&
    (!form.duration_minutes || Number(form.duration_minutes) <= 0)
  ) {
    return "حدد مدة الامتحان بالدقائق، أو فعّل بدون حد زمني";
  }

  if (form.audience_type === "groups") {
    const ids = Array.isArray(form.group_ids) ? form.group_ids : [];
    if (!ids.length) {
      return "اختر مجموعة واحدة على الأقل، أو اجعل الامتحان متاحاً لجميع الطلاب";
    }
  }
  return null;
}
