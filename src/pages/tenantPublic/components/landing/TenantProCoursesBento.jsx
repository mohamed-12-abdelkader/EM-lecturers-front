import { FaArrowLeft, FaBookOpen } from "react-icons/fa";
import { motion } from "framer-motion";
import { DepthCard, Reveal, StaggerGrid, StaggerItem } from "../../tenantLandingMotion";
import { getCardImageUrl } from "../../../../utils/highQualityImageUrl";
import {
  TL_CYAN,
  TL_LIME,
  TL_NAVY,
  TL_NAVY_SOFT,
  tlBtnPrimary,
  tlCard,
  tlCardHover,
  tlContainer,
  tlEyebrow,
  tlHeading,
} from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

function formatCoursePrice(rawPrice, isFreeFlag) {
  if (isFreeFlag) return { label: "مجاني", isFree: true };
  const priceNum = Number(rawPrice);
  const hasPrice = rawPrice != null && String(rawPrice).trim() !== "" && !Number.isNaN(priceNum);
  if (!hasPrice || priceNum === 0) return { label: "مجاني", isFree: true };
  return { label: `${priceNum.toLocaleString("ar-EG")} ج.م`, isFree: false };
}

function courseIsFree(course) {
  if (course?.is_free != null) return Boolean(course.is_free);
  if (course?.isFree != null) return Boolean(course.isFree);
  const priceNum = Number(course?.price);
  return Number.isFinite(priceNum) && priceNum === 0;
}

function SimpleCourseCard({ course, fallbackImage, loginHref }) {
  const title = (course.title || course.name || "كورس").trim();
  const rawImg = course.image_url || course.cover_url || course.thumbnail || course.avatar || fallbackImage;
  const img = getCardImageUrl(rawImg);
  const free = courseIsFree(course);
  const { label: priceLabel, isFree } = formatCoursePrice(course.price, free);
  const grade = course.grade?.name || course.grade_name || course.grade;
  const lessons = course.lessons_count ?? course.lectures_count;

  return (
    <DepthCard maxTilt={11} floatPx={0}>
      <article className={`flex flex-col overflow-hidden ${tlCard} ${tlCardHover}`}>
        <div className="relative h-40 overflow-hidden bg-[#12263F] sm:h-36">
          <img
            src={img}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/70 via-transparent to-transparent" />
          {grade ? (
            <span
              className="absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: TL_CYAN }}
            >
              {grade}
            </span>
          ) : null}
          <span
            className="absolute left-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
            style={
              isFree
                ? { background: TL_LIME, color: TL_NAVY }
                : { background: TL_CYAN, color: "#fff" }
            }
          >
            {isFree ? "مجاني" : "مدفوع"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-heading line-clamp-2 text-sm font-bold leading-snug text-white">
            {title}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: isFree ? TL_LIME : TL_CYAN }}
              >
                {priceLabel}
              </p>
              {lessons != null ? (
                <p className="text-[10px] text-[#7EB8D9]">
                  {Number(lessons).toLocaleString("ar-EG")} درس
                </p>
              ) : null}
            </div>
            <TenantAppLink
              href={loginHref}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: TL_CYAN }}
            >
              اشترك
              <FaArrowLeft className="text-[9px]" />
            </TenantAppLink>
          </div>
        </div>
      </article>
    </DepthCard>
  );
}

export default function TenantProCoursesBento({ courses, loading, fallbackImage, loginHref, signupHref }) {
  return (
    <section
      id="courses"
      className="scroll-mt-20 py-12 md:py-20"
      style={{ background: TL_NAVY_SOFT, perspective: 1200 }}
      dir="rtl"
    >
      <div className={tlContainer}>
        <Reveal variant="depthIn" className="text-center">
          <span className={tlEyebrow}>الكورسات</span>
          <h2 className={`${tlHeading} mt-3`}>الكورسات المتاحة</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#7EB8D9]">
            اختر الكورس المناسب وابدأ التعلّم
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <p className="mt-5 text-center text-sm text-[#7EB8D9]">
              <span className="font-bold" style={{ color: TL_CYAN }}>
                {courses.length.toLocaleString("ar-EG")}
              </span>{" "}
              كورس
            </p>
            <div
              className="-mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:hidden"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {courses.map((c, i) => (
                <div key={c.id ?? `course-m-${i}`} className="w-[78vw] max-w-[300px] shrink-0 snap-center">
                  <SimpleCourseCard course={c} fallbackImage={fallbackImage} loginHref={loginHref} />
                </div>
              ))}
            </div>
            <StaggerGrid className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((c, i) => (
                <StaggerItem key={c.id ?? `course-${i}`} variant="blur">
                  <SimpleCourseCard course={c} fallbackImage={fallbackImage} loginHref={loginHref} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          </>
        ) : (
          <Reveal variant="springPop" className="mt-8">
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-6 py-12 text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                style={{ background: `${TL_CYAN}22`, color: TL_CYAN }}
              >
                <FaBookOpen />
              </div>
              <p className="font-heading font-bold text-white">لا توجد كورسات حالياً</p>
              <TenantAppLink href={signupHref} className={`mt-4 ${tlBtnPrimary}`}>
                أنشئ حسابك
                <FaArrowLeft className="text-xs" />
              </TenantAppLink>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
