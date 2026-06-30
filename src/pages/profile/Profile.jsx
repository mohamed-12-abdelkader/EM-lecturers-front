import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
import { MdAttachEmail } from "react-icons/md";
import { MdClose } from "react-icons/md";
import { FaCamera, FaCalendarAlt, FaEdit, FaGraduationCap, FaPhone, FaUserFriends } from "react-icons/fa";
import ScrollToTop from "../../components/scollToTop/ScrollToTop"; // Ensure this path is correct
import baseUrl from "../../api/baseUrl";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    parent_phone: "",
    password: "",
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [selectedAvatarPreview, setSelectedAvatarPreview] = useState(null);

  const directAvatarInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);

  // Prevent memory leaks from object URLs
  useEffect(() => {
    return () => {
      if (selectedAvatarPreview) URL.revokeObjectURL(selectedAvatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAvatarPreview]);
  
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("يرجى تسجيل الدخول للوصول إلى الملف الشخصي.");
          setLoading(false);
          return;
        }
        const response = await baseUrl.get("/api/student/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "فشل في جلب البيانات. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  // Helper to render grade text from array or id/string
  const getGradeText = useMemo(() => {
    if (!user) return "غير محدد";
    const grade = user?.grades;
    if (Array.isArray(grade)) {
      if (grade.length === 0) return "غير محدد";
      return grade.map((g) => g?.name).filter(Boolean).join("، ");
    }
    if (typeof grade === "string") return grade || "غير محدد";
    switch (parseInt(grade)) {
      case 1:
        return "الصف الأول الثانوي";
      case 2:
        return "الصف الثاني الثانوي";
      case 3:
        return "الصف الثالث الثانوي";
      default:
        return "غير محدد";
    }
  }, [user]);

  const roleText = useMemo(() => {
    if (!user) return "";
    return user?.role === "student" ? "طالب" : user?.role || "عضو";
  }, [user]);

  const joinedText = useMemo(() => {
    if (!user?.created_at) return "غير متوفر";
    try {
      return new Date(user.created_at).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "غير متوفر";
    }
  }, [user]);

  const openEditModal = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      parent_phone: user?.parent_phone || "",
      password: "",
    });
    setSelectedAvatarFile(null);
    setSelectedAvatarPreview(null);
    setEditModalVisible(true);
    setError(null);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditing(false);
    setError(null);
  };

  const onPickAvatarDirect = () => {
    directAvatarInputRef.current?.click();
  };

  const onPickAvatarInModal = () => {
    modalAvatarInputRef.current?.click();
  };

  const uploadAvatarDirect = async (file) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("يرجى تسجيل الدخول لتغيير الصورة الشخصية.");
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      setLoading(true);
      const response = await baseUrl.put("/api/user/me", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUser(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "فشل في تحديث الصورة الشخصية.");
    } finally {
      setLoading(false);
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

      const hasAvatar = !!selectedAvatarFile;
      const hasData =
        editForm.name ||
        editForm.email ||
        editForm.phone ||
        editForm.parent_phone ||
        editForm.password;

      if (!hasData && !hasAvatar) {
        setError("يرجى إدخال بيانات للتحديث.");
        return;
      }

      if (hasAvatar) {
        const formData = new FormData();
        if (editForm.name) formData.append("name", editForm.name);
        if (editForm.email) formData.append("email", editForm.email);
        if (editForm.phone) formData.append("phone", editForm.phone);
        if (editForm.parent_phone) formData.append("parent_phone", editForm.parent_phone);
        if (editForm.password) formData.append("password", editForm.password);
        formData.append("avatar", selectedAvatarFile);

        const response = await baseUrl.put("/api/user/me", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setUser(response.data);
      } else {
        const payload = {
          ...(editForm.name ? { name: editForm.name } : {}),
          ...(editForm.email ? { email: editForm.email } : {}),
          ...(editForm.phone ? { phone: editForm.phone } : {}),
          ...(editForm.parent_phone ? { parent_phone: editForm.parent_phone } : {}),
          ...(editForm.password ? { password: editForm.password } : {}),
        };

        const response = await baseUrl.put("/api/user/me", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setUser(response.data);
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
    await uploadAvatarDirect(file);
    // Clear input so selecting the same file again triggers change
    e.target.value = "";
  };

  const onAvatarFileChangeModal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedAvatarFile(file);
    setSelectedAvatarPreview(URL.createObjectURL(file));
    // eslint-disable-next-line no-param-reassign
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-slate-100 flex flex-col items-center py-16 md:py-20 px-4" dir="rtl">
      <div className="w-full max-w-3xl bg-white/95 dark:bg-gray-900/85 rounded-3xl shadow-[0_30px_80px_-20px_rgba(15,23,42,0.22)] overflow-hidden my-8 md:my-10 transition-all duration-500 border border-blue-100/70 dark:border-blue-400/10 backdrop-blur-xl">
        {loading ? (
          <div className="p-10 text-center">
            <p className="text-xl font-semibold text-gray-600">جاري تحميل البيانات...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-xl font-semibold text-red-600">{error}</p>
          </div>
        ) : user ? (
          <>
            {/* Cover */}
            <div className="relative h-32 md:h-40 w-full overflow-hidden">
              {user?.cover_photo ? (
                <img
                  src={user.cover_photo}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#0f3f96] via-[#1e63d6] to-[#3b82f6]" />
              )}
              {/* Decorative overlays */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_40%),linear-gradient(to_bottom,rgba(15,23,42,0.12),rgba(15,23,42,0.22))]" />
              <div className="absolute -top-12 -left-12 w-52 h-52 rounded-full bg-blue-300/25 blur-3xl" />
              <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-orange-300/20 blur-3xl" />

              <div className="absolute inset-x-0 bottom-5 px-6">
                <div className="inline-flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <div className="text-white font-extrabold text-lg md:text-xl drop-shadow">
                    ملفي الشخصي
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="relative -mt-16 md:-mt-14 px-5 md:px-7 pb-7 md:pb-8">
              {/* Avatar + Direct Update Badge */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white/90 shadow-[0_12px_28px_rgba(15,23,42,0.22)] bg-indigo-50 flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <IoPersonCircleSharp className="text-indigo-600" style={{ fontSize: 72 }} />
                    )}
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-[1.05] transition-transform"
                    role="button"
                    tabIndex={0}
                    onClick={onPickAvatarDirect}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onPickAvatarDirect();
                    }}
                  >
                    <FaCamera className="text-white" />
                  </div>
                </div>
              </div>

              {/* Hidden inputs */}
              <input
                ref={directAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarFileChangeDirect}
              />

              {/* User Info */}
              <div className="mb-6 md:flex md:items-start md:justify-between md:gap-7">
                <div className="text-center md:text-right flex-1">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                    {user?.name || "طالب جديد"}
                  </h2>
                  <div className="inline-flex items-center px-5 py-2 rounded-2xl bg-blue-500/15 border border-blue-200/70 dark:border-blue-300/20 gap-2">
                    <FaGraduationCap className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {roleText}
                    </span>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:w-[260px]">
                  <div className="rounded-3xl border border-blue-200/70 dark:border-blue-400/20 bg-white dark:bg-gray-800/50 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-center md:justify-end gap-3">
                      <FaCalendarAlt className="text-blue-600 dark:text-blue-400 text-lg" />
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-blue-700/80 dark:text-blue-300 mb-1">
                          تاريخ الانضمام
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {joinedText}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Summary */}
              <div className="rounded-3xl p-5 md:p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:shadow-none bg-white dark:bg-gray-800/60 border border-gray-100/80 dark:border-gray-700/60 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                    ملخص الحساب
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                    <FaEdit className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Grade */}
                  <div className="rounded-2xl border border-blue-100/70 dark:border-blue-400/20 bg-blue-50/60 dark:bg-blue-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <FaGraduationCap className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-extrabold text-blue-700/80 dark:text-blue-300">
                          المرحلة
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                          {getGradeText}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="rounded-2xl border border-emerald-100/70 dark:border-emerald-400/20 bg-emerald-50/60 dark:bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                        <FaPhone className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-extrabold text-emerald-700/80 dark:text-emerald-300">
                          موبايل
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                          {user?.phone || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parent */}
                  <div className="rounded-2xl border border-amber-100/70 dark:border-amber-400/20 bg-amber-50/60 dark:bg-amber-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                        <FaUserFriends className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-extrabold text-amber-700/80 dark:text-amber-300">
                          ولي الأمر
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                          {user?.parent_phone || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="rounded-2xl border border-violet-100/70 dark:border-violet-400/20 bg-violet-50/60 dark:bg-violet-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                        <MdAttachEmail className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-extrabold text-violet-700/80 dark:text-violet-300">
                          البريد
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate">
                          {user?.email || "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit CTA */}
              <div className="mt-5 flex justify-center md:justify-end">
                <button
                  type="button"
                  className="relative inline-flex items-center gap-3 px-9 py-3.5 rounded-2xl font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:brightness-105 transition"
                  onClick={openEditModal}
                  aria-label="تعديل البيانات"
                >
                  <FaEdit />
                  تعديل البيانات
                </button>
              </div>
            </div>

            {/* Edit Modal */}
            {editModalVisible && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
                <div
                  className="absolute inset-0"
                  onClick={closeEditModal}
                  aria-hidden="true"
                />

                <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
                  <div className="w-11 h-1.5 rounded-full bg-blue-500/30 mx-auto mb-5" />

                  <div className="flex items-center justify-between mb-5" dir="rtl">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">تعديل الملف الشخصي</h3>
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={closeEditModal}
                      aria-label="اغلاق"
                    >
                      <MdClose className="text-gray-700 dark:text-gray-200" />
                    </button>
                  </div>

                  {/* Avatar picker */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/80 shadow-lg bg-indigo-50 flex items-center justify-center">
                        {selectedAvatarPreview ? (
                          <img
                            src={selectedAvatarPreview}
                            alt="selected avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : user?.avatar ? (
                          <img src={user.avatar} alt="current avatar" className="w-full h-full object-cover" />
                        ) : (
                          <IoPersonCircleSharp className="text-indigo-600" style={{ fontSize: 70 }} />
                        )}
                      </div>

                      <button
                        type="button"
                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer"
                        onClick={onPickAvatarInModal}
                        aria-label="اختيار صورة"
                      >
                        <FaEdit className="text-white" />
                      </button>
                    </div>
                  </div>

                  <input
                    ref={modalAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarFileChangeModal}
                  />

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <IoPersonCircleSharp className="text-blue-600" />
                      <input
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-semibold"
                        placeholder="الاسم"
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <FaPhone className="text-blue-600" />
                      <input
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-semibold"
                        placeholder="رقم الهاتف"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <MdAttachEmail className="text-blue-600" />
                      <input
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-semibold"
                        placeholder="البريد الإلكتروني"
                        value={editForm.email}
                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <FaUserFriends className="text-blue-600" />
                      <input
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-semibold"
                        placeholder="رقم ولي الأمر"
                        value={editForm.parent_phone}
                        onChange={(e) => setEditForm((p) => ({ ...p, parent_phone: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <input
                        type="password"
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white font-semibold"
                        placeholder="كلمة المرور (اختياري)"
                        value={editForm.password}
                        onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-600 text-center mt-4 font-semibold">{error}</p>}

                  <button
                    type="button"
                    className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-extrabold shadow-md disabled:opacity-70"
                    disabled={editing}
                    onClick={handleUpdateProfile}
                  >
                    {editing ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-10 text-center">
            <p className="text-2xl font-bold text-gray-600">لا تتوفر بيانات حالياً.</p>
            <p className="text-md text-gray-500 mt-2">يرجى تسجيل الدخول لعرض ملفك الشخصي.</p>
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Profile;
