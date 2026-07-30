import { FaBookOpen, FaCheckCircle, FaLayerGroup } from "react-icons/fa";
import { HP_BLUE, HP_ORANGE, hpContainer } from "../homeTheme";

const ITEMS = [
  {
    key: "enrolled",
    icon: FaCheckCircle,
    label: "مشترك بها",
    color: HP_BLUE,
    soft: "rgba(49,130,206,0.12)",
  },
  {
    key: "platform",
    icon: FaLayerGroup,
    label: "على المنصة",
    color: HP_BLUE,
    soft: "rgba(49,130,206,0.08)",
  },
  {
    key: "available",
    icon: FaBookOpen,
    label: "متاحة للاشتراك",
    color: HP_ORANGE,
    soft: "rgba(221,107,32,0.12)",
  },
];

export default function HomeProStats({
  enrolledCount = 0,
  coursesCount = 0,
  availableToJoin = 0,
}) {
  const values = {
    enrolled: enrolledCount,
    platform: coursesCount,
    available: availableToJoin,
  };

  return (
    <section className="pt-4 sm:pt-5" dir="rtl">
      <div className={`${hpContainer}`}>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_6px_20px_-10px_rgba(26,32,44,0.15)] dark:border-slate-700 dark:bg-slate-900 sm:p-4"
              >
                <div
                  className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10"
                  style={{ background: item.soft, color: item.color }}
                >
                  <Icon className="text-sm sm:text-[15px]" />
                </div>
                <p className="font-heading text-xl font-bold tabular-nums text-slate-800 dark:text-white sm:text-2xl">
                  {Number(values[item.key] || 0).toLocaleString("ar-EG")}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
