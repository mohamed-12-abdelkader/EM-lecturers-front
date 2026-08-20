import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPlatformPublicFreeLectures } from "../../../api/tenantPublicApi";
import TenantPublicShell from "../TenantPublicShell";
import TenantBreadcrumb from "../components/TenantBreadcrumb";
import TenantPublicImage from "../components/TenantPublicImage";
import { TenantPublicSkeleton, TenantPublicNotFound } from "../components/TenantPublicStates";
import { getYouTubeEmbedUrl, isYouTubeUrl } from "../../../utils/youtubeEmbed";

/**
 * Public free lesson page — indexed when lecture is published.
 * Path: /free-lectures/:lectureId
 */
export default function TenantFreeLessonPage({ subdomain }) {
  const { lectureId } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenant-free-lectures", subdomain],
    queryFn: () => fetchPlatformPublicFreeLectures(subdomain),
    staleTime: 60_000,
  });

  const lectures = data?.data?.lectures || [];
  const lecture = lectures.find((l) => String(l.id) === String(lectureId));
  const iframeSrc = useMemo(() => {
    if (!lecture?.link) return null;
    if (isYouTubeUrl(lecture.link)) return getYouTubeEmbedUrl(lecture.link);
    return lecture.link;
  }, [lecture?.link]);

  if (isLoading) {
    return (
      <TenantPublicShell subdomain={subdomain} seoPage="free-lecture" showSearch={false}>
        <TenantPublicSkeleton rows={2} />
      </TenantPublicShell>
    );
  }

  if (isError || !lecture) {
    return (
      <TenantPublicShell subdomain={subdomain} seoPage="free-lecture">
        <TenantPublicNotFound subdomain={subdomain} backHref="/#videos" />
      </TenantPublicShell>
    );
  }

  const title = lecture.title || "محاضرة مجانية";

  return (
    <TenantPublicShell subdomain={subdomain} seoPage="free-lecture">
      <TenantBreadcrumb
        items={[
          { name: "الرئيسية", path: "/" },
          { name: "محاضرات مجانية", path: "/#videos" },
          { name: title, path: null },
        ]}
      />

      <article>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">محاضرة مجانية</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          {lecture.link && iframeSrc ? (
            <div className="aspect-video w-full bg-black">
              <iframe
                src={iframeSrc}
                title={title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : lecture.link ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                رابط الفيديو غير صالح
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                تعذر تشغيل هذا الرابط داخل المنصة.
              </p>
            </div>
          ) : (
            <TenantPublicImage src={lecture.image_url} alt={title} priority />
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/signup"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            سجّل للمزيد من المحاضرات
          </a>
          <Link
            to="/courses"
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold dark:border-slate-600"
          >
            استعرض الكورسات
          </Link>
        </div>
      </article>
    </TenantPublicShell>
  );
}
