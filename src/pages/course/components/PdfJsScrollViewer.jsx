import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from "react-icons/fi";
import FileScrollPanel from "./FileScrollPanel";

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
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.maxWidth = "100%";
      setHeight(viewport.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, pdf, pageNumber, scale]);

  return (
    <Box ref={hostRef} mb={6} minH={`${height}px`} w="full">
      <canvas ref={canvasRef} style={{ display: "block", margin: "0 auto", width: "100%", height: "auto" }} />
    </Box>
  );
}

export default function PdfJsScrollViewer({ src, fileName, onLoadError }) {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const scrollRaf = useRef(null);

  const bg = useColorModeValue("gray.100", "gray.950");
  const toolbarBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPdf(null);
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument(src).promise;
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
        setPage(1);
        setPageInput("1");
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "تعذّر تحميل PDF");
          onLoadError?.(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

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

  if (loading) {
    return (
      <Center flex={1} minH={0} bg={bg}>
        <Flex direction="column" align="center" gap={3}>
          <Spinner size="lg" color="blue.500" thickness="3px" />
          <Text fontSize="sm" color={muted}>
            جاري تحميل {fileName || "الملف"}...
          </Text>
        </Flex>
      </Center>
    );
  }

  if (error || !pdf) {
    return (
      <Center flex={1} minH={0} bg={bg} px={6}>
        <Text color="red.500" textAlign="center">
          {error || "تعذّر عرض الملف"}
        </Text>
      </Center>
    );
  }

  return (
    <Flex direction="column" flex={1} minH={0} bg={bg} overflow="hidden">
      <Flex
        align="center"
        gap={2}
        px={{ base: 2, md: 4 }}
        py={2}
        bg={toolbarBg}
        borderBottom="1px solid"
        borderColor={border}
        flexShrink={0}
        flexWrap="wrap"
      >
        <IconButton
          aria-label="الصفحة السابقة"
          icon={<Icon as={FiChevronRight} />}
          size="sm"
          onClick={() => scrollToPage(page - 1)}
          isDisabled={page <= 1}
          borderRadius="lg"
        />
        <IconButton
          aria-label="الصفحة التالية"
          icon={<Icon as={FiChevronLeft} />}
          size="sm"
          onClick={() => scrollToPage(page + 1)}
          isDisabled={page >= numPages}
          borderRadius="lg"
        />
        <HStack spacing={1}>
          <Input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(e) => e.key === "Enter" && commitPageInput()}
            size="sm"
            w="16"
            textAlign="center"
            borderRadius="lg"
          />
          <Text fontSize="sm" color={muted}>
            / {numPages.toLocaleString("ar-EG")}
          </Text>
        </HStack>
        <HStack spacing={1} ms="auto">
          <IconButton
            aria-label="ملائمة العرض"
            icon={<Text fontSize="xs" fontWeight="bold">Fit</Text>}
            size="sm"
            variant="ghost"
            onClick={() => setScale(fitScale)}
            borderRadius="lg"
          />
          <IconButton
            aria-label="تصغير"
            icon={<Icon as={FiZoomOut} />}
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(fitScale * 0.5, s - 0.1))}
            borderRadius="lg"
          />
          <IconButton
            aria-label="تكبير"
            icon={<Icon as={FiZoomIn} />}
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(fitScale * 2.5, s + 0.1))}
            borderRadius="lg"
          />
        </HStack>
      </Flex>

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
