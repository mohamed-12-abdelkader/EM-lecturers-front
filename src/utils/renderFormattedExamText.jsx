import React from "react";
import { Box } from "@chakra-ui/react";

const numericInlinePattern =
  /([+-]?\d+(?:[.,]\d+)?(?:\s*[×xX·]\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻+\-\d]+|\s*[×xX·]\s*[+-]?\d+)?(?:\s*[A-Za-z°%/]+)?|10[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻+\-\d]+(?:\s*[A-Za-z°%/]+)?)/g;

const isNumericText = (value) =>
  /^[+-]?\d|^10[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻+\-\d]/.test(String(value).trim());

const extractBalancedGroup = (text, startIndex) => {
  if (text[startIndex] !== "{") return null;

  let depth = 0;
  for (let i = startIndex; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") depth -= 1;

    if (depth === 0) {
      return {
        content: text.slice(startIndex + 1, i),
        endIndex: i,
      };
    }
  }

  return null;
};

const findNextMathMarker = (text, fromIndex) => {
  const markers = ["$$", "\\[", "\\(", "$", "\\frac", "\\sqrt", "\\text"];
  let nextIndex = text.length;
  let marker = null;

  for (const item of markers) {
    const idx = text.indexOf(item, fromIndex);
    if (idx !== -1 && idx < nextIndex) {
      nextIndex = idx;
      marker = item;
    }
  }

  return { index: nextIndex, marker };
};

const tokenizeFormattedText = (text) => {
  const segments = [];
  let index = 0;

  while (index < text.length) {
    if (text.startsWith("$$", index)) {
      const end = text.indexOf("$$", index + 2);
      if (end > index) {
        segments.push({ type: "latex", value: text.slice(index + 2, end), display: true });
        index = end + 2;
        continue;
      }
    }

    if (text.startsWith("\\[", index)) {
      const end = text.indexOf("\\]", index + 2);
      if (end > index) {
        segments.push({ type: "latex", value: text.slice(index + 2, end), display: true });
        index = end + 2;
        continue;
      }
    }

    if (text.startsWith("\\(", index)) {
      const end = text.indexOf("\\)", index + 2);
      if (end > index) {
        segments.push({ type: "latex", value: text.slice(index + 2, end), display: false });
        index = end + 2;
        continue;
      }
    }

    if (text[index] === "$" && text[index + 1] !== "$") {
      const end = text.indexOf("$", index + 1);
      if (end > index) {
        segments.push({ type: "latex", value: text.slice(index + 1, end), display: false });
        index = end + 1;
        continue;
      }
    }

    if (text.startsWith("\\frac", index)) {
      const numerator = extractBalancedGroup(text, index + 5);
      const denominator = numerator
        ? extractBalancedGroup(text, numerator.endIndex + 1)
        : null;
      if (numerator && denominator) {
        segments.push({
          type: "latex",
          value: text.slice(index, denominator.endIndex + 1),
          display: false,
        });
        index = denominator.endIndex + 1;
        continue;
      }
    }

    if (text.startsWith("\\sqrt", index)) {
      let pos = index + 5;
      if (text[pos] === "[") {
        const closeBracket = text.indexOf("]", pos);
        if (closeBracket > pos) pos = closeBracket + 1;
      }
      const content = extractBalancedGroup(text, pos);
      if (content) {
        segments.push({
          type: "latex",
          value: text.slice(index, content.endIndex + 1),
          display: false,
        });
        index = content.endIndex + 1;
        continue;
      }
    }

    if (text.startsWith("\\text", index)) {
      const content = extractBalancedGroup(text, index + 5);
      if (content) {
        segments.push({
          type: "latex",
          value: text.slice(index, content.endIndex + 1),
          display: false,
        });
        index = content.endIndex + 1;
        continue;
      }
    }

    const next = findNextMathMarker(text, index);
    if (next.index === index) {
      segments.push({ type: "plain", value: text[index] ?? "" });
      index += 1;
      continue;
    }
    if (next.index > index) {
      segments.push({ type: "plain", value: text.slice(index, next.index) });
    }
    index = next.index;
  }

  return segments;
};

