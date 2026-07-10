import { FaArrowLeft, FaCheck, FaGraduationCap } from "react-icons/fa";
import { Reveal } from "../../tenantLandingMotion";
import { tlContainer } from "../../tenantLandingTheme";

function AboutTeacherImage({ src, alt }) {
  return (
    <div className="relative mx-auto w-full max-w-[400px]" dir="ltr">
      <div
        className="pointer-events-none absolute -bottom-5 -left-5 h-[88%] w-[78%] rounded-2xl bg-orange-200/70 dark:bg-orange-900/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 top-8 h-20 w-20 rounded-full border border-blue-200 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/40"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(49,130,206,0.12)] dark:border-slate-700 dark:bg-slate-900">
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-l from-blue-500 via-blue-400 to-orange-400" aria-hidden />

        <div className="aspect-[4/5] overflow-hidden bg-gradient-to-b from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FaGraduationCap className="text-6xl text-blue-200 dark:text-slate-600" aria-hidden />
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function TenantProBentoWall({
  teacherName,
  bioText,
  services,
  signupHref,
  teacherImageUrl,
}) {
  const benefitItems = services.slice(0, 4).map((s) => s.title).filter(Boolean);

  return (
    <section
      id="services"
      className="scroll-mt-20 bg-white py-16 dark:bg-slate-950 md:py-20"
      dir="rtl"
    >
      <div className={`${tlContainer} max-w-6xl`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16" dir="ltr">
          <div className="order-1 flex justify-center lg:order-none">
            <Reveal variant="blurUp">
              <AboutTeacherImage src={teacherImageUrl} alt={teacherName} />
            </Reveal>
          </div>

          <div className="order-2 text-right lg:order-none" dir="rtl">
            <Reveal variant="blurUp">
              <p className="text-sm font-semibold text-blue-500">تعرّف علينا</p>
              <h2 className="font-heading mt-2 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                لماذا {teacherName}؟
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
                {bioText}
              </p>

              {benefitItems.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {benefitItems.map((title) => (
                    <li
                      key={title}
                      className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                    >
                      <FaCheck className="mt-0.5 shrink-0 text-blue-500" aria-hidden />
                      <span>{title}</span>
                    </li>
                  ))}
                </ul>
              )}

              <a
                href={signupHref}
                className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-500 px-7 py-3 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-blue-600"
              >
                ابدأ الآن
                <FaArrowLeft className="text-xs" />
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
