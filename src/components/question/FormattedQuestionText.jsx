import React from "react";
import { Text } from "@chakra-ui/react";
import { renderFormattedExamText } from "../../utils/renderFormattedExamText";

/** أنماط عرض نص الأسئلة — اتصال الحروف ووضوح العربية */
export const examQuestionTextSx = {
  fontFamily: "'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif",
  letterSpacing: "normal",
  fontVariationSettings: "normal",
  fontFeatureSettings: '"liga" 1, "calt" 1',
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

/**
 * يعرض نص السؤال/الاختيار مع دعم LaTeX والكسور والأرقام العشرية والرموز الرياضية.
 */
export default function FormattedQuestionText({
  value,
  as = Text,
  lineHeight = "1.9",
  fontWeight = "500",
  className,
  sx,
  ...props
}) {
  if (value == null || value === "") return null;
  const Component = as;
  return (
    <Component
      className={["exam-q-text", className].filter(Boolean).join(" ")}
      data-exam-q-text=""
      lineHeight={lineHeight}
      fontWeight={fontWeight}
      sx={{ ...examQuestionTextSx, ...sx }}
      {...props}
    >
      {renderFormattedExamText(value)}
    </Component>
  );
}
