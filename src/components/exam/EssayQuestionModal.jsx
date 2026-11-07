import { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import {
  createEssayQuestion,
  essayQuestionsApiError,
  ocrEssayImages,
} from "../../api/essayQuestionsApi";

export default function EssayQuestionModal({ isOpen, onClose, examId, scope = "course", onSaved }) {
  const toast = useToast();
  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [modelImage, setModelImage] = useState("");
  const [points, setPoints] = useState("5");
  const [rubric, setRubric] = useState("");
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);

  const reset = () => {
    setQuestionText("");
    setQuestionImage("");
    setModelAnswer("");
    setModelImage("");
    setPoints("5");
    setRubric("");
  };

  const readImage = async (file, target) => {
    const token = localStorage.getItem("token");
    setReading(true);
    try {
      const { images } = await ocrEssayImages(file, token);
      const image = images?.[0];
      if (!image?.url) throw new Error("لم تُرفع الصورة");
      if (target === "question") setQuestionImage(image.url);
      if (target === "model") {
        setModelImage(image.url);
        if (image.extractedText) setModelAnswer(image.extractedText);
        if (image.ocrFailed) {
          toast({
            title: "راجع النص المستخرج",
            description: "يمكن تعديل الإجابة النموذجية قبل الحفظ.",
            status: "warning",
          });
        }
      }
    } catch (err) {
      toast({
        title: "تعذر قراءة الصورة",
        description: essayQuestionsApiError(err, "حاول مرة أخرى"),
        status: "error",
      });
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    if (!String(questionText || "").trim() && !questionImage) {
      toast({ title: "أدخل نص السؤال أو صورته", status: "warning" });
      return;
    }
    if (!String(modelAnswer || "").trim()) {
      toast({ title: "الإجابة النموذجية مطلوبة", status: "warning" });
      return;
    }
    const score = Number(points);
    if (!Number.isFinite(score) || score <= 0) {
      toast({ title: "الدرجة يجب أن تكون أكبر من صفر", status: "warning" });
      return;
    }
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const result = await createEssayQuestion(
        {
          examId,
          scope,
          questionText,
          questionImage: questionImage || null,
          modelAnswer,
          modelAnswerImage: modelImage || null,
          points: score,
          rubric,
        },
        token,
      );
      toast({ title: result.message || "تم حفظ السؤال المقالي", status: "success" });
      reset();
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast({
        title: "تعذر حفظ السؤال",
        description: essayQuestionsApiError(err, "حاول مرة أخرى"),
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent dir="rtl" borderRadius="2xl" mx={3}>
        <ModalHeader>سؤال مقالي</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>نص السؤال</FormLabel>
              <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} minH="100px" />
            </FormControl>
            <FormControl>
              <FormLabel>صورة السؤال (اختياري)</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], "question")} />
              {questionImage && <Image src={questionImage} alt="السؤال" mt={2} maxH="180px" borderRadius="lg" />}
            </FormControl>
            <FormControl>
              <FormLabel>الإجابة النموذجية</FormLabel>
              <Textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} minH="120px" />
            </FormControl>
            <FormControl>
              <FormLabel>صورة الإجابة النموذجية (اختياري)</FormLabel>
              <Text fontSize="sm" color="gray.500" mb={2}>
                يُستخرج النص من الصورة ويمكنك تعديله قبل الحفظ.
              </Text>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], "model")} />
              {modelImage && <Image src={modelImage} alt="الإجابة النموذجية" mt={2} maxH="180px" borderRadius="lg" />}
            </FormControl>
            <FormControl>
              <FormLabel>الدرجة</FormLabel>
              <Input type="number" min="0.5" step="0.5" value={points} onChange={(e) => setPoints(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>معايير التصحيح (اختياري)</FormLabel>
              <Textarea value={rubric} onChange={(e) => setRubric(e.target.value)} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" ml={3} onClick={onClose}>إلغاء</Button>
          <Button colorScheme="blue" onClick={save} isLoading={saving || reading}>حفظ السؤال</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
