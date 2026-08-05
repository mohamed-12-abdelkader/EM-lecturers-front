import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  formatDuration,
  SCORING_MODE_LABELS,
  SHOW_ANSWERS_LABELS,
} from "../../api/dailyQuizApi";
import { useDailyQuizTheme } from "./DailyQuizChrome";

function SectionTitle({ children }) {
  const theme = useDailyQuizTheme();
  return (
    <Text
      fontSize="xs"
      fontWeight="800"
      letterSpacing="0.06em"
      textTransform="uppercase"
      color={theme.muted}
      mb={1}
      mt={1}
    >
      {children}
    </Text>
  );
}

export default function DailyQuizFormFields({ form, setForm, grades, showAdvanced }) {
  const theme = useDailyQuizTheme();
  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const inputProps = {
    borderRadius: "xl",
    borderColor: theme.cardBorder,
    bg: theme.filterBg,
    _focus: {
      borderColor: "orange.400",
      boxShadow: "0 0 0 1px var(--chakra-colors-orange-400)",
    },
  };

  return (
    <VStack spacing={4} align="stretch">
      <SectionTitle>المعلومات الأساسية</SectionTitle>
      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
          عنوان المسابقة
        </FormLabel>
        <Input
          {...inputProps}
          value={form.title}
          onChange={(e) => patch("title", e.target.value)}
          placeholder="مثال: مسابقة يومية — التيار الكهربي"
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
          وصف مختصر
        </FormLabel>
        <Textarea
          {...inputProps}
          value={form.description}
          onChange={(e) => patch("description", e.target.value)}
          rows={2}
          placeholder="اختياري — يظهر للطالب مع بطاقة المسابقة"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
          الصف الدراسي
        </FormLabel>
        <Select
          {...inputProps}
          value={form.grade_id}
          onChange={(e) => patch("grade_id", e.target.value)}
          placeholder="اختر الصف"
        >
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </FormControl>

      <SectionTitle>الجدول الزمني</SectionTitle>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            تبدأ في
          </FormLabel>
          <Input
            {...inputProps}
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => patch("starts_at", e.target.value)}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            تنتهي في
          </FormLabel>
          <Input
            {...inputProps}
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => patch("ends_at", e.target.value)}
          />
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            مدة الحل (ثانية)
          </FormLabel>
          <Input
            {...inputProps}
            type="number"
            min={30}
            max={7200}
            value={form.duration_seconds}
            onChange={(e) => patch("duration_seconds", e.target.value)}
          />
          <Text fontSize="xs" color={theme.muted} mt={1}>
            {formatDuration(form.duration_seconds)} — مثال 600 = 10 دقائق
          </Text>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            أقصى نقاط أساسية
          </FormLabel>
          <Input
            {...inputProps}
            type="number"
            min={1}
            value={form.max_points}
            onChange={(e) => patch("max_points", e.target.value)}
          />
        </FormControl>
      </SimpleGrid>

      <SectionTitle>قواعد اللعب</SectionTitle>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            إظهار الإجابات
          </FormLabel>
          <Select
            {...inputProps}
            value={form.show_answers_mode}
            onChange={(e) => patch("show_answers_mode", e.target.value)}
          >
            {Object.entries(SHOW_ANSWERS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            نظام المكافأة
          </FormLabel>
          <Select
            {...inputProps}
            value={form.scoring_mode}
            onChange={(e) => patch("scoring_mode", e.target.value)}
          >
            {Object.entries(SCORING_MODE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
        {[
          { key: "allow_one_attempt", label: "محاولة واحدة فقط" },
          { key: "is_visible", label: "ظاهرة للطلاب" },
          { key: "shuffle_questions", label: "خلط الأسئلة" },
          { key: "shuffle_options", label: "خلط الاختيارات" },
          { key: "allow_navigation", label: "التنقل بين الأسئلة" },
        ].map((item) => (
          <Flex
            key={item.key}
            align="center"
            justify="space-between"
            borderWidth="1px"
            borderColor={theme.cardBorder}
            borderRadius="xl"
            bg={theme.softBg}
            px={3.5}
            py={2.5}
          >
            <Text fontSize="sm" fontWeight="600" color={theme.heading}>
              {item.label}
            </Text>
            <Switch
              isChecked={form[item.key]}
              onChange={(e) => patch(item.key, e.target.checked)}
              colorScheme="orange"
            />
          </Flex>
        ))}
      </SimpleGrid>

      {showAdvanced && form.scoring_mode === "rank_bonus" ? (
        <Box>
          <SectionTitle>مكافآت الترتيب</SectionTitle>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700">
                مكافأة الأول
              </FormLabel>
              <Input
                {...inputProps}
                type="number"
                value={form.rank_bonus_start}
                onChange={(e) => patch("rank_bonus_start", e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700">
                نقص لكل مركز
              </FormLabel>
              <Input
                {...inputProps}
                type="number"
                value={form.rank_bonus_step}
                onChange={(e) => patch("rank_bonus_step", e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="700">
                حد أدنى للمكافأة
              </FormLabel>
              <Input
                {...inputProps}
                type="number"
                value={form.rank_bonus_min}
                onChange={(e) => patch("rank_bonus_min", e.target.value)}
              />
            </FormControl>
          </SimpleGrid>
        </Box>
      ) : null}

      {showAdvanced && form.scoring_mode === "time_ratio" ? (
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="700">
            أقصى مكافأة زمنية
          </FormLabel>
          <Input
            {...inputProps}
            type="number"
            value={form.time_ratio_max_bonus}
            onChange={(e) => patch("time_ratio_max_bonus", e.target.value)}
          />
        </FormControl>
      ) : null}
    </VStack>
  );
}
