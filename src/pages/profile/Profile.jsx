import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCamera,
  FaCalendarAlt,
  FaEdit,
  FaGraduationCap,
  FaPhone,
  FaUserFriends,
  FaIdCard,
  FaUsers,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { IoPersonCircleSharp } from "react-icons/io5";
import { MdAttachEmail, MdClose, MdLock } from "react-icons/md";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import baseUrl from "../../api/baseUrl";
import { resolvePublicImageUrl } from "../../utils/highQualityImageUrl";

const ACCOUNT_STATUS_LABELS = {
  active: { label: "نشط", tone: "ok" },
  pending: { label: "قيد المراجعة", tone: "warn" },
  blocked: { label: "محظور", tone: "bad" },
  inactive: { label: "غير نشط", tone: "muted" },
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatTimeRange(start, end) {
  if (!start && !end) return null;
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function InfoChip({ icon: Icon, label, value, accent = "blue" }) {
  const accents = {
    blue: "border-blue-100 bg-blue-50/80 text-blue-700",
    orange: "border-orange-100 bg-orange-50/80 text-orange-700",
    emerald: "border-emerald-100 bg-emerald-50/80 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/80 text-amber-700",
    violet: "border-violet-100 bg-violet-50/80 text-violet-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  const iconBox = {
    blue: "bg-blue-500/15 text-blue-600",
    orange: "bg-orange-500/15 text-orange-600",
    emerald: "bg-emerald-500/15 text-emerald-600",
    amber: "bg-amber-500/15 text-amber-600",
    violet: "bg-violet-500/15 text-violet-600",
    slate: "bg-slate-200/80 text-slate-600",
  };

  return (
    <div className={`rounded-2xl border p-4 ${accents[accent] || accents.blue}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBox[accent] || iconBox.blue}`}
        >
          <Icon className="text-sm" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[11px] font-bold opacity-80">{label}</p>
          <p className="mt-1 break-words text-sm font-extrabold text-slate-900">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ title, icon: Icon, group, emptyText, canChoose }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E4C92]/10 text-[#0E4C92]">
            <Icon />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 md:text-lg">{title}</h3>
            {canChoose ? (
              <p className="mt-0.5 text-xs text-emerald-600">يمكنك تغييرها من «تعديل البيانات»</p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-500">يُدار من قبل المنصة / المدرس</p>
            )}
          </div>
        </div>
      </div>

      {group ? (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-bl from-[#0E4C92]/5 to-orange-50/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-heading text-lg font-extrabold text-slate-900">{group.name}</p>
              {group.grade_name ? (
                <p className="mt-1 text-sm text-slate-600">{group.grade_name}</p>
              ) : null}
            </div>
            {group.status ? (
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#0E4C92]">
                {group.status === "active" ? "نشطة" : group.status}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {group.days ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1">
                <FaCalendarAlt className="text-[10px] text-orange-500" />
                {group.days}
              </span>
            ) : null}
            {formatTimeRange(group.start_time, group.end_time) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1">
                <FaClock className="text-[10px] text-blue-500" />
                {formatTimeRange(group.start_time, group.end_time)}
              </span>
            ) : null}
            {group.number_in_group != null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1">
                رقمك في المجموعة: {group.number_in_group}
              </span>
            ) : null}
            {group.joined_at ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1">
                انضممت: {formatDate(group.joined_at)}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </section>
  );
}

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageMessage, setPageMessage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    parent_phone: "",
    password: "",
    group_id: "",
    course_group_id: "",
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [selectedAvatarPreview, setSelectedAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const directAvatarInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (selectedAvatarPreview) URL.revokeObjectURL(selectedAvatarPreview);
    };
  }, [selectedAvatarPreview]);

  const applyProfile = useCallback((data) => {
    if (!data) return;
    const { success, message, ...profile } = data;
    setUser(profile);
    if (message) setPageMessage(message);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("يرجى تسجيل الدخول للوصول إلى الملف الشخصي.");
        setUser(null);
        return;
      }
      const response = await baseUrl.get("/api/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      applyProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب البيانات. حاول مرة أخرى.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const gradeText = useMemo(() => {
    if (!user) return "غير محدد";
    const grades = user.grades;
    if (Array.isArray(grades) && grades.length > 0) {
      return grades.map((g) => g?.name).filter(Boolean).join("، ");
    }
    return "غير محدد";
  }, [user]);

  const statusMeta = ACCOUNT_STATUS_LABELS[user?.account_status] || {
    label: user?.account_status || "—",
    tone: "muted",
  };

  const avatarSrc = useMemo(() => {
    if (selectedAvatarPreview) return selectedAvatarPreview;
    return resolvePublicImageUrl(user?.avatar) || user?.avatar || null;
  }, [selectedAvatarPreview, user?.avatar]);

  const openEditModal = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      parent_phone: user?.parent_phone || "",
      password: "",
      group_id: user?.study_group?.id ?? "",
      course_group_id: user?.course_group?.id ?? "",
    });
    setSelectedAvatarFile(null);
    setSelectedAvatarPreview(null);
    setEditModalVisible(true);
    setError(null);
    setPageMessage(null);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditing(false);
    setSelectedAvatarFile(null);
    setSelectedAvatarPreview(null);
  };

  const uploadAvatar = async (file) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("يرجى تسجيل الدخول لتغيير الصورة الشخصية.");
      return false;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const response = await baseUrl.put("/api/student/me/avatar", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const avatarUrl = response.data?.data?.avatar;
      if (avatarUrl) {
        setUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
      }
      setPageMessage(response.data?.message || "تم تحديث الصورة الشخصية");
      setError(null);
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || "فشل في تحديث الصورة الشخصية.");
      return false;
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setEditing(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("يرجى تسجيل الدخول لتحديث البيانات.");
        return;
      }

      if (selectedAvatarFile) {
        const ok = await uploadAvatar(selectedAvatarFile);
        if (!ok) return;
      }

      const payload = {};
      if (editForm.name?.trim() && editForm.name.trim() !== user?.name) {
        payload.name = editForm.name.trim();
      }
      if ((editForm.phone || "") !== (user?.phone || "")) {
        payload.phone = editForm.phone.trim();
      }
      if ((editForm.parent_phone || "") !== (user?.parent_phone || "")) {
        payload.parent_phone = editForm.parent_phone.trim() || null;
      }
      if ((editForm.email || "") !== (user?.email || "")) {
        payload.email = editForm.email.trim() || null;
      }
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }

      if (user?.can_choose_study_group) {
        const nextGroupId = editForm.group_id === "" ? null : Number(editForm.group_id);
        const currentGroupId = user?.study_group?.id ?? null;
        if (nextGroupId && nextGroupId !== currentGroupId) {
          payload.group_id = nextGroupId;
        }
      }

      if (user?.can_choose_course_group) {
        const nextCourseGroupId =
          editForm.course_group_id === "" ? null : Number(editForm.course_group_id);
        const currentCourseGroupId = user?.course_group?.id ?? null;
        if (nextCourseGroupId && nextCourseGroupId !== currentCourseGroupId) {
          payload.course_group_id = nextCourseGroupId;
        }
      }

      const avatarOnly = Boolean(selectedAvatarFile) && Object.keys(payload).length === 0;
      if (Object.keys(payload).length === 0 && !selectedAvatarFile) {
        setError("لم يتم تغيير أي بيانات.");
        return;
      }

      if (Object.keys(payload).length > 0) {
        const response = await baseUrl.put("/api/student/me", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        applyProfile(response.data);
        setPageMessage(response.data?.message || "تم تحديث البيانات بنجاح");
      } else if (avatarOnly) {
        setPageMessage((prev) => prev || "تم تحديث الصورة الشخصية");
      }

      closeEditModal();
    } catch (err) {
      setError(err?.response?.data?.message || "فشل في تحديث البيانات.");
    } finally {
      setEditing(false);
    }
  };

  const onAvatarFileChangeDirect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = "";
  };

  const onAvatarFileChangeModal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedAvatarPreview) URL.revokeObjectURL(selectedAvatarPreview);
    setSelectedAvatarFile(file);
    setSelectedAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const statusToneClass = {
    ok: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
    warn: "bg-amber-500/15 text-amber-700 border-amber-200",
    bad: "bg-red-500/15 text-red-700 border-red-200",
    muted: "bg-slate-500/10 text-slate-600 border-slate-200",
  };

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#E8EEF5_0%,#F7F9FC_45%,#EEF2F7_100%)] pb-16 pt-[5.5rem] md:pt-[6.25rem]"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        {loading ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#0E4C92] border-t-transparent" />
            <p className="font-semibold text-slate-600">جاري تحميل الملف الشخصي...</p>
          </div>
        ) : error && !user ? (
          <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <FaExclamationTriangle className="mx-auto mb-3 text-3xl text-red-500" />
            <p className="text-lg font-bold text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchMe}
              className="mt-5 rounded-xl bg-[#0E4C92] px-5 py-2.5 text-sm font-bold text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : user ? (
          <div className="space-y-5">
            {pageMessage ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <FaCheckCircle />
                {pageMessage}
              </div>
            ) : null}
            {error && editModalVisible === false ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            ) : null}

            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border border-white/20 shadow-[0_24px_60px_-28px_rgba(8,43,87,0.55)]">
              <div className="absolute inset-0 bg-[linear-gradient(125deg,#082B57_0%,#0E4C92_48%,#1A6BB8_100%)]" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 70% 80% at 100% 0%, rgba(221,107,32,0.28), transparent 45%), radial-gradient(ellipse 60% 70% at 0% 100%, rgba(255,255,255,0.12), transparent 50%)",
                }}
              />
              <div className="relative z-10 px-5 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8">
                <div className="flex flex-col items-center gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
                    <div className="relative">
                      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white/90 bg-white/10 shadow-xl md:h-32 md:w-32">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt={user.name || "avatar"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <IoPersonCircleSharp className="text-6xl text-white/80" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={() => directAvatarInputRef.current?.click()}
                        className="absolute -bottom-1 -left-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#DD6B20] text-white shadow-lg transition hover:bg-[#C05621] disabled:opacity-60"
                        aria-label="تغيير الصورة"
                      >
                        <FaCamera className="text-sm" />
                      </button>
                      <input
                        ref={directAvatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={onAvatarFileChangeDirect}
                      />
                    </div>

                    <div className="text-center md:text-right">
                      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur">
                          طالب
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusToneClass[statusMeta.tone]}`}
                        >
                          {statusMeta.label}
                        </span>
                        {user.must_change_password ? (
                          <span className="rounded-full border border-amber-200 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-100">
                            يُفضّل تغيير كلمة المرور
                          </span>
                        ) : null}
                      </div>
                      <h1 className="font-heading text-2xl font-black tracking-tight text-white md:text-3xl">
                        {user.name || "طالب"}
                      </h1>
                      <p className="mt-2 text-sm text-white/75">
                        {gradeText}
                        {user.student_code ? ` · كود الطالب ${user.student_code}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openEditModal}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#DD6B20] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_-12px_rgba(221,107,32,0.9)] transition hover:bg-[#C05621]"
                  >
                    <FaEdit />
                    تعديل البيانات
                  </button>
                </div>
              </div>
            </section>

            {/* Account summary */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-slate-900">بيانات الحساب</h2>
                <span className="text-xs font-semibold text-slate-500">
                  انضممت: {formatDate(user.created_at)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoChip icon={FaIdCard} label="كود الطالب" value={user.student_code || "—"} accent="blue" />
                <InfoChip icon={FaGraduationCap} label="الصف / المرحلة" value={gradeText} accent="orange" />
                <InfoChip icon={FaPhone} label="رقم الهاتف" value={user.phone} accent="emerald" />
                <InfoChip icon={FaUserFriends} label="ولي الأمر" value={user.parent_phone} accent="amber" />
                <InfoChip icon={MdAttachEmail} label="البريد الإلكتروني" value={user.email} accent="violet" />
                <InfoChip icon={FaCalendarAlt} label="تاريخ الانضمام" value={formatDate(user.created_at)} accent="slate" />
              </div>
            </section>

            {/* Groups */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <GroupCard
                title="المجموعة الدراسية"
                icon={FaUsers}
                group={user.study_group}
                emptyText="لست منضمًا لمجموعة دراسية بعد"
                canChoose={Boolean(user.can_choose_study_group)}
              />
              <GroupCard
                title="مجموعة الكورس"
                icon={FaBookOpen}
                group={user.course_group}
                emptyText="لست منضمًا لمجموعة كورس بعد"
                canChoose={Boolean(user.can_choose_course_group)}
              />
            </div>

            {(user.can_choose_study_group || user.can_choose_course_group) && (
              <p className="text-center text-sm text-slate-500">
                لتغيير مجموعتك، اضغط «تعديل البيانات» واختر المجموعة المناسبة ثم احفظ.
              </p>
            )}

            {/* Edit Modal */}
            {editModalVisible && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
                <button type="button" className="absolute inset-0 cursor-default" aria-label="إغلاق" onClick={closeEditModal} />
                <div
                  className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl sm:p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-heading text-xl font-extrabold text-slate-900">تعديل الملف الشخصي</h3>
                    <button
                      type="button"
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                      onClick={closeEditModal}
                      aria-label="إغلاق"
                    >
                      <MdClose className="text-xl" />
                    </button>
                  </div>

                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-4 ring-white shadow-lg">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="avatar preview" className="h-full w-full object-cover" />
                        ) : (
                          <IoPersonCircleSharp className="text-6xl text-[#0E4C92]" />
                        )}
                      </div>
                      <button
                        type="button"
                        className="absolute -bottom-1 -left-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0E4C92] text-white shadow-lg"
                        onClick={() => modalAvatarInputRef.current?.click()}
                        aria-label="اختيار صورة"
                      >
                        <FaCamera />
                      </button>
                      <input
                        ref={modalAvatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={onAvatarFileChangeModal}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <IoPersonCircleSharp className="text-[#0E4C92]" /> الاسم
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <FaPhone className="text-[#0E4C92]" /> رقم الهاتف
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <FaUserFriends className="text-[#0E4C92]" /> رقم ولي الأمر
                      </span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                        value={editForm.parent_phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, parent_phone: e.target.value }))}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <MdAttachEmail className="text-[#0E4C92]" /> البريد الإلكتروني
                      </span>
                      <input
                        type="email"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                        <MdLock className="text-[#0E4C92]" /> كلمة مرور جديدة (اختياري)
                      </span>
                      <input
                        type="password"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                        placeholder="اتركها فارغة إن لم ترد التغيير"
                        value={editForm.password}
                        onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                      />
                    </label>

                    {user.can_choose_study_group ? (
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                          <FaUsers className="text-[#0E4C92]" /> المجموعة الدراسية
                        </span>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                          value={editForm.group_id}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              group_id: e.target.value ? Number(e.target.value) : "",
                            }))
                          }
                        >
                          <option value="">— اختر مجموعة —</option>
                          {(user.available_study_groups || []).map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                              {g.days ? ` · ${g.days}` : ""}
                              {formatTimeRange(g.start_time, g.end_time)
                                ? ` · ${formatTimeRange(g.start_time, g.end_time)}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {user.can_choose_course_group ? (
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                          <FaBookOpen className="text-[#0E4C92]" /> مجموعة الكورس
                        </span>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#0E4C92] focus:ring-2 focus:ring-[#0E4C92]/15"
                          value={editForm.course_group_id}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              course_group_id: e.target.value ? Number(e.target.value) : "",
                            }))
                          }
                        >
                          <option value="">— اختر مجموعة —</option>
                          {(user.available_course_groups || []).map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                              {g.grade_name ? ` · ${g.grade_name}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  {error ? <p className="mt-4 text-center text-sm font-semibold text-red-600">{error}</p> : null}

                  <button
                    type="button"
                    disabled={editing || avatarUploading}
                    onClick={handleUpdateProfile}
                    className="mt-6 w-full rounded-2xl bg-[#0E4C92] py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0a3a70] disabled:opacity-70"
                  >
                    {editing ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold text-slate-700">لا تتوفر بيانات حالياً</p>
            <p className="mt-2 text-sm text-slate-500">يرجى تسجيل الدخول لعرض ملفك الشخصي.</p>
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Profile;
