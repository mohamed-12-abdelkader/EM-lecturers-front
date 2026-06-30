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
          display="inline-block"
          mx="0.5"
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

/**
 * يعرض نص السؤال/الاختيار مع دعم LaTeX ($...$) والكسور والأرقام العشرية والرموز.
 * @param {string} value
 */
export function renderFormattedExamText(value) {
  const text = String(value ?? "");
  if (!text) return null;

  return tokenizeFormattedText(text).map((segment, index) => {
    if (segment.type === "latex") {
      return renderMathSegment(
        segment.value,
        `math-${index}`,
        segment.display,
      );
    }
    return (
      <React.Fragment key={`plain-${index}`}>
        {renderPlainText(segment.value, `text-${index}`)}
      </React.Fragment>
    );
  });
}
