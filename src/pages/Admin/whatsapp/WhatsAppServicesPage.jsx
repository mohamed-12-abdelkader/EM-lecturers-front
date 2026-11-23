import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  useToast,
  useColorModeValue,
  Flex,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Checkbox,
  CheckboxGroup,
  Stack,
  Alert,
  AlertIcon,
  Divider,
  IconButton,
} from "@chakra-ui/react";
import { MdRefresh, MdSave } from "react-icons/md";
import {
  fetchWhatsAppStatus,
  fetchWhatsAppServices,
  fetchWhatsAppService,
  fetchWhatsAppSessions,
  patchWhatsAppService,
  putWhatsAppServiceSessions,
} from "../../../api/whatsappAdminApi";
import {
  WaPageShell,
  WaCard,
  WaLoading,
  WaEmptyState,
  WaStatusBadge,
} from "../../../components/whatsapp/ui";

const TYPE_AR = {
  chatbot: "شات بوت",
  transactional: "رسائل تلقائية",
  broadcast: "بث جماعي",
};

export default function WhatsAppServicesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [services, setServices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [poolDraft, setPoolDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const activeBg = useColorModeValue("green.50", "whiteAlpha.100");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchWhatsAppStatus();
      setConfigured(Boolean(status?.configured));
      const [svcList, sessList] = await Promise.all([
        fetchWhatsAppServices(),
        status?.configured ? fetchWhatsAppSessions() : Promise.resolve([]),
      ]);
      setServices(Array.isArray(svcList) ? svcList : []);
      setSessions(Array.isArray(sessList) ? sessList : []);
      if (!selectedId && svcList?.length) {
        setSelectedId(svcList[0].id);
      }
    } catch (err) {
      toast({
        title: "تعذّر تحميل الخدمات",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setPoolDraft([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWhatsAppService(selectedId);
        if (cancelled) return;
        setDetail(data);
        setPoolDraft(
          (data.sessions || []).map((s) => ({
            session_slug: s.session_slug,
            weight: s.weight || 1,
            priority: s.priority || 0,
            role: s.role || "primary",
            is_enabled: s.is_enabled !== false,
          })),
        );
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "تعذّر تحميل تفاصيل الخدمة",
            description: err?.response?.data?.message || err.message,
            status: "error",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, toast]);

  const toggleService = async (svc) => {
    try {
      await patchWhatsAppService(svc.id, { is_enabled: !svc.is_enabled });
      toast({
        title: !svc.is_enabled ? "تم تفعيل الخدمة" : "تم تعطيل الخدمة",
        status: "success",
      });
      load();
      if (selectedId === svc.id) {
        const data = await fetchWhatsAppService(svc.id);
        setDetail(data);
      }
    } catch (err) {
      toast({
        title: "تعذّر التحديث",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const selectedSlugs = poolDraft.map((p) => p.session_slug);

  const onToggleSlug = (slug, checked) => {
    if (checked) {
      setPoolDraft((prev) => [
        ...prev,
        { session_slug: slug, weight: 1, priority: 0, role: "primary", is_enabled: true },
      ]);
    } else {
      setPoolDraft((prev) => prev.filter((p) => p.session_slug !== slug));
    }
  };

  const updateMember = (slug, patch) => {
    setPoolDraft((prev) =>
      prev.map((p) => (p.session_slug === slug ? { ...p, ...patch } : p)),
    );
  };

  const savePool = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await putWhatsAppServiceSessions(selectedId, poolDraft);
      toast({ title: "تم حفظ مجموعة الأرقام", status: "success" });
      const data = await fetchWhatsAppService(selectedId);
      setDetail(data);
      load();
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

  return (
    <WaPageShell
      title="خدمات واتساب"
      description="إدارة الأتمتة وتوزيع الأرقام (load balancing) لكل خدمة"
      showAdminNav
      actions={
        <IconButton
          aria-label="تحديث"
          icon={<MdRefresh />}
          size="sm"
          variant="outline"
          onClick={load}
          isLoading={loading}
        />
      }
      alert={
        !configured ? (
          <Alert status="warning" borderRadius="xl">
            <AlertIcon />
            البوابة غير مُعدّة — يمكنك تعديل إعدادات الخدمات، لكن لن تعمل الجلسات بدون API key.
          </Alert>
        ) : null
      }
    >
      {loading ? (
        <WaLoading />
      ) : (
        <Flex gap={4} direction={{ base: "column", lg: "row" }} align="stretch">
          <WaCard title="قائمة الخدمات" flexShrink={0} minW={{ lg: "300px" }} maxW={{ lg: "340px" }} w="100%">
            <VStack align="stretch" spacing={2}>
              {services.map((svc) => (
                <Box
                  key={svc.id}
                  border="1px solid"
                  borderColor={selectedId === svc.id ? "green.400" : border}
                  bg={selectedId === svc.id ? activeBg : "transparent"}
                  _hover={{ bg: selectedId === svc.id ? activeBg : hoverBg }}
                  borderRadius="lg"
                  p={3}
                  cursor="pointer"
                  transition="all 0.15s"
                  onClick={() => setSelectedId(svc.id)}
                >
                  <Flex justify="space-between" align="center" gap={2}>
                    <Box minW={0}>
                      <Text fontWeight="700" noOfLines={1}>
                        {svc.name}
                      </Text>
                      <Text fontSize="xs" color={muted} dir="ltr" noOfLines={1}>
                        {svc.key}
                      </Text>
                    </Box>
                    <VStack spacing={1} align="end" flexShrink={0}>
                      <Badge colorScheme={svc.is_enabled ? "green" : "gray"} borderRadius="full">
                        {svc.is_enabled ? "مفعّل" : "معطّل"}
                      </Badge>
                      <Text fontSize="xs" color={muted}>
                        {svc.ready_session_count}/{svc.session_count} جاهز
                      </Text>
                    </VStack>
                  </Flex>
                </Box>
              ))}
              {services.length === 0 && (
                <WaEmptyState title="لا توجد خدمات" description="لم يتم تسجيل أي خدمة بعد." />
              )}
            </VStack>
          </WaCard>

          <WaCard flex={1} w="100%">
            {!detail?.service ? (
              <WaEmptyState title="اختر خدمة" description="اختر خدمة من القائمة لعرض التفاصيل وإدارة الأرقام." />
            ) : (
              <VStack align="stretch" spacing={4}>
                <Flex justify="space-between" align="start" wrap="wrap" gap={3}>
                  <Box>
                    <Heading size="md">{detail.service.name}</Heading>
                    <Text fontSize="sm" color={muted} mt={1}>
                      {detail.service.description || "بدون وصف"}
                    </Text>
                    <HStack mt={2} spacing={2} flexWrap="wrap">
                      <Badge borderRadius="full">{TYPE_AR[detail.service.type] || detail.service.type}</Badge>
                      <Badge variant="outline" borderRadius="full">
                        {detail.service.scope}
                      </Badge>
                    </HStack>
                  </Box>
                  <FormControl display="flex" alignItems="center" w="auto">
                    <FormLabel mb={0} fontSize="sm" me={2}>
                      تفعيل الخدمة
                    </FormLabel>
                    <Switch
                      isChecked={detail.service.is_enabled}
                      onChange={() => toggleService(detail.service)}
                      colorScheme="green"
                    />
                  </FormControl>
                </Flex>

                <Divider />

                <Box>
                  <Heading size="sm" mb={1}>
                    مجموعة الأرقام (Pool)
                  </Heading>
                  <Text fontSize="sm" color={muted} mb={3}>
                    اختر أكثر من رقم لتوزيع الحمل. المحادثات النشطة تبقى على نفس الرقم (sticky).
                  </Text>

                  {(() => {
                    const isTeacherService = detail?.service?.config?.owner === "teacher";
                    const poolSessions = sessions.filter((s) =>
                      isTeacherService ? Boolean(s.teacher_id) : !s.teacher_id,
                    );
                    if (poolSessions.length === 0) {
                      return (
                        <Alert status="info" borderRadius="lg">
                          <AlertIcon />
                          {isTeacherService
                            ? "لا توجد جلسات مدرسين — يربط المدرسون أرقامهم من لوحة المدرس."
                            : "لا توجد جلسات منصة — أنشئ جلسة من صفحة الجلسات أولاً (جلسات المدرسين مستبعدة)."}
                        </Alert>
                      );
                    }
                    return (
                      <CheckboxGroup value={selectedSlugs}>
                        <Stack spacing={3}>
                          {poolSessions.map((s) => {
                            const member = poolDraft.find((p) => p.session_slug === s.id);
                            const checked = Boolean(member);
                            return (
                              <Box
                                key={s.id}
                                border="1px solid"
                                borderColor={border}
                                borderRadius="lg"
                                p={3}
                                bg={checked ? activeBg : "transparent"}
                              >
                                <Checkbox
                                  isChecked={checked}
                                  onChange={(e) => onToggleSlug(s.id, e.target.checked)}
                                  colorScheme="green"
                                >
                                  <HStack spacing={2} flexWrap="wrap">
                                    <Text fontWeight="600" dir="ltr">
                                      {s.id}
                                    </Text>
                                    <Text fontSize="sm" color={muted} dir="ltr">
                                      {s.phone_number || "—"}
                                    </Text>
                                    {s.teacher_id && (
                                      <Badge colorScheme="purple" fontSize="xs" borderRadius="full">
                                        {s.teacher_name || `مدرس #${s.teacher_id}`}
                                      </Badge>
                                    )}
                                    <WaStatusBadge status={s.status} />
                                  </HStack>
                                </Checkbox>
                                {checked && (
                                  <HStack mt={3} spacing={4} wrap="wrap" ps={6}>
                                    <FormControl maxW="120px">
                                      <FormLabel fontSize="xs">الوزن</FormLabel>
                                      <NumberInput
                                        size="sm"
                                        min={1}
                                        max={100}
                                        value={member.weight}
                                        onChange={(_, n) =>
                                          updateMember(s.id, {
                                            weight: Number.isFinite(n) ? n : 1,
                                          })
                                        }
                                      >
                                        <NumberInputField />
                                      </NumberInput>
                                    </FormControl>
                                    <FormControl maxW="120px">
                                      <FormLabel fontSize="xs">الأولوية</FormLabel>
                                      <NumberInput
                                        size="sm"
                                        value={member.priority}
                                        onChange={(_, n) =>
                                          updateMember(s.id, {
                                            priority: Number.isFinite(n) ? n : 0,
                                          })
                                        }
                                      >
                                        <NumberInputField />
                                      </NumberInput>
                                    </FormControl>
                                  </HStack>
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </CheckboxGroup>
                    );
                  })()}

                  <Button
                    mt={4}
                    colorScheme="green"
                    leftIcon={<MdSave />}
                    onClick={savePool}
                    isLoading={saving}
                    isDisabled={!selectedId}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    حفظ المجموعة
                  </Button>
                </Box>
              </VStack>
            )}
          </WaCard>
        </Flex>
      )}
    </WaPageShell>
  );
}
