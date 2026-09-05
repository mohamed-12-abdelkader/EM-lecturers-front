import { useEffect, useRef, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";
import { getYouTubeVideoId, YOUTUBE_PLYR_OPTIONS } from "../../utils/youtubeEmbed";

const PLYR_I18N = {
  restart: "إعادة التشغيل",
  rewind: "تأخير 10 ثواني",
  play: "تشغيل",
  pause: "إيقاف مؤقت",
  fastForward: "تقديم 10 ثواني",
  seek: "بحث",
  seekLabel: "{currentTime} من {duration}",
  played: "تم التشغيل",
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

const PLAYER_SX = {
  ".plyr": { fontFamily: "'Cairo', 'Tajawal', sans-serif" },
  ".plyr__control--overlaid": { bg: "blue.500" },
  ".plyr__menu__container": { direction: "rtl", textAlign: "right" },
};

function getBunnyEmbed(url) {
  const match = url?.match(/embed\/([^/]+)\/([^/?]+)/);
  if (!match) return null;
  return `https://iframe.mediadelivery.net/embed/${match[1]}/${match[2]}?autoplay=false&preload=true`;
}

function buildPlyrOptions({ quality, qualityLabel } = {}) {
  const hasQuality = Array.isArray(quality?.options) && quality.options.length > 0;

  return {
    disableContextMenu: false,
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
      "fullscreen",
    ],
    settings: hasQuality ? ["quality", "speed"] : ["speed"],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5] },
    seekTime: 10,
    ...(hasQuality ? { quality } : {}),
    i18n: {
      ...PLYR_I18N,
      ...(qualityLabel ? { qualityLabel } : {}),
    },
    ratio: "16:9",
  };
}

function getHlsQualityValue(level) {
  if (level?.height) return level.height;
  if (level?.bitrate) return Math.round(level.bitrate / 1000);
  return 0;
}

function buildHlsQualityMenu(hls) {
  const levels = hls?.levels ?? [];
  const values = [
    ...new Set(levels.map(getHlsQualityValue).filter(Boolean)),
  ].sort((a, b) => b - a);

  const qualityLabel = {
    0: "تلقائي",
    ...Object.fromEntries(
      values.map((value) => {
        const level = levels.find((item) => getHlsQualityValue(item) === value);
        return [value, level?.height ? `${level.height}p` : `${value} kbps`];
      }),
    ),
  };

  return {
    quality: {
      default: 0,
      options: values.length ? [0, ...values] : [0],
      forced: true,
      onChange(nextQuality) {
        applyHlsQuality(hls, nextQuality);
      },
    },
    qualityLabel,
  };
}

function applyHlsQuality(hls, nextQuality) {
  if (!hls) return;

  if (!nextQuality) {
    hls.currentLevel = -1;
    return;
  }

  const index = hls.levels.findIndex(
    (level) => getHlsQualityValue(level) === nextQuality,
  );
  if (index >= 0) hls.currentLevel = index;
}

const YT_QUALITY_TO_HEIGHT = {
  auto: 0,
  tiny: 144,
  small: 240,
  medium: 360,
  large: 480,
  hd720: 720,
  hd1080: 1080,
  hd1440: 1440,
  hd2160: 2160,
  highres: 4320,
};

const HEIGHT_TO_YT_QUALITY = Object.fromEntries(
  Object.entries(YT_QUALITY_TO_HEIGHT).map(([label, height]) => [height, label]),
);

const YT_QUALITY_OPTIONS = [0, 144, 240, 360, 480, 720, 1080, 1440, 2160];

const YT_QUALITY_LABELS = {
  0: "تلقائي",
  144: "144p",
  240: "240p",
  360: "360p",
  480: "480p",
  720: "720p",
  1080: "1080p",
  1440: "1440p",
  2160: "2160p",
};

function getYouTubeLevels(ytPlayer) {
  try {
    const levels = ytPlayer?.getAvailableQualityLevels?.();
    return Array.isArray(levels) ? levels : [];
  } catch {
    return [];
  }
}

