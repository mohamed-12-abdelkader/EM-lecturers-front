import React from "react";
import { Box, Text, Flex, Image, SimpleGrid } from "@chakra-ui/react";
import FormattedQuestionText from "../../../components/question/FormattedQuestionText";
import {
  getQuestionMediaUrl,
  getQuestionOptions,
  getQuestionText,
  getPdfOptionLayout,
  resolveTextDirection,
  PDF_FONT_FAMILY,
} from "../examBuilderUtils";

/** عرض A4 عند 96dpi */
export const PDF_PAGE_WIDTH = "794px";
export const PDF_PAGE_HEIGHT = "1123px";

function PdfTitle({ title, fontSize, fontWeight = "bold", textAlign }) {
  const direction = resolveTextDirection(title);
  const align =
    textAlign ||
    (direction === "ltr" ? "left" : direction === "rtl" ? "right" : "center");

  return (
    <Box
      dir={direction}
      textAlign={align}
      fontFamily={PDF_FONT_FAMILY}
      fontSize={fontSize}
      fontWeight={fontWeight}
      color="#000"
      lineHeight="1.45"
      sx={{
        letterSpacing: "normal",
        wordBreak: "break-word",
        unicodeBidi: "plaintext",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {title}
    </Box>
  );
}

function PdfStudentNameField({ compact = false }) {
  return (
    <Flex align="center" gap="8px" flex={1} minW={0}>
      <Text
        fontSize={compact ? "11px" : "12px"}
        fontWeight="semibold"
        flexShrink={0}
        fontFamily={PDF_FONT_FAMILY}
      >
        اسم الطالب:
      </Text>
      <Box
        flex={1}
        minH={compact ? "18px" : "22px"}
        borderBottom="1px solid #333"
        sx={{ printColorAdjust: "exact" }}
      />
    </Flex>
  );
}

function PdfPageHeader({
  title,
  questionCount,
  dateStr,
  pageNumber,
  totalPages,
  showFullHeader,
}) {
  if (showFullHeader) {
    return (
      <Box borderBottom="2px solid #111" pb="10px" mb="10px" flexShrink={0}>
        <PdfTitle title={title} fontSize="22px" textAlign="center" />
        <Text
          fontSize="12px"
          color="#333"
          mt="6px"
          textAlign="center"
          fontFamily={PDF_FONT_FAMILY}
        >
          {questionCount} سؤال · {dateStr}
        </Text>
        <Flex align="center" gap="16px" mt="10px" flexWrap="wrap">
          <PdfStudentNameField />
          <Text fontSize="11px" color="#444" flexShrink={0} fontFamily={PDF_FONT_FAMILY}>
            التاريخ: {dateStr}
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Flex
      direction="column"
      gap="6px"
      borderBottom="1px solid #999"
      pb="6px"
      mb="8px"
      flexShrink={0}
    >
      <Flex justify="space-between" align="center" gap="12px">
        <Box flex={1} minW={0}>
          <PdfTitle title={title} fontSize="14px" />
        </Box>
        <Text
          fontSize="11px"
          color="#444"
          flexShrink={0}
          fontFamily={PDF_FONT_FAMILY}
          whiteSpace="nowrap"
        >
          صفحة {pageNumber} من {totalPages}
        </Text>
      </Flex>
      <PdfStudentNameField compact />
    </Flex>
  );
}

function PdfOptionItem({ letter, text, compact = false }) {
  return (
    <Flex align="flex-start" gap="6px" minW={0}>
      <Text
        fontSize={compact ? "13px" : "14px"}
        fontWeight="semibold"
        color="#222"
        flexShrink={0}
        minW="20px"
        fontFamily={PDF_FONT_FAMILY}
        lineHeight="1.4"
      >
        {letter})
      </Text>
      <Box flex="1" minW={0}>
        <FormattedQuestionText
          value={text}
          fontSize={compact ? "13px" : "14px"}
          lineHeight="1.45"
          color="#111"
          sx={{ fontFamily: PDF_FONT_FAMILY, wordBreak: "break-word" }}
        />
      </Box>
    </Flex>
  );
}

function PdfOptionsBlock({ options }) {
  const layout = getPdfOptionLayout(options);
  if (!options.length || layout.mode === "none") return null;

  const items = options.map((opt, optIdx) => {
    const letter = String.fromCharCode(65 + (opt.option_index ?? optIdx));
    const text = opt.text_content || opt.text || "";
    return { key: optIdx, letter, text };
  });

  if (layout.mode === "row") {
    return (
      <SimpleGrid columns={Math.min(4, items.length)} spacingX="10px" spacingY="4px" mt="6px">
        {items.map((item) => (
          <PdfOptionItem key={item.key} letter={item.letter} text={item.text} compact />
        ))}
      </SimpleGrid>
    );
  }

  if (layout.mode === "grid2") {
    return (
      <SimpleGrid columns={2} spacingX="14px" spacingY="6px" mt="6px">
        {items.map((item) => (
          <PdfOptionItem key={item.key} letter={item.letter} text={item.text} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Box mt="6px">
      {items.map((item) => (
        <Box key={item.key} mb="5px">
          <PdfOptionItem letter={item.letter} text={item.text} />
        </Box>
      ))}
    </Box>
  );
}

export function PdfPrintQuestion({ item, index }) {
  const options = getQuestionOptions(item);
  const mediaUrl = getQuestionMediaUrl(item);
  const text = getQuestionText(item);

  return (
    <Box
      flexShrink={0}
      py="6px"
      mb="2px"
      borderBottom="1px dashed #bdbdbd"
      overflow="visible"
    >
      <Flex align="flex-start" gap="10px" mb={mediaUrl || options.length ? "6px" : 0}>
        <Text
          fontSize="16px"
          fontWeight="bold"
          color="#000"
          flexShrink={0}
          lineHeight="1.5"
          minW="26px"
          fontFamily={PDF_FONT_FAMILY}
        >
          {index + 1}.
        </Text>
        <Box flex="1" minW={0}>
          {text && (
            <FormattedQuestionText
              value={text}
              fontSize="15px"
              lineHeight="1.6"
              color="#111"
              sx={{ fontFamily: PDF_FONT_FAMILY }}
            />
          )}

          {mediaUrl && (
            <Box mt="6px" mb="2px" textAlign="center">
              <Image
                src={mediaUrl}
                alt=""
                maxH="72px"
                mx="auto"
                objectFit="contain"
                crossOrigin="anonymous"
              />
            </Box>
          )}

          <Box pl="2px">
            <PdfOptionsBlock options={options} />
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

export function PdfExamSheetPage({
  title,
  questions,
  startIndex,
  pageNumber,
  totalPages,
  showFullHeader = false,
  questionCount,
}) {
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box
      dir="rtl"
      w={PDF_PAGE_WIDTH}
      minH={PDF_PAGE_HEIGHT}
      maxH={PDF_PAGE_HEIGHT}
      bg="white"
      color="#111"
      px="48px"
      py="28px"
      display="flex"
      flexDirection="column"
      fontFamily={PDF_FONT_FAMILY}
      boxSizing="border-box"
      overflow="hidden"
    >
      {showFullHeader ? (
        <PdfPageHeader
          title={title}
          questionCount={questionCount}
          dateStr={dateStr}
          pageNumber={pageNumber}
          totalPages={totalPages}
          showFullHeader
        />
      ) : (
        <PdfPageHeader
          title={title}
          questionCount={questionCount}
          dateStr={dateStr}
          pageNumber={pageNumber}
          totalPages={totalPages}
          showFullHeader={false}
        />
      )}

      <Box flex="1" minH={0} overflow="hidden">
        {questions.map((item, i) => (
          <PdfPrintQuestion
            key={`${item.source}-${item.id}-${startIndex + i}`}
            item={item}
            index={startIndex + i}
          />
        ))}
      </Box>

      <Text
        fontSize="10px"
        textAlign="center"
        color="#555"
        pt="6px"
        flexShrink={0}
        fontFamily={PDF_FONT_FAMILY}
      >
        — {pageNumber} / {totalPages} —
      </Text>
    </Box>
  );
}

export default PdfExamSheetPage;
