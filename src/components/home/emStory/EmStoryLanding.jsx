import { useEffect } from "react";
import StoryNav from "./StoryNav";
import HeroChaos from "./HeroChaos";
import ProblemScenes from "./ProblemScenes";
import DayAfterEm from "./DayAfterEm";
import EcosystemDemo from "./EcosystemDemo";
import SocialProof from "./SocialProof";
import FinalCta from "./FinalCta";
import { EM, emFont } from "./theme";

function ensureCairoFont() {
  const id = "em-story-cairo-font";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);
}

function setLandingSeo() {
  document.title = "EM Lectures | ركّز في الشرح… وسيب الفوضى علينا";
  const desc =
    "منصة EM Lectures للمدرّسين: نحوّل فوضى الواتساب والامتحانات والمدفوعات والمتابعة إلى نظام واحد يسيبك تدرّس وتنمو.";
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", desc);
}

export default function EmStoryLanding() {
  useEffect(() => {
    ensureCairoFont();
    setLandingSeo();

    const root = document.documentElement;
    const prevScheme = root.style.colorScheme;
    const prevTheme = root.getAttribute("data-theme");
    root.style.colorScheme = "dark";
    root.setAttribute("data-em-story-dark", "1");

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevThemeColor = themeMeta?.getAttribute("content");
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", EM.bg);

    return () => {
      root.style.colorScheme = prevScheme;
      root.removeAttribute("data-em-story-dark");
      if (themeMeta && prevThemeColor != null) {
        themeMeta.setAttribute("content", prevThemeColor);
      }
      if (prevTheme) root.setAttribute("data-theme", prevTheme);
    };
  }, []);

  return (
    <div
      className="em-story-landing min-h-screen overflow-x-clip"
      data-theme="dark"
      style={{
        ...emFont,
        background: EM.bg,
        color: EM.text,
        colorScheme: "dark",
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      <a
        href="#problems"
        className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:px-4 focus:py-2 focus:shadow"
        style={{ background: EM.bgElevated, color: EM.text }}
      >
        تخطّي إلى المحتوى
      </a>
      <StoryNav />
      <main>
        <HeroChaos />
        <ProblemScenes />
        <DayAfterEm />
        <EcosystemDemo />
        <SocialProof />
        <FinalCta />
      </main>
    </div>
  );
}
