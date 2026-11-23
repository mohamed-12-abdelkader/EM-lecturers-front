import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import {
  addSalesAgentKnowledge,
  createSalesAgentFollowup,
  createSalesAgentSession,
  deleteSalesAgentKnowledge,
  fetchSalesAgentKnowledge,
  fetchSalesAgentLead,
  fetchSalesAgentLeads,
  fetchSalesAgentOverview,
  fetchSalesAgentSession,
  fetchSalesAgentSessions,
  fetchWhatsAppServices,
  fetchWhatsAppSessions,
  patchWhatsAppService,
  setSalesAgentLeadAi,
  setSalesAgentSessionStatus,
  updateSalesAgentLead,
  updateSalesAgentSession,
} from "../../../api/whatsappAdminApi";

const STATUS_AR = {
  draft: "مسودة",
  active: "نشطة",
  paused: "متوقفة",
  archived: "مؤرشفة",
  error: "خطأ",
};

const STATUS_COLOR = {
  draft: "gray",
  active: "green",
  paused: "orange",
  archived: "purple",
  error: "red",
};

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

/** WhatsApp gateway sessions use `id` as the slug (not `slug`). */
function waSessionId(s) {
  return String(s?.id || s?.slug || "").trim();
}

function waSessionLabel(s) {
  const id = waSessionId(s);
  const phone = s?.phone_number ? ` (${s.phone_number})` : "";
  const status = s?.status ? ` — ${s.status}` : "";
  return `${id}${phone}${status}`;
}

const emptyCreate = {
  name: "",
  product_name: "",
  description: "",
  dialect: "egyptian",
  tone: "friendly",
  formality: "casual",
  wa_session_slug: "",
  sales_instructions: "",
  demo_url: "",
  signup_url: "",
};