const renderPlainText = (value, keyPrefix) =>
  String(value)
    .split(numericInlinePattern)
    .filter((part) => part !== "")
    .map((part, index) =>
      isNumericText(part) ? (
        <Box
          as="span"
          key={`${keyPrefix}-num-${index}`}
          dir="ltr"
          display="inline"
          whiteSpace="nowrap"
          mx="0.15em"
          sx={{ unicodeBidi: "isolate" }}
        >
          {part}
        </Box>
      ) : (
        <React.Fragment key={`${keyPrefix}-txt-${index}`}>{part}</React.Fragment>
      ),
    );

const latexCommandMap = {
  times: "×",
  cdot: "·",
  div: "÷",
  pm: "±",
  mp: "∓",
  le: "≤",
  ge: "≥",
  neq: "≠",
  approx: "≈",
  infty: "∞",
  pi: "π",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  sigma: "σ",
  omega: "ω",
  degree: "°",
  circ: "°",
  left: "",
  right: "",
  text: "",
};

const renderLatexFragment = (value, keyPrefix = "math") => {
  const latex = String(value ?? "").trim();
  const nodes = [];
  let index = 0;

  const pushPlain = (text) => {
    if (!text) return;
    nodes.push(...renderPlainText(text, `${keyPrefix}-plain-${nodes.length}`));
  };

  while (index < latex.length) {
    if (latex.startsWith("\\frac", index)) {
      const numerator = extractBalancedGroup(latex, index + 5);
      const denominator = numerator
        ? extractBalancedGroup(latex, numerator.endIndex + 1)
        : null;

      if (numerator && denominator) {
        nodes.push(
          <Box
            as="span"
            key={`${keyPrefix}-frac-${nodes.length}`}
            dir="ltr"
            display="inline-flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            mx="1"
            lineHeight="1.05"
            verticalAlign="middle"
            sx={{ unicodeBidi: "isolate" }}
          >
            <Box as="span" px="1" fontSize="0.86em">
              {renderLatexFragment(numerator.content, `${keyPrefix}-num-${nodes.length}`)}
            </Box>
            <Box
              as="span"
              px="1"
              mt="0.5"
              borderTop="1px solid currentColor"
              fontSize="0.86em"
            >
              {renderLatexFragment(denominator.content, `${keyPrefix}-den-${nodes.length}`)}
            </Box>
          </Box>,
        );
        index = denominator.endIndex + 1;
        continue;
      }
    }

    if (latex.startsWith("\\sqrt", index)) {
      let pos = index + 5;
      let rootIndex = null;
      if (latex[pos] === "[") {
        const closeBracket = latex.indexOf("]", pos);
        if (closeBracket > pos) {
          rootIndex = latex.slice(pos + 1, closeBracket);
          pos = closeBracket + 1;
        }
      }
      const content = extractBalancedGroup(latex, pos);
      if (content) {
        nodes.push(
          <Box
            as="span"
            key={`${keyPrefix}-sqrt-${nodes.length}`}
            dir="ltr"
            display="inline-flex"
            alignItems="center"
            mx="0.5"
            sx={{ unicodeBidi: "isolate" }}
          >
            {rootIndex ? (
              <Box as="sup" fontSize="0.65em" mr="0.5">
                {renderLatexFragment(rootIndex, `${keyPrefix}-root-${nodes.length}`)}
              </Box>
            ) : null}
            <Box as="span" fontSize="1.05em">√</Box>
            <Box as="span" borderTop="1px solid transparent">
              {renderLatexFragment(content.content, `${keyPrefix}-sqrt-body-${nodes.length}`)}
            </Box>
          </Box>,
        );
        index = content.endIndex + 1;
        continue;
      }
    }

    if (latex.startsWith("\\text", index)) {
      const content = extractBalancedGroup(latex, index + 5);
      if (content) {
        nodes.push(
          <React.Fragment key={`${keyPrefix}-text-${nodes.length}`}>
            {renderPlainText(content.content, `${keyPrefix}-text-${nodes.length}`)}
          </React.Fragment>,
        );
        index = content.endIndex + 1;
        continue;
      }
    }

    if (latex.startsWith("\\left", index)) {
      index += 5;
      continue;
    }

    if (latex.startsWith("\\right", index)) {
      index += 6;
      continue;
    }

    const char = latex[index];

    if (char === "\\") {
      const command = latex.slice(index).match(/^\\([a-zA-Z]+)/);
      if (command) {
        pushPlain(latexCommandMap[command[1]] ?? command[1]);
        index += command[0].length;
        continue;
      }
    }

    if (char === "{") {
      const group = extractBalancedGroup(latex, index);
      if (group) {
        nodes.push(
          <React.Fragment key={`${keyPrefix}-group-${nodes.length}`}>
            {renderLatexFragment(group.content, `${keyPrefix}-group-${nodes.length}`)}
          </React.Fragment>,
        );
        index = group.endIndex + 1;
        continue;
      }
    }

    if ((char === "_" || char === "^") && nodes.length > 0) {
      const baseNode = nodes.pop();
      const scriptGroup =
        latex[index + 1] === "{" ? extractBalancedGroup(latex, index + 1) : null;
      const script = scriptGroup?.content ?? latex[index + 1] ?? "";
      const nextIndex = scriptGroup ? scriptGroup.endIndex + 1 : index + 2;

      nodes.push(
        <Box
          as="span"
          key={`${keyPrefix}-script-${nodes.length}`}
          dir="ltr"
          display="inline-flex"
          alignItems={char === "_" ? "flex-end" : "flex-start"}
          sx={{ unicodeBidi: "isolate" }}
        >
          {baseNode}
          <Box
            as="span"
            fontSize="0.72em"
            lineHeight="1"
            transform={char === "_" ? "translateY(0.24em)" : "translateY(-0.34em)"}
          >
            {renderLatexFragment(script, `${keyPrefix}-script-${nodes.length}`)}
          </Box>
        </Box>,
      );
      index = nextIndex;
      continue;
    }

    let plainEnd = index + 1;
    while (
      plainEnd < latex.length &&
      !["\\", "{", "_", "^"].includes(latex[plainEnd])
    ) {
      plainEnd += 1;
    }
    pushPlain(latex.slice(index, plainEnd));
    index = plainEnd;
  }

  return nodes;
};

