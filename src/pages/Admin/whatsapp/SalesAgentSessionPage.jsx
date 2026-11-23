import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { MdArrowForward, MdExpandLess, MdExpandMore, MdRefresh, MdSettings, MdMenuBook } from "react-icons/md";
import {
  addSalesAgentKnowledge,
  createSalesAgentFollowup,
  deleteSalesAgentKnowledge,
  fetchSalesAgentKnowledge,
  fetchSalesAgentLead,
  fetchSalesAgentLeads,
  fetchSalesAgentSession,
  fetchWhatsAppSessions,
  setSalesAgentLeadAi,
  setSalesAgentSessionStatus,
  updateSalesAgentLead,
  updateSalesAgentSession,
} from "../../../api/whatsappAdminApi";
import { WaPageShell, WaLoading, WaStatRow, WaEmptyState } from "../../../components/whatsapp/ui";

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

function waSessionId(s) {
  return String(s?.id || s?.slug || "").trim();
}

function waSessionLabel(s) {
  const id = waSessionId(s);
  const phone = s?.phone_number ? ` (${s.phone_number})` : "";
  const status = s?.status ? ` — ${s.status}` : "";
  return `${id}${phone}${status}`;
}

function CollapsibleSection({ title, icon, isOpen, onToggle, children }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box border="1px solid" borderColor={border} borderRadius="xl" overflow="hidden" bg={useColorModeValue("white", "gray.800")}>
      <Button
        variant="ghost"
        w="100%"
        justifyContent="space-between"
        borderRadius={0}
        h="auto"
        py={3}
        px={4}
        onClick={onToggle}
        rightIcon={isOpen ? <MdExpandLess /> : <MdExpandMore />}
        leftIcon={icon}
      >
        <Text flex="1" textAlign="right" fontWeight="700">
          {title}
        </Text>
        <Text fontSize="xs" color={muted} me={2}>
          {isOpen ? "إخفاء" : "إظهار"}
        </Text>
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Box px={4} pb={4} pt={1} borderTop="1px solid" borderColor={border}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function SalesAgentSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const threadEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [settingsForm, setSettingsForm] = useState(null);
  const [knowledge, setKnowledge] = useState([]);
  const [leads, setLeads] = useState([]);
  const [waSessions, setWaSessions] = useState([]);
  const [leadDetail, setLeadDetail] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [kbForm, setKbForm] = useState({ title: "", kind: "note", content: "" });
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const listHover = useColorModeValue("gray.50", "whiteAlpha.50");
  const listActive = useColorModeValue("green.50", "whiteAlpha.100");
  const inboundBg = useColorModeValue("white", "gray.700");
  const outboundBg = useColorModeValue("green.100", "green.800");
  const chatBg = useColorModeValue("#e5ddd5", "gray.900");

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [dash, kb, leadList, wa] = await Promise.all([
        fetchSalesAgentSession(sessionId),
        fetchSalesAgentKnowledge(sessionId),
        fetchSalesAgentLeads(sessionId, { limit: 200 }),
        fetchWhatsAppSessions().catch(() => []),
      ]);
      setDetail(dash);
      setSettingsForm(dash?.session || null);
      setKnowledge(kb || []);
      setLeads(leadList?.rows || []);
      setWaSessions(Array.isArray(wa) ? wa : wa?.sessions || wa?.rows || []);
    } catch (err) {
      toast({
        title: "تعذر فتح الجلسة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
      navigate("/admin/whatsapp/sales-agent");
    } finally {
      setLoading(false);
    }
  }, [sessionId, toast, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const openLead = useCallback(
    async (leadId) => {
      if (!sessionId || !leadId) return;
      setSelectedLeadId(leadId);
      setLeadLoading(true);
      try {
        const data = await fetchSalesAgentLead(sessionId, leadId);
        setLeadDetail(data);
      } catch (err) {
        toast({
          title: "تعذر فتح المحادثة",
          description: err?.response?.data?.message || err.message,
          status: "error",
        });
      } finally {
        setLeadLoading(false);
      }
    },
    [sessionId, toast],
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [leadDetail?.messages?.length, selectedLeadId]);

  const packagesText = useMemo(() => {
    if (!settingsForm) return "[]";
    try {
      return JSON.stringify(settingsForm.packages || [], null, 2);
    } catch {
      return "[]";
    }
  }, [settingsForm]);

  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      `${l.contact_name || ""} ${l.contact_phone || ""} ${l.stage || ""}`.toLowerCase().includes(q),
    );
  }, [leads, leadSearch]);

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
    if (!sessionId) return;
    setActing(true);
    try {
      await setSalesAgentSessionStatus(sessionId, status);
      toast({ title: `الحالة: ${STATUS_AR[status] || status}`, status: "success" });
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
    if (!sessionId || !kbForm.content.trim()) return;
    setActing(true);
    try {
      await addSalesAgentKnowledge(sessionId, kbForm);
      setKbForm({ title: "", kind: "note", content: "" });
      setKnowledge(await fetchSalesAgentKnowledge(sessionId));
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

  if (loading) {
    return <WaLoading label="جارٍ فتح الجلسة…" />;
  }

  const session = detail?.session;
  if (!session || !settingsForm) {
    return (
      <WaPageShell title="الجلسة غير موجودة" showAdminNav>
        <WaEmptyState title="لا توجد جلسة" description="ارجع لقائمة وكيل المبيعات." />
        <Button as={RouterLink} to="/admin/whatsapp/sales-agent" mt={4}>
          العودة
        </Button>
      </WaPageShell>
    );
  }

  const lead = leadDetail?.lead;

  return (
    <WaPageShell
      title={session.name}
      description={`${session.product_name || "—"} · واتساب ${session.wa_session_slug || "غير مربوط"}`}
      showAdminNav
      maxW="1400px"
      actions={
        <HStack wrap="wrap">
          <Button
            as={RouterLink}
            to="/admin/whatsapp/sales-agent"
            size="sm"
            variant="outline"
            leftIcon={<MdArrowForward />}
          >
            كل الجلسات
          </Button>
          <Button leftIcon={<MdRefresh />} size="sm" variant="outline" onClick={() => void load()} isLoading={acting}>
            تحديث
          </Button>
          <Badge colorScheme={STATUS_COLOR[session.status] || "gray"} fontSize="sm" px={3} py={1} borderRadius="full">
            {STATUS_AR[session.status] || session.status}
          </Badge>
          <Button size="sm" colorScheme="green" onClick={() => void onStatus("active")} isLoading={acting}>
            تشغيل
          </Button>
          <Button size="sm" onClick={() => void onStatus("paused")} isLoading={acting}>
            إيقاف
          </Button>
          <Button size="sm" variant="outline" onClick={() => void onStatus("archived")} isLoading={acting}>
            أرشفة
          </Button>
        </HStack>
      }
      alert={
        session.last_error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold" fontSize="sm">
                آخر خطأ
              </Text>
              <Text fontSize="sm">{session.last_error}</Text>
            </Box>
          </Alert>
        ) : null
      }
    >
      <WaStatRow
        columns={{ base: 2, md: 3, lg: 6 }}
        items={[
          { label: "عملاء", value: detail.stats?.total_leads ?? leads.length },
          { label: "محتملون", value: detail.stats?.potential ?? detail.stats?.open_leads ?? 0 },
          { label: "مهتمون", value: detail.stats?.interested ?? 0 },
          { label: "يحتاج بشر", value: detail.stats?.needs_human ?? 0 },
          { label: "مبيعات", value: detail.stats?.won ?? 0 },
          { label: "تحويل %", value: detail.stats?.conversion_rate ?? 0 },
        ]}
      />

      {/* Inbox-style: leads + chat */}
      <Flex
        gap={4}
        align="stretch"
        direction={{ base: "column", lg: "row" }}
        minH={{ lg: "68vh" }}
        mt={4}
      >
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={border}
          borderRadius="xl"
          w={{ base: "100%", lg: "340px" }}
          flexShrink={0}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Box p={3} borderBottom="1px solid" borderColor={border}>
            <Text fontWeight="800" mb={2}>
              العملاء ({filteredLeads.length})
            </Text>
            <Input
              size="sm"
              placeholder="بحث بالاسم أو الرقم…"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
            />
          </Box>
          <Box flex="1" overflowY="auto" maxH={{ base: "40vh", lg: "none" }}>
            {filteredLeads.map((l) => {
              const active = l.id === selectedLeadId;
              return (
                <Box
                  key={l.id}
                  as="button"
                  w="100%"
                  textAlign="right"
                  px={3}
                  py={3}
                  borderBottom="1px solid"
                  borderColor={border}
                  bg={active ? listActive : "transparent"}
                  _hover={{ bg: active ? listActive : listHover }}
                  onClick={() => void openLead(l.id)}
                >
                  <Flex justify="space-between" gap={2} mb={1}>
                    <Text fontWeight="700" noOfLines={1}>
                      {l.contact_name || "بدون اسم"}
                    </Text>
                    <Text fontSize="10px" color={muted} flexShrink={0}>
                      {l.last_contact_at ? formatWhen(l.last_contact_at) : ""}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color={muted} dir="ltr" textAlign="right" noOfLines={1}>
                    {l.contact_phone || "—"}
                  </Text>
                  <HStack mt={1} spacing={2} flexWrap="wrap">
                    <Badge fontSize="9px">{l.stage || "—"}</Badge>
                    <Text fontSize="10px" color={muted}>
                      اهتمام {l.interest_score ?? "—"}
                    </Text>
                    {(l.last_action === "escalate_human" ||
                      l.last_action === "needs_human" ||
                      l.memory?.needs_human) && (
                      <Badge fontSize="9px" colorScheme="orange">
                        يحتاج بشر
                      </Badge>
                    )}
                    {Number(l.interest_score || 0) >= 40 && (
                      <Badge fontSize="9px" colorScheme="green" variant="subtle">
                        مهتم
                      </Badge>
                    )}
                  </HStack>
                </Box>
              );
            })}
            {!filteredLeads.length && (
              <Text color={muted} textAlign="center" py={10} px={3}>
                لا يوجد عملاء بعد
              </Text>
            )}
          </Box>
        </Box>

        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={border}
          borderRadius="xl"
          flex="1"
          display="flex"
          flexDirection="column"
          minH={{ base: "55vh", lg: "68vh" }}
          overflow="hidden"
        >
          {!selectedLeadId ? (
            <Flex flex="1" align="center" justify="center" p={6} direction="column" gap={2}>
              <Text color={muted} fontWeight="600">
                اختَر عميلاً لفتح المحادثة
              </Text>
              <Text fontSize="sm" color={muted}>
                الشات يظهر مباشرة مثل واتساب
              </Text>
            </Flex>
          ) : leadLoading && !leadDetail ? (
            <Flex flex="1" align="center" justify="center">
              <Spinner />
            </Flex>
          ) : !lead ? (
            <Flex flex="1" align="center" justify="center">
              <Text color={muted}>تعذر تحميل المحادثة</Text>
            </Flex>
          ) : (
            <>
              <Flex
                px={4}
                py={3}
                borderBottom="1px solid"
                borderColor={border}
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={2}
              >
                <Box>
                  <HStack spacing={2} mb={1} flexWrap="wrap">
                    <Text fontWeight="800">{lead.contact_name || "بدون اسم"}</Text>
                    <Badge>{lead.stage}</Badge>
                    <Badge variant="subtle">اهتمام {lead.interest_score ?? 0}</Badge>
                    {(lead.last_action === "escalate_human" ||
                      lead.last_action === "needs_human" ||
                      lead.memory?.needs_human) && (
                      <Badge colorScheme="orange">يحتاج بشر</Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color={muted} dir="ltr">
                    {lead.contact_phone || "—"}
                  </Text>
                </Box>
                <HStack wrap="wrap">
                  <Button
                    size="xs"
                    colorScheme={lead.ai_enabled ? "orange" : "green"}
                    variant="outline"
                    onClick={async () => {
                      await setSalesAgentLeadAi(sessionId, lead.id, !lead.ai_enabled);
                      await openLead(lead.id);
                    }}
                  >
                    {lead.ai_enabled ? "إيقاف AI" : "تشغيل AI"}
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={async () => {
                      await createSalesAgentFollowup(sessionId, lead.id, {
                        hours_from_now: 24,
                        reason: "manual_admin",
                      });
                      toast({ title: "تمت جدولة متابعة خلال 24 ساعة", status: "success" });
                    }}
                  >
                    متابعة 24س
                  </Button>
                  <Select
                    size="xs"
                    maxW="150px"
                    value={lead.stage}
                    onChange={async (e) => {
                      await updateSalesAgentLead(sessionId, lead.id, { stage: e.target.value });
                      await openLead(lead.id);
                      await load();
                    }}
                  >
                    {(session.custom_stages || []).map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </HStack>
              </Flex>

              {(lead.needs || lead.context_summary) && (
                <Box px={4} py={2} borderBottom="1px solid" borderColor={border} bg={listHover}>
                  {lead.needs ? (
                    <Text fontSize="xs" color={muted}>
                      الاحتياج: {lead.needs}
                    </Text>
                  ) : null}
                  {lead.context_summary ? (
                    <Text fontSize="xs" color={muted} noOfLines={2}>
                      الملخص: {lead.context_summary}
                    </Text>
                  ) : null}
                </Box>
              )}

              <Box flex="1" overflowY="auto" px={4} py={3} bg={chatBg}>
                {!(leadDetail.messages || []).length ? (
                  <Text color={muted} textAlign="center" py={10}>
                    لا رسائل محفوظة بعد
                  </Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {(leadDetail.messages || []).map((m, idx) => {
                      const inbound = m.direction === "inbound";
                      return (
                        <Flex key={m.id || idx} justify={inbound ? "flex-start" : "flex-end"}>
                          <Box
                            maxW="85%"
                            bg={inbound ? inboundBg : outboundBg}
                            borderRadius="lg"
                            px={3}
                            py={2}
                            shadow="sm"
                          >
                            <Text whiteSpace="pre-wrap" fontSize="sm">
                              {m.body}
                            </Text>
                            <Text fontSize="10px" color={muted} mt={1} textAlign={inbound ? "left" : "right"}>
                              {formatWhen(m.at || m.created_at || m.processed_at)}
                            </Text>
                          </Box>
                        </Flex>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </VStack>
                )}
              </Box>

              {(leadDetail.actions || []).length > 0 && (
                <Box px={3} py={2} borderTop="1px solid" borderColor={border} maxH="80px" overflowY="auto">
                  <Text fontSize="10px" color={muted} mb={1}>
                    إجراءات AI
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {(leadDetail.actions || []).slice(0, 8).map((a) => (
                      <Badge key={a.id} variant="subtle" fontSize="9px">
                        {a.action_type}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </>
          )}
        </Box>
      </Flex>

      {/* Settings & knowledge — hidden by default */}
      <VStack align="stretch" spacing={3} mt={4}>
        <CollapsibleSection
          title="إعدادات الجلسة"
          icon={<MdSettings />}
          isOpen={showSettings}
          onToggle={() => setShowSettings((v) => !v)}
        >
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
                  onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </FormControl>
            ))}
            <FormControl>
              <FormLabel fontSize="sm">رقم واتساب</FormLabel>
              <Select
                value={settingsForm.wa_session_slug || ""}
                onChange={(e) => setSettingsForm((f) => ({ ...f, wa_session_slug: e.target.value }))}
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
              onChange={(e) => setSettingsForm((f) => ({ ...f, product_description: e.target.value }))}
            />
          </FormControl>
          <FormControl mt={3}>
            <FormLabel fontSize="sm">استراتيجية البيع</FormLabel>
            <Textarea
              rows={4}
              value={settingsForm.sales_instructions || ""}
              onChange={(e) => setSettingsForm((f) => ({ ...f, sales_instructions: e.target.value }))}
            />
          </FormControl>
          <FormControl mt={3}>
            <FormLabel fontSize="sm">تعليمات عامة</FormLabel>
            <Textarea
              rows={3}
              value={settingsForm.general_instructions || ""}
              onChange={(e) => setSettingsForm((f) => ({ ...f, general_instructions: e.target.value }))}
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
          <Button mt={4} colorScheme="blue" onClick={() => void onSaveSettings()} isLoading={acting}>
            حفظ الإعدادات
          </Button>
        </CollapsibleSection>

        <CollapsibleSection
          title="قاعدة المعرفة"
          icon={<MdMenuBook />}
          isOpen={showKnowledge}
          onToggle={() => setShowKnowledge((v) => !v)}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">عنوان</FormLabel>
                <Input value={kbForm.title} onChange={(e) => setKbForm((f) => ({ ...f, title: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">النوع</FormLabel>
                <Select value={kbForm.kind} onChange={(e) => setKbForm((f) => ({ ...f, kind: e.target.value }))}>
                  {["note", "faq", "product", "pricing", "offer", "terms", "objection", "instruction", "url"].map(
                    (k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ),
                  )}
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
              <Button onClick={() => void onAddKb()} isLoading={acting} colorScheme="teal">
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
                        await deleteSalesAgentKnowledge(sessionId, doc.id);
                        setKnowledge(await fetchSalesAgentKnowledge(sessionId));
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
        </CollapsibleSection>
      </VStack>
    </WaPageShell>
  );
}
