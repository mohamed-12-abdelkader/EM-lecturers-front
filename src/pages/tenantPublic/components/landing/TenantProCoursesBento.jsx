/**
 * سيكشن الكورسات المتاحة — كروت أوضح + معاينة مجانية جنب اشترك
 */
import { FaArrowLeft, FaBookOpen, FaEye, FaPlay } from "react-icons/fa";
import { DepthCard, Reveal, StaggerGrid, StaggerItem } from "../../tenantLandingMotion";
import { getCardImageUrl } from "../../../../utils/highQualityImageUrl";
import { tlContainer } from "../../tenantLandingTheme";
import TenantAppLink from "../TenantAppLink";

const BLUE = "#3182CE";
const BLUE_DARK = "#2B6CB0";

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

function coursePreviewHref(course) {
  const slug = course?.slug || (course?.id != null ? `course-${course.id}` : null);
  return slug ? `/course/${slug}` : "/courses";
}

function SimpleCourseCard({ course, fallbackImage, loginHref }) {
  const title = (course.title || course.name || "كورس").trim();
  const rawImg = course.image_url || course.cover_url || course.thumbnail || course.avatar || fallbackImage;
  const img = getCardImageUrl(rawImg);
  const free = courseIsFree(course);
  const { label: priceLabel, isFree } = formatCoursePrice(course.price, free);
  const grade = course.grade?.name || course.grade_name || course.grade;
  const lessons = course.lessons_count ?? course.lectures_count;
  const previewHref = coursePreviewHref(course);
  const description = String(course.description || course.short_description || "").trim();

  return (
    <DepthCard maxTilt={8} floatPx={0}>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] shadow-[var(--tl-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3182CE]/35">
        <div className="relative h-44 overflow-hidden bg-[var(--tl-card-solid)] sm:h-40">
          <img
            src={img}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1524]/70 via-[#0B1524]/15 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            {grade ? (
              <span className="rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#1A365D] shadow-sm [.tenant-dark_&]:bg-[#1A365D]/90 [.tenant-dark_&]:text-white">
                {grade}
              </span>
            ) : (
              <span />
            )}
            <span
              className="rounded-lg px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
              style={{ background: isFree ? "#38A169" : BLUE }}
            >
              {isFree ? "مجاني" : "مدفوع"}
            </span>
          </div>

          <TenantAppLink
            href={previewHref}
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#1A365D] opacity-0 shadow-md backdrop-blur-sm transition group-hover:opacity-100"
          >
            <FaPlay className="text-[8px]" style={{ color: BLUE }} />
            معاينة
          </TenantAppLink>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-heading line-clamp-2 text-[15px] font-bold leading-snug text-[var(--tl-fg)]">
            {title}
          </h3>

          {description ? (
            <p className="mt-2 line-clamp-2 text-xs leading-6 text-[var(--tl-muted)]">
              {description}
            </p>
          ) : null}

          <div className="mt-auto border-t border-[color:var(--tl-border)] pt-3">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium text-[var(--tl-muted)]">السعر</p>
                <p className="font-heading text-base font-extrabold" style={{ color: BLUE }}>
                  {priceLabel}
                </p>
              </div>
              {lessons != null ? (
                <p className="rounded-lg bg-[var(--tl-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--tl-muted)]">
                  {Number(lessons).toLocaleString("ar-EG")} درس
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TenantAppLink
                href={previewHref}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#3182CE]/35 bg-[var(--tl-card-solid)] px-2 text-xs font-bold text-[#2B6CB0] transition hover:bg-[#3182CE]/08 [.tenant-dark_&]:text-[#90CDF4]"
              >
                <FaEye className="text-[11px]" />
                معاينة مجانية
              </TenantAppLink>
              <TenantAppLink
                href={loginHref}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold text-white transition hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
                  boxShadow: `0 10px 22px -12px ${BLUE}aa`,
                }}
              >
                اشترك
                <FaArrowLeft className="text-[9px]" />
              </TenantAppLink>
            </div>
          </div>
        </div>
      </article>
    </DepthCard>
  );
}

export default function TenantProCoursesBento({
  courses,
  loading,
  fallbackImage,
  loginHref,
  signupHref,
}) {
  return (
    <section
      id="courses"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--tl-section-alt)] py-12 md:py-20"
      style={{ perspective: 1200 }}
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 90% 10%, rgba(49,130,206,0.06) 0%, transparent 55%)",
        }}
        aria-hidden
      />

      <div className={`${tlContainer} relative z-[1]`}>
        <Reveal variant="depthIn" className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3182CE]/25 bg-[#3182CE]/10 px-3 py-1 text-xs font-bold text-[#2B6CB0] [.tenant-dark_&]:text-[#90CDF4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3182CE]" />
            الكورسات
          </span>
          <h2 className="font-heading mt-3 text-2xl font-extrabold tracking-tight text-[var(--tl-fg)] md:text-3xl">
            الكورسات المتاحة
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--tl-muted)]">
            اختر الكورس المناسب، جرّب معاينة مجانية، ثم اشترك وابدأ التعلّم
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-[var(--tl-card-solid)]" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <p className="mt-5 text-center text-sm text-[var(--tl-muted)]">
              <span className="font-bold" style={{ color: BLUE }}>
                {courses.length.toLocaleString("ar-EG")}
              </span>{" "}
              كورس
            </p>
            <div
              className="-mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:hidden"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {courses.map((c, i) => (
                <div key={c.id ?? `course-m-${i}`} className="w-[80vw] max-w-[300px] shrink-0 snap-center">
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
            <div className="rounded-2xl border border-dashed border-[color:var(--tl-border)] bg-[var(--tl-card)] px-6 py-12 text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
                style={{ background: BLUE }}
              >
                <FaBookOpen />
              </div>
              <p className="font-heading font-bold text-[var(--tl-fg)]">لا توجد كورسات حالياً</p>
              <TenantAppLink
                href={signupHref}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
                style={{ background: BLUE }}
              >
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
