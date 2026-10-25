import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { MdRefresh, MdSave } from "react-icons/md";
import {
  fetchParentsExamSettings,
  saveParentsExamSettings,
} from "../../../api/whatsappAdminApi";

export default function ParentsExamNotifyPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchParentsExamSettings();
      setSettings(next);
      setDraft(next?.config || null);
    } catch (err) {
      toast({
        title: "تعذّر تحميل الإعدادات",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveParentsExamSettings({
        interval_seconds: Number(draft.interval_seconds),
        jitter_seconds: Number(draft.jitter_seconds),
        daily_cap: Number(draft.daily_cap),
        quiet_hours: draft.quiet_hours,
      });
      setSettings(next);
      setDraft(next.config);
      toast({ title: "تم حفظ حدود الإرسال", status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر الحفظ",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <Flex minH="40vh" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Box bg={pageBg} minH="40vh" py={4}>
      <Container maxW="4xl">
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            <FaWhatsapp color="#25D366" />
            <Heading size="md">حدود إرسال أولياء الأمور</Heading>
          </HStack>
          <Button leftIcon={<MdRefresh />} size="sm" onClick={() => void load()}>
            تحديث
          </Button>
        </Flex>
        <Alert status="info" borderRadius="lg" mb={4}>
          <AlertIcon />
          المدرس يربط رقمه من إشعارات الطلاب ويختار الامتحانات. هنا تضبط سرعة الإرسال لكل المدرسين.
        </Alert>
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4} mb={4}>
          <VStack align="stretch" spacing={3}>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm">ثواني بين كل رسالة</FormLabel>
                <NumberInput
                  min={15}
                  max={300}
                  value={draft.interval_seconds}
                  onChange={(_t, n) => setDraft({ ...draft, interval_seconds: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">عشوائية بالثواني</FormLabel>
                <NumberInput
                  min={0}
                  max={120}
                  value={draft.jitter_seconds}
                  onChange={(_t, n) => setDraft({ ...draft, jitter_seconds: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">حد يومي لكل مدرس</FormLabel>
                <NumberInput
                  min={1}
                  max={5000}
                  value={draft.daily_cap}
                  onChange={(_t, n) => setDraft({ ...draft, daily_cap: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </HStack>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>
                ساعات الهدوء ({draft.quiet_hours?.start}–{draft.quiet_hours?.end})
              </FormLabel>
              <Switch
                isChecked={Boolean(draft.quiet_hours?.enabled)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    quiet_hours: { ...draft.quiet_hours, enabled: e.target.checked },
                  })
                }
              />
            </FormControl>
            <Button leftIcon={<MdSave />} colorScheme="green" alignSelf="start" isLoading={saving} onClick={() => void save()}>
              حفظ
            </Button>
          </VStack>
        </Box>
        <Text color={muted} mb={2}>
          اتبعتت النهاردة على كل المدرسين: {settings?.sentToday ?? 0}. الحد اليومي لكل مدرس: {draft.daily_cap}.
        </Text>
        <Table size="sm" bg={cardBg}>
          <Thead>
            <Tr>
              <Th>الامتحان</Th>
              <Th>الطالب</Th>
              <Th>موعد الإرسال</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(settings?.upcoming || []).map((row) => (
              <Tr key={row.notificationId}>
                <Td>{row.examTitle}</Td>
                <Td>{row.studentName}</Td>
                <Td>{row.scheduledAt ? new Date(row.scheduledAt).toLocaleString("ar-EG") : "—"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Container>
    </Box>
  );
}
