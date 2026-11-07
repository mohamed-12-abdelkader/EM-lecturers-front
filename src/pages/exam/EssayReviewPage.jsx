import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  decideEssayReview,
  essayQuestionsApiError,
  fetchEssayReviews,
} from "../../api/essayQuestionsApi";

const STATUS_LABELS = {
  needs_review: "قيد المراجعة",
  pending: "بانتظار التصحيح",
  grading: "جاري التصحيح",
  correct: "صحيحة",
  incorrect: "خاطئة",
  graded: "تم التصحيح",
  all: "الكل",
};

export default function EssayReviewPage() {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("needs_review");
  const [examId, setExamId] = useState("");
  const [scope, setScope] = useState("all");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState({});

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const items = await fetchEssayReviews(
        {
          status,
          ...(examId ? { examId } : {}),
          ...(scope !== "all" ? { scope } : {}),
        },
        token,
      );
      setItems(items);
    } catch (err) {
      toast({
        title: "تعذر تحميل المراجعات",
        description: essayQuestionsApiError(err, "حاول مرة أخرى"),
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [examId, scope, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (item, score) => {
    const token = localStorage.getItem("token");
    const draft = drafts[`${item.source}:${item.answerId}`] || {};
    try {
      const result = await decideEssayReview(
        {
          source: item.source,
          answerId: item.answerId,
          score,
          note: draft.note || "",
        },
        token,
      );
      toast({
        title: result?.message || "تم اعتماد الدرجة وتحديث نتيجة الطالب",
        status: "success",
      });
      load();
    } catch (err) {
      toast({
        title: "تعذر حفظ القرار",
        description: essayQuestionsApiError(err, "حاول مرة أخرى"),
        status: "error",
      });
    }
  };

  return (
    <Box dir="rtl" maxW="1100px" mx="auto" px={4} py={6}>
      <Heading size="lg" mb={2}>مراجعة الأسئلة المقالية</Heading>
      <Text color="gray.500" mb={5}>
        الإجابات التي تحتاج تقديرك تظهر هنا. بعد الحفظ تتحدث درجة الطالب تلقائيًا.
      </Text>
      <HStack mb={5} wrap="wrap" spacing={3}>
        <Select maxW="220px" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="needs_review">قيد المراجعة</option>
          <option value="pending">بانتظار التصحيح</option>
          <option value="correct">صحيحة</option>
          <option value="incorrect">خاطئة</option>
          <option value="graded">درجة جزئية</option>
          <option value="all">الكل</option>
        </Select>
        <Select maxW="180px" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">كل الاختبارات</option>
          <option value="course">شامل / عام</option>
          <option value="lecture">محاضرة / واجب</option>
        </Select>
        <Input
          maxW="180px"
          placeholder="رقم الامتحان"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
        />
        <Button onClick={load} isLoading={loading}>تحديث</Button>
      </HStack>
      <VStack align="stretch" spacing={4}>
        {!items.length && !loading && <Text>لا توجد إجابات في هذا التصفية.</Text>}
        {items.map((item) => {
          const key = `${item.source}:${item.answerId}`;
          const draft = drafts[key] || {};
          const suggested = draft.score ?? (item.awardedScore ?? "");
          return (
            <Box key={key} bg={cardBg} borderWidth="1px" borderRadius="2xl" p={5}>
              <HStack justify="space-between" mb={3} wrap="wrap">
                <Box>
                  <Text fontWeight="700">{item.studentName}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {[item.gradeName, item.groupName].filter(Boolean).join(" · ") || "بدون مجموعة"}
                    {" · "}
                    {item.examTitle}
                  </Text>
                </Box>
                <Badge colorScheme="orange">{STATUS_LABELS[item.gradingStatus] || item.gradingStatus}</Badge>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight="700" mb={2}>السؤال</Text>
                  <Text whiteSpace="pre-wrap">{item.questionText}</Text>
                  {item.questionImage && <Image src={item.questionImage} alt="السؤال" mt={2} maxH="220px" borderRadius="lg" />}
                </Box>
                <Box>
                  <Text fontWeight="700" mb={2}>الإجابة النموذجية</Text>
                  <Text whiteSpace="pre-wrap">{item.modelAnswer}</Text>
                  {item.modelAnswerImage && (
                    <Image src={item.modelAnswerImage} alt="النموذج" mt={2} maxH="220px" borderRadius="lg" />
                  )}
                </Box>
                <Box>
                  <Text fontWeight="700" mb={2}>إجابة الطالب</Text>
                  <Text whiteSpace="pre-wrap">{item.answerText || "بدون نص"}</Text>
                  <HStack mt={2} wrap="wrap">
                    {(item.answerImages || []).map((url) => (
                      <Image key={url} src={url} alt="إجابة" boxSize="110px" objectFit="cover" borderRadius="lg" />
                    ))}
                  </HStack>
                  {item.ocrText && (
                    <Text mt={2} fontSize="sm" color="gray.500" whiteSpace="pre-wrap">
                      النص المستخرج: {item.ocrText}
                    </Text>
                  )}
                </Box>
                <Box>
                  <Text fontWeight="700" mb={2}>تقييم أولي</Text>
                  <Text fontSize="sm">الدرجة الكاملة: {item.maxScore}</Text>
                  <Text fontSize="sm">الدرجة المقترحة: {item.awardedScore ?? "—"}</Text>
                  <Text mt={2} whiteSpace="pre-wrap">{item.aiReason || "لا يوجد سبب آلي"}</Text>
                  {!!item.matchedPoints?.length && <Text mt={2} fontSize="sm">موجود: {item.matchedPoints.join("، ")}</Text>}
                  {!!item.missingPoints?.length && <Text fontSize="sm">ناقص: {item.missingPoints.join("، ")}</Text>}
                  {!!item.errors?.length && <Text fontSize="sm">أخطاء: {item.errors.join("، ")}</Text>}
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString("ar-EG") : ""}
                  </Text>
                </Box>
              </SimpleGrid>
              <FormControl mt={4}>
                <FormLabel>ملاحظة للطالب</FormLabel>
                <Textarea
                  value={draft.note ?? item.teacherNote ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: { ...draft, note: e.target.value } }))}
                />
              </FormControl>
              <HStack mt={3} wrap="wrap">
                <Input
                  maxW="140px"
                  type="number"
                  min="0"
                  max={item.maxScore}
                  step="0.5"
                  placeholder="الدرجة"
                  value={suggested}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: { ...draft, score: e.target.value } }))}
                />
                <Button colorScheme="green" onClick={() => decide(item, Number(item.maxScore))}>اعتماد صحيحة</Button>
                <Button colorScheme="red" variant="outline" onClick={() => decide(item, 0)}>اعتماد خاطئة</Button>
                <Button colorScheme="blue" onClick={() => decide(item, Number(suggested))}>حفظ الدرجة</Button>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
