export default function StudentIdBarcode({ value, className = "" }) {
  if (value == null || value === "") {
    return (
      <p className="py-4 text-center text-xs text-slate-400">كود الطالب غير متوفر</p>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-800/50 ${className}`}
    >
      <p className="mb-2 font-sans text-xs font-medium text-slate-500">كود الطالب</p>
      <p className="font-heading text-3xl font-bold tabular-nums tracking-wide text-blue-600 dark:text-blue-400">
        {value}
      </p>
    </div>
  );
}
