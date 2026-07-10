import { FaBookOpen, FaCheckCircle, FaLayerGroup } from "react-icons/fa";
import { hpContainer, hpStatTile } from "../homeTheme";

function StatItem({ icon: Icon, label, value, tone = "blue" }) {
  const iconTone = {
    blue: "bg-blue-50 text-blue-500 dark:bg-blue-950/50",
    orange: "bg-orange-50 text-orange-500 dark:bg-orange-950/40",
    emerald: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40",
  }[tone];

  return (
    <div className={`${hpStatTile} flex-row items-center gap-3`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="font-heading text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
        <p className="font-sans text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function HomeProStats({ lecturesCount = 0, coursesCount = 0, enrolledCount = 0 }) {
  return (
    <section className="border-b border-slate-200/60 bg-slate-50 py-4 dark:border-slate-800 dark:bg-slate-950/80" dir="rtl">
      <div className={`${hpContainer} grid grid-cols-1 gap-3 sm:grid-cols-3`}>
        <StatItem icon={FaBookOpen} label="محاضراتك المتاحة" value={lecturesCount} tone="blue" />
        <StatItem icon={FaLayerGroup} label="كل الكورسات المتاحة" value={coursesCount} tone="orange" />
        <StatItem icon={FaCheckCircle} label="كورسات مشترك بها" value={enrolledCount} tone="emerald" />
      </div>
    </section>
  );
}
