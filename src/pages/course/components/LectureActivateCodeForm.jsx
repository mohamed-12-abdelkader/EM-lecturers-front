import { useState } from "react";
import { Button, HStack, Input, Text, useToast } from "@chakra-ui/react";
import { FaKey } from "react-icons/fa";
import { activateLectureByCode, courseAccessApiError } from "../../../api/courseAccessApi";
import { formatRemainingSeconds } from "../../../utils/lectureAccessUtils";
import { lcBodySm, lcTitleSm } from "../courseTheme";

export default function LectureActivateCodeForm({ onActivated }) {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast({ title: "أدخل كود التفعيل", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setLoading(true);
    try {
      const result = await activateLectureByCode(trimmed);
      toast({
        title: result?.message || "تم تفعيل المحاضرة",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setCode("");
      onActivated?.(result);
    } catch (err) {
      toast({
        title: "تعذّر التفعيل",
        description: courseAccessApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 text-right">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:text-right">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500 text-white">
          <FaKey className="text-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`${lcTitleSm} text-purple-800 dark:text-purple-200`}>تفعيل المحاضرة</p>
          <p className={`mt-1 ${lcBodySm}`}>
            أدخل كود التفعيل الذي أرسله لك المدرس
          </p>
        </div>
      </div>
      <HStack spacing={2}>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABC123"
          dir="ltr"
          textAlign="center"
          fontFamily="mono"
          fontWeight="bold"
          letterSpacing="wider"
          flex={1}
        />
        <Button
          type="submit"
          colorScheme="purple"
          borderRadius="xl"
          isLoading={loading}
          loadingText="..."
          flexShrink={0}
        >
          تفعيل
        </Button>
      </HStack>
    </form>
  );
}

export function LectureActivationTimer({ activation }) {
  if (!activation?.expires_at && activation?.remaining_seconds == null) return null;
  const remaining =
    activation?.remaining_seconds != null
      ? formatRemainingSeconds(activation.remaining_seconds)
      : null;
  if (!remaining) return null;
  return (
    <Text fontSize="xs" color="emerald.600" mt={1}>
      متبقٍ على انتهاء التفعيل: {remaining}
    </Text>
  );
}
