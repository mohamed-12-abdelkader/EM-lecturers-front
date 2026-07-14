import { FaBookOpen, FaCheckCircle, FaLayerGroup } from "react-icons/fa";

function StatItem({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-500 dark:bg-blue-950/50",
    orange: "bg-orange-50 text-orange-500 dark:bg-orange-950/40",
    emerald: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40",
  };

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]} transition group-hover:scale-105`}
      >
        <Icon className="text-lg" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="font-heading text-2xl font-black tabular-nums text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function HomeProStats({
  enrolledCount = 0,
  coursesCount = 0,
  availableToJoin = 0,
}) {
  return (
    <section className="py-1" dir="rtl">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-3 md:px-6 lg:px-8">
        <StatItem icon={FaCheckCircle} label="كورسات مشترك بها" value={enrolledCount} tone="emerald" />
        <StatItem icon={FaLayerGroup} label="كورسات المنصة" value={coursesCount} tone="blue" />
        <StatItem icon={FaBookOpen} label="متاحة للاشتراك" value={availableToJoin} tone="orange" />
      </div>
    </section>
  );
}
