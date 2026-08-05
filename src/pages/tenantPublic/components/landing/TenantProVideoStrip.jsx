import { useRef } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa";
import { Reveal, StaggerItem } from "../../tenantLandingMotion";
import { getCardImageUrl } from "../../../../utils/highQualityImageUrl";
import {
  TL_CYAN,
  TL_LIME,
  TL_NAVY,
  tlContainer,
  tlEyebrow,
  tlHeading,
} from "../../tenantLandingTheme";

function LectureFrame({ lecture, fallbackImage, onPlay }) {
  const thumb = getCardImageUrl(lecture.image_url || fallbackImage);
  return (
    <motion.button
      type="button"
      onClick={() => onPlay(lecture)}
      className="group w-[min(300px,82vw)] shrink-0 cursor-pointer snap-center text-right sm:w-[min(340px,85vw)]"
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      whileHover={{ y: -10, rotateX: 8, rotateY: -4, scale: 1.03, z: 40 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <div className="overflow-hidden rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] p-1.5 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.2)] sm:p-2">
        <div className="relative overflow-hidden rounded-xl bg-[var(--tl-card-solid)]">
          <img
            src={thumb}
            alt={lecture.title}
            className="aspect-video w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/35 transition-colors duration-200 group-hover:bg-slate-900/45">
            <motion.span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tl-card)] shadow-md"
              style={{ color: TL_CYAN }}
              whileHover={{ scale: 1.15 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaPlay className="mr-[-2px]" />
            </motion.span>
          </div>
          <span
            className="absolute left-3 top-3 rounded-lg px-2 py-0.5 text-[10px] font-bold"
            style={{ background: TL_LIME, color: TL_NAVY }}
          >
            مجاني
          </span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 font-heading text-sm font-bold text-[var(--tl-fg)]">{lecture.title}</p>
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
    <section
      id="videos"
      className="scroll-mt-20 bg-[var(--tl-section)] py-12 md:py-20"
      dir="rtl"
    >
      <div className={tlContainer}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal variant="blurUp">
            <span className={tlEyebrow}>محاضرات مجانية</span>
            <h2 className={`${tlHeading} mt-3`}>جرّب قبل الاشتراك</h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-[var(--tl-muted)]">
              شاهد محاضرات مجانية وتعرّف على أسلوب الشرح
            </p>
          </Reveal>
          {lectures.length > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scroll(-1)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] text-[var(--tl-muted)] transition-colors duration-200 hover:border-[#00A0E3]/50 hover:text-[#00A0E3]"
                aria-label="السابق"
              >
                <FaChevronRight />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] text-[var(--tl-muted)] transition-colors duration-200 hover:border-[#00A0E3]/50 hover:text-[#00A0E3]"
                aria-label="التالي"
              >
                <FaChevronLeft />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="-mx-4 mt-8 flex gap-4 overflow-hidden px-4 sm:mx-0 sm:mt-10 sm:px-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 w-[min(300px,82vw)] shrink-0 animate-pulse rounded-2xl bg-[var(--tl-card-solid)] sm:h-52 sm:w-[min(340px,85vw)]"
              />
            ))}
          </div>
        ) : lectures.length > 0 ? (
          <div
            ref={scrollRef}
            className="-mx-4 mt-8 flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory sm:mx-0 sm:mt-10 sm:gap-5 sm:px-0 sm:pb-4"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {lectures.map((lecture) => (
              <StaggerItem key={lecture.id} variant="blur">
                <LectureFrame lecture={lecture} fallbackImage={fallbackImage} onPlay={onPlay} />
              </StaggerItem>
            ))}
          </div>
        ) : (
          <Reveal variant="springPop" className="mt-10">
            <div className="rounded-2xl border border-dashed border-[color:var(--tl-border)] bg-[var(--tl-soft)] px-6 py-14 text-center">
              <p className="font-heading text-lg font-bold text-[var(--tl-fg)]">لا توجد محاضرات مجانية حالياً</p>
              <p className="mt-2 text-sm text-[var(--tl-muted)]">سيتم إضافة محاضرات قريباً</p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