function resolveYouTubeQualityLabel(ytPlayer, height) {
  const wanted = height ? HEIGHT_TO_YT_QUALITY[height] || "auto" : "auto";
  const levels = getYouTubeLevels(ytPlayer);
  if (!levels.length || wanted === "auto" || levels.includes(wanted)) return wanted;

  const availableHeights = levels
    .map((label) => YT_QUALITY_TO_HEIGHT[label])
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  if (!availableHeights.length) return wanted;

  const closest = availableHeights.reduce((best, value) =>
    Math.abs(value - height) < Math.abs(best - height) ? value : best,
  );
  return HEIGHT_TO_YT_QUALITY[closest] || "auto";
}

function applyYouTubeQuality(ytPlayer, height) {
  if (!ytPlayer) return;

  const label = resolveYouTubeQualityLabel(ytPlayer, height);

  try {
    ytPlayer.setPlaybackQualityRange?.(label, label);
  } catch {
    /* YouTube may ignore quality hints */
  }
  try {
    ytPlayer.setPlaybackQuality?.(label);
  } catch {
    /* deprecated, still the only embed hook */
  }
}

function buildYouTubeQualityMenu(getYtPlayer) {
  return {
    quality: {
      default: 0,
      options: YT_QUALITY_OPTIONS,
      forced: true,
      onChange(nextQuality) {
        applyYouTubeQuality(getYtPlayer(), nextQuality);
      },
    },
    qualityLabel: YT_QUALITY_LABELS,
  };
}

function bindYouTubeQualityControl(player) {
  const applyCurrent = () => {
    applyYouTubeQuality(player.embed, player.quality ?? 0);
  };

  player.on("ready", applyCurrent);
  player.on("playing", applyCurrent);
  player.on("statechange", (event) => {
    const code = event?.detail?.code;
    if (code === 1) applyCurrent();
  });
}

function SecureHlsPlayer({
  manifestUrl,
  authToken,
  sessionId,
  segmentToken,
  resumePosition,
  onPlayerReady,
  onEvent,
}) {
  const containerRef = useRef(null);
  const playerId = useMemo(() => `secure-hls-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !manifestUrl) return undefined;

    const video = document.createElement("video");
    video.id = playerId;
    video.playsInline = true;
    video.className = "w-full h-full";
    container.appendChild(video);

    let player;
    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        xhrSetup(xhr) {
          if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
          if (sessionId) xhr.setRequestHeader("X-Playback-Session", sessionId);
          if (segmentToken) xhr.setRequestHeader("X-Playback-Token", segmentToken);
        },
      });
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        player = new Plyr(video, buildPlyrOptions(buildHlsQualityMenu(hls)));
        onPlayerReady?.(player, video);
        if (resumePosition > 0) video.currentTime = resumePosition;
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) onEvent?.("stream_error", { details: data.details });
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = manifestUrl;
      player = new Plyr(video, buildPlyrOptions());
      onPlayerReady?.(player, video);
    }

    video.addEventListener("play", () => onEvent?.("play", {}));
    video.addEventListener("pause", () => onEvent?.("pause", {}));
    video.addEventListener("seeking", () => onEvent?.("seek", { time: video.currentTime }));
    video.addEventListener("ratechange", () =>
      onEvent?.("speed_change", { rate: video.playbackRate }),
    );

    return () => {
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      hls?.destroy();
      if (container.contains(video)) container.removeChild(video);
    };
  }, [manifestUrl, authToken, sessionId, segmentToken, resumePosition, playerId, onPlayerReady, onEvent]);

  return (
    <Box
      ref={containerRef}
      w="full"
      sx={{
        ...PLAYER_SX,
        video: { maxHeight: "70vh" },
      }}
    />
  );
}

function disableYouTubeCaptions(ytPlayer) {
  if (!ytPlayer) return;
  try {
    ytPlayer.unloadModule("captions");
  } catch {
    /* module may not be loaded yet */
  }
  try {
    ytPlayer.unloadModule("cc");
  } catch {
    /* ignore */
  }
  try {
    ytPlayer.setOption("captions", "track", {});
  } catch {
    /* ignore */
  }
}

function bindYouTubeCaptionGuard(player) {
  const apply = () => disableYouTubeCaptions(player.embed);

  player.on("ready", () => {
    player.toggleCaptions(false);
    apply();
    player.embed?.addEventListener?.("onApiChange", apply);
  });

  player.on("captionsenabled", () => {
    player.toggleCaptions(false);
    apply();
  });

  player.on("statechange", apply);
}

function SecureYoutubePlayer({ youtubeUrl, onPlayerReady }) {
  const youtubeId = getYouTubeVideoId(youtubeUrl);
  const playerId = useMemo(() => `secure-yt-${youtubeId}`, [youtubeId]);

  useEffect(() => {
    if (!youtubeId) return undefined;

    let ytPlayer = null;
    const player = new Plyr(`#${playerId}`, {
      ...buildPlyrOptions(buildYouTubeQualityMenu(() => ytPlayer || player.embed)),
      captions: { active: false, update: false },
      youtube: {
        noCookie: true,
        iv_load_policy: 3,
        modestbranding: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        playsinline: 1,
        ...YOUTUBE_PLYR_OPTIONS,
      },
    });

    player.on("ready", () => {
      ytPlayer = player.embed || ytPlayer;
    });

    bindYouTubeCaptionGuard(player);
    bindYouTubeQualityControl(player);
    onPlayerReady?.(player);
    return () => {
      try {
        player.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [youtubeId, playerId, onPlayerReady]);

  if (!youtubeId) {
    return (
      <Box p={8} textAlign="center">
        <Text color="white">رابط فيديو YouTube غير صالح</Text>
      </Box>
    );
  }

  return (
    <Box sx={PLAYER_SX}>
      <div id={playerId} data-plyr-provider="youtube" data-plyr-embed-id={youtubeId} />
    </Box>
  );
}

