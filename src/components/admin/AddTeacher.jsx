import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  Textarea,
  Button,
  Spinner,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  IconButton,
  SimpleGrid,
  Badge,
  Container,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Image,
  Wrap,
  WrapItem,
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import {
  FaUserTie,
  FaEnvelope,
  FaLock,
  FaBook,
  FaSave,
  FaTrash,
  FaCloudUploadAlt,
  FaIdCard,
  FaCog,
} from "react-icons/fa";
import { useSearchParams, useLocation } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import { fetchAdminTenantById, patchAdminTenant, patchAdminTenantMultipart } from "../../api/adminTenantsApi";
import { compressImage, TENANT_MEDIA_COMPRESS } from "../../utils/compressImage";

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const emptyMediaFiles = () => ({
  avatar: null,
  favicon: null,
  og_image: null,
});

function defaultTenantHeaders() {
  const h = {};
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      h["X-Tenant-Subdomain"] = "default";
    }
  }
  return h;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

function jsonSuperHeaders(token) {
  return {
    ...authHeader(token),
    "Content-Type": "application/json",
    ...defaultTenantHeaders(),
  };
}

function multipartSuperHeaders(token) {
  return {
    ...authHeader(token),
    ...defaultTenantHeaders(),
  };
}

function hasAnyUpload(files) {
  return !!(files.avatar || files.favicon || files.og_image);
}

function emptyOwnerState() {
  return {
    name: "",
    email: "",
    password: "",
    description: "",
    subject: "",
    grade_ids: [],
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    tiktok_url: "",
    whatsapp_number: "",
    account_status: "active",
  };
}

function buildOwnerCreatePayload(owner) {
  const payload = {
    name: owner.name.trim(),
    email: owner.email.trim(),
    password: owner.password,
  };

  if (owner.description?.trim()) payload.description = owner.description.trim();
  if (owner.subject?.trim()) payload.subject = owner.subject.trim();
  if (Array.isArray(owner.grade_ids) && owner.grade_ids.length) {
    payload.grade_ids = owner.grade_ids;
  }
  if (owner.facebook_url?.trim()) payload.facebook_url = owner.facebook_url.trim();
  if (owner.instagram_url?.trim()) payload.instagram_url = owner.instagram_url.trim();
  if (owner.youtube_url?.trim()) payload.youtube_url = owner.youtube_url.trim();
  if (owner.tiktok_url?.trim()) payload.tiktok_url = owner.tiktok_url.trim();
  if (owner.whatsapp_number?.trim()) {
    payload.whatsapp_number = owner.whatsapp_number.trim().replace(/^\+/, "");
  }

  return payload;
}

function appendOwnerCreateMultipart(fd, owner) {
  fd.append("owner_name", owner.name.trim());
  fd.append("owner_email", owner.email.trim());
  fd.append("owner_password", owner.password);
  if (owner.description?.trim()) fd.append("owner_description", owner.description.trim());
  if (owner.subject?.trim()) fd.append("owner_subject", owner.subject.trim());
  if (Array.isArray(owner.grade_ids) && owner.grade_ids.length) {
    fd.append("owner_grade_ids", owner.grade_ids.join(","));
  }
  if (owner.facebook_url?.trim()) fd.append("owner_facebook_url", owner.facebook_url.trim());
  if (owner.instagram_url?.trim()) fd.append("owner_instagram_url", owner.instagram_url.trim());
  if (owner.youtube_url?.trim()) fd.append("owner_youtube_url", owner.youtube_url.trim());
  if (owner.tiktok_url?.trim()) fd.append("owner_tiktok_url", owner.tiktok_url.trim());
  if (owner.whatsapp_number?.trim()) {
    fd.append(
      "owner_whatsapp_number",
      owner.whatsapp_number.trim().replace(/^\+/, ""),
    );
  }
}

function buildCreateTenantJsonBody({ tenant, sub, settings, ownerEnabled, owner }) {
  const body = {
    subdomain: sub,
    display_name: tenant.display_name.trim(),
    specialty: tenant.specialty.trim() || null,
    bio: tenant.bio.trim() || null,
    avatar_url: tenant.avatar_url.trim() || null,
    is_active: tenant.is_active !== false,
    seo_title: tenant.seo_title.trim() || null,
    seo_meta_description: tenant.seo_meta_description.trim() || null,
    favicon_url: tenant.favicon_url.trim() || null,
    og_image_url: tenant.og_image_url.trim() || null,
    settings: settings && typeof settings === "object" ? settings : {},
    landing: {},
  };

  if (ownerEnabled) {
    body.owner = buildOwnerCreatePayload(owner);
  }

  return body;
}

function appendCreateTenantMultipart(fd, { tenant, sub, settings, ownerEnabled, owner, mediaFiles }) {
  fd.append("subdomain", sub);
  fd.append("display_name", tenant.display_name.trim());
  if (tenant.specialty.trim()) fd.append("specialty", tenant.specialty.trim());
  if (tenant.bio.trim()) fd.append("bio", tenant.bio.trim());
  if (tenant.avatar_url.trim()) fd.append("avatar_url", tenant.avatar_url.trim());
  if (tenant.favicon_url.trim()) fd.append("favicon_url", tenant.favicon_url.trim());
  if (tenant.og_image_url.trim()) fd.append("og_image_url", tenant.og_image_url.trim());
  if (tenant.seo_title.trim()) fd.append("seo_title", tenant.seo_title.trim());
  if (tenant.seo_meta_description.trim()) {
    fd.append("seo_meta_description", tenant.seo_meta_description.trim());
  }
  fd.append("is_active", tenant.is_active !== false ? "true" : "false");
  fd.append("landing", JSON.stringify({}));
  fd.append("settings", JSON.stringify(settings && typeof settings === "object" ? settings : {}));

  if (mediaFiles.avatar) fd.append("avatar", mediaFiles.avatar);
  if (mediaFiles.favicon) fd.append("favicon", mediaFiles.favicon);
  if (mediaFiles.og_image) fd.append("og_image", mediaFiles.og_image);

  if (ownerEnabled) {
    appendOwnerCreateMultipart(fd, owner);
  }
}

