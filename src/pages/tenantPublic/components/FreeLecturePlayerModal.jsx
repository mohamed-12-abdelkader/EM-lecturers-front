import { useEffect, useMemo, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { FaTimes } from "react-icons/fa";

const PLYR_I18N = {
  restart: "إعادة التشغيل",
  rewind: "تأخير 10 ثواني",
  play: "تشغيل",
  pause: "إيقاف مؤقت",
  fastForward: "تقديم 10 ثواني",
  seek: "بحث",
  seekLabel: "{currentTime} من {duration}",
  played: "تـم التشغيل",
  buffered: "تم التحميل",
  currentTime: "الوقت الحالي",
  duration: "المدة الإجمالية",
  volume: "مستوى الصوت",
  mute: "كتم الصوت",
  unmute: "إلغاء كتم الصوت",
  enterFullscreen: "ملء الشاشة",
  exitFullscreen: "الخروج من ملء الشاشة",
  settings: "الإعدادات",
  speed: "سرعة التشغيل",
  normal: "عادي",
  quality: "الجودة",
};

function getYoutubeId(url) {
  if (!url) return null;
  if (url.includes("youtube.com/watch?v=")) {
    return url.split("v=")[1].split("&")[0];
  }
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2]?.length === 11 ? match[2] : null;
}

function getBunnyEmbed(url) {
  const match = url?.match(/embed\/([^/]+)\/([^/?]+)/);
  return match ? { libraryId: match[1], videoId: match[2] } : null;
}

function getVimeoEmbed(url) {
  const match = url?.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export function resolveFreeLectureEmbed(url) {
  const youtubeId = getYoutubeId(url);
  if (youtubeId) return { kind: "youtube", youtubeId };

  const bunny = getBunnyEmbed(url);
  if (bunny) {
    return {
      kind: "iframe",
      src: `https://iframe.mediadelivery.net/embed/${bunny.libraryId}/${bunny.videoId}`,
    };
  }

  const vimeo = getVimeoEmbed(url);
  if (vimeo) return { kind: "iframe", src: vimeo };

  if (/^https?:\/\//i.test(url)) {
    return { kind: "iframe", src: url };
  }

  return { kind: "external", url };
}

function PlyrYoutubePlayer({ youtubeId }) {
  const playerRef = useRef(null);
  const playerId = useMemo(() => `free-lecture-player-${youtubeId}`, [youtubeId]);

  useEffect(() => {
    const player = new Plyr(`#${playerId}`, {
      disableContextMenu: true,
      controls: [
        "play-large",
        "rewind",
        "play",
        "fast-forward",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "pip",
        "fullscreen",
      ],
      settings: ["quality", "speed"],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      seekTime: 10,
      i18n: PLYR_I18N,
    });
    playerRef.current = player;

    return () => {
      try {
        player.destroy();
      } catch {
        // ignore destroy errors
      }
      playerRef.current = null;
    };
  }, [playerId, youtubeId]);

  return (
    <div className="free-lecture-plyr overflow-hidden rounded-xl bg-black">
      <div id={playerId} data-plyr-provider="youtube" data-plyr-embed-id={youtubeId} />
    </div>
  );
}

function IframePlayer({ src, title }) {
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <iframe
        src={src}
        title={title}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

export default function FreeLecturePlayerModal({ lecture, onClose }) {
  const embed = useMemo(
    () => (lecture?.link ? resolveFreeLectureEmbed(lecture.link) : null),
    [lecture?.link],
  );

  if (!lecture) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={lecture.title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 text-right">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">محاضرة مجانية</p>
            <h3 className="font-heading mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {lecture.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="إغلاق"
          >
            <FaTimes />
          </button>
        </div>

        {embed?.kind === "youtube" ? (
          <PlyrYoutubePlayer youtubeId={embed.youtubeId} />
        ) : embed?.kind === "iframe" ? (
          <IframePlayer src={embed.src} title={lecture.title} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-600 dark:bg-slate-800/50">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              لا يمكن عرض هذا الرابط داخل المشغل. افتحه في نافذة جديدة.
            </p>
            <a
              href={lecture.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              فتح المحاضرة
            </a>
          </div>
        )}

        <style>{`
          .free-lecture-plyr .plyr {
            font-family: 'Cairo', 'Tajawal', sans-serif;
          }
          .free-lecture-plyr .plyr__control--overlaid {
            background: #2563eb;
          }
          .free-lecture-plyr .plyr--video .plyr__control.plyr__tab-focus,
          .free-lecture-plyr .plyr--video .plyr__control:hover,
          .free-lecture-plyr .plyr--video .plyr__control[aria-expanded="true"] {
            background: #f97316;
          }
          .free-lecture-plyr .plyr__menu__container {
            direction: rtl;
            text-align: right;
          }
        `}</style>
      </div>
    </div>
  );
}