function SecureBunnyPlayer({ embedUrl }) {
  const src = getBunnyEmbed(embedUrl) || embedUrl;
  return (
    <Box className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={src}
        title="محتوى محمي"
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </Box>
  );
}

function SecureProgressivePlayer({ url, authToken, sessionId, onPlayerReady, onEvent }) {
  const containerRef = useRef(null);
  const playerId = useMemo(() => `secure-mp4-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !url) return undefined;

    const video = document.createElement("video");
    video.id = playerId;
    video.playsInline = true;
    container.appendChild(video);

    video.src = url;
    const player = new Plyr(video, buildPlyrOptions());
    onPlayerReady?.(player, video);

    video.addEventListener("play", () => onEvent?.("play", {}));
    video.addEventListener("pause", () => onEvent?.("pause", {}));

    return () => {
      try {
        player.destroy();
      } catch {
        /* ignore */
      }
      if (container.contains(video)) container.removeChild(video);
    };
  }, [url, authToken, sessionId, playerId, onPlayerReady, onEvent]);

  return <Box ref={containerRef} w="full" />;
}

export default function SecureVideoPlayer({ playback, authToken, onPlayerReady, onEvent }) {
  if (!playback) return null;

  switch (playback.streamType) {
    case "hls":
      return (
        <SecureHlsPlayer
          manifestUrl={playback.manifestUrl}
          authToken={authToken}
          sessionId={playback.sessionId}
          segmentToken={playback.segmentToken}
          resumePosition={playback.resumePosition}
          onPlayerReady={onPlayerReady}
          onEvent={onEvent}
        />
      );
    case "youtube":
      return <SecureYoutubePlayer youtubeUrl={playback.youtubeUrl} onPlayerReady={onPlayerReady} />;
    case "bunny":
      return <SecureBunnyPlayer embedUrl={playback.embedUrl} />;
    case "progressive":
      return (
        <SecureProgressivePlayer
          url={playback.progressiveUrl}
          authToken={authToken}
          sessionId={playback.sessionId}
          onPlayerReady={onPlayerReady}
          onEvent={onEvent}
        />
      );
    default:
      return (
        <SecureProgressivePlayer
          url={playback.manifestUrl || playback.progressiveUrl}
          authToken={authToken}
          sessionId={playback.sessionId}
          onPlayerReady={onPlayerReady}
          onEvent={onEvent}
        />
      );
  }
}
