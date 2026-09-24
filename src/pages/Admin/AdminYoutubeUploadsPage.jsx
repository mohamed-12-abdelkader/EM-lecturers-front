import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Link,
  Progress,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { MdCloudUpload, MdLink, MdRefresh, MdLogin } from "react-icons/md";
import {
  disconnectYoutube,
  enqueueYoutubeUploads,
  fetchYoutubeConnectUrl,
  fetchYoutubeSessions,
  fetchYoutubeStatus,
  fetchYoutubeUploadJobs,
  formatBytes,
  retryYoutubeUploadJob,
} from "../../api/adminYoutubeApi";

const STATUS_AR = {
  queued: "في الانتظار",
  uploading: "جارٍ الرفع",
  done: "تم",
  failed: "فشل",
  needs_reauth: "يحتاج تسجيل دخول",
};

function statusColor(status) {
  if (status === "done") return "green";
  if (status === "uploading" || status === "queued") return "blue";
  if (status === "needs_reauth") return "orange";
  if (status === "failed") return "red";
  return "gray";
}

export default function AdminYoutubeUploadsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [jobMap, setJobMap] = useState(() => new Map());
  const [trackedJobIds, setTrackedJobIds] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    not_on_youtube: true,
    has_file: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, sess] = await Promise.all([
        fetchYoutubeStatus(),
        fetchYoutubeSessions({
          search: filters.search,
          not_on_youtube: filters.not_on_youtube,
          has_file: filters.has_file,
          limit: 100,
          offset: 0,
        }),
      ]);
      setStatus(st);
      setSessions(sess.sessions || []);
      setTotal(sess.total || 0);
      const nextJobs = new Map();
      for (const s of sess.sessions || []) {
        if (s.latest_job) nextJobs.set(s.meeting_id, s.latest_job);
      }
      setJobMap(nextJobs);
    } catch (err) {
      toast({
        title: "تعذّر التحميل",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [filters.has_file, filters.not_on_youtube, filters.search, toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      toast({
        title: "تم ربط YouTube",
        description: params.get("channel") || undefined,
        status: "success",
      });
      window.history.replaceState({}, "", "/admin/youtube-uploads");
    } else if (params.get("error")) {
      toast({
        title: "فشل ربط YouTube",
        description: params.get("detail") || params.get("error"),
        status: "error",
        duration: 8000,
      });
      window.history.replaceState({}, "", "/admin/youtube-uploads");
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!trackedJobIds.length) return undefined;
    const timer = setInterval(async () => {
      try {
        const jobs = await fetchYoutubeUploadJobs(trackedJobIds);
        setJobMap((prev) => {
          const next = new Map(prev);
          for (const job of jobs) {
            next.set(String(job.meeting_id), job);
          }
          return next;
        });
        const active = jobs.some((j) => j.status === "queued" || j.status === "uploading");
        if (!active) {
          setTrackedJobIds([]);
          load();
        }
        if (jobs.some((j) => j.status === "needs_reauth")) {
          const st = await fetchYoutubeStatus();
          setStatus(st);
        }
      } catch {
        /* ignore poll errors */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [trackedJobIds, load]);

  const allSelected = useMemo(() => {
    const selectable = sessions.filter((s) => s.file_exists);
    return selectable.length > 0 && selectable.every((s) => selected.has(s.meeting_id));
  }, [sessions, selected]);

  const toggleAll = () => {
    const selectable = sessions.filter((s) => s.file_exists);
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectable.map((s) => s.meeting_id)));
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await fetchYoutubeConnectUrl();
      if (!data?.url) throw new Error("لا يوجد رابط ربط");
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: "تعذّر بدء الربط",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectYoutube();
      toast({ title: "تم قطع الاتصال", status: "info" });
      load();
    } catch (err) {
      toast({
        title: "فشل قطع الاتصال",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleUpload = async (replace = false) => {
    const ids = Array.from(selected);
    if (!ids.length) {
      toast({ title: "اختر جلسة واحدةً واحدة واحدة واحدة واحدة واحدة واحدةً على الأقل", status: "warning" });
      return;
    }
    setUploading(true);
    try {
      const result = await enqueueYoutubeUploads(ids, replace);
      const jobs = result.jobs || [];
      setJobMap((prev) => {
        const next = new Map(prev);
        for (const job of jobs) next.set(String(job.meeting_id), job);
        return next;
      });
      setTrackedJobIds(jobs.map((j) => j.id).filter(Boolean));
      setSelected(new Set());
      toast({
        title: `تم جدولة ${jobs.length} رفع`,
        description:
          result.skipped?.length
            ? `تم تخطي ${result.skipped.length}`
            : undefined,
        status: "success",
      });
      load();
    } catch (err) {
      const code = err?.response?.data?.details?.code || err?.response?.data?.code;
      const msg = err?.response?.data?.message || err.message || "";
      const needsReauth =
        code === "needs_reauth" || String(msg).includes("YouTube") && String(msg).includes("تسجيل");
      toast({
        title: needsReauth ? "يلزم تسجيل الدخول لـ YouTube" : "فشل بدء الرفع",
        description: msg,
        status: "error",
      });
      if (needsReauth) {
        const st = await fetchYoutubeStatus().catch(() => null);
        if (st) setStatus(st);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      const job = await retryYoutubeUploadJob(jobId);
      if (job) {
        setJobMap((prev) => new Map(prev).set(String(job.meeting_id), job));
        setTrackedJobIds((prev) => Array.from(new Set([...prev, job.id])));
      }
      toast({ title: "أُعيدت المهمة للطابور", status: "success" });
    } catch (err) {
      toast({
        title: "فشل إعادة المحاولة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const connected = status?.connected === true;

  return (
    <Container maxW="7xl" py={6} dir="rtl">
      <VStack align="stretch" spacing={6}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Box>
            <Heading size="md">رفع تسجيلات البث إلى YouTube</Heading>
            <Text color="gray.500" mt={1} fontSize="sm">
              الرفع من السيرفر مباشرة دون تنزيل الملفات على جهازك
            </Text>
          </Box>
          <Button leftIcon={<MdRefresh />} onClick={load} isLoading={loading} variant="outline">
            تحديث
          </Button>
        </Flex>

        <Box borderWidth="1px" rounded="lg" p={4} bg="white">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box>
              <Text fontWeight="bold">اتصال YouTube</Text>
              {connected ? (
                <HStack mt={1} spacing={2}>
                  <Badge colorScheme="green">متصل</Badge>
                  <Text>{status?.channel_title || status?.channel_id}</Text>
                </HStack>
              ) : status?.status === "needs_reauth" ? (
                <HStack mt={1} spacing={2}>
                  <Badge colorScheme="orange">يحتاج تسجيل دخول</Badge>
                  <Text fontSize="sm" color="gray.600">
                    انتهت صلاحية التوكن — سجّل الدخول مجدداً
                  </Text>
                </HStack>
              ) : (
                <Text mt={1} fontSize="sm" color="gray.600">
                  لم يتم ربط قناة بعد
                </Text>
              )}
            </Box>
            <HStack>
              {connected ? (
                <Button variant="outline" colorScheme="red" onClick={handleDisconnect}>
                  قطع الاتصال
                </Button>
              ) : null}
              <Button
                leftIcon={<MdLogin />}
                colorScheme="red"
                onClick={handleConnect}
                isLoading={connecting}
              >
                {connected ? "إعادة الربط" : "ربط YouTube"}
              </Button>
            </HStack>
          </Flex>
          {status?.redirect_uri ? (
            <Text mt={3} fontSize="xs" color="gray.500">
              Redirect URI: {status.redirect_uri}
            </Text>
          ) : null}
        </Box>

        {!connected ? (
          <Alert status="warning">
            <AlertIcon />
            اربط قناة YouTube أولاً قبل رفع التسجيلات.
          </Alert>
        ) : null}

        <Box borderWidth="1px" rounded="lg" p={4} bg="white">
          <Flex gap={3} wrap="wrap" mb={4} align="center">
            <Input
              placeholder="بحث: جلسة / كورس / مدرس / منصة"
              maxW="320px"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <Checkbox
              isChecked={filters.not_on_youtube}
              onChange={(e) =>
                setFilters((f) => ({ ...f, not_on_youtube: e.target.checked }))
              }
            >
              غير مرفوع على YouTube
            </Checkbox>
            <Checkbox
              isChecked={filters.has_file}
              onChange={(e) => setFilters((f) => ({ ...f, has_file: e.target.checked }))}
            >
              يوجد ملف على السيرفر
            </Checkbox>
            <Button
              leftIcon={<MdCloudUpload />}
              colorScheme="blue"
              onClick={() => handleUpload(false)}
              isDisabled={!connected || selected.size === 0}
              isLoading={uploading}
            >
              رفع المحدد ({selected.size})
            </Button>
          </Flex>

          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner />
            </Flex>
          ) : (
            <>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {sessions.length} من أصل {total} جلسة
              </Text>
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>
                        <Checkbox isChecked={allSelected} onChange={toggleAll} />
                      </Th>
                      <Th>الجلسة</Th>
                      <Th>الكورس</Th>
                      <Th>المنصة</Th>
                      <Th>الحجم</Th>
                      <Th>YouTube</Th>
                      <Th>حالة الرفع</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sessions.map((s) => {
                      const job = jobMap.get(s.meeting_id) || s.latest_job;
                      const ytUrl = job?.youtube_url || (s.already_on_youtube ? s.egress_url : null);
                      return (
                        <Tr key={s.meeting_id}>
                          <Td>
                            <Checkbox
                              isChecked={selected.has(s.meeting_id)}
                              isDisabled={!s.file_exists}
                              onChange={() => toggleOne(s.meeting_id)}
                            />
                          </Td>
                          <Td>
                            <Text fontWeight="medium">{s.session_title}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {s.teacher_name}
                            </Text>
                          </Td>
                          <Td>
                            <Text>{s.course_title || "—"}</Text>
                            <Text fontSize="xs" color="gray.500">
                              #{s.course_id}
                            </Text>
                          </Td>
                          <Td>{s.tenant_subdomain || "—"}</Td>
                          <Td>
                            {s.file_exists ? (
                              formatBytes(s.file_size)
                            ) : (
                              <Badge colorScheme="red">لا يوجد ملف</Badge>
                            )}
                          </Td>
                          <Td>
                            {ytUrl ? (
                              <Link href={ytUrl} isExternal color="blue.500" fontSize="sm">
                                <HStack spacing={1}>
                                  <MdLink />
                                  <Text>فتح</Text>
                                </HStack>
                              </Link>
                            ) : (
                              "—"
                            )}
                          </Td>
                          <Td minW="160px">
                            {job ? (
                              <VStack align="stretch" spacing={1}>
                                <Badge colorScheme={statusColor(job.status)} w="fit-content">
                                  {STATUS_AR[job.status] || job.status}
                                </Badge>
                                {(job.status === "uploading" || job.status === "queued") && (
                                  <Progress
                                    size="xs"
                                    value={Number(job.progress_percent) || 0}
                                    hasStripe
                                    isAnimated
                                  />
                                )}
                                {job.error_message ? (
                                  <Text fontSize="xs" color="red.500" noOfLines={2}>
                                    {job.error_message}
                                  </Text>
                                ) : null}
                              </VStack>
                            ) : s.already_on_youtube ? (
                              <Badge colorScheme="green">موجود</Badge>
                            ) : (
                              "—"
                            )}
                          </Td>
                          <Td>
                            {job && (job.status === "failed" || job.status === "needs_reauth") ? (
                              <Button
                                size="xs"
                                onClick={() => handleRetry(job.id)}
                                isDisabled={!connected && job.status !== "failed"}
                              >
                                إعادة
                              </Button>
                            ) : null}
                          </Td>
                        </Tr>
                      );
                    })}
                    {!sessions.length ? (
                      <Tr>
                        <Td colSpan={8}>
                          <Text textAlign="center" py={6} color="gray.500">
                            لا توجد جلسات مطابقة
                          </Text>
                        </Td>
                      </Tr>
                    ) : null}
                  </Tbody>
                </Table>
              </Box>
            </>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
