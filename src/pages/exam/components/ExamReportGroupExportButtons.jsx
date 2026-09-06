import { useState } from "react";
import { Button, HStack, Icon, Tooltip, useToast } from "@chakra-ui/react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import {
  downloadExamReportGroupExcel,
  downloadExamReportGroupPdf,
} from "../utils/exportExamReportGroup";

export default function ExamReportGroupExportButtons({
  examinedStudents = [],
  notExaminedStudents = [],
  examTitle = "",
  courseTitle = "",
  groupName = "",
  isDisabled = false,
  size = "sm",
  colorMode = "light",
}) {
  const toast = useToast();
  const [exporting, setExporting] = useState(null);
  const exportGroupLabel = groupName || "كل المجموعات";
  const canExport = examinedStudents.length > 0 || notExaminedStudents.length > 0;
  const exportFileName = examTitle
    ? `تقرير-طلاب-${exportGroupLabel}-${examTitle}`
    : `تقرير-طلاب-${exportGroupLabel}`;
  const onDark = colorMode === "dark";

  const handleExport = async (kind) => {
    if (!canExport) {
      toast({
        title: "لا يوجد طلاب للتنزيل",
        description: "اختر مجموعة أو تأكد أن التقرير يحتوي على طلاب.",
        status: "warning",
      });
      return;
    }
    setExporting(kind);
    try {
      const options = {
        examinedStudents,
        notExaminedStudents,
        title: examTitle || "تقرير الامتحان",
        courseTitle,
        groupName: exportGroupLabel,
        filename: exportFileName,
      };
      const ok =
        kind === "excel"
          ? downloadExamReportGroupExcel(options)
          : await downloadExamReportGroupPdf(options);
      if (ok) {
        toast({
          title: kind === "excel" ? "تم تنزيل ملف Excel" : "تم تنزيل ملف PDF",
          description: `${exportGroupLabel} · حلوا ${examinedStudents.length} · لم يحلوا ${notExaminedStudents.length}`,
          status: "success",
        });
      }
    } catch (err) {
      toast({
        title: "تعذر التنزيل",
        description: err?.message || "حدث خطأ أثناء إنشاء الملف",
        status: "error",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <HStack spacing={2} flexWrap="wrap">
      <Tooltip label="اسم الطالب ودرجته، والطلاب الذين لم يحلوا، مع اسم المجموعة" hasArrow>
        <Button
          size={size}
          colorScheme="green"
          variant={onDark ? "solid" : "outline"}
          bg={onDark ? "white" : undefined}
          color={onDark ? "green.700" : undefined}
          leftIcon={<Icon as={FaFileExcel} />}
          onClick={() => handleExport("excel")}
          isLoading={exporting === "excel"}
          isDisabled={!canExport || isDisabled || Boolean(exporting)}
        >
          Excel
        </Button>
      </Tooltip>
      <Tooltip label="كشف PDF للطباعة يشمل من حل ومن لم يحل" hasArrow>
        <Button
          size={size}
          colorScheme="red"
          variant={onDark ? "solid" : "outline"}
          bg={onDark ? "white" : undefined}
          color={onDark ? "red.600" : undefined}
          leftIcon={<Icon as={FaFilePdf} />}
          onClick={() => handleExport("pdf")}
          isLoading={exporting === "pdf"}
          isDisabled={!canExport || isDisabled || Boolean(exporting)}
        >
          PDF
        </Button>
      </Tooltip>
    </HStack>
  );
}