export default function SalesAgentAdminPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [waSessions, setWaSessions] = useState([]);
  const [service, setService] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [knowledge, setKnowledge] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadDetail, setLeadDetail] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [settingsForm, setSettingsForm] = useState(null);
  const [kbForm, setKbForm] = useState({ title: "", kind: "note", content: "" });
  const [acting, setActing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, list, services, wa] = await Promise.all([
        fetchSalesAgentOverview(),
        fetchSalesAgentSessions({ status: statusFilter || undefined, limit: 100 }),
        fetchWhatsAppServices(),
        fetchWhatsAppSessions().catch(() => []),
      ]);
      setOverview(ov);
      setSessions(list?.rows || list || []);
      const svc = (services || []).find((s) => s.key === "ai_sales_agent") || null;
      setService(svc);
      setWaSessions(Array.isArray(wa) ? wa : wa?.sessions || wa?.rows || []);
    } catch (err) {
      toast({
        title: "تعذر تحميل وكيل المبيعات",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = useCallback(
    async (id) => {
      if (!id) return;
      setSelectedId(id);
      setLeadDetail(null);
      setSelectedLeadId(null);
      try {
        const [dash, kb, leadList] = await Promise.all([
          fetchSalesAgentSession(id),
          fetchSalesAgentKnowledge(id),
          fetchSalesAgentLeads(id, { limit: 100 }),
        ]);
        setDetail(dash);
        setSettingsForm(dash?.session || null);
        setKnowledge(kb || []);
        setLeads(leadList?.rows || []);
      } catch (err) {
        toast({
          title: "تعذر فتح الجلسة",
          description: err?.response?.data?.message || err.message,
          status: "error",
        });
      }
    },
    [toast],
  );

  const openLead = async (leadId) => {
    if (!selectedId || !leadId) return;
    setSelectedLeadId(leadId);
    try {
      const data = await fetchSalesAgentLead(selectedId, leadId);
      setLeadDetail(data);
    } catch (err) {
      toast({
        title: "تعذر فتح العميل",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const onCreate = async () => {
    if (!createForm.name.trim()) {
      toast({ title: "اكتب اسم الجلسة", status: "warning" });
      return;
    }
    setCreating(true);
    try {
      const created = await createSalesAgentSession({
        ...createForm,
        product_name: createForm.product_name || createForm.name,
        wa_session_slug: createForm.wa_session_slug || null,
      });
      toast({ title: "تم إنشاء الجلسة", status: "success" });
      setCreateForm(emptyCreate);
      await load();
      if (created?.id) await loadDetail(created.id);
    } catch (err) {
      toast({
        title: "فشل الإنشاء",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const onSaveSettings = async () => {
    if (!settingsForm?.id) return;
    setActing(true);
    try {
      let packages = settingsForm.packages;
      if (typeof packages === "string") {
        try {
          packages = JSON.parse(packages);
        } catch {
          throw new Error("صيغة الباقات يجب أن تكون JSON");
        }
      }
      await updateSalesAgentSession(settingsForm.id, {
        name: settingsForm.name,
        description: settingsForm.description,
        product_name: settingsForm.product_name,
        product_description: settingsForm.product_description,
        goal: settingsForm.goal,
        target_audience: settingsForm.target_audience,
        dialect: settingsForm.dialect,
        tone: settingsForm.tone,
        formality: settingsForm.formality,
        persona: settingsForm.persona,
        sales_instructions: settingsForm.sales_instructions,
        general_instructions: settingsForm.general_instructions,
        wa_session_slug: settingsForm.wa_session_slug || null,
        demo_url: settingsForm.demo_url || null,
        signup_url: settingsForm.signup_url || null,
        packages: packages || [],
        followup_settings: settingsForm.followup_settings,
        enabled_tools: settingsForm.enabled_tools,
      });
      toast({ title: "تم حفظ الإعدادات", status: "success" });
      await loadDetail(settingsForm.id);
      await load();
    } catch (err) {
      toast({
        title: "فشل الحفظ",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const onStatus = async (status) => {
    if (!selectedId) return;
    setActing(true);
    try {
      await setSalesAgentSessionStatus(selectedId, status);
      toast({ title: `الحالة: ${STATUS_AR[status] || status}`, status: "success" });
      await loadDetail(selectedId);
      await load();
    } catch (err) {
      toast({
        title: "تعذر تغيير الحالة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const onAddKb = async () => {
    if (!selectedId || !kbForm.content.trim()) return;
    setActing(true);
    try {
      await addSalesAgentKnowledge(selectedId, kbForm);
      setKbForm({ title: "", kind: "note", content: "" });
      setKnowledge(await fetchSalesAgentKnowledge(selectedId));
      toast({ title: "تمت إضافة المعرفة", status: "success" });
    } catch (err) {
      toast({
        title: "فشل الإضافة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const toggleService = async () => {
    if (!service?.id) return;
    setActing(true);
    try {
      await patchWhatsAppService(service.id, { is_enabled: !service.is_enabled });
      toast({
        title: service.is_enabled ? "تم إيقاف الخدمة" : "تم تشغيل الخدمة",
        status: "success",
      });
      await load();
    } catch (err) {
      toast({
        title: "فشل التبديل",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const packagesText = useMemo(() => {
    if (!settingsForm) return "[]";
    try {
      return JSON.stringify(settingsForm.packages || [], null, 2);
    } catch {
      return "[]";
    }
  }, [settingsForm]);

  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={pageBg}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" py={6}>
      <Container maxW="7xl">
        <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={4} mb={6} wrap="wrap">
          <VStack align="start" spacing={1}>
            <HStack>
              <Box as={FaWhatsapp} color="green.500" />
              <Heading size="md" color={title}>
                وكيل المبيعات الذكي — AI Sales Agent
              </Heading>
            </HStack>
            <Text color={muted} fontSize="sm">
              جلسات متعددة مستقلة — كل Session لها رقم واتساب ومعرفة وعملاء ومتابعات خاصة
            </Text>
          </VStack>
          <HStack>
            <Button as={RouterLink} to="/admin/whatsapp/services" size="sm" variant="outline">
              ربط الأرقام
            </Button>
            <Button leftIcon={<MdRefresh />} size="sm" onClick={load} isLoading={acting}>
              تحديث
            </Button>
            {service && (
              <Button
                size="sm"
                colorScheme={service.is_enabled ? "red" : "green"}
                onClick={toggleService}
                isLoading={acting}
              >
                {service.is_enabled ? "إيقاف الخدمة" : "تشغيل الخدمة"}
              </Button>
            )}
          </HStack>
        </Flex>

        {!service?.is_enabled && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            خدمة <b>ai_sales_agent</b> غير مفعّلة. فعّلها واربط لها أرقام واتساب من صفحة الخدمات، ثم فعّل كل
            Session.
          </Alert>
        )}

        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={3} mb={6}>
          {[
            ["Sessions", overview?.sessions?.total],
            ["نشطة", overview?.sessions?.active],
            ["عملاء", overview?.leads?.total_leads],
            ["مهتمون", overview?.leads?.interested],
            ["مبيعات", overview?.leads?.won],
            ["تحويل %", overview?.conversion_rate],
          ].map(([label, value]) => (
            <Box key={label} bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="lg" p={3}>
              <Text fontSize="xs" color={muted}>
                {label}
              </Text>
              <Text fontWeight="bold" fontSize="xl">
                {value ?? 0}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={4}>
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="lg" p={4}>
            <Heading size="sm" mb={3}>
              إنشاء Session جديدة
            </Heading>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">اسم الجلسة</FormLabel>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: بيع منصة EM Lectures"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">المنتج</FormLabel>
                <Input
                  value={createForm.product_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, product_name: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">رقم واتساب (session slug)</FormLabel>
                <Select
                  placeholder="اختَر رقم"
                  value={createForm.wa_session_slug}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, wa_session_slug: e.target.value }))
                  }
                >
                  {waSessions.map((s) => {
                    const id = waSessionId(s);
                    if (!id) return null;
                    return (
                      <option key={id} value={id}>
                        {waSessionLabel(s)}
                      </option>
                    );
                  })}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">استراتيجية البيع</FormLabel>
                <Textarea
                  rows={3}
                  value={createForm.sales_instructions}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, sales_instructions: e.target.value }))
                  }
                />
              </FormControl>
              <Button colorScheme="blue" onClick={onCreate} isLoading={creating}>
                إنشاء
              </Button>
            </VStack>
          </Box>

          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="lg" p={4}>
            <Flex justify="space-between" mb={3} align="center">
              <Heading size="sm">الجلسات</Heading>
              <Select
                size="sm"
                maxW="160px"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">الكل</option>
                {Object.keys(STATUS_AR).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_AR[k]}
                  </option>
                ))}
              </Select>
            </Flex>
            <Box maxH="360px" overflowY="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>الاسم</Th>
                    <Th>الحالة</Th>
                    <Th>الرقم</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sessions.map((s) => (
                    <Tr
                      key={s.id}
                      cursor="pointer"
                      bg={selectedId === s.id ? "blue.50" : undefined}
                      onClick={() => loadDetail(s.id)}
                    >
                      <Td>
                        <Text fontWeight="semibold">{s.name}</Text>
                        <Text fontSize="xs" color={muted}>
                          {s.product_name}
                        </Text>
                        {s.last_error ? (
                          <Text fontSize="xs" color="red.500" noOfLines={2} mt={1}>
                            {s.last_error}
                          </Text>
                        ) : null}
                      </Td>
                      <Td>
                        <Badge colorScheme={STATUS_COLOR[s.status] || "gray"}>
                          {STATUS_AR[s.status] || s.status}
                        </Badge>
                      </Td>
                      <Td fontSize="xs">{s.wa_session_slug || "—"}</Td>
                    </Tr>
                  ))}
                  {!sessions.length && (
                    <Tr>
                      <Td colSpan={3}>
                        <Text color={muted}>لا توجد جلسات بعد</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </SimpleGrid>

        {detail?.session && settingsForm && (
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="lg" p={4}>
            <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
              <VStack align="start" spacing={0}>
                <Heading size="sm">{detail.session.name}</Heading>
                <Text fontSize="sm" color={muted}>
                  تحويل {detail.stats?.conversion_rate ?? 0}% · عملاء {detail.stats?.total_leads ?? 0} ·
                  متابعات مستحقة {detail.stats?.followups_due ?? 0}
                </Text>
                {detail.session.last_error ? (
                  <Alert status="error" mt={2} borderRadius="md" py={2}>
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="semibold" fontSize="sm">
                        آخر خطأ
                      </Text>
                      <Text fontSize="sm">{detail.session.last_error}</Text>
                    </Box>
                  </Alert>
                ) : null}
              </VStack>
              <HStack>
                <Button size="sm" colorScheme="green" onClick={() => onStatus("active")} isLoading={acting}>
                  تشغيل
                </Button>
                <Button size="sm" onClick={() => onStatus("paused")} isLoading={acting}>
                  إيقاف
                </Button>
                <Button size="sm" variant="outline" onClick={() => onStatus("archived")} isLoading={acting}>
                  أرشفة
                </Button>
              </HStack>
            </Flex>

            <Tabs variant="enclosed" colorScheme="blue">
              <TabList flexWrap="wrap">
                <Tab>الإعدادات</Tab>
                <Tab>المعرفة</Tab>
                <Tab>العملاء</Tab>
                <Tab>المحادثة</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {[
                      ["name", "اسم الـ Agent"],
                      ["product_name", "المنتج"],
                      ["dialect", "اللهجة"],
                      ["tone", "الأسلوب"],
                      ["formality", "الرسمية"],
                      ["demo_url", "رابط الديمو"],
                      ["signup_url", "رابط الاشتراك"],
                    ].map(([key, label]) => (
                      <FormControl key={key}>
                        <FormLabel fontSize="sm">{label}</FormLabel>
                        <Input
                          value={settingsForm[key] || ""}
                          onChange={(e) =>
                            setSettingsForm((f) => ({ ...f, [key]: e.target.value }))
                          }
                        />
                      </FormControl>
                    ))}
                    <FormControl>
                      <FormLabel fontSize="sm">رقم واتساب</FormLabel>
                      <Select
                        value={settingsForm.wa_session_slug || ""}
                        onChange={(e) =>
                          setSettingsForm((f) => ({ ...f, wa_session_slug: e.target.value }))
                        }
                      >
                        <option value="">—</option>
                        {waSessions.map((s) => {
                          const id = waSessionId(s);
                          if (!id) return null;
                          return (
                            <option key={id} value={id}>
                              {waSessionLabel(s)}
                            </option>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                  <FormControl mt={3}>
                    <FormLabel fontSize="sm">وصف المنتج</FormLabel>
                    <Textarea
                      rows={2}
                      value={settingsForm.product_description || ""}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, product_description: e.target.value }))
                      }
                    />
                  </FormControl>
                  <FormControl mt={3}>
                    <FormLabel fontSize="sm">استراتيجية البيع</FormLabel>
                    <Textarea
                      rows={4}
                      value={settingsForm.sales_instructions || ""}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, sales_instructions: e.target.value }))
                      }
                    />
                  </FormControl>
                  <FormControl mt={3}>
                    <FormLabel fontSize="sm">تعليمات عامة</FormLabel>
                    <Textarea
                      rows={3}
                      value={settingsForm.general_instructions || ""}
                      onChange={(e) =>
                        setSettingsForm((f) => ({ ...f, general_instructions: e.target.value }))
                      }
                    />
                  </FormControl>
                  <FormControl mt={3}>
                    <FormLabel fontSize="sm">الباقات (JSON)</FormLabel>
                    <Textarea
                      rows={5}
                      fontFamily="mono"
                      defaultValue={packagesText}
                      key={`pkg-${settingsForm.id}-${settingsForm.updated_at}`}
                      onBlur={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value || "[]");
                          setSettingsForm((f) => ({ ...f, packages: parsed }));
                        } catch {
                          toast({ title: "JSON الباقات غير صالح", status: "warning" });
                        }
                      }}
                    />
                  </FormControl>
                  <Button mt={4} colorScheme="blue" onClick={onSaveSettings} isLoading={acting}>
                    حفظ الإعدادات
                  </Button>
                </TabPanel>

                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack align="stretch" spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="sm">عنوان</FormLabel>
                        <Input
                          value={kbForm.title}
                          onChange={(e) => setKbForm((f) => ({ ...f, title: e.target.value }))}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">النوع</FormLabel>
                        <Select
                          value={kbForm.kind}
                          onChange={(e) => setKbForm((f) => ({ ...f, kind: e.target.value }))}
                        >
                          {[
                            "note",
                            "faq",
                            "product",
                            "pricing",
                            "offer",
                            "terms",
                            "objection",
                            "instruction",
                            "url",
                          ].map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">المحتوى</FormLabel>
                        <Textarea
                          rows={6}
                          value={kbForm.content}
                          onChange={(e) => setKbForm((f) => ({ ...f, content: e.target.value }))}
                        />
                      </FormControl>
                      <Button onClick={onAddKb} isLoading={acting} colorScheme="teal">
                        إضافة للمعرفة
                      </Button>
                    </VStack>
                    <Box maxH="420px" overflowY="auto">
                      {knowledge.map((doc) => (
                        <Box key={doc.id} borderWidth="1px" borderColor={border} borderRadius="md" p={3} mb={2}>
                          <Flex justify="space-between" gap={2}>
                            <Box>
                              <Badge mr={2}>{doc.kind}</Badge>
                              <Text fontWeight="semibold" display="inline">
                                {doc.title || "بدون عنوان"}
                              </Text>
                              <Text fontSize="sm" color={muted} noOfLines={3} mt={1}>
                                {doc.content}
                              </Text>
                            </Box>
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={async () => {
                                await deleteSalesAgentKnowledge(selectedId, doc.id);
                                setKnowledge(await fetchSalesAgentKnowledge(selectedId));
                              }}
                            >
                              حذف
                            </Button>
                          </Flex>
                        </Box>
                      ))}
                      {!knowledge.length && <Text color={muted}>قاعدة المعرفة فارغة</Text>}
                    </Box>
                  </SimpleGrid>
                </TabPanel>

                <TabPanel>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>العميل</Th>
                        <Th>المرحلة</Th>
                        <Th>اهتمام</Th>
                        <Th>آخر تواصل</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {leads.map((l) => (
                        <Tr
                          key={l.id}
                          cursor="pointer"
                          bg={selectedLeadId === l.id ? "green.50" : undefined}
                          onClick={() => openLead(l.id)}
                        >
                          <Td>
                            <Text fontWeight="semibold">{l.contact_name || "بدون اسم"}</Text>
                            <Text fontSize="xs" color={muted}>
                              {l.contact_phone}
                            </Text>
                          </Td>
                          <Td>{l.stage}</Td>
                          <Td>{l.interest_score}</Td>
                          <Td fontSize="xs">{formatWhen(l.last_contact_at)}</Td>
                        </Tr>
                      ))}
                      {!leads.length && (
                        <Tr>
                          <Td colSpan={4}>
                            <Text color={muted}>لا يوجد عملاء بعد</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TabPanel>

                <TabPanel>
                  {!leadDetail ? (
                    <Text color={muted}>اختَر عميلاً من تبويب العملاء</Text>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Heading size="xs" mb={2}>
                          بيانات العميل
                        </Heading>
                        <Text fontSize="sm">المرحلة: {leadDetail.lead.stage}</Text>
                        <Text fontSize="sm">الاحتياج: {leadDetail.lead.needs || "—"}</Text>
                        <Text fontSize="sm">الملخص: {leadDetail.lead.context_summary || "—"}</Text>
                        <HStack mt={3}>
                          <Button
                            size="sm"
                            onClick={async () => {
                              await setSalesAgentLeadAi(
                                selectedId,
                                leadDetail.lead.id,
                                !leadDetail.lead.ai_enabled,
                              );
                              await openLead(leadDetail.lead.id);
                            }}
                          >
                            {leadDetail.lead.ai_enabled ? "إيقاف AI" : "تشغيل AI"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await createSalesAgentFollowup(selectedId, leadDetail.lead.id, {
                                hours_from_now: 24,
                                reason: "manual_admin",
                              });
                              toast({ title: "تمت جدولة متابعة خلال 24 ساعة", status: "success" });
                            }}
                          >
                            متابعة بعد 24س
                          </Button>
                          <Select
                            size="sm"
                            maxW="180px"
                            value={leadDetail.lead.stage}
                            onChange={async (e) => {
                              await updateSalesAgentLead(selectedId, leadDetail.lead.id, {
                                stage: e.target.value,
                              });
                              await openLead(leadDetail.lead.id);
                            }}
                          >
                            {(detail.session.custom_stages || []).map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </Select>
                        </HStack>
                        <Divider my={3} />
                        <Heading size="xs" mb={2}>
                          إجراءات AI
                        </Heading>
                        <VStack align="stretch" maxH="200px" overflowY="auto" spacing={1}>
                          {(leadDetail.actions || []).map((a) => (
                            <Text key={a.id} fontSize="xs" color={muted}>
                              {formatWhen(a.created_at)} — {a.action_type}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                      <Box>
                        <Heading size="xs" mb={2}>
                          الرسائل
                        </Heading>
                        <VStack
                          align="stretch"
                          spacing={2}
                          maxH="420px"
                          overflowY="auto"
                          borderWidth="1px"
                          borderColor={border}
                          borderRadius="md"
                          p={3}
                        >
                          {(leadDetail.messages || []).map((m, idx) => (
                            <Box
                              key={m.id || idx}
                              alignSelf={m.direction === "outbound" ? "flex-end" : "flex-start"}
                              bg={m.direction === "outbound" ? "green.100" : "gray.100"}
                              px={3}
                              py={2}
                              borderRadius="lg"
                              maxW="90%"
                            >
                              <Text fontSize="sm" whiteSpace="pre-wrap">
                                {m.body}
                              </Text>
                              <Text fontSize="10px" color={muted}>
                                {formatWhen(m.at || m.created_at || m.processed_at)}
                              </Text>
                            </Box>
                          ))}
                          {!(leadDetail.messages || []).length && (
                            <Text color={muted}>لا رسائل محفوظة بعد</Text>
                          )}
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        )}
      </Container>
    </Box>
  );
}
