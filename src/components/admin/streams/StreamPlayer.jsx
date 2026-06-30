import React, { useEffect, useRef } from "react";
import Plyr from "plyr";
import Hls from "hls.js";
import "plyr/dist/plyr.css";

// TODO: Add a poster on the video
const StreamPlayer = ({ src }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const videoElRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the video element outside React
    const video = document.createElement("video");
    video.controls = true;
    video.autoplay = true;
    video.playsinline = true;
    video.muted = true;
    video.volume = 0;

    video.style.width = "100%";
    video.className = "plyr-react plyr";
    container.appendChild(video);
    videoElRef.current = video;

    let hls;
    let player;
    const defaultOptions = {
      volume: 0,
      autoplay: true,
      muted: true,
      captions: { active: false },
    };

    function updateQuality(newQuality) {
      if (!window.hls) return;
      if (newQuality === 0) {
        window.hls.currentLevel = -1;
      } else {
        window.hls.levels.forEach((level, levelIndex) => {
          if (level.height === newQuality) {
            window.hls.currentLevel = levelIndex;
          }
        });
      }
    }

    if (!Hls.isSupported()) {
      video.src = src;
      player = new Plyr(video, defaultOptions);
    } else {
      hls = new Hls();
      hls.loadSource(src);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const availableQualities = hls.levels.map((l) => l.height);
        availableQualities.unshift(0); // 0 = Auto

        defaultOptions.quality = {
          default: 0,
          options: availableQualities,
          forced: true,
          onChange: (e) => updateQuality(e),
        };

        defaultOptions.i18n = {
          qualityLabel: {
            0: "Auto",
          },
        };

        player = new Plyr(video, defaultOptions);
        playerRef.current = player;

        hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
          const span = document.querySelector(
            ".plyr__menu__container [data-plyr='quality'][value='0'] span"
          );
          if (span) {
            if (hls.autoLevelEnabled) {
              span.innerHTML = `AUTO (${hls.levels[data.level].height}p)`;
            } else {
              span.innerHTML = `AUTO`;
            }
          }
        });
      });

      hls.attachMedia(video);
      window.hls = hls;
    }

    return () => {
      if (player) {
        player.destroy();
      }
      if (hls) {
        hls.destroy();
      }
      if (video && container.contains(video)) {
        container.removeChild(video);
      }
    };
  }, [src]);

  return <div className="mx-auto my-[100px]" ref={containerRef} />;
};

export default StreamPlayer;
