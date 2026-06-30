import React from "react";
import { Text } from "@chakra-ui/react";
import { renderFormattedExamText } from "../../utils/renderFormattedExamText";

/**
 * يعرض نص السؤال/الاختيار مع دعم LaTeX والكسور والأرقام العشرية والرموز الرياضية.
 */
export default function FormattedQuestionText({ value, as = Text, ...props }) {
  if (value == null || value === "") return null;
  const Component = as;
  return <Component {...props}>{renderFormattedExamText(value)}</Component>;
}
