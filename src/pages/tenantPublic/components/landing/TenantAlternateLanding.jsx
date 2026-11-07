import { useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { getCardImageUrl } from "../../../../utils/highQualityImageUrl";
import TenantAppLink from "../TenantAppLink";
import { getLandingDesign } from "../../tenantLandingDesigns";

function courseHref(course) {
  const slug = course?.slug || (course?.id != null ? `course-${course.id}` : null);
  return slug ? `/course/${slug}` : "/courses";
}

function courseTitle(course) {
  return (course?.title || course?.name || "كورس").trim();
}

function coursePrice(course) {
  if (course?.is_free || course?.isFree) return "مجاني";
  const price = Number(course?.price);
  if (!Number.isFinite(price) || price <= 0) return "مجاني";
  return `${price.toLocaleString("ar-EG")} ج.م`;
}

function useDesignFont(design) {
  useEffect(() => {
    if (!design?.fontHref) return undefined;
    const id = `tenant-design-font-${design.id}`;
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = design.fontHref;
    return undefined;
  }, [design]);
}

function ActionRow({ design, signupHref, loginHref, hideSignup }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!hideSignup && signupHref ? (
        <TenantAppLink
          href={signupHref}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition hover:brightness-110"
          style={{
            background: design.accent,
            color: design.accentFg,
            borderRadius: design.id === "editorial" ? 2 : 14,
          }}
        >
          ابدأ التعلم
          <FaArrowLeft className="text-[10px]" />
        </TenantAppLink>
      ) : null}
      <TenantAppLink
        href={loginHref}
        className="inline-flex items-center px-6 py-3 text-sm font-bold"
        style={{
          color: design.fg,
          border: `1px solid ${design.muted}`,
          borderRadius: design.id === "editorial" ? 2 : 14,
        }}
      >
        تسجيل الدخول
      </TenantAppLink>
    </div>
  );
}

