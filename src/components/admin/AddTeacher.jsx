import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  Button,
  Spinner,
  useToast,
  Text,
  Icon,
  useColorModeValue,
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
  FaArrowRight,
  FaHome,
} from "react-icons/fa";
import { useSearchParams, useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import { fetchAdminTenantById, fetchAdminTenants, patchAdminTenant, patchAdminTenantMultipart } from "../../api/adminTenantsApi";
import { compressImage, TENANT_MEDIA_COMPRESS } from "../../utils/compressImage";

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BRAND_BLUE = "#3182CE";
const BRAND_ORANGE = "#DD6B20";

const emptyMediaFiles = () => ({
  avatar: null,
  favicon: null,
  og_image: null,
  hero_image: null,
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
  return !!(files.avatar || files.favicon || files.og_image || files.hero_image);
}

/** صورة الهيرو تُرسل داخل landing.hero.image_url (أو عبر ملف hero_image) */
function buildLandingPayload(heroImageUrl, hasHeroFile = false) {
  const image_url = String(heroImageUrl || "").trim();
  if (hasHeroFile) {
    return image_url ? { hero: { image_url } } : { hero: {} };
  }
  if (!image_url) return null;
  return { hero: { image_url } };
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

function buildCreateTenantJsonBody({ tenant, sub, settings, ownerEnabled, owner, landingPayload }) {
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
    landing: landingPayload || {},
  };

  if (ownerEnabled) {
    body.owner = buildOwnerCreatePayload(owner);
  }

  return body;
}

function appendCreateTenantMultipart(fd, { tenant, sub, settings, ownerEnabled, owner, mediaFiles, landingPayload }) {
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
  fd.append("landing", JSON.stringify(landingPayload || {}));
  fd.append("settings", JSON.stringify(settings && typeof settings === "object" ? settings : {}));

  if (mediaFiles.avatar) fd.append("avatar", mediaFiles.avatar);
  if (mediaFiles.favicon) fd.append("favicon", mediaFiles.favicon);
  if (mediaFiles.og_image) fd.append("og_image", mediaFiles.og_image);
  if (mediaFiles.hero_image) fd.append("hero_image", mediaFiles.hero_image);

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

function appendAdminTenantEditFields(fd, { tenant, sub, settings, ownerPatch, landingPayload }) {
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
  if (landingPayload) {
    fd.append("landing", JSON.stringify(landingPayload));
    fd.append("merge_landing", "true");
  }
  if (settings !== undefined) {
    fd.append("settings", JSON.stringify(settings));
    fd.append("merge_settings", "true");
  }
  if (ownerPatch) fd.append("owner", JSON.stringify(ownerPatch));
}

function buildAdminTenantEditJson({ tenant, sub, settings, ownerPatch, landingPayload }) {
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
  if (landingPayload) {
    body.landing = landingPayload;
    body.merge_landing = true;
  }
  if (settings !== undefined) body.settings = settings;
  if (ownerPatch) body.owner = ownerPatch;

  return body;
}

function SectionCard({ step, title, subtitle, accent = "blue", children }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const accentColor = accent === "orange" ? BRAND_ORANGE : BRAND_BLUE;

  return (
    <Box
      as="section"
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="sm"
    >
      <Flex
        align="flex-start"
        gap={4}
        px={{ base: 4, md: 6 }}
        py={5}
        borderBottomWidth="1px"
        borderColor={border}
        bg={useColorModeValue("gray.50", "whiteAlpha.50")}
      >
        <Flex
          w="36px"
          h="36px"
          borderRadius="lg"
          align="center"
          justify="center"
          flexShrink={0}
          bg={useColorModeValue(`${accent === "orange" ? "orange" : "blue"}.50`, "whiteAlpha.100")}
          color={accentColor}
          fontSize="sm"
          fontWeight="800"
        >
          {step}
        </Flex>
        <Box minW={0}>
          <Text fontWeight="800" fontSize={{ base: "md", md: "lg" }} letterSpacing="-0.02em">
            {title}
          </Text>
          {subtitle ? (
            <Text fontSize="sm" color={muted} mt={1} lineHeight="tall">
              {subtitle}
            </Text>
          ) : null}
        </Box>
      </Flex>
      <Box px={{ base: 4, md: 6 }} py={6}>
        {children}
      </Box>
    </Box>
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
      <FormLabel fontWeight="600" fontSize="sm" mb={2}>
        {label}
      </FormLabel>
      <Box
        position="relative"
        borderWidth="1.5px"
        borderStyle="dashed"
        borderColor={previewUrl ? BRAND_BLUE : dashed}
        borderRadius="xl"
        p={4}
        transition="all 0.2s ease"
        _hover={{ bg: hoverBg, borderColor: BRAND_BLUE }}
        cursor="pointer"
        onClick={() => inputRef.current?.click()}
        role="group"
        minH="140px"
        display="flex"
        alignItems="center"
        justifyContent="center"
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
          <Icon as={FaCloudUploadAlt} boxSize={7} color={BRAND_BLUE} opacity={0.85} />
          <Text fontSize="sm" textAlign="center" color={mutedColor} maxW="220px">
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
                  maxH="100px"
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
  /** Map subdomain → { id, display_name, is_active } من نفس API لوحة الأدمن */
  const [existingSubdomains, setExistingSubdomains] = useState(() => new Map());
  const [subdomainsLoading, setSubdomainsLoading] = useState(false);

  const [settingsJson, setSettingsJson] = useState("");
  const [mediaFiles, setMediaFiles] = useState(emptyMediaFiles);
  const [compressingMedia, setCompressingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState({
    avatar: null,
    favicon: null,
    og_image: null,
    hero_image: null,
  });
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [uploadKey, setUploadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const headerBg = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "gray.800");
  const footerBg = useColorModeValue("white", "gray.900");
  const badgeBlueBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const badgeGrayBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const tipBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const tipBorder = useColorModeValue("blue.100", "blue.800");
  const btnGhostHover = useColorModeValue("gray.100", "whiteAlpha.100");

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
    setHeroImageUrl("");
    ["avatar", "favicon", "og_image", "hero_image"].forEach((k) => {
      const u = mediaPreview[k];
      if (u && u.startsWith("blob:")) URL.revokeObjectURL(u);
    });
    setMediaPreview({ avatar: null, favicon: null, og_image: null, hero_image: null });
    setUploadKey((k) => k + 1);
    setTargetTenantId("");
  };

  const inputProps = {
    size: "md",
    borderRadius: "lg",
    borderColor,
    bg: inputBg,
    _focus: {
      borderColor: BRAND_BLUE,
      boxShadow: `0 0 0 1px ${BRAND_BLUE}`,
    },
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

    const heroUrl = tenantData.landing?.hero?.image_url || "";
    setHeroImageUrl(heroUrl);

    setMediaPreview((prev) => ({
      ...prev,
      avatar: tenantData.avatar_url || prev.avatar,
      favicon: tenantData.favicon_url || prev.favicon,
      og_image: tenantData.og_image_url || prev.og_image,
      hero_image: heroUrl || prev.hero_image,
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

  /** نفس مصدر المنصات في الصفحة الرئيسية للأدمن */
  useEffect(() => {
    let mounted = true;
    const loadExistingSubdomains = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setSubdomainsLoading(true);
      try {
        const map = new Map();
        let offset = 0;
        const limit = 200;
        let safety = 0;

        while (mounted && safety < 50) {
          safety += 1;
          const result = await fetchAdminTenants(
            {
              limit,
              offset,
              include_default: true,
              include_deleted: false,
            },
            token,
          );

          for (const t of result.tenants) {
            const key = String(t.subdomain || "")
              .trim()
              .toLowerCase();
            if (!key) continue;
            map.set(key, {
              id: t.id,
              display_name: t.display_name || t.subdomain,
              is_active: t.is_active !== false,
              subdomain: t.subdomain,
            });
          }

          offset += result.tenants.length;
          if (!result.tenants.length || offset >= result.total) break;
        }

        if (mounted) setExistingSubdomains(map);
      } catch {
        if (mounted) setExistingSubdomains(new Map());
      } finally {
        if (mounted) setSubdomainsLoading(false);
      }
    };

    loadExistingSubdomains();
    return () => {
      mounted = false;
    };
  }, []);

  const subdomainConflict = useMemo(() => {
    const sub = String(tenant.subdomain || "")
      .trim()
      .toLowerCase();
    if (sub.length < 2) return null;

    const hit = existingSubdomains.get(sub);
    if (!hit) return null;

    if (formMode === "edit" && targetTenantId && String(hit.id) === String(targetTenantId)) {
      return null;
    }
    return hit;
  }, [tenant.subdomain, existingSubdomains, formMode, targetTenantId]);

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

    if (subdomainConflict) {
      toast({
        title: "النطاق الفرعي مستخدم",
        description: `«${sub}» مسجّل لمنصة «${subdomainConflict.display_name}» — اختر معرّفاً مختلفاً.`,
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
    const landingPayload =
      buildLandingPayload(heroImageUrl, !!mediaFiles.hero_image) ||
      (formMode === "create" ? {} : null);
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
            landingPayload,
          });
          if (uploadFiles.avatar) fd.append("avatar", uploadFiles.avatar);
          if (uploadFiles.favicon) fd.append("favicon", uploadFiles.favicon);
          if (uploadFiles.og_image) fd.append("og_image", uploadFiles.og_image);
          if (uploadFiles.hero_image) fd.append("hero_image", uploadFiles.hero_image);
          response = await patchAdminTenantMultipart(tenantId, fd, token);
        } else {
          const body = buildAdminTenantEditJson({
            tenant,
            sub,
            settings,
            ownerPatch,
            landingPayload,
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
          landingPayload,
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
          landingPayload,
        });
        response = await baseUrl.post("/api/super/tenants", body, {
          headers: jsonSuperHeaders(token),
        });
      }

      const t = response.data?.data ?? response.data?.tenant;
      if (t?.subdomain) {
        const key = String(t.subdomain).trim().toLowerCase();
        setExistingSubdomains((prev) => {
          const next = new Map(prev);
          next.set(key, {
            id: t.id,
            display_name: t.display_name || t.subdomain,
            is_active: t.is_active !== false,
            subdomain: t.subdomain,
          });
          return next;
        });
      }
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
  const isEditMode = formMode === "edit";

  return (
    <Box
      as="main"
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      fontFamily="'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif"
      pb={{ base: "110px", md: "120px" }}
    >
      {/* Standalone top bar */}
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={30}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Box h="3px" bg={`linear-gradient(90deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`} />
        <Container maxW="1080px" py={3.5} px={{ base: 4, md: 6 }}>
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <HStack spacing={3} minW={0}>
              <Button
                as={RouterLink}
                to="/home"
                variant="ghost"
                size="sm"
                leftIcon={<FaArrowRight />}
                color={mutedColor}
                fontWeight="600"
                borderRadius="lg"
                cursor="pointer"
                _hover={{ bg: btnGhostHover, color: textColor }}
              >
                العودة
              </Button>
              <Box
                w="1px"
                h="28px"
                bg={borderColor}
                display={{ base: "none", sm: "block" }}
              />
              <Box minW={0}>
                <Text fontWeight="800" fontSize={{ base: "md", md: "lg" }} noOfLines={1}>
                  {isEditMode ? "تعديل منصة مدرس" : "إنشاء منصة مدرس"}
                </Text>
                <Text fontSize="xs" color={mutedColor} display={{ base: "none", sm: "block" }}>
                  مسؤول النظام · صفحة مستقلة
                </Text>
              </Box>
            </HStack>

            <HStack spacing={2}>
              <Badge
                bg={badgeBlueBg}
                color={BRAND_BLUE}
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="700"
                textTransform="none"
              >
                {isEditMode ? "تعديل" : "إنشاء"}
              </Badge>
              <Badge
                bg={multipart ? "orange.50" : badgeGrayBg}
                color={multipart ? BRAND_ORANGE : mutedColor}
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="700"
                textTransform="none"
              >
                {multipart ? "مع رفع صور" : "JSON"}
              </Badge>
              <IconButton
                as={RouterLink}
                to="/home"
                aria-label="الرئيسية"
                icon={<FaHome />}
                size="sm"
                variant="outline"
                borderRadius="lg"
                borderColor={borderColor}
                display={{ base: "none", md: "inline-flex" }}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="1080px" px={{ base: 4, md: 6 }} pt={{ base: 6, md: 8 }}>
        <VStack spacing={5} align="stretch">
          <Box
            borderRadius="xl"
            borderWidth="1px"
            borderColor={tipBorder}
            bg={tipBg}
            px={4}
            py={3}
          >
            <Text fontSize="sm" color={mutedColor} lineHeight="tall">
              يتطلب حساب <strong style={{ color: textColor }}>مسؤول النظام</strong>. على localhost تُضاف
              تلقائياً ترويسة{" "}
              <Text as="span" dir="ltr" fontFamily="mono" fontSize="xs" color={BRAND_BLUE}>
                X-Tenant-Subdomain: default
              </Text>
              . رفع صورة يستبدل الرابط النصي لنفس الحقل.
            </Text>
          </Box>

          <form onSubmit={handleSubmit} id="add-teacher-form">
            {loadingTenant && (
              <Flex justify="center" align="center" py={10} direction="column" gap={3}>
                <Spinner size="lg" color={BRAND_BLUE} />
                <Text color={mutedColor}>جاري تحميل بيانات المنصة...</Text>
              </Flex>
            )}

            <VStack spacing={5} align="stretch">
              <SectionCard
                step="1"
                title="المنصة والنطاق"
                subtitle="معرّف الرابط الفرعي واسم العرض إلزاميان عند الإنشاء."
                accent="blue"
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={5}>
                  <FormControl>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                  {isEditMode ? (
                    <FormControl>
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        Tenant ID
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
                  <FormControl isRequired={!isEditMode} isInvalid={!!subdomainConflict}>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      معرّف الرابط الفرعي
                    </FormLabel>
                    <Input
                      {...inputProps}
                      placeholder="ahmed-math"
                      value={tenant.subdomain}
                      onChange={(e) =>
                        setTenantField("subdomain", e.target.value.toLowerCase())
                      }
                      dir="ltr"
                      fontFamily="mono"
                      borderColor={subdomainConflict ? "red.400" : borderColor}
                      _focus={
                        subdomainConflict
                          ? {
                              borderColor: "red.400",
                              boxShadow: "0 0 0 1px var(--chakra-colors-red-400)",
                            }
                          : inputProps._focus
                      }
                    />
                    {subdomainConflict ? (
                      <FormErrorMessage fontSize="sm" mt={2}>
                        النطاق «{subdomainConflict.subdomain}» مستخدم بالفعل لمنصة «
                        {subdomainConflict.display_name}»
                        {subdomainConflict.is_active ? " (نشطة)" : " (موقوفة)"} — اختر معرّفاً
                        مختلفاً.
                      </FormErrorMessage>
                    ) : (
                      <FormHelperText>
                        أحرف إنجليزية صغيرة وأرقام وشرطة (2–63).
                        {subdomainsLoading ? " جاري مطابقة المنصات الموجودة…" : ""}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl isRequired={!isEditMode}>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      اسم العرض
                    </FormLabel>
                    <Input
                      {...inputProps}
                      placeholder="اسم المدرس أو العلامة"
                      value={tenant.display_name}
                      onChange={(e) => setTenantField("display_name", e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      التخصص
                    </FormLabel>
                    <Input
                      {...inputProps}
                      value={tenant.specialty}
                      onChange={(e) => setTenantField("specialty", e.target.value)}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel mb={0} fontWeight="600" color={textColor} fontSize="sm">
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
                  <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                    نبذة
                  </FormLabel>
                  <Textarea
                    {...inputProps}
                    rows={3}
                    value={tenant.bio}
                    onChange={(e) => setTenantField("bio", e.target.value)}
                  />
                </FormControl>
              </SectionCard>

              <SectionCard
                step="2"
                title="الصور والروابط"
                subtitle="رابط نصي أو رفع ملف — الملف المرفوع يتغلب على الرابط."
                accent="orange"
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
                  <FormControl>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      رابط الصورة الرئيسية
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="https://..."
                      value={tenant.avatar_url}
                      onChange={(e) => setTenantField("avatar_url", e.target.value)}
                      isDisabled={!!mediaFiles.avatar}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      رابط أيقونة الموقع
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="https://..."
                      value={tenant.favicon_url}
                      onChange={(e) => setTenantField("favicon_url", e.target.value)}
                      isDisabled={!!mediaFiles.favicon}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      رابط صورة المشاركة (OG)
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="https://..."
                      value={tenant.og_image_url}
                      onChange={(e) => setTenantField("og_image_url", e.target.value)}
                      isDisabled={!!mediaFiles.og_image}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                      رابط صورة الهيرو
                    </FormLabel>
                    <Input
                      {...inputProps}
                      dir="ltr"
                      placeholder="https://..."
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      isDisabled={!!mediaFiles.hero_image}
                    />
                    <FormHelperText>
                      تظهر في قسم الهيرو بصفحة الهبوط العامة للمنصة.
                    </FormHelperText>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FileDropSlot
                    label="رفع الصورة الرئيسية"
                    hint="PNG شفاف مدعوم"
                    fieldKey="avatar"
                    previewUrl={mediaPreview.avatar}
                    onFile={(f) => setMediaFile("avatar", f)}
                    onClear={() => clearMediaFile("avatar")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                  <FileDropSlot
                    label="رفع الأيقونة"
                    hint="PNG صغير مفضّل"
                    fieldKey="favicon"
                    previewUrl={mediaPreview.favicon}
                    onFile={(f) => setMediaFile("favicon", f)}
                    onClear={() => clearMediaFile("favicon")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                  <FileDropSlot
                    label="رفع صورة OG"
                    hint="PNG أو JPG"
                    fieldKey="og_image"
                    previewUrl={mediaPreview.og_image}
                    onFile={(f) => setMediaFile("og_image", f)}
                    onClear={() => clearMediaFile("og_image")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                  <FileDropSlot
                    label="رفع صورة الهيرو"
                    hint="صورة الواجهة البارزة — PNG شفاف حتى 4MB"
                    fieldKey="hero_image"
                    previewUrl={mediaPreview.hero_image}
                    onFile={(f) => setMediaFile("hero_image", f)}
                    onClear={() => clearMediaFile("hero_image")}
                    borderColor={borderColor}
                    mutedColor={mutedColor}
                    uploadKey={uploadKey}
                  />
                </SimpleGrid>
              </SectionCard>

              <Accordion allowToggle borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
                <AccordionItem border="none" bg={headerBg}>
                  <h2>
                    <AccordionButton py={4} px={{ base: 4, md: 6 }} _hover={{ bg: "transparent" }}>
                      <HStack flex="1" textAlign="start" spacing={3}>
                        <Icon as={FaIdCard} color={BRAND_BLUE} />
                        <Box>
                          <Text fontWeight="700">تحسين الظهور (SEO)</Text>
                          <Text fontSize="sm" color={mutedColor}>
                            اختياري — إن تُرك فارغاً يُستخدم اسم العرض
                          </Text>
                        </Box>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={6} px={{ base: 4, md: 6 }} pt={0}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">
                          عنوان نتائج البحث
                        </FormLabel>
                        <Input
                          {...inputProps}
                          value={tenant.seo_title}
                          onChange={(e) => setTenantField("seo_title", e.target.value)}
                        />
                      </FormControl>
                      <FormControl gridColumn={{ md: "1 / -1" }}>
                        <FormLabel fontSize="sm" fontWeight="600">
                          وصف مختصر
                        </FormLabel>
                        <Textarea
                          {...inputProps}
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
                step="3"
                title="حساب مالك المنصة"
                subtitle="مطلوب عند الإنشاء بمدرس: الاسم، البريد، وكلمة المرور (6 أحرف على الأقل)."
                accent="blue"
              >
                <HStack justify="space-between" mb={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="sm" color={mutedColor}>
                    عطّل الخيار لإنشاء منصة بدون حساب مالك.
                  </Text>
                  <Switch
                    isChecked={ownerEnabled}
                    onChange={(e) => setOwnerEnabled(e.target.checked)}
                    colorScheme="blue"
                    size="lg"
                  />
                </HStack>
                {ownerEnabled ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                    <FormControl isRequired={!isEditMode}>
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        <HStack spacing={2}>
                          <Icon as={FaUserTie} color={BRAND_BLUE} />
                          <Text>الاسم</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        {...inputProps}
                        value={owner.name}
                        onChange={(e) => setOwnerField("name", e.target.value)}
                      />
                    </FormControl>
                    <FormControl isRequired={!isEditMode}>
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        <HStack spacing={2}>
                          <Icon as={FaEnvelope} color={BRAND_BLUE} />
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
                    <FormControl isRequired={!isEditMode}>
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        <HStack spacing={2}>
                          <Icon as={FaLock} color={BRAND_BLUE} />
                          <Text>كلمة المرور</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        {...inputProps}
                        type="password"
                        placeholder={isEditMode ? "اتركه فارغاً إن لم تُرد تغييره" : "6 أحرف على الأقل"}
                        value={owner.password}
                        onChange={(e) => setOwnerField("password", e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        <HStack spacing={2}>
                          <Icon as={FaBook} color={BRAND_ORANGE} />
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        واتساب
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                    {isEditMode && (
                      <FormControl>
                        <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
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
                      <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                        الصفوف الدراسية
                      </FormLabel>
                      <Text fontSize="sm" color={mutedColor} mb={3}>
                        تحدد الصفوف المرتبطة بالمدرس عند الإنشاء.
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
                              <Checkbox key={grade.id} value={String(grade.id)} colorScheme="blue">
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
                step="4"
                title="إعدادات إضافية"
                subtitle="اختياري — كائن JSON يُخزَّن مع إعدادات المستأجر."
                accent="orange"
              >
                <FormControl>
                  <FormLabel fontWeight="600" color={textColor} fontSize="sm">
                    <HStack spacing={2}>
                      <Icon as={FaCog} />
                      <Text>إعدادات (JSON)</Text>
                    </HStack>
                  </FormLabel>
                  <Textarea
                    dir="ltr"
                    fontFamily="mono"
                    fontSize="sm"
                    placeholder='{"key": "value"}'
                    value={settingsJson}
                    onChange={(e) => setSettingsJson(e.target.value)}
                    rows={5}
                    borderRadius="lg"
                    borderColor={borderColor}
                    bg={inputBg}
                  />
                  <FormHelperText>اتركه فارغاً إن لم تكن بحاجة لإعدادات تقنية.</FormHelperText>
                </FormControl>
              </SectionCard>
            </VStack>
          </form>
        </VStack>
      </Container>

      {/* Sticky action bar */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={40}
        bg={footerBg}
        borderTopWidth="1px"
        borderColor={borderColor}
        boxShadow="0 -8px 24px rgba(15,23,42,0.06)"
        py={3}
        px={4}
      >
        <Container maxW="1080px" px={{ base: 0, md: 6 }}>
          <Flex
            gap={3}
            align="center"
            justify="space-between"
            flexDir={{ base: "column-reverse", sm: "row" }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              isDisabled={loading}
              borderRadius="lg"
              w={{ base: "full", sm: "auto" }}
              cursor="pointer"
            >
              مسح النموذج
            </Button>
            <HStack spacing={3} w={{ base: "full", sm: "auto" }}>
              <Button
                type="button"
                variant="outline"
                borderColor={borderColor}
                onClick={() => navigate("/home")}
                borderRadius="lg"
                display={{ base: "none", md: "inline-flex" }}
                cursor="pointer"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="add-teacher-form"
                flex={1}
                minW={{ sm: "240px" }}
                bg={BRAND_BLUE}
                color="white"
                size="lg"
                h="48px"
                borderRadius="lg"
                fontWeight="700"
                leftIcon={loading ? undefined : <FaSave />}
                isLoading={loading || compressingMedia}
                isDisabled={compressingMedia || !!subdomainConflict}
                loadingText={
                  compressingMedia
                    ? "ضغط الصور..."
                    : isEditMode
                      ? "جاري التحديث..."
                      : "جاري الإنشاء..."
                }
                cursor="pointer"
                _hover={{ bg: "#2B6CB0" }}
                boxShadow="0 10px 24px -8px rgba(49,130,206,0.45)"
              >
                {isEditMode
                  ? multipart
                    ? "تحديث مع الصور"
                    : "تحديث المنصة"
                  : multipart
                    ? "إنشاء مع الصور"
                    : "إنشاء المنصة"}
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default AddTeacher;
