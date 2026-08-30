import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Center, Flex, Spinner, Text, useColorModeValue } from "@chakra-ui/react";
import { courseFilesApiError, buildCourseFileViewApiUrl, getCourseFileViewHeaders } from "../../../api/courseFilesApi";
import FileScrollPanel from "./FileScrollPanel";
import PdfViewerToolbar from "./PdfViewerToolbar";

const PDFJS_VERSION = "4.0.379";
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

let pdfjsLibPromise = null;

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(/* @vite-ignore */ `${PDFJS_BASE}/pdf.min.mjs`).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
      return lib;
    });
  }
  return pdfjsLibPromise;
}

function LazyPdfPage({ pdf, pageNumber, scale, rootRef }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    const node = hostRef.current;
    const root = rootRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root, rootMargin: "600px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootRef]);

  useEffect(() => {
    if (!visible || !pdf) return undefined;

    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.maxWidth = "100%";
      setHeight(viewport.height);

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      await page.render({ canvasContext: ctx, viewport, transform }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, pdf, pageNumber, scale]);

  return (
    <Box ref={hostRef} mb={6} minH={`${height}px`} w="full">
      <canvas
        ref={canvasRef}
        style={{ display: "block", margin: "0 auto", width: "100%", height: "auto", touchAction: "pan-y pinch-zoom" }}
      />
    </Box>
  );
}

export default function PdfViewer({ fileId, fileName, onRetry }) {
  const [reloadToken, setReloadToken] = useState(0);
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const scrollRaf = useRef(null);
  const pdfRef = useRef(null);

  const bg = useColorModeValue("gray.100", "gray.950");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    (async () => {
      if (!fileId) {
        setPdf(null);
        return;
      }

      setParsing(true);
      setParseError(null);
      setPdf(null);

      try {
        const pdfjs = await loadPdfJs();
        loadingTask = pdfjs.getDocument({
          url: `${buildCourseFileViewApiUrl(fileId)}?client=app`,
          httpHeaders: getCourseFileViewHeaders(),
          withCredentials: false,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
        });
        const doc = await loadingTask.promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        pdfRef.current = doc;
        setPdf(doc);
        setNumPages(doc.numPages);
        setPage(1);
        setPageInput("1");
      } catch (err) {
        if (!cancelled) {
          setParseError(courseFilesApiError(err, err?.message || "تعذّر عرض ملف PDF"));
        }
      } finally {
        if (!cancelled) setParsing(false);
      }
    })();

    return () => {
      cancelled = true;
      if (pdfRef.current) {
        pdfRef.current.destroy();
        pdfRef.current = null;
      } else {
        loadingTask?.destroy?.();
      }
    };
  }, [fileId, reloadToken]);

  const recalcFitScale = useCallback(async () => {
    if (!pdf || !scrollRef.current) return;
    const firstPage = await pdf.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const horizontalPadding = 32;
    const availableWidth = Math.max(280, scrollRef.current.clientWidth - horizontalPadding);
    const nextFit = availableWidth / baseViewport.width;
    setFitScale(nextFit);
    setScale(nextFit);
  }, [pdf]);

  useEffect(() => {
    if (!pdf) return undefined;
    recalcFitScale();
    const node = scrollRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => recalcFitScale());
    observer.observe(node);
    return () => observer.disconnect();
  }, [pdf, recalcFitScale]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const scrollToPage = useCallback(
    (target) => {
      const clamped = Math.min(Math.max(1, target), numPages || 1);
      setPage(clamped);
      setPageInput(String(clamped));
      pageRefs.current[clamped - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [numPages],
  );

  const commitPageInput = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isFinite(parsed)) scrollToPage(parsed);
    else setPageInput(String(page));
  }, [page, pageInput, scrollToPage]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || numPages === 0) return;
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      const root = scrollRef.current;
      if (!root) return;
      const rootTop = root.getBoundingClientRect().top;
      let closest = 1;
      let minDistance = Infinity;
      pageRefs.current.forEach((el, index) => {
        if (!el) return;
        const distance = Math.abs(el.getBoundingClientRect().top - rootTop - 12);
        if (distance < minDistance) {
          minDistance = distance;
          closest = index + 1;
        }
      });
      setPage(closest);
      setPageInput(String(closest));
    });
  }, [numPages]);

  const toggleFullscreen = useCallback(async () => {
    const node = containerRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await node.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by the browser
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target?.tagName === "INPUT" || event.target?.tagName === "TEXTAREA") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToPage(page + 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToPage(page - 1);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setScale((s) => Math.min(fitScale * 2.5, s + 0.1));
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setScale((s) => Math.max(fitScale * 0.5, s - 0.1));
      } else if (event.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fitScale, page, scrollToPage]);

  const loading = parsing || (!pdf && !parseError);
  const loadError = parseError;

  if (loading) {
    return (
      <Center flex={1} minH={0} bg={bg}>
        <Flex direction="column" align="center" gap={3}>
          <Spinner size="lg" color="orange.500" thickness="3px" />
          <Text fontSize="sm" color={muted}>
            جاري تحميل {fileName || "الملف"}...
          </Text>
        </Flex>
      </Center>
    );
  }

  if (loadError || !pdf) {
    return (
      <Center flex={1} minH={0} bg={bg} px={6}>
        <Flex direction="column" align="center" gap={3} textAlign="center">
          <Text color="red.500" role="alert">
            {loadError || "تعذّر عرض الملف"}
          </Text>
          <Button
            size="sm"
            variant="outline"
            borderRadius="xl"
            onClick={() => {
              onRetry?.();
              setParseError(null);
              setReloadToken((n) => n + 1);
            }}
          >
            إعادة المحاولة
          </Button>
        </Flex>
      </Center>
    );
  }

  return (
    <Flex
      ref={containerRef}
      direction="column"
      flex={1}
      minH={0}
      bg={bg}
      overflow="hidden"
    >
      <PdfViewerToolbar
        page={page}
        pageInput={pageInput}
        numPages={numPages}
        scale={scale}
        fitScale={fitScale}
        isFullscreen={isFullscreen}
        onPrev={() => scrollToPage(page - 1)}
        onNext={() => scrollToPage(page + 1)}
        onPageInputChange={setPageInput}
        onPageInputCommit={commitPageInput}
        onZoomIn={() => setScale((s) => Math.min(fitScale * 2.5, s + 0.1))}
        onZoomOut={() => setScale((s) => Math.max(fitScale * 0.5, s - 0.1))}
        onFitWidth={() => setScale(fitScale)}
        onToggleFullscreen={toggleFullscreen}
      />

      <FileScrollPanel
        scrollRef={scrollRef}
        px={{ base: 2, md: 4 }}
        py={4}
        onScroll={handleScroll}
        onWheel={(event) => event.stopPropagation()}
      >
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <Box
              key={`${pageNumber}-${scale}`}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
            >
              <LazyPdfPage pdf={pdf} pageNumber={pageNumber} scale={scale} rootRef={scrollRef} />
            </Box>
          );
        })}
      </FileScrollPanel>
    </Flex>
  );
}
