import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  FaFacebookF,
  FaInstagram,
  FaLink,
  FaUnlink,
  FaCalendarAlt,
  FaCog,
  FaList,
  FaRedo,
  FaPaperPlane,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import baseUrl from "../../api/baseUrl";

const STATUS_LABELS = {
  draft: "مسودة",
  pending_approval: "بانتظار الموافقة",
  approved: "موافق عليه",
  scheduled: "مجدول",
  queued: "في الطابور",
  publishing: "جارٍ النشر",
  published: "منشور",
  partial: "منشور جزئيًا",
  failed: "فشل",
  cancelled: "ملغي",
};

const STATUS_COLORS = {
  draft: "gray",
  pending_approval: "orange",
  approved: "blue",
  scheduled: "purple",
  queued: "cyan",
  publishing: "yellow",
  published: "green",
  partial: "teal",
  failed: "red",
  cancelled: "gray",
};

const DAY_LABELS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (error?.message) return error.message;
  return "حدث خطأ غير متوقع";
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const SocialPublishingHub = ({ authHeaders, initialSection = "connections" }) => {
  const toast = useToast();
  const [section, setSection] = useState(initialSection);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [targets, setTargets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const disconnectRef = React.useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [disconnectTarget, setDisconnectTarget] = useState(null);

  const panelBg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const ink = useColorModeValue("gray.900", "gray.100");
  const pageBg = useColorModeValue("#f7f7f8", "gray.900");
  const chipBg = useColorModeValue("gray.50", "gray.750");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, connRes, postsRes, settingsRes, logsRes] = await Promise.all([
        baseUrl.get("/api/teacher/social-publishing/dashboard", { headers: authHeaders }),
        baseUrl.get("/api/teacher/social-publishing/connections", { headers: authHeaders }),
        baseUrl.get("/api/teacher/social-publishing/posts?limit=100", { headers: authHeaders }),
        baseUrl.get("/api/teacher/social-publishing/settings", { headers: authHeaders }),
        baseUrl.get("/api/teacher/social-publishing/logs?limit=40", { headers: authHeaders }),
      ]);
      setDashboard(dashRes.data?.data || null);
      setTargets(connRes.data?.data?.targets || []);
      setConnections(connRes.data?.data?.connections || []);
      setConfigured(!!connRes.data?.data?.configured);
      setPosts(postsRes.data?.data || []);
      setSettings(settingsRes.data?.data || null);
      setLogs(logsRes.data?.data || []);
    } catch (error) {
      toast({
        title: "تعذر تحميل بيانات النشر",
        description: getErrorMessage(error),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      toast({
        title: "تم ربط الحسابات",
        description: `تم اكتشاف ${params.get("accounts") || ""} حساب/صفحة`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      params.delete("connected");
      params.delete("accounts");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
      setSection("connections");
    }
    if (params.get("error")) {
      toast({
        title: "فشل الربط",
        description: params.get("detail") || params.get("error"),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      params.delete("error");
      params.delete("detail");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
    }
  }, [toast]);

  const connectMeta = async () => {
    try {
      setConnecting(true);
      const { data } = await baseUrl.get("/api/teacher/social-publishing/connect", {
        headers: authHeaders,
      });
      if (data?.data?.url) {
        window.location.href = data.data.url;
        return;
      }
      throw new Error("رابط الربط غير متاح");
    } catch (error) {
      toast({
        title: "تعذر بدء الربط",
        description: getErrorMessage(error),
        status: "error",
        isClosable: true,
      });
    } finally {
      setConnecting(false);
    }
  };

  const confirmDisconnect = (target) => {
    setDisconnectTarget(target);
    onOpen();
  };

  const doDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      setSaving(true);
      await baseUrl.delete(`/api/teacher/social-publishing/targets/${disconnectTarget.id}`, {
        headers: authHeaders,
      });
      toast({ title: "تم فصل الحساب", status: "success", duration: 2500 });
      onClose();
      await loadAll();
    } catch (error) {
      toast({ title: getErrorMessage(error), status: "error", isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    try {
      await baseUrl.post(
        `/api/teacher/social-publishing/targets/${id}/default`,
        {},
        { headers: authHeaders },
      );
      await loadAll();
    } catch (error) {
      toast({ title: getErrorMessage(error), status: "error" });
    }
  };

  const saveSettings = async (patch) => {
    try {
      setSaving(true);
      const { data } = await baseUrl.put("/api/teacher/social-publishing/settings", patch, {
        headers: authHeaders,
      });
      setSettings(data?.data || patch);
      toast({ title: "تم حفظ الإعدادات", status: "success", duration: 2000 });
    } catch (error) {
      toast({ title: getErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const runPostAction = async (postId, action, body) => {
    try {
      setSaving(true);
      const path =
        action === "delete"
          ? `/api/teacher/social-publishing/posts/${postId}`
          : `/api/teacher/social-publishing/posts/${postId}/${action}`;
      if (action === "delete") {
        await baseUrl.delete(path, { headers: authHeaders });
      } else {
        await baseUrl.post(path, body || {}, { headers: authHeaders });
      }
      toast({ title: "تمت العملية", status: "success", duration: 2000 });
      setSelectedPost(null);
      await loadAll();
    } catch (error) {
      toast({ title: getErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateSelectedCaption = async () => {
    if (!selectedPost) return;
    try {
      setSaving(true);
      await baseUrl.patch(
        `/api/teacher/social-publishing/posts/${selectedPost.id}`,
        { caption: selectedPost.caption },
        { headers: authHeaders },
      );
      toast({ title: "تم تحديث الكابشن", status: "success", duration: 2000 });
      await loadAll();
    } catch (error) {
      toast({ title: getErrorMessage(error), status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const calendarPosts = useMemo(() => {
    const map = {};
    for (const p of posts) {
      const d = new Date(p.scheduled_at || p.created_at);
      const key = d.toISOString().slice(0, 10);
      (map[key] ||= []).push(p);
    }
    return map;
  }, [posts]);

  const calendarDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, []);

  const navItems = [
    { id: "connections", label: "الحسابات", icon: FaLink },
    { id: "calendar", label: "التقويم", icon: FaCalendarAlt },
    { id: "posts", label: "البوستات", icon: FaList },
    { id: "approval", label: "الموافقة", icon: FaCheck },
    { id: "settings", label: "الإعدادات", icon: FaCog },
  ];

  if (loading && !dashboard) {
    return (
      <CenterSpinner />
    );
  }

  return (
    <Box h="full" minH={0} display="flex" flexDirection="column" bg={pageBg} dir="rtl">
      <Flex
        px={{ base: 3, md: 4 }}
        py={2}
        borderBottomWidth="1px"
        borderColor={borderColor}
        bg={panelBg}
        align="center"
        gap={2}
        overflowX="auto"
        flexShrink={0}
      >
        {navItems.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={section === item.id ? "solid" : "ghost"}
            colorScheme={section === item.id ? "blue" : "gray"}
            leftIcon={<Icon as={item.icon} />}
            onClick={() => setSection(item.id)}
            borderRadius="lg"
            flexShrink={0}
          >
            {item.label}
          </Button>
        ))}
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          size="sm"
          variant="ghost"
          onClick={loadAll}
          ms="auto"
        />
      </Flex>

      <Box flex={1} minH={0} overflowY="auto" p={{ base: 3, md: 4 }}>
        {section === "connections" && (
          <VStack align="stretch" spacing={4}>
            <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4}>
              <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                <Box>
                  <Text fontWeight="bold" color={ink}>
                    حسابات السوشيال ميديا المرتبطة
                  </Text>
                  <Text fontSize="sm" color={muted} mt={1}>
                    اربط صفحات فيسبوك وحسابات إنستجرام الاحترافية عبر Meta OAuth الرسمي.
                  </Text>
                  {!configured && (
                    <Text fontSize="sm" color="orange.500" mt={2}>
                      Meta App غير مُعد على السيرفر — أضف META_APP_ID و META_APP_SECRET.
                    </Text>
                  )}
                </Box>
                <HStack>
                  <Button
                    leftIcon={<FaFacebookF />}
                    colorScheme="facebook"
                    onClick={connectMeta}
                    isLoading={connecting}
                    borderRadius="lg"
                  >
                    ربط Facebook / Instagram
                  </Button>
                </HStack>
              </Flex>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
              {targets.map((t) => (
                <Box
                  key={t.id}
                  bg={panelBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  p={4}
                >
                  <HStack spacing={3} align="start">
                    <Avatar
                      size="md"
                      src={t.picture_url || undefined}
                      name={t.display_name}
                      bg={t.platform === "instagram_business" ? "pink.400" : "blue.500"}
                      icon={
                        <Icon
                          as={t.platform === "instagram_business" ? FaInstagram : FaFacebookF}
                        />
                      }
                    />
                    <Box flex={1} minW={0}>
                      <HStack>
                        <Text fontWeight="semibold" noOfLines={1}>
                          {t.display_name}
                        </Text>
                        {t.is_default && (
                          <Badge colorScheme="green" fontSize="10px">
                            أساسي
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color={muted}>
                        {t.platform === "instagram_business"
                          ? "Instagram Professional"
                          : "Facebook Page"}
                      </Text>
                      <Badge
                        mt={2}
                        colorScheme={
                          t.connection_status === "connected"
                            ? "green"
                            : t.connection_status === "needs_reauth"
                              ? "orange"
                              : "red"
                        }
                      >
                        {t.connection_status === "connected"
                          ? "متصل"
                          : t.connection_status === "needs_reauth"
                            ? "يلزم إعادة الربط"
                            : "مفصول"}
                      </Badge>
                      <Text fontSize="xs" color={muted} mt={2}>
                        مرتبط: {formatDate(t.connected_at)}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack mt={4} spacing={2}>
                    {!t.is_default && (
                      <Button size="xs" variant="outline" onClick={() => setDefault(t.id)}>
                        جعله أساسيًا
                      </Button>
                    )}
                    {t.connection_status === "needs_reauth" && (
                      <Button
                        size="xs"
                        colorScheme="orange"
                        leftIcon={<FaRedo />}
                        onClick={connectMeta}
                      >
                        إعادة الربط
                      </Button>
                    )}
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      leftIcon={<FaUnlink />}
                      onClick={() => confirmDisconnect(t)}
                    >
                      فصل
                    </Button>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
            {!targets.length && (
              <Box textAlign="center" py={10} color={muted}>
                لا توجد حسابات مرتبطة بعد.
              </Box>
            )}
            {!!connections.length && (
              <Text fontSize="xs" color={muted}>
                اتصالات Meta: {connections.length}
              </Text>
            )}
          </VStack>
        )}

        {section === "calendar" && (
          <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4}>
            <Text fontWeight="bold" mb={3}>
              تقويم المحتوى —{" "}
              {new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 4, md: 7 }} spacing={2}>
              {calendarDays.map((day) => {
                const key = day.toISOString().slice(0, 10);
                const dayPosts = calendarPosts[key] || [];
                return (
                  <Box
                    key={key}
                    minH="90px"
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    p={2}
                    bg={chipBg}
                  >
                    <Text fontSize="xs" fontWeight="bold" mb={1}>
                      {day.getDate()}
                    </Text>
                    <VStack align="stretch" spacing={1}>
                      {dayPosts.slice(0, 3).map((p) => (
                        <Badge
                          key={p.id}
                          colorScheme={STATUS_COLORS[p.status] || "gray"}
                          cursor="pointer"
                          onClick={() => {
                            setSelectedPost(p);
                            setSection("posts");
                          }}
                          fontSize="9px"
                          noOfLines={1}
                        >
                          #{p.id} {STATUS_LABELS[p.status] || p.status}
                        </Badge>
                      ))}
                      {dayPosts.length > 3 && (
                        <Text fontSize="9px" color={muted}>
                          +{dayPosts.length - 3}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {(section === "posts" || section === "approval") && (
          <Flex gap={4} direction={{ base: "column", lg: "row" }} align="start">
            <VStack
              align="stretch"
              spacing={3}
              flex={1}
              w="full"
            >
              {(section === "approval"
                ? posts.filter((p) => p.status === "pending_approval")
                : posts
              ).map((p) => (
                <Box
                  key={p.id}
                  bg={panelBg}
                  borderWidth="1px"
                  borderColor={selectedPost?.id === p.id ? "blue.400" : borderColor}
                  borderRadius="xl"
                  p={3}
                  cursor="pointer"
                  onClick={() => setSelectedPost(p)}
                >
                  <HStack align="start" spacing={3}>
                    {p.image_url && (
                      <Image
                        src={p.image_url}
                        alt=""
                        boxSize="64px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <Box flex={1} minW={0}>
                      <HStack>
                        <Badge colorScheme={STATUS_COLORS[p.status] || "gray"}>
                          {STATUS_LABELS[p.status] || p.status}
                        </Badge>
                        <Text fontSize="xs" color={muted}>
                          #{p.id}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" noOfLines={2} mt={1}>
                        {p.caption || "بدون كابشن"}
                      </Text>
                      <Text fontSize="xs" color={muted} mt={1}>
                        {p.scheduled_at
                          ? `مجدول: ${formatDate(p.scheduled_at)}`
                          : `أُنشئ: ${formatDate(p.created_at)}`}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
              {!posts.length && (
                <Box textAlign="center" py={8} color={muted}>
                  لا توجد بوستات بعد. ولّد محتوى من المساعد ثم أضفه للنشر.
                </Box>
              )}
            </VStack>

            {selectedPost && (
              <Box
                w={{ base: "full", lg: "360px" }}
                bg={panelBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="xl"
                p={4}
                position={{ lg: "sticky" }}
                top={2}
              >
                <Text fontWeight="bold" mb={2}>
                  تفاصيل البوست #{selectedPost.id}
                </Text>
                {selectedPost.image_url && (
                  <Image
                    src={selectedPost.image_url}
                    alt=""
                    w="full"
                    maxH="220px"
                    objectFit="cover"
                    borderRadius="lg"
                    mb={3}
                  />
                )}
                <FormControl mb={3}>
                  <FormLabel fontSize="sm">الكابشن</FormLabel>
                  <Textarea
                    value={selectedPost.caption || ""}
                    onChange={(e) =>
                      setSelectedPost((prev) => ({ ...prev, caption: e.target.value }))
                    }
                    rows={5}
                    fontSize="sm"
                  />
                </FormControl>
                <Button size="sm" mb={3} onClick={updateSelectedCaption} isLoading={saving}>
                  حفظ الكابشن
                </Button>
                <Divider my={3} />
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  الحسابات المستهدفة
                </Text>
                <Stack spacing={1} mb={3}>
                  {(selectedPost.targets || []).map((t) => (
                    <Text key={t.id} fontSize="xs" color={muted}>
                      {t.platform} · {t.page_name || t.ig_username || t.target_id} ·{" "}
                      {STATUS_LABELS[t.status] || t.status}
                      {t.external_post_url ? (
                        <>
                          {" "}
                          ·{" "}
                          <a href={t.external_post_url} target="_blank" rel="noreferrer">
                            فتح
                          </a>
                        </>
                      ) : null}
                    </Text>
                  ))}
                </Stack>
                <SimpleGrid columns={2} spacing={2}>
                  {selectedPost.status === "pending_approval" && (
                    <>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FaCheck />}
                        onClick={() =>
                          runPostAction(selectedPost.id, "approve", { publish_now: true })
                        }
                        isLoading={saving}
                      >
                        موافقة ونشر
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FaTimes />}
                        onClick={() => runPostAction(selectedPost.id, "reject")}
                        isLoading={saving}
                      >
                        رفض
                      </Button>
                    </>
                  )}
                  {!["published", "publishing", "cancelled"].includes(selectedPost.status) && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<FaPaperPlane />}
                      onClick={() => runPostAction(selectedPost.id, "publish-now")}
                      isLoading={saving}
                    >
                      نشر الآن
                    </Button>
                  )}
                  {selectedPost.status === "failed" && (
                    <Button
                      size="sm"
                      colorScheme="orange"
                      leftIcon={<FaRedo />}
                      onClick={() => runPostAction(selectedPost.id, "retry")}
                      isLoading={saving}
                    >
                      إعادة المحاولة
                    </Button>
                  )}
                  {["scheduled", "queued", "approved"].includes(selectedPost.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runPostAction(selectedPost.id, "cancel-schedule")}
                      isLoading={saving}
                    >
                      إلغاء الجدولة
                    </Button>
                  )}
                  {!["published", "publishing", "partial"].includes(selectedPost.status) && (
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => runPostAction(selectedPost.id, "delete")}
                      isLoading={saving}
                    >
                      حذف
                    </Button>
                  )}
                </SimpleGrid>
              </Box>
            )}
          </Flex>
        )}

        {section === "settings" && settings && (
          <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4} maxW="720px">
            <Text fontWeight="bold" mb={4}>
              إعدادات النشر التلقائي
            </Text>
            <VStack align="stretch" spacing={4}>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0}>تفعيل النشر التلقائي</FormLabel>
                <Switch
                  isChecked={!!settings.auto_publish_enabled}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, auto_publish_enabled: e.target.checked }))
                  }
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0}>إيقاف مؤقت</FormLabel>
                <Switch
                  isChecked={!!settings.paused}
                  onChange={(e) => setSettings((s) => ({ ...s, paused: e.target.checked }))}
                  colorScheme="orange"
                />
              </FormControl>
              <FormControl>
                <FormLabel>وضع الموافقة</FormLabel>
                <Select
                  value={settings.approval_mode}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, approval_mode: e.target.value }))
                  }
                >
                  <option value="manual">يدوي (توليد فقط)</option>
                  <option value="approval">موافقة قبل النشر</option>
                  <option value="auto">تلقائي بالكامل</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>عدد البوستات يوميًا</FormLabel>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={settings.posts_per_day}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, posts_per_day: Number(e.target.value) }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>مواعيد النشر (HH:MM مفصولة بفاصلة)</FormLabel>
                <Input
                  value={(settings.publish_times || []).join(", ")}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      publish_times: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>المنطقة الزمنية</FormLabel>
                <Input
                  value={settings.timezone || "Africa/Cairo"}
                  onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>أيام النشر</FormLabel>
                <CheckboxGroup
                  value={(settings.publish_days || []).map(String)}
                  onChange={(vals) =>
                    setSettings((s) => ({
                      ...s,
                      publish_days: vals.map(Number).sort(),
                    }))
                  }
                >
                  <HStack wrap="wrap" spacing={3}>
                    {DAY_LABELS.map((label, idx) => (
                      <Checkbox key={idx} value={String(idx)}>
                        {label}
                      </Checkbox>
                    ))}
                  </HStack>
                </CheckboxGroup>
              </FormControl>
              <FormControl>
                <FormLabel>الحسابات الافتراضية للنشر</FormLabel>
                <CheckboxGroup
                  value={(settings.default_target_ids || []).map(String)}
                  onChange={(vals) =>
                    setSettings((s) => ({
                      ...s,
                      default_target_ids: vals.map(Number),
                    }))
                  }
                >
                  <Stack>
                    {targets.map((t) => (
                      <Checkbox key={t.id} value={String(t.id)}>
                        {t.display_name} (
                        {t.platform === "instagram_business" ? "IG" : "FB"})
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
              <Button
                colorScheme="blue"
                onClick={() => saveSettings(settings)}
                isLoading={saving}
                alignSelf="flex-start"
              >
                حفظ الإعدادات
              </Button>
            </VStack>

            <Divider my={6} />
            <Text fontWeight="semibold" mb={2}>
              سجل النشر
            </Text>
            <VStack align="stretch" spacing={2} maxH="240px" overflowY="auto">
              {logs.map((log) => (
                <Box key={log.id} fontSize="xs" borderWidth="1px" borderColor={borderColor} borderRadius="md" p={2}>
                  <HStack justify="space-between">
                    <Text>
                      {log.action} · {log.status}
                    </Text>
                    <Text color={muted}>{formatDate(log.created_at)}</Text>
                  </HStack>
                  {log.error_message && (
                    <Text color="red.400" mt={1}>
                      {log.error_message}
                    </Text>
                  )}
                </Box>
              ))}
              {!logs.length && (
                <Text fontSize="sm" color={muted}>
                  لا يوجد سجل بعد.
                </Text>
              )}
            </VStack>

            {dashboard && (
              <Box mt={4} fontSize="sm" color={muted}>
                ملخص: FB {dashboard.facebook_count} · IG {dashboard.instagram_count} · منشور{" "}
                {dashboard.posts_by_status?.published || 0} · فشل{" "}
                {dashboard.posts_by_status?.failed || 0}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={disconnectRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              فصل الحساب؟
            </AlertDialogHeader>
            <AlertDialogBody>
              سيتم إيقاف أي نشر مجدول على هذا الحساب. المحتوى والسجل السابقان لن يُحذفا.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={disconnectRef} onClick={onClose} ml={3}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={doDisconnect} isLoading={saving}>
                فصل
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

const CenterSpinner = () => (
  <Flex h="full" align="center" justify="center" py={20}>
    <Spinner size="lg" />
  </Flex>
);

export default SocialPublishingHub;
