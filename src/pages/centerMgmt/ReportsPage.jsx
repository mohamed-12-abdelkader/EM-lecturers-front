import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaDownload, FaFileAlt } from "react-icons/fa";
import { useGrades, useGroups } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage, fetchReport } from "../../api/centerMgmtApi";
import { REPORT_TYPES, field } from "./centerMgmtUtils";
import { PageHeader, Surface } from "./components/UiBits";

export default function ReportsPage() {
  const { centerId } = useOutletContext();
  const toast = useToast();
  const { data: grades = [] } = useGrades(centerId);
  const { data: groups = [] } = useGroups(centerId);
  const [type, setType] = useState("attendance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const buildParams = (format) => ({
    format,
    from: from || undefined,
    to: to || undefined,
    groupId: groupId || undefined,
    gradeId: gradeId || undefined,
    studentId: studentId || undefined,
  });

  const handleJson = async () => {
    setLoading(true);
    try {
      const data = await fetchReport(centerId, type, buildParams("json"));
      setPreview(JSON.stringify(data, null, 2));
      toast({ title: "تم تحميل التقرير", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCsv = async () => {
    setLoading(true);
    try {
      const blob = await fetchReport(centerId, type, buildParams("csv"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `center-report-${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم تنزيل CSV", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="التقارير"
        description="صدّر كشف حضور، غياب، اشتراكات، متأخرات، أو إيرادات بصيغة JSON أو CSV."
      />

      <Surface mb={5}>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>نوع التقرير</FormLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)} borderRadius="xl">
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <FormControl>
              <FormLabel>من تاريخ</FormLabel>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} borderRadius="xl" />
            </FormControl>
            <FormControl>
              <FormLabel>إلى تاريخ</FormLabel>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} borderRadius="xl" />
            </FormControl>
            <FormControl>
              <FormLabel>المجموعة</FormLabel>
              <Select
                placeholder="الكل"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                borderRadius="xl"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {field(g, "name")}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>الصف</FormLabel>
              <Select
                placeholder="الكل"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                borderRadius="xl"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {field(g, "name")}
                  </option>
                ))}
              </Select>
            </FormControl>
            {(type === "student" || type === "attendance") && (
              <FormControl>
                <FormLabel>معرّف الطالب (اختياري)</FormLabel>
                <Input
                  type="number"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  borderRadius="xl"
                />
              </FormControl>
            )}
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
            <Button
              leftIcon={<FaFileAlt />}
              colorScheme="blue"
              borderRadius="xl"
              onClick={handleJson}
              isLoading={loading}
            >
              عرض JSON
            </Button>
            <Button
              leftIcon={<FaDownload />}
              variant="outline"
              colorScheme="blue"
              borderRadius="xl"
              onClick={handleCsv}
              isLoading={loading}
            >
              تنزيل CSV
            </Button>
          </SimpleGrid>
        </VStack>
      </Surface>

      {preview ? (
        <Surface>
          <Text fontWeight="bold" mb={3}>
            معاينة التقرير
          </Text>
          <Textarea
            value={preview}
            readOnly
            minH="320px"
            fontFamily="mono"
            fontSize="xs"
            borderRadius="xl"
            dir="ltr"
          />
        </Surface>
      ) : null}
    </>
  );
}
