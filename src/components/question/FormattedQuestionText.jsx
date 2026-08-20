import React from "react";
import { Text } from "@chakra-ui/react";
import { renderFormattedExamText } from "../../utils/renderFormattedExamText";

/**
 * يعرض نص السؤال/الاختيار مع دعم LaTeX والكسور والأرقام العشرية والرموز الرياضية.
 */
export default function FormattedQuestionText({ value, as = Text, ...props }) {
  if (value == null || value === "") return null;
  const Component = as;
  return (
    <Component
      fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, serif"
      lineHeight="2"
      {...props}
    >
      {renderFormattedExamText(value)}
    </Component>
  );
}
