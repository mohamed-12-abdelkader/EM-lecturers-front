import { Switch } from "@chakra-ui/react";
import { FaPlay, FaClipboardCheck, FaPen, FaStar, FaTasks } from "react-icons/fa";

const ROWS = [
  {
    key: "video",
    icon: FaPlay,
    title: "نقاط مشاهدة الفيديو",
    hint: "تُمنح مرة واحدة عند أول مشاهدة لكل فيديو",
    enabledKey: "video_watch_enabled",
    pointsKey: "video_watch_points",
    hasPoints: true,
  },
  {
    key: "examStart",
    icon: FaClipboardCheck,
    title: "نقاط بدء الامتحان",
    hint: "عند إنشاء محاولة امتحان جديدة فقط",
    enabledKey: "exam_start_enabled",
    pointsKey: "exam_start_points",
    hasPoints: true,
  },
  {
    key: "assignmentStart",
    icon: FaTasks,
    title: "نقاط بدء الواجب",
    hint: "عند إنشاء محاولة واجب جديدة فقط",
    enabledKey: "assignment_start_enabled",
    pointsKey: "assignment_start_points",
    hasPoints: true,
  },
  {
    key: "examScore",
    icon: FaStar,
    title: "نقاط درجة الامتحان",
    hint: "يُضاف عدد درجات الطالب كالنقاط عند التسليم (مثال: 15/20 → +15)",
    enabledKey: "exam_score_enabled",
    hasPoints: false,
  },
  {
    key: "assignmentScore",
    icon: FaPen,
    title: "نقاط درجة الواجب",
    hint: "نفس منطق درجة الامتحان عند تسليم الواجب",
    enabledKey: "assignment_score_enabled",
    hasPoints: false,
  },
];

export default function PointsSettingsPanel({
  form,
  onChange,
  onSave,
  saving,
  dirty,
}) {
  const patch = (key, value) => onChange({ ...form, [key]: value });

  return (
    <div className="space-y-3" dir="rtl">
      <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
        إعداداتك مستقلة عن أي مدرس آخر. تعطيل نوع لا يمنع المشاهدة أو الامتحان — فقط يتوقف منح النقاط.
      </p>

      {ROWS.map((row) => {
        const Icon = row.icon;
        const enabled = Boolean(form[row.enabledKey]);
        return (
          <div
            key={row.key}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <Icon className="text-sm" />
                </span>
                <div className="min-w-0 text-right">
                  <p className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                    {row.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-6 text-slate-500">{row.hint}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                {row.hasPoints ? (
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    النقاط
                    <input
                      type="number"
                      min={0}
                      disabled={!enabled}
                      value={form[row.pointsKey] ?? 0}
                      onChange={(e) =>
                        patch(row.pointsKey, Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-10 w-20 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                ) : null}
                <Switch
                  isChecked={enabled}
                  colorScheme="blue"
                  onChange={(e) => patch(row.enabledKey, e.target.checked)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={onSave}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