function EditorialLanding({ design, model }) {
  return (
    <div style={{ color: design.fg }}>
      <section className="mx-auto grid max-w-[1180px] items-end gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.15fr_0.85fr] md:px-8">
        <div>
          <p className="mb-4 text-xs font-bold tracking-[0.28em]" style={{ color: design.accent }}>
            {model.specialty || "منصة تعليمية"}
          </p>
          <h1
            className="whitespace-pre-line text-4xl leading-[1.25] md:text-6xl"
            style={{ fontFamily: design.headingFont, fontWeight: 700 }}
          >
            {model.heroTitle}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 md:text-lg" style={{ color: design.muted }}>
            {model.heroTagline || model.bioText}
          </p>
          <div className="mt-8">
            <ActionRow
              design={design}
              signupHref={model.signupHref}
              loginHref={model.loginHref}
              hideSignup={model.hideSignup}
            />
          </div>
        </div>
        <figure className="relative">
          {model.teacherPortraitUrl ? (
            <img
              src={model.teacherPortraitUrl}
              alt=""
              className="aspect-[4/5] w-full object-cover"
              style={{ border: `1px solid ${design.fg}` }}
            />
          ) : (
            <div className="aspect-[4/5] w-full" style={{ background: "#E7D3C1" }} />
          )}
          <figcaption className="mt-3 flex items-baseline justify-between text-sm">
            <span style={{ fontFamily: design.headingFont }} className="text-2xl">
              {model.teacherName}
            </span>
            <span style={{ color: design.muted }}>{model.specialty}</span>
          </figcaption>
        </figure>
      </section>

      <section className="border-y" style={{ borderColor: "rgba(28,25,23,0.15)" }}>
        <div className="mx-auto grid max-w-[1180px] md:grid-cols-4">
          {model.services.slice(0, 4).map((service, index) => (
            <article key={service.title} className="border-b px-6 py-8 md:border-b-0 md:border-l" style={{ borderColor: "rgba(28,25,23,0.15)" }}>
              <p className="text-xs tracking-[0.2em]" style={{ color: design.accent }}>
                0{index + 1}
              </p>
              <h2 className="mt-3 text-2xl" style={{ fontFamily: design.headingFont }}>
                {service.title}
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: design.muted }}>
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {model.courses.length ? (
        <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-8">
          <h2 className="mb-8 text-4xl" style={{ fontFamily: design.headingFont }}>
            الكورسات
          </h2>
          <div className="divide-y" style={{ borderColor: "rgba(28,25,23,0.12)" }}>
            {model.courses.slice(0, 6).map((course, index) => (
              <TenantAppLink
                key={course.id || courseTitle(course)}
                href={courseHref(course)}
                className="flex items-center justify-between gap-4 py-5"
              >
                <span className="text-sm" style={{ color: design.muted }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-xl" style={{ fontFamily: design.headingFont }}>
                  {courseTitle(course)}
                </span>
                <span className="text-sm font-bold" style={{ color: design.accent }}>
                  {coursePrice(course)}
                </span>
              </TenantAppLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function NocturneLanding({ design, model }) {
  return (
    <div style={{ color: design.fg }}>
      <section className="mx-auto flex max-w-[860px] flex-col items-center px-5 pb-20 pt-10 text-center">
        <div
          className="mb-8 h-44 w-44 overflow-hidden rounded-full p-[3px]"
          style={{ background: `linear-gradient(160deg, ${design.accent}, transparent 70%)` }}
        >
          {model.teacherPortraitUrl ? (
            <img src={model.teacherPortraitUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="h-full w-full rounded-full" style={{ background: "#16140F" }} />
          )}
        </div>
        <p className="text-xs font-bold tracking-[0.35em]" style={{ color: design.accent }}>
          {model.specialty || model.brandName}
        </p>
        <h1 className="mt-4 whitespace-pre-line text-4xl font-extrabold leading-tight md:text-6xl">
          {model.heroTitle}
        </h1>
        <p className="mt-5 max-w-lg text-base leading-8" style={{ color: design.muted }}>
          {model.heroTagline || model.bioText}
        </p>
        <div className="mt-8">
          <ActionRow
            design={design}
            signupHref={model.signupHref}
            loginHref={model.loginHref}
            hideSignup={model.hideSignup}
          />
        </div>
        {model.stats?.length ? (
          <div className="mt-12 flex flex-wrap justify-center gap-8 border-t pt-8" style={{ borderColor: "rgba(198,161,91,0.35)" }}>
            {model.stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold" style={{ color: design.accent }}>{stat.value}</p>
                <p className="text-xs" style={{ color: design.muted }}>{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-4 px-5 pb-16 md:grid-cols-2 md:px-8">
        {model.services.slice(0, 4).map((service) => (
          <article
            key={service.title}
            className="p-6"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(198,161,91,0.28)",
              borderRadius: 20,
            }}
          >
            <h2 className="text-xl font-bold">{service.title}</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: design.muted }}>
              {service.description}
            </p>
          </article>
        ))}
      </section>

      {model.courses.length ? (
        <section className="mx-auto max-w-[1100px] px-5 pb-20 md:px-8">
          <h2 className="mb-6 text-3xl font-extrabold">الكورسات</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {model.courses.slice(0, 6).map((course) => {
              const img = getCardImageUrl(course.image_url || course.cover_url || course.thumbnail || model.courseFallbackImage);
              return (
                <TenantAppLink
                  key={course.id || courseTitle(course)}
                  href={courseHref(course)}
                  className="overflow-hidden"
                  style={{ border: "1px solid rgba(198,161,91,0.28)", borderRadius: 22 }}
                >
                  {img ? <img src={img} alt="" className="h-40 w-full object-cover" /> : null}
                  <div className="p-4">
                    <p className="font-bold">{courseTitle(course)}</p>
                    <p className="mt-1 text-sm" style={{ color: design.accent }}>{coursePrice(course)}</p>
                  </div>
                </TenantAppLink>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function HorizonLanding({ design, model }) {
  return (
    <div style={{ color: design.fg }}>
      <section className="mx-auto grid max-w-[1200px] overflow-hidden md:grid-cols-[0.9fr_1.1fr]" style={{ borderRadius: 28 }}>
        <div className="flex flex-col justify-between px-7 py-10 text-[#F4F7F2] md:px-10 md:py-14" style={{ background: design.accent }}>
          <p className="text-xs font-bold tracking-[0.22em]" style={{ color: design.accent2 }}>
            {model.specialty || "منصة المدرس"}
          </p>
          <div>
            <h1 className="mt-8 whitespace-pre-line text-4xl font-extrabold leading-tight md:text-5xl">
              {model.heroTitle}
            </h1>
            <p className="mt-4 text-sm font-semibold opacity-80">{model.teacherName}</p>
          </div>
          <div className="mt-10">
            {!model.hideSignup && model.signupHref ? (
              <TenantAppLink
                href={model.signupHref}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold"
                style={{ background: design.accent2, color: "#10241C" }}
              >
                ابدأ الآن
                <FaArrowLeft className="text-[10px]" />
              </TenantAppLink>
            ) : (
              <TenantAppLink
                href={model.loginHref}
                className="inline-flex rounded-full px-6 py-3 text-sm font-extrabold"
                style={{ background: design.accent2, color: "#10241C" }}
              >
                تسجيل الدخول
              </TenantAppLink>
            )}
          </div>
        </div>
        <div className="relative min-h-[320px] bg-white">
          {model.teacherPortraitUrl ? (
            <img src={model.teacherPortraitUrl} alt="" className="h-full min-h-[320px] w-full object-cover" />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#10241C]/80 to-transparent p-6 text-white">
            <p className="max-w-md text-sm leading-7">{model.bioText}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-[1200px] gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {model.services.slice(0, 4).map((service, index) => (
          <article key={service.title} className="rounded-3xl bg-white p-5 shadow-[0_16px_40px_-28px_rgba(15,61,50,0.7)]">
            <p className="text-3xl font-black" style={{ color: design.accent }}>
              0{index + 1}
            </p>
            <h2 className="mt-3 text-lg font-extrabold">{service.title}</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: design.muted }}>
              {service.description}
            </p>
          </article>
        ))}
      </section>

      {model.courses.length ? (
        <section className="mx-auto max-w-[1200px] px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-3xl font-extrabold">الكورسات</h2>
            <TenantAppLink href="/courses" className="text-sm font-bold" style={{ color: design.accent }}>
              عرض الكل
            </TenantAppLink>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {model.courses.slice(0, 6).map((course) => {
              const img = getCardImageUrl(course.image_url || course.cover_url || course.thumbnail || model.courseFallbackImage);
              return (
                <TenantAppLink
                  key={course.id || courseTitle(course)}
                  href={courseHref(course)}
                  className="overflow-hidden rounded-3xl bg-white"
                >
                  {img ? <img src={img} alt="" className="h-44 w-full object-cover" /> : null}
                  <div className="p-4">
                    <p className="font-extrabold">{courseTitle(course)}</p>
                    <p className="mt-1 text-sm font-bold" style={{ color: design.accent }}>{coursePrice(course)}</p>
                  </div>
                </TenantAppLink>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function TenantAlternateLanding({ layout, model }) {
  const design = getLandingDesign(layout);
  useDesignFont(design);
  if (design.id === "editorial") return <EditorialLanding design={design} model={model} />;
  if (design.id === "nocturne") return <NocturneLanding design={design} model={model} />;
  if (design.id === "horizon") return <HorizonLanding design={design} model={model} />;
  return null;
}
