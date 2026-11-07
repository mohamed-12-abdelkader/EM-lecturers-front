import { useState } from "react";
import {
  Box,
  Button,
  HStack,
  Image,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { essayQuestionsApiError, ocrEssayImages } from "../../api/essayQuestionsApi";

export default function EssayAnswerEditor({ value, onChange, disabled = false }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("white", "gray.800");
  const text = value?.text || "";
  const images = Array.isArray(value?.images) ? value.images : [];

  const emit = (next) => {
    onChange?.({
      essay: true,
      text: next.text ?? text,
      images: next.images ?? images,
      ocrText: next.ocrText ?? value?.ocrText ?? "",
    });
  };

  const uploadImages = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, 5);
    if (!files.length) return;
    const token = localStorage.getItem("token");
    setUploading(true);
    try {
      const { images: uploaded } = await ocrEssayImages(files, token);
      const urls = uploaded.map((item) => item.url).filter(Boolean);
      const extracted = uploaded
        .map((item) => String(item.extractedText || "").trim())
        .filter(Boolean)
        .join("\n\n");
      const failed = uploaded.some((item) => item.ocrFailed);
      emit({
        images: [...images, ...urls].slice(0, 5),
        ocrText: [value?.ocrText, extracted].filter(Boolean).join("\n\n"),
        text: text.trim() ? text : [text, extracted].filter(Boolean).join("\n\n"),
      });
      if (failed) {
        toast({
          title: "تعذر قراءة إحدى الصور",
          description: "الصورة محفوظة. راجع النص أو أعد رفع صورة أوضح.",
          status: "warning",
        });
      }
    } catch (err) {
      toast({
        title: "تعذر رفع الصورة",
        description: essayQuestionsApiError(err, "حاول مرة أخرى"),
        status: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <VStack align="stretch" spacing={3} dir="rtl">
      <Text fontSize="sm" color="gray.500">
        اكتب إجابتك، أو ارفع صورة خط اليد. يمكنك الجمع بين الاثنين ومراجعة النص قبل التسليم.
      </Text>
      <Textarea
        value={text}
        minH="180px"
        bg={bg}
        borderColor={border}
        borderRadius="xl"
        isDisabled={disabled}
        placeholder="اكتب الإجابة هنا"
        onChange={(e) => emit({ text: e.target.value })}
      />
      <HStack wrap="wrap" spacing={3}>
        {images.map((url) => (
          <Box key={url} position="relative">
            <Image src={url} alt="صورة الإجابة" boxSize="92px" objectFit="cover" borderRadius="lg" />
            {!disabled && (
              <Button
                size="xs"
                colorScheme="red"
                position="absolute"
                top={1}
                left={1}
                onClick={() => emit({ images: images.filter((item) => item !== url) })}
              >
                حذف
              </Button>
            )}
          </Box>
        ))}
      </HStack>
      {!disabled && (
        <Button as="label" alignSelf="start" isLoading={uploading} cursor="pointer" variant="outline">
          رفع صورة الإجابة
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              uploadImages(e.target.files);
              e.target.value = "";
            }}
          />
        </Button>
      )}
    </VStack>
  );
}