function buildOwnerPatch(owner, ownerEnabled) {
  if (!ownerEnabled) return undefined;

  const patch = {};
  if (owner.name?.trim()) patch.name = owner.name.trim();
  if (owner.email?.trim()) patch.email = owner.email.trim();
  if (owner.password) patch.password = owner.password;
  if (owner.description?.trim()) patch.description = owner.description.trim();
  if (owner.subject?.trim()) patch.subject = owner.subject.trim();
  if (owner.facebook_url?.trim()) patch.facebook_url = owner.facebook_url.trim();
  if (owner.instagram_url?.trim()) patch.instagram_url = owner.instagram_url.trim();
  if (owner.youtube_url?.trim()) patch.youtube_url = owner.youtube_url.trim();
  if (owner.tiktok_url?.trim()) patch.tiktok_url = owner.tiktok_url.trim();
  if (owner.whatsapp_number?.trim()) {
    patch.whatsapp_number = owner.whatsapp_number.trim().replace(/^\+/, "");
  }
  if (owner.account_status) patch.account_status = owner.account_status;
  if (Array.isArray(owner.grade_ids) && owner.grade_ids.length) {
    patch.grade_ids = owner.grade_ids;
  }

  return Object.keys(patch).length ? patch : undefined;
}

function appendAdminTenantEditFields(fd, { tenant, sub, settings, ownerPatch }) {
  if (sub) fd.append("subdomain", sub);
  if (tenant.display_name?.trim()) fd.append("display_name", tenant.display_name.trim());
  if (tenant.specialty?.trim()) fd.append("specialty", tenant.specialty.trim());
  if (tenant.bio?.trim()) fd.append("bio", tenant.bio.trim());
  fd.append("is_active", tenant.is_active ? "true" : "false");
  if (tenant.seo_title?.trim()) fd.append("seo_title", tenant.seo_title.trim());
  if (tenant.seo_meta_description?.trim()) {
    fd.append("seo_meta_description", tenant.seo_meta_description.trim());
  }
  if (tenant.avatar_url?.trim()) fd.append("avatar_url", tenant.avatar_url.trim());
  if (tenant.favicon_url?.trim()) fd.append("favicon_url", tenant.favicon_url.trim());
  if (tenant.og_image_url?.trim()) fd.append("og_image_url", tenant.og_image_url.trim());
  if (settings !== undefined) {
    fd.append("settings", JSON.stringify(settings));
    fd.append("merge_settings", "true");
  }
  if (ownerPatch) fd.append("owner", JSON.stringify(ownerPatch));
}

function buildAdminTenantEditJson({ tenant, sub, settings, ownerPatch }) {
  const body = {
    merge_settings: true,
    is_active: tenant.is_active,
  };

  if (sub) body.subdomain = sub;
  if (tenant.display_name?.trim()) body.display_name = tenant.display_name.trim();
  if (tenant.specialty?.trim()) body.specialty = tenant.specialty.trim();
  if (tenant.bio?.trim()) body.bio = tenant.bio.trim();
  if (tenant.seo_title?.trim()) body.seo_title = tenant.seo_title.trim();
  if (tenant.seo_meta_description?.trim()) {
    body.seo_meta_description = tenant.seo_meta_description.trim();
  }
  if (tenant.avatar_url?.trim()) body.avatar_url = tenant.avatar_url.trim();
  if (tenant.favicon_url?.trim()) body.favicon_url = tenant.favicon_url.trim();
  if (tenant.og_image_url?.trim()) body.og_image_url = tenant.og_image_url.trim();
  if (settings !== undefined) body.settings = settings;
  if (ownerPatch) body.owner = ownerPatch;

  return body;
}

