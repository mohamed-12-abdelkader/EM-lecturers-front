import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaTrophy } from "react-icons/fa";
import { fetchStudentPointsSummary } from "../../../api/teacherPointsApi";
import { hpContainer, hpEyebrow, hpSectionTitle } from "../homeTheme";

export default function HomeProPointsSummary() {
  const [summary, setSummary] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchStudentPointsSummary()
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch(() => {
        if (mounted) setHidden(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (hidden || !summary) return null;

  return (
    <section className="py-2 sm:py-4" dir="rtl">
      <div className={hpContainer}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <span className={hpEyebrow}>الترتيب</span>
            <h2 className={`${hpSectionTitle} mt-2`}>نقاطك في الصف</h2>
          </div>
          <Link
            to="/my-points"
            className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            التفاصيل
            <FaChevronLeft className="text-[10px]" />
          </Link>
        </div>
        <Link
          to="/my-points"
          className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2"
        >
          <div className="border-e border-slate-100 p-4 text-right dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-500">نقاطي</p>
            <p className="mt-1 font-heading text-2xl font-black text-orange-500">
              {summary.totalPoints}
            </p>
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 sm:flex dark:bg-orange-950/40">
              <FaTrophy />
            </span>
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-bold text-slate-500">قائمة المتفوقين</p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                أعلى 10 يظهر ترتيبهم فقط
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
