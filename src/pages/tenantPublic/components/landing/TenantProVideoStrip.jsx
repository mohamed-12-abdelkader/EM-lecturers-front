import { useRef } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import { Reveal, StaggerItem } from "../../tenantLandingMotion";
import { tlCard, tlContainer, tlEyebrow, tlHeading, tlSectionWhite } from "../../tenantLandingTheme";

function LectureFrame({ lecture, fallbackImage, onPlay }) {
  return (
    <motion.button
      type="button"
      onClick={() => onPlay(lecture)}
      className="group w-[min(340px,85vw)] shrink-0 cursor-pointer snap-center text-right"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 p-2 shadow-xl dark:border-slate-700">
        <div className={`relative overflow-hidden rounded-xl ${tlCard} !border-0 !shadow-none`}>
          <img
            src={lecture.image_url || fallbackImage}
            alt={lecture.title}
            className="aspect-video w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 transition-colors duration-200 group-hover:bg-blue-900/55">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-500 shadow-md transition-transform duration-200 group-hover:scale-110">
              <FaPlay className="mr-[-2px]" />
            </span>
          </div>
          <span className="absolute left-3 top-3 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
            مجاني
          </span>
        </div>
      </div>
      <p className="mt-3 font-heading text-sm font-bold text-slate-900 dark:text-white">{lecture.title}</p>
    </motion.button>
  );
}

export default function TenantProVideoStrip({
  lectures,
  loading,
  fallbackImage,
  onPlay,
}) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  return (
    <section id="videos" className={`scroll-mt-20 py-16 md:py-24 ${tlSectionWhite}`} dir="rtl">
      <div className={tlContainer}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal variant="blurUp">
            <span className={tlEyebrow}>محاضرات مجانية</span>
            <h2 className={`${tlHeading} mt-3`}>جرّب قبل الاشتراك</h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">
              شاهد محاضرات مجانية وتعرّف على أسلوب الشرح
            </p>
          </Reveal>
          {lectures.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scroll(-1)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-blue-500 hover:text-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-label="السابق"
              >
                <FaChevronRight />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-blue-500 hover:text-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-label="التالي"
              >
                <FaChevronLeft />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-10 flex gap-5 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 w-[min(340px,85vw)] shrink-0 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : lectures.length > 0 ? (
          <div
            ref={scrollRef}
            className="mt-10 flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "thin" }}
          >
            {lectures.map((lecture) => (
              <StaggerItem key={lecture.id} variant="blur">
                <LectureFrame lecture={lecture} fallbackImage={fallbackImage} onPlay={onPlay} />
              </StaggerItem>
            ))}
          </div>
        ) : (
          <Reveal variant="springPop" className="mt-10">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-600 dark:bg-slate-900/50">
              <p className="font-heading text-lg font-bold text-slate-800 dark:text-white">لا توجد محاضرات مجانية حالياً</p>
              <p className="mt-2 text-sm text-slate-500">سيتم إضافة محاضرات قريباً</p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