function SectionCard({ step, title, subtitle, accent = "blue", children }) {
  const headerBg = useColorModeValue(`${accent}.50`, "whiteAlpha.50");
  const muted = useColorModeValue("gray.600", "gray.400");
  return (
    <Card
      overflow="hidden"
      borderRadius="2xl"
      shadow="lg"
      borderWidth="1px"
      borderColor={useColorModeValue("gray.100", "gray.700")}
    >
      <CardHeader
        py={5}
        px={{ base: 4, md: 8 }}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={useColorModeValue("blackAlpha.50", "whiteAlpha.100")}
      >
        <HStack align="flex-start" spacing={4}>
          <Badge
            colorScheme={accent}
            fontSize="0.7rem"
            px={2}
            py={1}
            borderRadius="md"
            textTransform="none"
            fontWeight="bold"
          >
            {step}
          </Badge>
          <VStack align="start" spacing={0.5} flex={1}>
            <Heading size="md" fontWeight="700" letterSpacing="-0.02em">
              {title}
            </Heading>
            {subtitle ? (
              <Text fontSize="sm" color={muted} lineHeight="tall">
                {subtitle}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody px={{ base: 4, md: 8 }} py={6}>
        {children}
      </CardBody>
    </Card>
  );
}

function FileDropSlot({
  label,
  hint,
  fieldKey,
  previewUrl,
  onFile,
  onClear,
  borderColor,
  mutedColor,
  uploadKey,
}) {
  const dashed = useColorModeValue("gray.300", "gray.600");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const inputRef = useRef(null);

  return (
    <FormControl>
      <FormLabel fontWeight="semibold" fontSize="sm">
        {label}
      </FormLabel>
      <Box
        position="relative"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={previewUrl ? "blue.400" : dashed}
        borderRadius="xl"
        p={4}
        transition="all 0.2s ease"
        _hover={{ bg: hoverBg, borderColor: "blue.400" }}
        cursor="pointer"
        onClick={() => inputRef.current?.click()}
        role="group"
      >
        <Input
          key={`${fieldKey}-${uploadKey}`}
          ref={inputRef}
          type="file"
          accept="image/*"
          display="none"
          onChange={(e) => {
            const f = e.target.files?.[0];
            onFile(f || null);
            e.target.value = "";
          }}
        />
        <VStack spacing={3}>
          <Icon as={FaCloudUploadAlt} boxSize={8} color="blue.400" opacity={0.9} />
          <Text fontSize="sm" textAlign="center" color={mutedColor}>
            {hint}
          </Text>
          {previewUrl ? (
            <HStack w="full" justify="center" flexWrap="wrap">
              <Box
                borderRadius="lg"
                borderWidth="1px"
                borderColor={borderColor}
                p={2}
                bg="repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 50% / 16px 16px"
              >
                <Image
                  src={previewUrl}
                  alt="معاينة الصورة"
                  maxH="120px"
                  maxW="100%"
                  objectFit="contain"
                  bg="transparent"
                />
              </Box>
              <IconButton
                aria-label="إزالة الملف"
                icon={<FaTrash />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
              />
            </HStack>
          ) : null}
        </VStack>
      </Box>
    </FormControl>
  );
}

const AddTeacher = () => {
  const [formMode, setFormMode] = useState("create");
  const [targetTenantId, setTargetTenantId] = useState("");
  const [tenant, setTenant] = useState({
    subdomain: "",
    display_name: "",
    specialty: "",
    bio: "",
    avatar_url: "",
    is_active: true,
    seo_title: "",
    seo_meta_description: "",
    favicon_url: "",
    og_image_url: "",
  });

  const [ownerEnabled, setOwnerEnabled] = useState(true);
  const [owner, setOwner] = useState(() => emptyOwnerState());
  const [availableGrades, setAvailableGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  const [settingsJson, setSettingsJson] = useState("");
  const [mediaFiles, setMediaFiles] = useState(emptyMediaFiles);
  const [compressingMedia, setCompressingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState({
    avatar: null,
    favicon: null,
    og_image: null,
  });
  const [uploadKey, setUploadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const pageBg = useColorModeValue("gray.50", "gray.950");
  const heroGradient = useColorModeValue(
    "linear(135deg, #1e3a8a 0%, #3b82f6 45%, #0ea5e9 100%)",
    "linear(135deg, #0f172a 0%, #1e40af 50%, #0369a1 100%)",
  );
  const textColor = useColorModeValue("gray.800", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("white", "gray.800");

  const setTenantField = useCallback((field, value) => {
    setTenant((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setOwnerField = useCallback((field, value) => {
    setOwner((prev) => ({ ...prev, [field]: value }));
  }, []);

  const revokePreview = useCallback((key) => {
    setMediaPreview((prev) => {
      const u = prev[key];
      if (u && u.startsWith("blob:")) URL.revokeObjectURL(u);
      const next = { ...prev, [key]: null };
      return next;
    });
  }, []);

  const setMediaFile = useCallback(
    async (key, file) => {
      if (!file) {
        setMediaFiles((prev) => ({ ...prev, [key]: null }));
        setMediaPreview((prev) => {
          const old = prev[key];
          if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
          return { ...prev, [key]: null };
        });
        return;
      }

      setCompressingMedia(true);
      try {
        const compressed = await compressImage(file, TENANT_MEDIA_COMPRESS[key] || {});
        setMediaFiles((prev) => ({ ...prev, [key]: compressed }));
        setMediaPreview((prev) => {
          const old = prev[key];
          if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
          return {
            ...prev,
            [key]: URL.createObjectURL(compressed),
          };
        });
      } finally {
        setCompressingMedia(false);
      }
    },
    [],
  );

  const clearMediaFile = useCallback(
    (key) => {
      setMediaFiles((prev) => ({ ...prev, [key]: null }));
      revokePreview(key);
    },
    [revokePreview],
  );

  const mediaPreviewRef = useRef(mediaPreview);
  mediaPreviewRef.current = mediaPreview;
  useEffect(() => {
    return () => {
      Object.values(mediaPreviewRef.current).forEach((u) => {
        if (u && typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, []);

  const resetForm = () => {
    setTenant({
      subdomain: "",
      display_name: "",
      specialty: "",
      bio: "",
      avatar_url: "",
      is_active: true,
      seo_title: "",
      seo_meta_description: "",
      favicon_url: "",
      og_image_url: "",
    });
    setOwner(emptyOwnerState());
    setOwnerEnabled(true);
    setSettingsJson("");
    setMediaFiles(emptyMediaFiles());
    ["avatar", "favicon", "og_image"].forEach((k) => {
      const u = mediaPreview[k];
      if (u && u.startsWith("blob:")) URL.revokeObjectURL(u);
    });
    setMediaPreview({ avatar: null, favicon: null, og_image: null });
    setUploadKey((k) => k + 1);
    setTargetTenantId("");
  };

  const inputProps = {
    size: "lg",
    borderRadius: "xl",
    borderColor,
    bg: inputBg,
    _focus: { borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" },
  };

  const applyTenantForEdit = useCallback((tenantData) => {
    if (!tenantData?.id) return;

    setFormMode("edit");
    setTargetTenantId(String(tenantData.id));
    setTenant({
      subdomain: tenantData.subdomain || "",
      display_name: tenantData.display_name || "",
      specialty: tenantData.specialty || "",
      bio: tenantData.bio || "",
      avatar_url: tenantData.avatar_url || "",
      is_active: tenantData.is_active !== false,
      seo_title: tenantData.seo_title || "",
      seo_meta_description: tenantData.seo_meta_description || "",
      favicon_url: tenantData.favicon_url || "",
      og_image_url: tenantData.og_image_url || "",
    });

    if (tenantData.settings && typeof tenantData.settings === "object") {
      setSettingsJson(JSON.stringify(tenantData.settings, null, 2));
    }

    if (tenantData.owner) {
      setOwnerEnabled(true);
      setOwner({
        name: tenantData.owner.name || "",
        email: tenantData.owner.email || "",
        password: "",
        description: tenantData.owner.description || "",
        subject: tenantData.owner.subject || "",
        grade_ids: Array.isArray(tenantData.owner.grade_ids)
          ? tenantData.owner.grade_ids
          : [],
        facebook_url: tenantData.owner.facebook_url || "",
        instagram_url: tenantData.owner.instagram_url || "",
        youtube_url: tenantData.owner.youtube_url || "",
        tiktok_url: tenantData.owner.tiktok_url || "",
        whatsapp_number:
          tenantData.owner.whatsapp_number || tenantData.owner.phone || "",
        account_status: tenantData.owner.account_status || "active",
      });
    }

    setMediaPreview((prev) => ({
      ...prev,
      avatar: tenantData.avatar_url || prev.avatar,
      favicon: tenantData.favicon_url || prev.favicon,
      og_image: tenantData.og_image_url || prev.og_image,
    }));
  }, []);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const tenantIdParam = searchParams.get("tenantId");
    if (mode !== "edit" || !tenantIdParam) return;

    const fromState = location.state?.tenant;
    if (fromState && String(fromState.id) === String(tenantIdParam)) {
      applyTenantForEdit(fromState);
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    let mounted = true;
    setLoadingTenant(true);
    fetchAdminTenantById(tenantIdParam, token)
      .then((tenant) => {
        if (!mounted) return;
        if (tenant) {
          applyTenantForEdit(tenant);
        } else {
          setFormMode("edit");
          setTargetTenantId(String(tenantIdParam));
          toast({
            title: "لم تُعثر على المنصة",
            description: "تحقق من رقم المنصة أو عد للوحة التحكم.",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        }
      })
      .catch(() => {
        if (!mounted) return;
        setFormMode("edit");
        setTargetTenantId(String(tenantIdParam));
        toast({
          title: "تعذر تحميل بيانات المنصة",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .finally(() => {
        if (mounted) setLoadingTenant(false);
      });

    return () => {
      mounted = false;
    };
  }, [searchParams, location.state, applyTenantForEdit, toast]);

  useEffect(() => {
    let mounted = true;
    const fetchAvailableGrades = async () => {
      setGradesLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await baseUrl.get("/api/teacher/available-grades", {
          headers: token ? authHeader(token) : undefined,
        });
        if (!mounted) return;
        setAvailableGrades(Array.isArray(response?.data?.grades) ? response.data.grades : []);
      } catch (error) {
        if (!mounted) return;
        setAvailableGrades([]);
        toast({
          title: "تعذر تحميل الصفوف",
          description: "لم نتمكن من جلب الصفوف الدراسية. يمكنك المحاولة لاحقاً.",
          status: "warning",
          duration: 3500,
          isClosable: true,
        });
      } finally {
        if (mounted) setGradesLoading(false);
      }
    };
    fetchAvailableGrades();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEditMode = formMode === "edit";
    const tenantId = String(targetTenantId || "").trim();
    if (isEditMode && !tenantId) {
      toast({
        title: "رقم المنصة مطلوب",
        description: "في وضع التعديل يجب إدخال Tenant ID.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    const sub = tenant.subdomain.trim().toLowerCase();
    if (!isEditMode && (!sub || sub.length < 2 || sub.length > 63)) {
      toast({
        title: "خطأ في النطاق الفرعي",
        description: "مطلوب وبطول بين 2 و 63 حرفاً.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    if (sub && !SUBDOMAIN_PATTERN.test(sub)) {
      toast({
        title: "صيغة النطاق الفرعي",
        description: "استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطة فقط (مثل ahmed-math).",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isEditMode && !tenant.display_name.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "اسم العرض على المنصة مطلوب.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (ownerEnabled && !isEditMode) {
      if (!owner.name.trim() || !owner.email.trim() || !owner.password) {
        toast({
          title: "بيانات المالك",
          description: "عند تفعيل حساب المالك: الاسم والبريد وكلمة المرور إلزامية.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      if (owner.password.length < 6) {
        toast({
          title: "كلمة المرور",
          description: "يجب أن تكون 6 أحرف على الأقل.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    }

    if (ownerEnabled && isEditMode && owner.password && owner.password.length < 6) {
      toast({
        title: "كلمة المرور",
        description: "يجب أن تكون 6 أحرف على الأقل.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    let settings = undefined;
    if (settingsJson.trim()) {
      try {
        settings = JSON.parse(settingsJson);
        if (settings === null || typeof settings !== "object" || Array.isArray(settings)) {
          throw new Error("settings must be object");
        }
      } catch {
        toast({
          title: "صيغة بيانات غير صالحة",
          description: "حقل الإعدادات الإضافية يجب أن يكون كائناً بصيغة JSON صالحة.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "غير مصرّح",
        description: "سجّل الدخول كمسؤول نظام.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const ownerPatch = buildOwnerPatch(owner, ownerEnabled);
    const useMultipart = hasAnyUpload(mediaFiles);

    setLoading(true);
    try {
      const uploadFiles = mediaFiles;
      let response;
      if (isEditMode) {
        if (useMultipart) {
          const fd = new FormData();
          appendAdminTenantEditFields(fd, {
            tenant,
            sub,
            settings,
            ownerPatch,
          });
          if (uploadFiles.avatar) fd.append("avatar", uploadFiles.avatar);
          if (uploadFiles.favicon) fd.append("favicon", uploadFiles.favicon);
          if (uploadFiles.og_image) fd.append("og_image", uploadFiles.og_image);
          response = await patchAdminTenantMultipart(tenantId, fd, token);
        } else {
          const body = buildAdminTenantEditJson({
            tenant,
            sub,
            settings,
            ownerPatch,
          });
          response = await patchAdminTenant(tenantId, body, token);
        }
      } else if (useMultipart) {
        const fd = new FormData();
        appendCreateTenantMultipart(fd, {
          tenant,
          sub,
          settings,
          ownerEnabled,
          owner,
          mediaFiles: uploadFiles,
        });
        response = await baseUrl.post("/api/super/tenants", fd, {
          headers: multipartSuperHeaders(token),
        });
      } else {
        const body = buildCreateTenantJsonBody({
          tenant,
          sub,
          settings,
          ownerEnabled,
          owner,
        });
        response = await baseUrl.post("/api/super/tenants", body, {
          headers: jsonSuperHeaders(token),
        });
      }

      const t = response.data?.data ?? response.data?.tenant;
      const extra =
        t?.subdomain != null
          ? ` النطاق: ${t.subdomain}${t.id != null ? ` — المعرف: ${t.id}` : ""}`
          : "";

      toast({
        title: formMode === "edit" ? "تم التعديل" : "تم الإنشاء",
        description:
          (response.data?.message ||
            (formMode === "edit" ? "تم تحديث المنصة والمدرس بنجاح." : "تم إنشاء منصة المدرس بنجاح.")) +
          extra,
        status: "success",
        duration: 5500,
        isClosable: true,
      });

      resetForm();
    } catch (error) {
      console.error(formMode === "edit" ? "خطأ تحديث المنصة:" : "خطأ إنشاء المنصة:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.response?.status === 413
          ? "حجم الطلب كبير جداً (الصور أو البيانات). جرّب صوراً أصغر أو قلّل محتوى صفحة الهبوط."
          : error.response?.status === 409
          ? "النطاق الفرعي مستخدم مسبقاً."
          : error.response?.status === 403
            ? "تحقق من صلاحية المسؤول وأن الطلب يمر عبر المستأجر الافتراضي للنظام."
            : formMode === "edit"
              ? "فشل تحديث المنصة."
              : "فشل إنشاء المنصة.");
      toast({
        title: "فشل الطلب",
        description: typeof msg === "string" ? msg : "حدث خطأ غير متوقع.",
        status: "error",
        duration: 6500,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const multipart = hasAnyUpload(mediaFiles);

  return (
    <Box as="main" minH="100vh" bg={pageBg} pb={16}>
      <Box bgGradient={heroGradient} color="white" pt={10} pb={14} px={4} mb={-8}>
        <Container maxW="1100px">
          <VStack align="stretch" spacing={4}>
            <HStack flexWrap="wrap" spacing={3}>
              <Badge
                bg="whiteAlpha.200"
                color="white"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                textTransform="none"
                borderWidth="1px"
                borderColor="whiteAlpha.400"
              >
                مسؤول أعلى · {formMode === "edit" ? "تعديل منصة مدرس" : "إنشاء منصة مدرس"}
              </Badge>
              <Badge
                bg={multipart ? "orange.400" : "whiteAlpha.200"}
                color="white"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                textTransform="none"
              >
                {multipart
                  ? "إرسال مع رفع صور (نموذج متعدد الأجزاء)"
                  : "إرسال نصي (بيانات JSON)"}
              </Badge>
            </HStack>
            <Heading
              size="xl"
              fontWeight="800"
              letterSpacing="-0.03em"
              lineHeight="shorter"
              maxW="lg"
            >
              {formMode === "edit"
                ? "تعديل منصة مدرس متعددة المستأجرين"
                : "إنشاء منصة مدرس متعددة المستأجرين"}
            </Heading>
            <Text fontSize="md" opacity={0.92} maxW="2xl" lineHeight="tall">
              يمكنك إدخال كل البيانات كنص، أو رفع صور من جهازك (الصورة الشخصية، أيقونة الموقع، صورة
              المشاركة الاجتماعية، صورة الواجهة البارزة) مع الحقول النصية وبيانات صفحة الهبوط والإعدادات
              وحساب المالك وفق دليل الواجهة البرمجية.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container maxW="1100px" position="relative" zIndex={1}>
        <VStack spacing={6} align="stretch">
          <Alert
            status="info"
            variant="left-accent"
            borderRadius="xl"
            bg={useColorModeValue("white", "gray.800")}
            boxShadow="md"
          >
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">متطلبات الوصول</AlertTitle>
              <AlertDescription fontSize="sm" mt={1}>
                يتطلب الأمر حساباً بدور <strong>مسؤول النظام</strong> مع رمز دخول صالح. تُنفَّذ
                العملية في سياق <strong>المستأجر الافتراضي</strong> للمنصة. على الجهاز المحلي تُضاف
                تلقائياً الترويسة{" "}
                <Text as="span" dir="ltr" fontFamily="mono" fontSize="xs">
                  X-Tenant-Subdomain: default
                </Text>
                . عند رفع ملف صورة يُستبدل الرابط النصي لنفس الحقل بما يُرفع إلى التخزين السحابي.
              </AlertDescription>
            </Box>
          </Alert>

          <form onSubmit={handleSubmit}>
            {loadingTenant && (
              <Flex justify="center" align="center" py={8} mb={4} direction="column" gap={3}>
                <Spinner size="lg" color="blue.500" />
                <Text color={mutedColor}>جاري تحميل بيانات المنصة للتعديل...</Text>
              </Flex>
            )}
            <VStack spacing={6} align="stretch">
              <SectionCard
                step="١ · الهوية"
                title="المنصة والنطاق"
                subtitle="معرّف الرابط الفرعي واسم العرض إلزاميان؛ باقي الحقول اختيارية."
                accent="blue"
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={5}>
                  <FormControl>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      وضع العملية
                    </FormLabel>
                    <Select
                      {...inputProps}
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value)}
                    >
                      <option value="create">إنشاء منصة جديدة</option>
                      <option value="edit">تعديل منصة موجودة</option>
                    </Select>
                  </FormControl>
                  {formMode === "edit" ? (
                    <FormControl isRequired={formMode !== "edit"}>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        Tenant ID للتعديل
                      </FormLabel>
                      <Input
                        {...inputProps}
                        dir="ltr"
                        fontFamily="mono"
                        placeholder="مثال: 25"
                        value={targetTenantId}
                        onChange={(e) => setTargetTenantId(e.target.value)}
                      />
                    </FormControl>
                  ) : (
                    <Box />
                  )}
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <FormControl isRequired={formMode !== "edit"}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      معرّف الرابط الفرعي
                    </FormLabel>
                    <Input
                      {...inputProps}
                      placeholder="مثال: ahmed-math"
                      value={tenant.subdomain}
                      onChange={(e) =>
                        setTenantField("subdomain", e.target.value.toLowerCase())
                      }
                      dir="ltr"
                      fontFamily="mono"
                    />
                    <FormHelperText>
                      أحرف إنجليزية صغيرة وأرقام وشرطة، بين 2 و 63 حرفاً.
                    </FormHelperText>
                  </FormControl>
                  <FormControl isRequired={formMode !== "edit"}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      اسم العرض على المنصة
                    </FormLabel>
                    <Input
                      {...inputProps}
                      placeholder="اسم المدرس أو العلامة الظاهرة"
                      value={tenant.display_name}
                      onChange={(e) => setTenantField("display_name", e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      التخصص
                    </FormLabel>
                    <Input
                      {...inputProps}
                      value={tenant.specialty}
                      onChange={(e) => setTenantField("specialty", e.target.value)}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel mb={0} fontWeight="semibold" color={textColor}>
                      المنصة نشطة
                    </FormLabel>
                    <Switch
                      isChecked={tenant.is_active}
                      onChange={(e) => setTenantField("is_active", e.target.checked)}
                      colorScheme="blue"
                      size="lg"
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl mt={5}>
                  <FormLabel fontWeight="semibold" color={textColor}>
                    نبذة عن المنصة أو المدرس
                  </FormLabel>
                  <Textarea
                    {...inputProps}
                    rows={4}
                    value={tenant.bio}
                    onChange={(e) => setTenantField("bio", e.target.value)}
                  />
                </FormControl>
              </SectionCard>

              <SectionCard
                step="٢ · الوسائط"
                title="الصور والروابط"
                subtitle="أدخل روابط الصور كنص، أو ارفع ملفات من جهازك؛ الملف المرفوع يتغلب على الرابط لنفس الحقل. صورة الواجهة البارزة تُدمج في محتوى صفحة الهبوط."
                accent="purple"
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
                  <FormControl>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      رابط الصورة الرئيسية
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="الصق رابط الصورة الكامل"
                      value={tenant.avatar_url}
                      onChange={(e) => setTenantField("avatar_url", e.target.value)}
                      isDisabled={!!mediaFiles.avatar}
                    />
                    <FormHelperText>
                      {mediaFiles.avatar ? "معطّل أثناء اختيار ملف للرفع." : null}
                    </FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      رابط أيقونة الموقع
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="الصق رابط الأيقونة الكامل"
                      value={tenant.favicon_url}
                      onChange={(e) => setTenantField("favicon_url", e.target.value)}
                      isDisabled={!!mediaFiles.favicon}
                    />
                  </FormControl>
                  <FormControl gridColumn={{ md: "1 / -1" }}>
                    <FormLabel fontWeight="semibold" color={textColor}>
                      رابط صورة المشاركة الاجتماعية
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="الصق رابط صورة المشاركة الكامل"
                      value={tenant.og_image_url}
                      onChange={(e) => setTenantField("og_image_url", e.target.value)}
                      isDisabled={!!mediaFiles.og_image}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <FileDropSlot
                    label="رفع الصورة الرئيسية"
                    hint="PNG شفاف مدعوم — تُرفع بجودتها الأصلية إن كان الحجم مناسباً."
                    fieldKey="avatar"
                    previewUrl={mediaPreview.avatar}
                    onFile={(f) => setMediaFile("avatar", f)}
                    onClear={() => clearMediaFile("avatar")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                  <FileDropSlot
                    label="رفع أيقونة الموقع"
                    hint="يفضّل PNG صغير. الشفافية تُحفظ."
                    fieldKey="favicon"
                    previewUrl={mediaPreview.favicon}
                    onFile={(f) => setMediaFile("favicon", f)}
                    onClear={() => clearMediaFile("favicon")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                  <FileDropSlot
                    label="ملف og_image → og_image_url"
                    hint="PNG أو JPG — جودة عالية، الشفافية محفوظة."
                    fieldKey="og_image"
                    previewUrl={mediaPreview.og_image}
                    onFile={(f) => setMediaFile("og_image", f)}
                    onClear={() => clearMediaFile("og_image")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                </SimpleGrid>
              </SectionCard>

              <Accordion allowToggle borderRadius="2xl" overflow="hidden" boxShadow="md">
                <AccordionItem border="none" bg={useColorModeValue("white", "gray.800")}>
                  <h2>
                    <AccordionButton py={4} px={{ base: 4, md: 6 }}>
                      <HStack flex="1" textAlign="start" spacing={3}>
                        <Icon as={FaIdCard} color="teal.500" />
                        <Box>
                          <Text fontWeight="bold">تحسين الظهور في محركات البحث</Text>
                          <Text fontSize="sm" color={mutedColor}>
                            اختياري — إن تُرك عنوان البحث فارغاً يُستخدم اسم العرض على المنصة.
                          </Text>
                        </Box>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={6} px={{ base: 4, md: 6 }} pt={0}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                          عنوان الصفحة في نتائج البحث
                        </FormLabel>
                        <Input
                          {...inputProps}
                          size="md"
                          value={tenant.seo_title}
                          onChange={(e) => setTenantField("seo_title", e.target.value)}
                        />
                      </FormControl>
                      <FormControl gridColumn={{ md: "1 / -1" }}>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                          وصف مختصر لصفحة البحث
                        </FormLabel>
                        <Textarea
                          {...inputProps}
                          size="md"
                          rows={3}
                          value={tenant.seo_meta_description}
                          onChange={(e) =>
                            setTenantField("seo_meta_description", e.target.value)
                          }
                        />
                      </FormControl>
                    </SimpleGrid>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <SectionCard
                step="٣ · المالك"
                title="حساب مالك المنصة"
                subtitle="اختياري — لكن مطلوب لإنشاء منصة بمدرس. الإلزامي داخل المالك: الاسم، البريد، وكلمة المرور (6 أحرف على الأقل)."
                accent="green"
              >
                <HStack justify="space-between" mb={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="sm" color={mutedColor}>
                    تعطيل الخيار ينشئ منصة بدون حساب مالك. مع الملفات تُرسل حقول owner_* مسطّحة.
                  </Text>
                  <Switch
                    isChecked={ownerEnabled}
                    onChange={(e) => setOwnerEnabled(e.target.checked)}
                    colorScheme="green"
                    size="lg"
                  />
                </HStack>
                {ownerEnabled ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    <FormControl isRequired={formMode !== "edit"}>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        <HStack spacing={2}>
                          <Icon as={FaUserTie} color="green.500" />
                          <Text>الاسم</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        {...inputProps}
                        value={owner.name}
                        onChange={(e) => setOwnerField("name", e.target.value)}
                      />
                    </FormControl>
                    <FormControl isRequired={formMode !== "edit"}>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        <HStack spacing={2}>
                          <Icon as={FaEnvelope} color="green.500" />
                          <Text>البريد</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        {...inputProps}
                        type="email"
                        dir="ltr"
                        value={owner.email}
                        onChange={(e) => setOwnerField("email", e.target.value)}
                      />
                    </FormControl>
                    <FormControl isRequired={formMode !== "edit"}>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        <HStack spacing={2}>
                          <Icon as={FaLock} color="green.500" />
                          <Text>كلمة المرور</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        {...inputProps}
                        type="password"
                        placeholder={formMode === "edit" ? "اتركه فارغاً إن لم تُرد تغييره" : "6 أحرف على الأقل"}
                        value={owner.password}
                        onChange={(e) => setOwnerField("password", e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        <HStack spacing={2}>
                          <Icon as={FaBook} color="green.500" />
                          <Text>المادة الدراسية</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        {...inputProps}
                        value={owner.subject}
                        onChange={(e) => setOwnerField("subject", e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        واتساب (whatsapp_number)
                      </FormLabel>
                      <Input
                        {...inputProps}
                        dir="ltr"
                        value={owner.whatsapp_number}
                        onChange={(e) => setOwnerField("whatsapp_number", e.target.value)}
                        placeholder="201012345678"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        فيسبوك
                      </FormLabel>
                      <Input
                        {...inputProps}
                        dir="ltr"
                        value={owner.facebook_url}
                        onChange={(e) => setOwnerField("facebook_url", e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        إنستغرام
                      </FormLabel>
                      <Input
                        {...inputProps}
                        dir="ltr"
                        value={owner.instagram_url}
                        onChange={(e) => setOwnerField("instagram_url", e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        يوتيوب
                      </FormLabel>
                      <Input
                        {...inputProps}
                        dir="ltr"
                        value={owner.youtube_url}
                        onChange={(e) => setOwnerField("youtube_url", e.target.value)}
                        placeholder="https://youtube.com/@..."
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        تيك توك
                      </FormLabel>
                      <Input
                        {...inputProps}
                        dir="ltr"
                        value={owner.tiktok_url}
                        onChange={(e) => setOwnerField("tiktok_url", e.target.value)}
                        placeholder="https://tiktok.com/@..."
                      />
                    </FormControl>
                    {formMode === "edit" && (
                      <FormControl>
                        <FormLabel fontWeight="semibold" color={textColor}>
                          حالة الحساب
                        </FormLabel>
                        <Select
                          {...inputProps}
                          value={owner.account_status}
                          onChange={(e) => setOwnerField("account_status", e.target.value)}
                        >
                          <option value="active">نشط</option>
                          <option value="inactive">غير نشط</option>
                          <option value="suspended">موقوف</option>
                        </Select>
                      </FormControl>
                    )}
                    <FormControl gridColumn={{ md: "1 / -1" }}>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        الوصف التعريفي
                      </FormLabel>
                      <Textarea
                        {...inputProps}
                        rows={3}
                        value={owner.description}
                        onChange={(e) => setOwnerField("description", e.target.value)}
                      />
                    </FormControl>
                    <FormControl gridColumn={{ md: "1 / -1" }}>
                      <FormLabel fontWeight="semibold" color={textColor}>
                        الصفوف الدراسية (اختياري)
                      </FormLabel>
                      <Text fontSize="sm" color={mutedColor} mb={3}>
                        تحدد الصفوف المرتبطة بالمدرس عند الإنشاء (grade_ids).
                      </Text>
                      {gradesLoading ? (
                        <HStack color={mutedColor}>
                          <Spinner size="sm" />
                          <Text fontSize="sm">جاري تحميل الصفوف...</Text>
                        </HStack>
                      ) : availableGrades.length ? (
                        <CheckboxGroup
                          value={(owner.grade_ids || []).map((id) => String(id))}
                          onChange={(values) =>
                            setOwnerField(
                              "grade_ids",
                              values
                                .map((v) => Number(v))
                                .filter((n) => Number.isFinite(n) && n > 0),
                            )
                          }
                        >
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            {availableGrades.map((grade) => (
                              <Checkbox key={grade.id} value={String(grade.id)} colorScheme="green">
                                {grade.name}
                              </Checkbox>
                            ))}
                          </SimpleGrid>
                        </CheckboxGroup>
                      ) : (
                        <Text fontSize="sm" color={mutedColor}>
                          لا توجد صفوف متاحة حالياً.
                        </Text>
                      )}
                    </FormControl>
                  </SimpleGrid>
                ) : null}
              </SectionCard>

              <SectionCard
                step="٤ · إعدادات"
                title="إعدادات المنصة الإضافية"
                subtitle="اختياري — كائن بصيغة JSON يُخزَّن مع إعدادات المستأجر."
                accent="gray"
              >
                <FormControl>
                  <FormLabel fontWeight="semibold" color={textColor}>
                    <HStack spacing={2}>
                      <Icon as={FaCog} />
                      <Text>نص الإعدادات (JSON)</Text>
                    </HStack>
                  </FormLabel>
                  <Textarea
                    dir="ltr"
                    fontFamily="mono"
                    fontSize="sm"
                    placeholder='{"حد_الطلبات": 100}'
                    value={settingsJson}
                    onChange={(e) => setSettingsJson(e.target.value)}
                    rows={5}
                    borderRadius="xl"
                    borderColor={borderColor}
                    bg={inputBg}
                  />
                  <FormHelperText>
                    اتركه فارغاً إن لم تكن بحاجة إلى إعدادات تقنية إضافية.
                  </FormHelperText>
                </FormControl>
              </SectionCard>

              <Wrap spacing={4} justify="flex-end">
                <WrapItem>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    isDisabled={loading}
                    borderRadius="xl"
                  >
                    مسح النموذج
                  </Button>
                </WrapItem>
                <WrapItem flex={1} minW={{ base: "100%", md: "280px" }}>
                  <Button
                    type="submit"
                    w="full"
                    colorScheme="blue"
                    size="lg"
                    h="58px"
                    borderRadius="xl"
                    fontSize="md"
                    fontWeight="bold"
                    leftIcon={loading ? <Spinner size="sm" /> : <FaSave />}
                    isLoading={loading || compressingMedia}
                    isDisabled={compressingMedia}
                    loadingText={
                      compressingMedia
                        ? "جاري ضغط الصور..."
                        : formMode === "edit"
                          ? "جاري التحديث..."
                          : "جاري الإنشاء..."
                    }
                    boxShadow="lg"
                    _hover={{ transform: "translateY(-1px)", boxShadow: "xl" }}
                    transition="all 0.2s"
                  >
                    {formMode === "edit"
                      ? multipart
                        ? "تحديث المنصة مع رفع الصور"
                        : "تحديث المنصة (إرسال نصي)"
                      : multipart
                        ? "إنشاء المنصة مع رفع الصور"
                        : "إنشاء المنصة (إرسال نصي)"}
                  </Button>
                </WrapItem>
              </Wrap>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
};

export default AddTeacher;
