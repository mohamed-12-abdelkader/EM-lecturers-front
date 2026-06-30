import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorModeValue } from "@chakra-ui/react";
import baseUrl from "../../api/baseUrl";
import UserType from "../../Hooks/auth/userType";
import { Link } from "react-router-dom";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";

const PlatfourmLeagues = () => {
  const [userData, isAdmin, isTeacher, isStudent] = UserType();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMsg, setCreateMsg] = useState("");

  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [matchesCount, setMatchesCount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  // Join modal states (student)
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinLeague, setJoinLeague] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinMsg, setJoinMsg] = useState("");

  // Chakra color mode adaptive values
  const pageBg = useColorModeValue(
    "linear-gradient(to bottom right, #f8fafc, #eff6ff, #e0e7ff)",
    "linear-gradient(to bottom right, #0f172a, #0b1220, #0b1022)"
  );
  const headerBgClass = useColorModeValue(
    "bg-white/80 border-slate-200/60",
    "bg-slate-900/70 border-slate-700/60"
  );
  const cardBgClass = useColorModeValue(
    "bg-white/70 border-slate-200/60",
    "bg-slate-800/60 border-slate-700/60"
  );
  const statBgClass = useColorModeValue("bg-slate-50/80", "bg-slate-700/60");
  const modalBgClass = useColorModeValue("bg-white/95", "bg-slate-900/95");
  const modalBorderClass = useColorModeValue(
    "border-white/20",
    "border-white/10"
  );
  const sectionBgClass = useColorModeValue("bg-slate-50/50", "bg-slate-800/50");
  const inputBorderClass = useColorModeValue(
    "border-slate-300",
    "border-slate-600"
  );
  const inputBgClass = useColorModeValue("bg-white/50", "bg-slate-800/50");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Edit/Delete states
  const [editMode, setEditMode] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState("");

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    }),
    []
  );

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const endpoint =
        userData?.role === "student" ? "/api/leagues/student" : "/api/leagues";
      const res = await baseUrl.get(endpoint, { headers: authHeader });
      setTournaments(
        Array.isArray(res?.data) ? res.data : res?.data?.data || []
      );
    } catch (e) {
      setError("فشل في جلب الدوريات");
    } finally {
      setLoading(false);
    }
  }, [authHeader, userData?.role]);

  const fetchGrades = useCallback(async () => {
    try {
      setGradesLoading(true);
      setGradesError("");
      const res = await baseUrl.get("/api/users/grades", {
        headers: authHeader,
      });
      setGrades(res?.data?.grades || []);
    } catch (e) {
      setGradesError("تعذر جلب الصفوف الدراسية");
    } finally {
      setGradesLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchTournaments();
    fetchGrades();
  }, [fetchTournaments, fetchGrades]);

  const resetForm = () => {
    setName("");
    setGradeId("");
    setStartDate("");
    setEndDate("");
    setMatchesCount("");
    setDescription("");
    setPrice("");
    setImageFile(null);
    setImagePreview("");
    try {
      if (fileInputRef?.current) fileInputRef.current.value = "";
    } catch {}
    setCreateError("");
    setCreateMsg("");
    setEditMode(false);
    setEditingTournament(null);
  };

  const handleEdit = (tournament) => {
    setEditMode(true);
    setEditingTournament(tournament);
    setName(tournament.name || "");
    setGradeId(tournament.grade_id?.toString() || "");
    setStartDate(formatForInput(tournament.start_date) || "");
    setEndDate(formatForInput(tournament.end_date) || "");
    setMatchesCount(tournament.matches_count?.toString() || "");
    setDescription(tournament.description || "");
    setPrice(tournament.price != null ? tournament.price.toString() : "");
    setImageFile(null);
    setIsOpen(true);
  };

  const handleUpdate = async (e) => {
    e?.preventDefault?.();
    if (!editingTournament) return;

    try {
      setUpdating(true);
      setCreateError("");
      setCreateMsg("");
      const form = new FormData();
      if (name) form.append("name", name);
      if (gradeId) form.append("grade_id", Number(gradeId));
      if (matchesCount) form.append("matches_count", Number(matchesCount));
      if (startDate) form.append("start_date", startDate);
      if (endDate) form.append("end_date", endDate);
      if (description) form.append("description", description);
      if (price !== "") form.append("price", Number(price));
      if (imageFile) form.append("image", imageFile);

      await baseUrl.put(`/api/leagues/${editingTournament.id}`, form, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
      setCreateMsg("تم تحديث الدوري بنجاح");
      await fetchTournaments();
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 700);
    } catch (e) {
      setCreateError("فشل تحديث الدوري. تحقق من البيانات والصلاحيات.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (tournamentId) => {
    try {
      setDeleting(true);
      await baseUrl.delete(`/api/leagues/${tournamentId}`, {
        headers: authHeader,
      });
      await fetchTournaments();
      setDeleteConfirm(null);
    } catch (e) {
      setCreateError("فشل حذف الدوري.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    try {
      setCreating(true);
      setCreateError("");
      setCreateMsg("");
      const form = new FormData();
      if (name) form.append("name", name);
      if (gradeId) form.append("grade_id", Number(gradeId));
      if (matchesCount) form.append("matches_count", Number(matchesCount));
      if (startDate) form.append("start_date", startDate);
      if (endDate) form.append("end_date", endDate);
      if (description) form.append("description", description);
      if (price !== "") form.append("price", Number(price));
      if (imageFile) form.append("image", imageFile);

      await baseUrl.post("/api/leagues", form, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
      setCreateMsg("تم إنشاء الدوري بنجاح");
      await fetchTournaments();
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 700);
    } catch (e) {
      setCreateError("فشل إنشاء الدوري. تحقق من البيانات والصلاحيات.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (value) => {
    if (value === "" || value == null) return "مجاني";
    const n = Number(value);
    if (Number.isNaN(n)) return "غير متاح";
    return `${n.toLocaleString("ar-EG")} ج.م`;
  };

  const formatForInput = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      // Format to YYYY-MM-DDTHH:mm
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const openJoinModal = (league) => {
    setJoinError("");
    setJoinMsg("");
    setJoinLeague(league);
    setIsJoinOpen(true);
  };

  const closeJoinModal = () => {
    setIsJoinOpen(false);
    setJoinLeague(null);
    setJoining(false);
    setJoinError("");
    setJoinMsg("");
  };

  const handleFreeJoin = async () => {
    if (!joinLeague) return;
    try {
      setJoining(true);
      setJoinError("");
      setJoinMsg("");
      await baseUrl.post(
        `/api/leagues/${joinLeague.id}/join`,
        {},
        { headers: authHeader }
      );
      setJoinMsg("تم الاشتراك بنجاح");
      await fetchTournaments();
      setTimeout(() => {
        closeJoinModal();
      }, 800);
    } catch (e) {
      setJoinError("فشل الاشتراك. حاول مرة أخرى.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <BrandLoadingScreen />;
  }

  return (
    <div
      className="min-h-screen pt-[72px]"
      style={{ background: pageBg }}
      dir="rtl"
    >
      {/* Header Section - براند */}
      <div
        className={`backdrop-blur-sm border-b sticky top-[72px] z-40 ${headerBgClass}`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-gray-200">
                  الدوريات
                </h1>
                <div className="flex items-center space-x-2 space-x-reverse mt-1">
                  <span className="text-sm text-slate-500">
                    إجمالي الدوريات:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                    {tournaments.length}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsOpen(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="font-medium">إنشاء دوري جديد</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 ml-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {tournaments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-2">
              لا توجد دوريات حالياً
            </h3>
            <p className="text-slate-500 dark:text-gray-400 mb-6">
              ابدأ بإنشاء أول دوري لطلابك
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                إنشاء دوري الآن
              </button>
            )}
          </div>
        )}

        {/* Tournaments Grid */}
        <div className="flex flex-wrap">
          {tournaments.map((t, index) => (
            <div
              key={t.id}
              className={`group m-3 ${cardBgClass} backdrop-blur-sm border rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-1 overflow-hidden w-full`}
              style={{ width: "370px" }}
            >
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500" />
              {/* Image Section */}

              <div className="relative overflow-hidden">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.name}
                    className="w-full h-[200px] object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-indigo-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                )}

                {/* Price Badge */}
                <div className="absolute top-3 right-3">
                  {t.price == null ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/90 text-white backdrop-blur-sm">
                      <svg
                        className="w-3 h-3 ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      مجاني
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-white backdrop-blur-sm">
                      <svg
                        className="w-3 h-3 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      {formatPrice(t.price)}
                    </span>
                  )}
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 space-y-1">
                  {typeof t.is_visible !== "undefined" && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        t.is_visible
                          ? "bg-blue-500/90 text-white"
                          : "bg-gray-500/90 text-white"
                      }`}
                    >
                      {t.is_visible ? "ظاهر" : "مخفي"}
                    </span>
                  )}
                  {typeof t.is_subscribed !== "undefined" && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        t.is_subscribed
                          ? "bg-emerald-500/90 text-white"
                          : "bg-slate-500/90 text-white"
                      }`}
                    >
                      {t.is_subscribed ? "مشترك" : "غير مشترك"}
                    </span>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                    {t.name}
                  </h3>
                </div>

                {t.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {t.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`${statBgClass} rounded-lg p-3 text-center`}>
                    <div className="text-lg font-bold text-slate-800">
                      {t.matches_count}
                    </div>
                    <div className="text-xs text-slate-500">مباراة</div>
                  </div>
                  <div className={`${statBgClass} rounded-lg p-3`}>
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-700 dark:text-gray-300">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3a4 4 0 118 0v4m4 4H4m0 0v8a2 2 0 002 2h12a2 2 0 002-2v-8M4 11h16"
                        />
                      </svg>
                      الفترة
                    </div>
                    <div className="text-[13px] font-semibold text-slate-800 mt-1 text-center leading-5">
                      {formatDate(t.start_date)}
                      <span className="mx-1">→</span>
                      {formatDate(t.end_date)}
                    </div>
                  </div>
                </div>

                {/* Grade Badge */}
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200/50">
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    {t.grade_name || `الصف ${t.grade_id}`}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="py-2.5 px-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : userData?.role === "student" ? (
                    t.is_enrolled ? (
                      <Link to={`/league/${t.id}`}>
                        <button className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg">
                          عرض التفاصيل
                        </button>
                      </Link>
                    ) : (
                      <button
                        onClick={() => openJoinModal(t)}
                        className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                      >
                        اشترك
                      </button>
                    )
                  ) : (
                    <button className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-orange-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg">
                      عرض التفاصيل
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[100px]">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            />
            <div
              className={`relative ${modalBgClass} backdrop-blur-sm w-full max-w-3xl rounded-3xl shadow-2xl border ${modalBorderClass} animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto`}
            >
              {/* Modal Header - براند */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500" />
              <div className="bg-gradient-to-r from-blue-500 to-orange-500 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {editMode ? "تعديل الدوري" : "إنشاء دوري جديد"}
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        {editMode
                          ? "تحديث بيانات الدوري"
                          : "أضف دوري تفاعلي للطلاب"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      resetForm();
                    }}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
                <form
                  id="create-league-form"
                  onSubmit={editMode ? handleUpdate : handleCreate}
                  className="space-y-6"
                >
                  {/* Tournament Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 ml-2 text-indigo-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        اسم الدوري
                      </span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm`}
                      placeholder="مثال: دوري العلوم المتقدم"
                      required
                    />
                  </div>

                  {/* Grid Layout for Main Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 ml-2 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          الصف الدراسي
                        </span>
                      </label>
                      <select
                        value={gradeId}
                        onChange={(e) => setGradeId(e.target.value)}
                        className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm`}
                        required
                      >
                        <option value="" disabled>
                          {gradesLoading ? "جارِ التحميل..." : "اختر الصف"}
                        </option>
                        {gradesError && (
                          <option value="" disabled>
                            {gradesError}
                          </option>
                        )}
                        {grades.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 ml-2 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0a4 4 0 108 0"
                            />
                          </svg>
                          تاريخ البداية
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 ml-2 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0a4 4 0 108 0"
                            />
                          </svg>
                          تاريخ النهاية
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm`}
                        min={startDate || undefined}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        <span className="flex items-center">
                          <svg
                            className="w-4 h-4 ml-2 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          عدد المباريات
                        </span>
                      </label>
                      <input
                        type="number"
                        value={matchesCount}
                        onChange={(e) => setMatchesCount(e.target.value)}
                        className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm`}
                        placeholder="5"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 ml-2 text-indigo-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h7"
                          />
                        </svg>
                        الوصف (اختياري)
                      </span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm resize-none`}
                      rows={4}
                      placeholder="وصف مفصل عن الدوري وأهدافه..."
                    />
                  </div>

                  {/* Pricing Section */}
                  <div
                    className={`${sectionBgClass} rounded-2xl p-6 border ${useColorModeValue(
                      "border-slate-200/50",
                      "border-slate-700/50"
                    )}`}
                  >
                    <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 ml-2 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      التسعير
                    </h4>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        السعر (جنيه مصري) — اتركه فارغاً ليكون مجاني
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={`w-full px-4 py-3 border ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm`}
                        placeholder="99"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      <span className="flex items-center">
                        <svg
                          className="w-4 h-4 ml-2 text-indigo-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        صورة الدوري (اختياري)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] || null)
                        }
                        className={`w-full px-4 py-3 border border-dashed ${inputBorderClass} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${inputBgClass} backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100`}
                      />
                    </div>
                    {(imagePreview ||
                      (editMode && editingTournament?.image_url)) && (
                      <div className="mt-3 relative">
                        <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50">
                          <img
                            src={imagePreview || editingTournament?.image_url}
                            alt="preview"
                            className="w-full max-h-56 object-cover"
                          />
                        </div>
                        {imagePreview && (
                          <div className="mt-3 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview("");
                                try {
                                  if (fileInputRef?.current)
                                    fileInputRef.current.value = "";
                                } catch {}
                              }}
                              className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors"
                            >
                              إزالة الصورة
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  {createError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-red-400 ml-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-red-700 text-sm">
                          {createError}
                        </span>
                      </div>
                    </div>
                  )}
                  {createMsg && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-green-400 ml-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-700 text-sm">
                          {createMsg}
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div
                className={`${sectionBgClass} px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-t ${useColorModeValue(
                  "border-slate-200/50",
                  "border-slate-700/50"
                )}`}
              >
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      resetForm();
                    }}
                    className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    form="create-league-form"
                    disabled={creating || updating}
                    className="group relative px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {creating || updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>
                            {editMode ? "جارٍ التحديث..." : "جارٍ الإنشاء..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {editMode ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            )}
                          </svg>
                          <span>
                            {editMode ? "حفظ التغييرات" : "إنشاء الدوري"}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Join Modal (Student) */}
        {isJoinOpen && joinLeague && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[100px]">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeJoinModal}
            />
            <div
              className={`relative ${modalBgClass} backdrop-blur-sm w-full max-w-lg rounded-3xl shadow-2xl border ${modalBorderClass} animate-scale-in overflow-hidden`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 sm:px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 01-8 0M3 11h18M5 11v8a2 2 0 002 2h10a2 2 0 002-2v-8"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">الاشتراك في الدوري</h3>
                      <p className="text-white/80 text-sm mt-1">
                        {joinLeague?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeJoinModal}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">سعر الاشتراك</span>
                    <span className="text-slate-800 font-semibold">
                      {formatPrice(joinLeague?.price)}
                    </span>
                  </div>

                  {joinLeague?.price == null ? (
                    <div
                      className={`mt-2 ${sectionBgClass} rounded-2xl p-4 border ${useColorModeValue(
                        "border-slate-200/50",
                        "border-slate-700/50"
                      )}`}
                    >
                      <div className="flex items-center gap-2 text-slate-700">
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm">
                          هذا الدوري مجاني. هل ترغب في تأكيد الاشتراك؟
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${sectionBgClass} rounded-2xl p-4 border ${useColorModeValue(
                        "border-slate-200/50",
                        "border-slate-700/50"
                      )}`}
                    >
                      <button
                        type="button"
                        className="px-4 py-3 rounded-xl border border-slate-300 text-slate-800 font-medium hover:bg-white transition-colors"
                      >
                        عن طريق كود تفعيل
                      </button>
                      <button
                        type="button"
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-medium hover:shadow-md transition-shadow"
                      >
                        عن طريق فوري
                      </button>
                    </div>
                  )}

                  {joinError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      {joinError}
                    </div>
                  )}
                  {joinMsg && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                      {joinMsg}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                className={`${sectionBgClass} px-4 sm:px-6 py-4 border-t ${useColorModeValue(
                  "border-slate-200/50",
                  "border-slate-700/50"
                )}`}
              >
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeJoinModal}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    إلغاء
                  </button>
                  {joinLeague?.price == null ? (
                    <button
                      onClick={handleFreeJoin}
                      disabled={joining}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                    >
                      {joining ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>جارٍ الاشتراك...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>تأكيد الاشتراك</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[100px]">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setDeleteConfirm(null)}
            />
            <div
              className={`relative ${modalBgClass} backdrop-blur-sm w-full max-w-md rounded-3xl shadow-2xl border ${modalBorderClass} animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto`}
            >
              {/* Delete Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 py-4 text-white">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">تأكيد الحذف</h3>
                    <p className="text-white/80 text-sm mt-1">
                      هذا الإجراء لا يمكن التراجع عنه
                    </p>
                  </div>
                </div>
              </div>

              {/* Delete Modal Content */}
              <div className="px-4 sm:px-6 py-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">
                    هل أنت متأكد؟
                  </h4>
                  <p className="text-slate-600 mb-6">
                    سيتم حذف الدوري نهائياً مع جميع المباريات والأسئلة المرتبطة
                    به
                  </p>
                </div>
              </div>

              {/* Delete Modal Footer */}
              <div
                className={`${sectionBgClass} px-4 sm:px-6 py-4 border-t ${useColorModeValue(
                  "border-slate-200/50",
                  "border-slate-700/50"
                )}`}
              >
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white hover:shadow-sm transition-all duration-200"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={deleting}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>جارٍ الحذف...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>حذف نهائي</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
};

export default PlatfourmLeagues;