const renderMathSegment = (value, keyPrefix, display = false) => (
  <Box
    as="span"
    key={keyPrefix}
    dir="ltr"
    display={display ? "block" : "inline-block"}
    my={display ? 2 : 0}
    textAlign={display ? "center" : "inherit"}
    fontFamily="'Cambria Math', 'Times New Roman', serif"
    sx={{ unicodeBidi: "isolate" }}
  >
    {renderLatexFragment(value, keyPrefix)}
  </Box>
);

const MARKUP_RE =
  /<\/?(u|ins|b|strong|i|em|mark|sub|sup)(?:\s[^>]*)?>|<(?:br)\s*\/?>/gi;

/**
 * أبيات الشعر فقط: شطر . : شطر
 * النقطة قبل النقطتين إلزامية حتى لا تنقسم أسئلة عادية فيها ":" (مثل قوائم I/II).
 */
const VERSE_SPLIT_RE = /^(.{8,110}?)\s+[.\u06D4]\s*:\s+(.{8,110})$/;
const VERSE_REJECT_RE =
  /\(([IVXLC]+|[0-9٠-٩]{1,2})\)|(?:^|\s)(?:R|r)\d|أمبير|مقاوم|دائر|كهرب|تيار|جهد/;

function decodeBasicEntities(text) {
  return String(text ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** يزيل محارف تمنع اتصال الحروف العربية ويعالج مسافات OCR بين الحروف */
function normalizeArabicShaping(text) {
  let t = String(text ?? "")
    .replace(/[\u200B\u200C\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");

  // "ا ل م ق ا ب ل" → "المقابل" عندما تكون الرموز حروفاً مفردة (بقايا OCR)
  t = t.replace(
    /(?:[\u0600-\u06FF](?:[\u064B-\u065F\u0670\u0640])*(?:\s+)){2,}[\u0600-\u06FF](?:[\u064B-\u065F\u0670\u0640])*/g,
    (run) => {
      const tokens = run.trim().split(/\s+/);
      if (tokens.length < 3) return run;
      const single = tokens.filter((tok) =>
        /^[\u0600-\u06FF](?:[\u064B-\u065F\u0670\u0640])*$/.test(tok),
      ).length;
      return single / tokens.length >= 0.85 ? tokens.join("") : run;
    },
  );

  return t;
}

function tryParsePoetryVerse(trimmed) {
  const verse = trimmed.match(VERSE_SPLIT_RE);
  if (!verse) return null;
  if (VERSE_REJECT_RE.test(trimmed)) return null;
  const sadr = verse[1].trim();
  const ajuz = verse[2].trim();
  const ratio =
    Math.max(sadr.length, ajuz.length) / Math.max(1, Math.min(sadr.length, ajuz.length));
  if (ratio > 2.8) return null;
  return { sadr, ajuz };
}

/** ينظّف بقايا OCR (JSON boxes وأسئلة مدمجة بعد السؤال الأصلي) */
export function cleanQuestionStemForDisplay(value) {
  let text = decodeBasicEntities(value);
  text = normalizeArabicShaping(text);
  text = text.replace(/\s*\[\{\s*"box_2d"[\s\S]*$/i, "");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  const extra = text.search(/\n\s*[٠-٩0-9]{2,}\s+/);
  if (extra > 40) {
    const head = text.slice(0, extra).trim();
    if (head.length >= 20) text = head;
  }
  return text.trim();
}

function renderLatexAwarePlain(value, keyPrefix) {
  return tokenizeFormattedText(String(value ?? "")).map((segment, index) => {
    if (segment.type === "latex") {
      return renderMathSegment(segment.value, `${keyPrefix}-math-${index}`, segment.display);
    }
    return (
      <React.Fragment key={`${keyPrefix}-plain-${index}`}>
        {renderPlainText(segment.value, `${keyPrefix}-text-${index}`)}
      </React.Fragment>
    );
  });
}

function VerseLine({ sadr, ajuz, keyPrefix }) {
  return (
    <Box
      key={keyPrefix}
      my={2}
      px={3}
      py={2.5}
      borderRadius="xl"
      bg="blackAlpha.50"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, serif"
      letterSpacing="normal"
      fontWeight="500"
      sx={{
        fontFeatureSettings: '"liga" 1, "calt" 1',
        fontVariationSettings: "normal",
        textRendering: "optimizeLegibility",
      }}
      _dark={{ bg: "whiteAlpha.100", borderColor: "whiteAlpha.200" }}
    >
      <Box
        display="flex"
        flexDirection={{ base: "column", md: "row" }}
        alignItems={{ base: "stretch", md: "center" }}
        gap={{ base: 1, md: 3 }}
      >
        <Box flex="1" textAlign="right" lineHeight="2">
          {renderLatexAwarePlain(sadr, `${keyPrefix}-sadr`)}
        </Box>
        <Box
          aria-hidden
          display={{ base: "none", md: "block" }}
          w="6px"
          h="6px"
          borderRadius="full"
          bg="blue.400"
          opacity={0.55}
          flexShrink={0}
        />
        <Box flex="1" textAlign={{ base: "right", md: "left" }} lineHeight="2">
          {renderLatexAwarePlain(ajuz, `${keyPrefix}-ajuz`)}
        </Box>
      </Box>
    </Box>
  );
}

function renderLiteraryPlain(value, keyPrefix) {
  const text = String(value ?? "");
  if (!text) return null;

  const renderLine = (line, lineKey) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const verse = tryParsePoetryVerse(trimmed);
    if (verse) {
      return (
        <VerseLine
          key={lineKey}
          keyPrefix={lineKey}
          sadr={verse.sadr}
          ajuz={verse.ajuz}
        />
      );
    }
    return (
      <React.Fragment key={lineKey}>
        {renderLatexAwarePlain(line, lineKey)}
      </React.Fragment>
    );
  };

  if (!text.includes("\n")) {
    return renderLine(text, keyPrefix);
  }

  return text.split("\n").map((line, lineIndex) => (
    <React.Fragment key={`${keyPrefix}-ln-${lineIndex}`}>
      {lineIndex > 0 ? <Box as="br" /> : null}
      {line.trim() ? renderLine(line, `${keyPrefix}-ln-${lineIndex}`) : null}
    </React.Fragment>
  ));
}

function wrapMarkup(tag, children, key) {
  switch (tag) {
    case "u":
    case "ins":
      return (
        <Box
          as="u"
          key={key}
          textDecoration="underline"
          textDecorationThickness="2px"
          textUnderlineOffset="3px"
        >
          {children}
        </Box>
      );
    case "b":
    case "strong":
      return (
        <Box as="strong" key={key}>
          {children}
        </Box>
      );
    case "i":
    case "em":
      return (
        <Box as="em" key={key}>
          {children}
        </Box>
      );
    case "mark":
      return (
        <Box as="mark" key={key} bg="yellow.200" px="0.5" borderRadius="sm">
          {children}
        </Box>
      );
    case "sub":
      return (
        <Box as="sub" key={key} fontSize="0.75em">
          {children}
        </Box>
      );
    case "sup":
      return (
        <Box as="sup" key={key} fontSize="0.75em">
          {children}
        </Box>
      );
    default:
      return <React.Fragment key={key}>{children}</React.Fragment>;
  }
}

function renderMarkupTree(text, keyPrefix = "mk") {
  const source = String(text ?? "");
  const nodes = [];
  const stack = [{ tag: null, children: nodes }];
  let lastIndex = 0;
  MARKUP_RE.lastIndex = 0;
  let match;

  const flushText = (end) => {
    if (end <= lastIndex) return;
    const chunk = source.slice(lastIndex, end);
    if (!chunk) return;
    stack[stack.length - 1].children.push(
      <React.Fragment key={`${keyPrefix}-t-${lastIndex}`}>
        {renderLiteraryPlain(chunk, `${keyPrefix}-t-${lastIndex}`)}
      </React.Fragment>,
    );
  };

  while ((match = MARKUP_RE.exec(source))) {
    flushText(match.index);
    const raw = match[0];
    if (/^<br/i.test(raw)) {
      stack[stack.length - 1].children.push(<Box key={`${keyPrefix}-br-${match.index}`} as="br" />);
      lastIndex = match.index + raw.length;
      continue;
    }
    const isClose = raw.startsWith("</");
    const tag = String(match[1] || "").toLowerCase();
    if (isClose) {
      if (stack.length > 1 && stack[stack.length - 1].tag === tag) {
        const closed = stack.pop();
        stack[stack.length - 1].children.push(
          wrapMarkup(closed.tag, closed.children, `${keyPrefix}-${tag}-${match.index}`),
        );
      }
    } else {
      stack.push({ tag, children: [] });
    }
    lastIndex = match.index + raw.length;
  }

  flushText(source.length);

  while (stack.length > 1) {
    const closed = stack.pop();
    stack[0].children.push(
      wrapMarkup(closed.tag, closed.children, `${keyPrefix}-unclosed-${closed.tag}`),
    );
  }

  return nodes;
}

/**
 * يعرض نص السؤال/الاختيار مع دعم HTML الآمن (<u> للتسطير) والأبيات وLaTeX.
 * @param {string} value
 */
export function renderFormattedExamText(value) {
  const text = cleanQuestionStemForDisplay(value);
  if (!text) return null;
  return (
    <Box
      as="span"
      display="contents"
      fontFamily="'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif"
      letterSpacing="normal"
      sx={{
        fontFeatureSettings: '"liga" 1, "calt" 1',
        fontVariationSettings: "normal",
        textRendering: "optimizeLegibility",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {renderMarkupTree(text, "q")}
    </Box>
  );
}
