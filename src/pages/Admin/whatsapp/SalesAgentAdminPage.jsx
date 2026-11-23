import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
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
import { useNavigate } from "react-router-dom";
import { MdRefresh } from "react-icons/md";
import {
  createSalesAgentSession,
  fetchSalesAgentOverview,
  fetchSalesAgentSessions,
  fetchWhatsAppServices,
  fetchWhatsAppSessions,
  patchWhatsAppService,
} from "../../../api/whatsappAdminApi";
import { WaPageShell, WaCard, WaLoading, WaStatRow } from "../../../components/whatsapp/ui";

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [waSessions, setWaSessions] = useState([]);
  const [service, setService] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [acting, setActing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("green.50", "whiteAlpha.100");

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
    void load();
  }, [load]);

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
      if (created?.id) {
        navigate(`/admin/whatsapp/sales-agent/${created.id}`);
        return;
      }
      await load();
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

  if (loading) {
    return <WaLoading label="جارٍ تحميل وكيل المبيعات…" />;
  }

  return (
    <WaPageShell
      title="وكيل المبيعات الذكي — AI Sales Agent"
      description="اختَر جلسة لفتح صفحة كاملة: العملاء والشات أولاً، والإعدادات والمعرفة عند الحاجة"
      showAdminNav
      maxW="7xl"
      actions={
        <HStack wrap="wrap">
          <Button leftIcon={<MdRefresh />} size="sm" variant="outline" onClick={() => void load()} isLoading={acting}>
            تحديث
          </Button>
          {service && (
            <Button
              size="sm"
              colorScheme={service.is_enabled ? "red" : "green"}
              onClick={() => void toggleService()}
              isLoading={acting}
            >
              {service.is_enabled ? "إيقاف الخدمة" : "تشغيل الخدمة"}
            </Button>
          )}
        </HStack>
      }
      alert={
        !service?.is_enabled ? (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            خدمة <b>ai_sales_agent</b> غير مفعّلة. فعّلها واربط لها أرقام واتساب من صفحة الخدمات، ثم فعّل كل
            Session.
          </Alert>
        ) : null
      }
    >
      <Box mb={6}>
        <WaStatRow
          columns={{ base: 2, md: 4, lg: 7 }}
          items={[
            { label: "Sessions", value: overview?.sessions?.total ?? 0 },
            { label: "نشطة", value: overview?.sessions?.active ?? 0 },
            { label: "محتملون", value: overview?.leads?.potential ?? overview?.leads?.open_leads ?? 0 },
            { label: "مهتمون", value: overview?.leads?.interested ?? 0 },
            { label: "يحتاج بشر", value: overview?.leads?.needs_human ?? 0 },
            { label: "مبيعات", value: overview?.leads?.won ?? 0 },
            { label: "تحويل %", value: overview?.conversion_rate ?? 0 },
          ]}
        />
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <WaCard title="إنشاء Session جديدة">
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
                onChange={(e) => setCreateForm((f) => ({ ...f, wa_session_slug: e.target.value }))}
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
                onChange={(e) => setCreateForm((f) => ({ ...f, sales_instructions: e.target.value }))}
              />
            </FormControl>
            <Button colorScheme="blue" onClick={() => void onCreate()} isLoading={creating}>
              إنشاء وفتح الجلسة
            </Button>
          </VStack>
        </WaCard>

        <WaCard
          title="الجلسات"
          description="اضغط على أي جلسة لفتح صفحة العملاء والشات"
          actions={
            <Select size="sm" maxW="160px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">الكل</option>
              {Object.keys(STATUS_AR).map((k) => (
                <option key={k} value={k}>
                  {STATUS_AR[k]}
                </option>
              ))}
            </Select>
          }
        >
          <Box maxH="420px" overflowY="auto">
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
                    _hover={{ bg: rowHover }}
                    onClick={() => navigate(`/admin/whatsapp/sales-agent/${s.id}`)}
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
        </WaCard>
      </SimpleGrid>
    </WaPageShell>
  );
}
