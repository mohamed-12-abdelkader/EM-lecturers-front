import { FaArrowLeft, FaBookOpen } from "react-icons/fa";
import { Reveal, StaggerGrid, StaggerItem } from "../../tenantLandingMotion";
import {
  tlBtnPrimary,
  tlCard,
  tlCardHover,
  tlContainer,
  tlEyebrow,
  tlHeading,
  tlSectionMuted,
} from "../../tenantLandingTheme";

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
  const img = course.image_url || course.cover_url || course.thumbnail || course.avatar || fallbackImage;
  const free = courseIsFree(course);
  const { label: priceLabel, isFree } = formatCoursePrice(course.price, free);
  const grade = course.grade?.name || course.grade_name || course.grade;
  const lessons = course.lessons_count ?? course.lectures_count;

  return (
    <article className={`flex flex-col overflow-hidden ${tlCard} ${tlCardHover}`}>
      <div className="relative h-36 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" />
        {grade ? (
          <span className="absolute right-2 top-2 rounded bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            {grade}
          </span>
        ) : null}
        <span
          className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white ${
            isFree ? "bg-green-500" : "bg-orange-500"
          }`}
        >
          {isFree ? "مجاني" : "مدفوع"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
          {title}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div>
            <p className={`text-sm font-bold ${isFree ? "text-green-600" : "text-orange-500"}`}>{priceLabel}</p>
            {lessons != null ? (
              <p className="text-[10px] text-slate-500">{Number(lessons).toLocaleString("ar-EG")} درس</p>
            ) : null}
          </div>
          <a
            href={loginHref}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-blue-600"
          >
            اشترك
            <FaArrowLeft className="text-[9px]" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function TenantProCoursesBento({ courses, loading, fallbackImage, loginHref, signupHref }) {
  return (
    <section id="courses" className={`scroll-mt-20 py-16 md:py-20 ${tlSectionMuted}`} dir="rtl">
      <div className={tlContainer}>
        <Reveal variant="blurUp" className="text-center">
          <span className={tlEyebrow}>الكورسات</span>
          <h2 className={`${tlHeading} mt-3`}>الكورسات المتاحة</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            اختر الكورس المناسب وابدأ التعلّم
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <p className="mt-5 text-center text-sm text-slate-500">
              <span className="font-bold text-blue-500">{courses.length.toLocaleString("ar-EG")}</span> كورس
            </p>
            <StaggerGrid className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((c, i) => (
                <StaggerItem key={c.id ?? `course-${i}`} variant="blur">
                  <SimpleCourseCard course={c} fallbackImage={fallbackImage} loginHref={loginHref} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          </>
        ) : (
          <Reveal variant="springPop" className="mt-8">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-900">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-500 dark:bg-blue-950/40">
                <FaBookOpen />
              </div>
              <p className="font-heading font-bold text-slate-800 dark:text-white">لا توجد كورسات حالياً</p>
              <a href={signupHref} className={`mt-4 ${tlBtnPrimary}`}>
                أنشئ حسابك
                <FaArrowLeft className="text-xs" />
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
