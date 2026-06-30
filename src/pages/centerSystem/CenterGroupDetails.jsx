import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Stack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Skeleton,
  Card,
  CardBody,
  Grid,
  GridItem,
  Flex,
  Container,
  SimpleGrid,
  Avatar,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useDisclosure,
  Image,
  Icon,
  useBreakpointValue,
  Collapse,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { BiSearch } from "react-icons/bi";
import {
  MdAdd,
  MdDelete,
  MdSchedule,
  MdPeople,
  MdLocationOn,
  MdSchool,
  MdAttachMoney,
  MdEmail,
  MdPhone,
  MdCheckCircle,
  MdCancel,
  MdLock,
} from "react-icons/md";
import {
  FaGraduationCap,
  FaClock,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt,
  FaStar,
} from "react-icons/fa";
import { useGroupStudents } from "../../Hooks/centerSystem/useGroupStudents";
import AddStudentDualModal from "../../components/centerSystem/AddStudentDualModal";
import EditStudentModal from "../../components/centerSystem/EditStudentModal";
import AddExamModal from "../../components/centerSystem/AddExamModal";
import ExamGradesModal from "../../components/centerSystem/ExamGradesModal";
import baseUrl from "../../api/baseUrl";
import nextEduLogo from "../../img/next logo.png";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AttendanceHistoryModal from "../../components/centerSystem/AttendanceHistoryModal";
import "react-day-picker/dist/style.css";
import { Html5Qrcode } from "html5-qrcode";

function KpiCard({ label, value, sub, icon, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accentMap = {
    blue: { bg: "blue.50", color: "blue.500" },
    green: { bg: "green.50", color: "green.500" },
    orange: { bg: "orange.50", color: "orange.500" },
    red: { bg: "red.50", color: "red.500" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Box p={4} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border}>
      <Flex justify="space-between" align="center" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color="gray.500" mb={1} noOfLines={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue("gray.800", "white")} lineHeight="1">
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={1} noOfLines={1}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={10} h={10} borderRadius="lg" bg={a.bg} align="center" justify="center" flexShrink={0}>
          <Icon as={icon} color={a.color} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

const CenterGroupDetails = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isExamGradesModalOpen, setIsExamGradesModalOpen] = useState(false);
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const { isOpen: isCalendarOpen, onToggle: onToggleCalendar } = useDisclosure({
    defaultIsOpen: false,
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState({}); // { studentId: { 'yyyy-MM-dd': 'present' | 'absent' } }
  const [savingAttendance, setSavingAttendance] = useState(false);

  // ---------- QR scanner state + helpers (ADDED) ----------
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const qrScannerRef = useRef(null);
  const [qrProcessing, setQrProcessing] = useState(false);

  const startQrScanner = async () => {
    setIsQrScannerOpen(true);
    setQrProcessing(false);

    requestAnimationFrame(async () => {
      try {
        const elementId = "qr-scanner";

        if (qrScannerRef.current) {
          try {
            await qrScannerRef.current.stop();
          } catch (e) {}
          try {
            qrScannerRef.current.clear();
          } catch (e) {}
          qrScannerRef.current = null;
        }

        const html5Qr = new Html5Qrcode(elementId, { verbose: false });
        qrScannerRef.current = html5Qr;

        const devices = await Html5Qrcode.getCameras();

        // تحديد الكاميرا المناسبة
        let cameraId = null;

        if (devices && devices.length > 0) {
          // البحث عن الكاميرا الخلفية أولاً
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment") ||
              device.label.toLowerCase().includes("facing back"),
          );

          if (backCamera) {
            cameraId = backCamera.id;
            console.log("Using back camera:", backCamera.label);
          } else {
            // إذا لم توجد كاميرا خلفية، استخدم الكاميرا الأولى
            cameraId = devices[0].id;
            console.log("Using first available camera:", devices[0].label);
          }
        }

        if (!cameraId) {
          throw new Error("لم يتم العثور على كاميرا متاحة");
        }

        await html5Qr.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: { ideal: "environment" }, // يفضل الكاميرا الخلفية
            },
          },
          async (decodedText) => {
            if (qrProcessing) return;
            setQrProcessing(true);
            try {
              await registerAttendanceByQr(decodedText, "present");
            } catch (err) {
              // handled in registerAttendanceByQr
            } finally {
              try {
                await html5Qr.stop();
              } catch (e) {}
              try {
                html5Qr.clear();
              } catch (e) {}
              qrScannerRef.current = null;
              setIsQrScannerOpen(false);
              setQrProcessing(false);
            }
          },
          (errorMessage) => {
            // scan failure callback (optional logging)
          },
        );
      } catch (err) {
        console.error("QR scanner start error:", err);
        toast({
          title: "فشل في فتح الكاميرا",
          description:
            err.message || "تأكد من صلاحية الكاميرا والسماح بالوصول إليها",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        setIsQrScannerOpen(false);
        setQrProcessing(false);
      }
    });
  };

  const stopQrScanner = async () => {
    try {
      if (qrScannerRef.current) {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
      }
    } catch (err) {
      // ignore
    } finally {
      setIsQrScannerOpen(false);
      setQrProcessing(false);
    }
  };
  // ---------- end QR scanner state + helpers ----------

  // new states for "عرض الطلاب" modal
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [modalStudents, setModalStudents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // تصدير كروت الطلاب PDF
  const [exportStartIndex, setExportStartIndex] = useState(1);
  const [exportEndIndex, setExportEndIndex] = useState(50);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const {
    students,
    loading,
    error: studentsError,
    fetchStudents,
    deleteStudent,
    updateStudent,
  } = useGroupStudents(id);

  useEffect(() => {
    const fetchGroupData = async () => {
      setLoadingGroup(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await baseUrl.get(`/api/study-groups/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroupData(response.data);
      } catch (err) {
        // If backend returns access:false (e.g. 403 with message), show the blocked UI
        if (
          err.response &&
          err.response.data &&
          err.response.data.access === false
        ) {
          setGroupData(err.response.data);
        } else {
          setError("فشل في جلب بيانات المجموعة");
          toast({ title: "فشل في جلب بيانات المجموعة", status: "error" });
        }
      } finally {
        setLoadingGroup(false);
      }
    };
    fetchGroupData();
    // عند تغيير التاريخ المختار، جلب الطلاب مع التاريخ
    const dateKey = selectedDate.toISOString().split("T")[0];
    fetchStudents(dateKey);
    // eslint-disable-next-line
  }, [id, selectedDate]);

  // دالة لتحميل بيانات الحضور المحفوظة
  const loadAttendanceData = async (dateKey) => {
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(
        `/api/study-groups/${id}/attendance?date=${dateKey}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // تحويل بيانات الحضور إلى الشكل المطلوب
      const attendanceData = {};
      if (response.data && response.data.attendance) {
        response.data.attendance.forEach((item) => {
          attendanceData[item.student_id] = {
            [dateKey]: item.status,
          };
        });
      }
      setAttendance(attendanceData);
    } catch (err) {
      console.log(
        "No attendance data found for this date or error loading:",
        err,
      );
      // إذا لم توجد بيانات، نبدأ بحالة فارغة
      setAttendance({});
    }
  };

  // تحميل بيانات الحضور عند تغيير التاريخ
  useEffect(() => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    loadAttendanceData(dateKey);
  }, [selectedDate, id]);

  // تحديث نطاق التصدير عند تغيير عدد الطلاب
  useEffect(() => {
    if (students?.length > 0) {
      setExportEndIndex((prev) => Math.min(Math.max(prev, 1), students.length));
    }
  }, [students?.length]);

  // إضافة مجموعة طلاب دفعة واحدة
  const handleAddStudentsBulk = async (names) => {
    try {
      const token = localStorage.getItem("token");
      await baseUrl.post(
        `/api/center-groups/${id}/students/bulk`,
        { names },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      await fetchStudents(dateKey);
      toast({
        title: "نجح",
        description: `تمت إضافة ${names.length} طالب بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error.response?.data?.message ||
          error.message ||
          "حدث خطأ في إضافة الطالب",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // تعديل طالب
  const handleEditStudent = async (studentData) => {
    try {
      await updateStudent(selectedStudent.id, studentData);
      toast({
        title: "نجح",
        description: "تم تحديث بيانات الطالب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحديث بيانات الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // حذف طالب
  const handleDeleteStudent = async (studentId) => {
    try {
      await deleteStudent(studentId);
      toast({
        title: "نجح",
        description: "تم حذف الطالب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في حذف الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // فتح المودال وجلب الطلاب من الـ API (يستخدم selectedDate)
  const openStudentsModal = async () => {
    setIsStudentsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    try {
      const token = localStorage.getItem("token");
      const dateKey = selectedDate.toISOString().split("T")[0];
      const resp = await baseUrl.get(
        `/api/study-groups/${id}/students?date=${dateKey}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // API قد يرجع { students: [...] } أو مباشرة مصفوفة
      const list = resp.data?.students ?? resp.data ?? [];
      setModalStudents(list);
    } catch (err) {
      console.error("Error loading students for modal:", err);
      setModalError("فشل في جلب بيانات الطلاب");
      setModalStudents([]);
    } finally {
      setModalLoading(false);
    }
  };

  // تصفية الطلاب
  const filteredStudents = (students || []).filter(
    (student) =>
      (student.student_name &&
        student.student_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (student.phone && student.phone.includes(searchTerm)),
  );

  // دالة لتسجيل الحضور
  const handleAttendance = (studentId, status) => {
    const dateKey = selectedDate.toISOString().split("T")[0];
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [dateKey]: status,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    const dateKey = selectedDate.toISOString().split("T")[0];

    // إنشاء مصفوفة الحضور بالشكل المطلوب للـ API
    const attendanceArr = students.map((s) => ({
      student_id: s.id,
      status: attendance[s.id]?.[dateKey] || "absent",
    }));

    setSavingAttendance(true);
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.post(
        `/api/study-groups/${id}/attendance`,
        {
          date: dateKey,
          attendance: attendanceArr,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Attendance saved successfully:", response.data);
      toast({
        title: "تم حفظ الحضور بنجاح",
        description: `تم تسجيل الحضور لـ ${dateKey}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // تحديث بيانات الطلاب بعد حفظ الحضور
      fetchStudents(dateKey);
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast({
        title: "فشل في حفظ الحضور",
        description: err.response?.data?.message || "حدث خطأ أثناء حفظ الحضور",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  // إضافة دالة معالج لحدث إضافة امتحان (تُمرّر للـ AddExamModal)
  const handleExamAdded = async (exam) => {
    // بسيطة: إظهار رسالة وتجديد القائمة (لو تحتاج منطق أوسع عدِّل هنا)
    try {
      toast({
        title: "تم إنشاء الامتحان",
        description: "تم إضافة الامتحان بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      const dateKey = selectedDate.toISOString().split("T")[0];
      await fetchStudents(dateKey);
    } catch (err) {
      console.error("Error in handleExamAdded:", err);
    }
  };

  // ---------- جديد: تسجيل الحضور عبر QR ----------
  const registerAttendanceByQr = async (scannedText, status = "present") => {
    if (!scannedText) {
      toast({
        title: "نص QR فارغ",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    const dateKey = selectedDate.toISOString().split("T")[0];
    try {
      const token = localStorage.getItem("token");
      const resp = await baseUrl.post(
        `/api/study-groups/${id}/scan-qr`,
        {
          date: dateKey,
          qr_data: scannedText,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      // نجاح
      toast({
        title: "تم تسجيل الحضور",
        description: resp.data?.message || "تمت العملية بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات محلياً
      await fetchStudents(dateKey);
      await loadAttendanceData(dateKey);
      return resp.data;
    } catch (err) {
      console.error("QR register error:", err);
      toast({
        title: "فشل تسجيل الحضور",
        description: err.response?.data?.message || err.message || "حدث خطأ",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      throw err;
    }
  };

  // تصدير كروت الطلاب كـ PDF (بنفس أسلوب تصدير الأكواد في الكورس)
  const handleExportStudentsPdf = async () => {
    const list = students || [];
    if (list.length === 0) {
      toast({
        title: "لا يوجد طلاب للتصدير",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (exportStartIndex > exportEndIndex) {
      toast({
        title: "خطأ في النطاق",
        description: "رقم البداية يجب أن يكون أقل من أو يساوي رقم النهاية",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const startIndex = Math.max(0, exportStartIndex - 1);
    const endIndex = Math.min(list.length, exportEndIndex);
    const toExport = list.slice(startIndex, endIndex);
    if (toExport.length === 0) {
      toast({
        title: "لا يوجد طلاب في النطاق المحدد",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const logoUrl = nextEduLogo.startsWith("http")
      ? nextEduLogo
      : `${window.location.origin}${nextEduLogo}`;
    const groupName = groupData?.name || `المجموعة #${id}`;
    const codesPerPage = 12;
    const pageWidth = 297;
    const pageHeight = 210;

    setIsExportingPdf(true);
    try {
      const pdf = new jsPDF("l", "mm", "a4");
      for (let i = 0; i < toExport.length; i += codesPerPage) {
        const tempDiv = document.createElement("div");
        tempDiv.style.display = "block";
        tempDiv.style.width = `${pageWidth}mm`;
        tempDiv.style.height = `${pageHeight}mm`;
        tempDiv.style.background = "#fff";
        document.body.appendChild(tempDiv);
        tempDiv.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(4,1fr); gap:3mm; width:100%; height:100%; align-content:start;">
        ${toExport
          .slice(i, i + codesPerPage)
          .map(
            (s) => `
        <div style="
          width:100%;
          height:100%;
          border-radius:14px;
          overflow:hidden;
          background:#ffffff;
          display:flex;
          flex-direction:column;
          border:1px solid #dbeafe;
          box-shadow:0 4px 10px rgba(0,0,0,0.08);
          direction:rtl;
          min-height:42mm;
        ">
          <!-- Header -->
          <div style="
            min-height:15mm;
            background:linear-gradient(90deg,#1e3a8a,#3b82f6);
            color:#fff;
            padding:2px 8px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            font-size:11px;
            font-weight:800;
            gap:6px;
          ">
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              background:#ffffff;
              border-radius:7px;
              padding:2px 5px;
            ">
              <img src="${logoUrl}" alt="NextEdu" style="height:16px;width:auto;object-fit:contain;opacity:0.98;" />
            </span>
            <span style="
              flex:1;
              text-align:center;
              white-space:normal;
              text-shadow:0 1px 1px rgba(0,0,0,0.25);
              background:rgba(255,255,255,0.18);
              border-radius:8px;
              padding:4px 8px;
              line-height:1.25;
              font-size:11px;
              font-weight:900;
              min-height:24px;
              display:flex;
              align-items:center;
              justify-content:center;
              direction:rtl;
              font-family:'Tahoma','Arial',sans-serif;
              overflow:hidden;
            ">
              ${s.group_name || groupName}
            </span>
            <span style="width:24px;"></span>
          </div>

          <!-- Body -->
          <div style="flex:1; display:flex; min-height:0;">
            <!-- Info side -->
            <div style="
              flex:1;
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:center;
              text-align:center;
              padding:8px;
              background:#eff6ff;
              border-left:1px solid #e2e8f0;
              position:relative;
            ">
              <img src="${logoUrl}" alt="" style="position:absolute;top:6px;right:6px;height:15px;width:auto;opacity:0.35;" />
              <div style="font-size:10px; font-weight:800; color:#1d4ed8; margin-bottom:4px;">اسم الطالب</div>
              <div style="
                font-size:14px;
                font-weight:900;
                color:#020617;
                line-height:1.4;
                width:95%;
                min-height:34px;
                max-height:56px;
                overflow:hidden;
                white-space:normal;
                word-break:normal;
                overflow-wrap:anywhere;
                direction:rtl;
                font-family:'Tahoma','Arial',sans-serif;
                text-shadow:0 0 0.01px #000;z-index: 1;
              ">
                ${s.student_name || "الطالب"}
              </div>
              <div style="font-size:9px; font-weight:700; color:#fd7305; margin-top:12px;">كود الطالب</div>
              <div style="
                margin-top:2px;
                font-size:14px;
                font-weight:900;
                letter-spacing:1px;
                font-family:monospace;
                color:#fd7305;
              ">
                ${s.number_in_group != null ? s.number_in_group : "-"}
              </div>
            </div>

            <!-- QR side -->
            <div style="
              flex:1;
              display:flex;
              align-items:center;
              justify-content:center;
              position:relative;
              padding:8px;
              background:#fff;
            ">
              <img src="${logoUrl}" alt="" style="position:absolute;bottom:6px;left:6px;height:12px;width:auto;opacity:0.35;" />
              ${
                s.qr_code
                  ? `<img src="${s.qr_code}" style="width:33mm;height:33mm;background:#fff;border-radius:9px;border:2px solid #2563eb;padding:2px;object-fit:contain;image-rendering:crisp-edges;" />`
                  : `<div style="width:33mm;height:33mm;border:2px dashed #2563eb;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#2563eb;">QR</div>`
              }
            </div>
          </div>
        </div>
        `,
          )
          .join("")}
        </div>`;
        await new Promise((r) => setTimeout(r, 350));
        try {
          const pxPerMm = 3.78;
          const canvas = await html2canvas(tempDiv, {
            scale: 1.7,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: pageWidth * pxPerMm,
            height: pageHeight * pxPerMm,
          });
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.85),
            "JPEG",
            0,
            0,
            pageWidth,
            pageHeight,
          );
        } catch (err) {
          console.error("PDF canvas error:", err);
          toast({
            title: "خطأ أثناء إنشاء صورة الصفحة",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
        if (i + codesPerPage < toExport.length) pdf.addPage();
        document.body.removeChild(tempDiv);
      }
      pdf.save("students-cards.pdf");
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${toExport.length} كرت طالب من ${exportStartIndex} إلى ${exportEndIndex}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({
        title: "حدث خطأ أثناء تصدير PDF",
        description: err?.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ألوان موحّدة مع باقي صفحات المدرس
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const primaryColor = useColorModeValue("blue.500", "blue.300");
  const orangeColor = useColorModeValue("orange.500", "orange.400");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const mutedText = useColorModeValue("gray.700", "gray.300");
  const mutedTextSecondary = useColorModeValue("gray.600", "gray.400");
  const dividerColor = useColorModeValue("gray.200", "gray.600");
  const mutedBorder = useColorModeValue("gray.200", "gray.600");

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  const formatDays = (daysString) => {
    if (!daysString) return "";
    return daysString.split(",").join("، ");
  };

  // تمت إزالة حالة الدفع من الجدول والبطاقات

  // دالة لتحديد لون الحضور
  const getAttendanceColor = (status) => {
    if (status === "present") return "green";
    if (status === "absent") return "red";
    if (status === "not_set") return "gray";
    return "gray";
  };

  // لون الكارد حسب المجموعة (كل مجموعة لون مختلف)
  const GROUP_CARD_COLORS = ["blue", "orange"];
  const getGroupCardColor = (groupId) => {
    const num = Number(String(groupId).replace(/\D/g, "")) || 0;
    return GROUP_CARD_COLORS[num % GROUP_CARD_COLORS.length];
  };

  // دالة مساعدة لإرجاع مصفوفة من الأيام (خمسة أيام متتالية)
  function getFiveDays(selectedDate) {
    const days = [];
    // نبدأ من يومين قبل اليوم المختار
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - 2);
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }

  // دالة لإرجاع جميع أيام الشهر
  function getMonthDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // إضافة أيام فارغة في بداية الشهر
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // إضافة أيام الشهر
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  // دالة لتغيير الشهر
  const changeMonth = (direction) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isMobile = useBreakpointValue({ base: true, md: false });
  const dateKey = selectedDate.toISOString().split("T")[0];
  const totalStudents = students?.length || 0;
  const paidCount =
    students?.filter((s) => s.payment_status === "paid").length || 0;
  const presentCount =
    students?.filter((s) => attendance[s.id]?.[dateKey] === "present").length ||
    0;
  const absentCount =
    students?.filter((s) => attendance[s.id]?.[dateKey] === "absent").length ||
    0;

  if (loadingGroup) {
    return (
      <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            <Skeleton height="200px" borderRadius="2xl" />
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
              <Skeleton height="150px" borderRadius="xl" />
              <Skeleton height="150px" borderRadius="xl" />
              <Skeleton height="150px" borderRadius="xl" />
              <Skeleton height="150px" borderRadius="xl" />
            </SimpleGrid>
            <Skeleton height="600px" borderRadius="2xl" />
          </VStack>
        </Container>
      </Box>
    );
  }
  if (groupData && groupData.access === false) {
    return (
      <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10}>
        <Container maxW="container.md">
          <Card
            bg={cardBg}
            borderRadius="xl"
            p={{ base: 6, md: 10 }}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack spacing={5} align="center">
              <Box p={4} bg="orange.50" borderRadius="full">
                <Icon as={MdLock} boxSize={10} color={orangeColor} />
              </Box>
              <Heading size="md" textAlign="center" color={textColor}>
                تم حجب المحتوى
              </Heading>
              <Text textAlign="center" color="gray.600">
                {groupData.message || "تم حجب المحتوي لحين تجديد الاشتراك"}
              </Text>
              <HStack spacing={3}>
                <Button
                  bg={primaryColor}
                  color="white"
                  onClick={() => window.location.reload()}
                  borderRadius="lg"
                  _hover={{ opacity: 0.9 }}
                >
                  إعادة المحاولة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  borderRadius="lg"
                  borderColor={borderColor}
                >
                  العودة
                </Button>
              </HStack>
            </VStack>
          </Card>
        </Container>
      </Box>
    );
  }
  if (error || !groupData) {
    return (
      <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10}>
        <Container maxW="container.xl">
          <Alert status="error" borderRadius="xl" boxShadow="sm">
            <AlertIcon />
            <Text fontWeight="semibold">
              {error || "حدث خطأ في تحميل بيانات المجموعة"}
            </Text>
          </Alert>
        </Container>
      </Box>
    );
  }

  // عرض رسالة أن المحتوى محجوب إذا جاءت الاستجابة بهذا الشكل

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10} dir="rtl">
      <Container maxW="container.xl" px={{ base: 3, md: 4 }}>
        <VStack spacing={5} align="stretch">
          {/* Hero */}
          <Box borderRadius="xl" overflow="hidden" bgGradient={heroBg} color="white" boxShadow="sm">
            <Flex
              p={{ base: 4, md: 6 }}
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={4}
            >
              <HStack spacing={3} align="start" flex={1} minW={0}>
                <Button
                  as={Link}
                  to="/center_groups"
                  size="sm"
                  variant="outline"
                  color="white"
                  borderColor="whiteAlpha.400"
                  leftIcon={<IoChevronBack />}
                  _hover={{ bg: "whiteAlpha.200" }}
                  flexShrink={0}
                >
                  المجموعات
                </Button>
                <Flex
                  boxSize={{ base: 10, md: 11 }}
                  borderRadius="lg"
                  bg="whiteAlpha.200"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  display={{ base: "none", sm: "flex" }}
                >
                  <Icon as={FaGraduationCap} boxSize={5} />
                </Flex>
                <Box minW={0}>
                  <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold" noOfLines={2} lineHeight="1.3">
                    {groupData?.name || "تفاصيل المجموعة"}
                  </Heading>
                  <HStack spacing={4} mt={2} flexWrap="wrap" color="whiteAlpha.900" fontSize="sm">
                    <HStack spacing={1}>
                      <Icon as={FaClock} boxSize={3.5} />
                      <Text>
                        {formatTime(groupData.start_time)} - {formatTime(groupData.end_time)}
                      </Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Icon as={FaCalendarAlt} boxSize={3.5} />
                      <Text noOfLines={1}>{formatDays(groupData.days)}</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Icon as={FaUsers} boxSize={3.5} />
                      <Text>{totalStudents} طالب</Text>
                    </HStack>
                  </HStack>
                </Box>
              </HStack>
              <Button
                size="sm"
                bg="whiteAlpha.200"
                color="white"
                borderRadius="lg"
                leftIcon={<FaUsers />}
                _hover={{ bg: "whiteAlpha.300" }}
                onClick={openStudentsModal}
                alignSelf={{ base: "stretch", md: "center" }}
              >
                عرض كروت الطلاب
              </Button>
            </Flex>
          </Box>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            <KpiCard label="عدد الطلاب" value={totalStudents} icon={FaUsers} accent="blue" />
            <KpiCard label="حضور اليوم" value={presentCount} icon={MdCheckCircle} accent="green" />
            <KpiCard label="غياب اليوم" value={absentCount} icon={MdCancel} accent="red" />
            <KpiCard
              label="المدفوع"
              value={`${paidCount} / ${totalStudents}`}
              sub="من إجمالي المجموعة"
              icon={MdAttachMoney}
              accent="orange"
            />
          </SimpleGrid>

          {/* التاريخ + التقويم (قابل للطي) */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <HStack justify="space-between" mb={isCalendarOpen ? 4 : 0}>
              <HStack spacing={2}>
                <Text fontWeight="semibold" color={textColor} fontSize="sm">
                  تاريخ الحضور:
                </Text>
                <Badge
                  colorScheme="blue"
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="lg"
                >
                  {selectedDate.toLocaleDateString("ar-EG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Badge>
              </HStack>
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleCalendar}
                borderRadius="lg"
                colorScheme="blue"
              >
                {isCalendarOpen ? "إخفاء التقويم" : "إظهار التقويم"}
              </Button>
            </HStack>
            <Collapse in={isCalendarOpen} animateOpacity>
              <Box pt={2} borderTopWidth="1px" borderColor={borderColor}>
                <HStack justify="space-between" w="full" mb={3}>
                  <IconButton
                    aria-label="الشهر السابق"
                    size="sm"
                    variant="ghost"
                    onClick={() => changeMonth(-1)}
                    color={primaryColor}
                    icon={<IoChevronBack />}
                  />
                  <Text fontWeight="bold" color={textColor} fontSize="md">
                    {selectedDate.toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                    })}
                  </Text>
                  <IconButton
                    aria-label="الشهر التالي"
                    size="sm"
                    variant="ghost"
                    onClick={() => changeMonth(1)}
                    color={primaryColor}
                    icon={<IoChevronForward />}
                  />
                </HStack>
                <SimpleGrid columns={7} spacing={1} w="full" mb={2}>
                  {[
                    "أحد",
                    "اثنين",
                    "ثلاثاء",
                    "أربعاء",
                    "خميس",
                    "جمعة",
                    "سبت",
                  ].map((d) => (
                    <Text
                      key={d}
                      textAlign="center"
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.500"
                    >
                      {d}
                    </Text>
                  ))}
                  {getMonthDays(selectedDate).map((day, idx) => {
                    if (!day) return <Box key={idx} h="32px" />;
                    const isSelected =
                      day.toDateString() === selectedDate.toDateString();
                    const isToday =
                      day.toDateString() === new Date().toDateString();
                    return (
                      <Button
                        key={idx}
                        size="sm"
                        borderRadius="full"
                        minW="32px"
                        h="32px"
                        p={0}
                        fontSize="xs"
                        fontWeight="bold"
                        color={isSelected || isToday ? "white" : "gray.700"}
                        bg={
                          isSelected
                            ? primaryColor
                            : isToday
                              ? orangeColor
                              : "gray.100"
                        }
                        _hover={{
                          bg: isSelected
                            ? primaryColor
                            : isToday
                              ? orangeColor
                              : "gray.200",
                        }}
                        onClick={() => setSelectedDate(new Date(day))}
                      >
                        {day.getDate()}
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </Box>
            </Collapse>
          </Box>

          {/* بحث + أزرار الإجراءات */}
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={4}
            align={{ base: "stretch", lg: "center" }}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="xl"
            p={4}
            boxShadow="sm"
          >
            <InputGroup size="md" maxW={{ lg: "320px" }}>
              <Input
                placeholder="ابحث بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                _focus={{ borderColor: "blue.500", boxShadow: "none" }}
              />
              <InputRightElement>
                <Icon as={BiSearch} color="gray.400" boxSize={4} />
              </InputRightElement>
            </InputGroup>
            <HStack spacing={2} flexWrap="wrap">
              <Button
                size="sm"
                colorScheme="orange"
                variant="outline"
                onClick={startQrScanner}
                borderRadius="lg"
              >
                مسح QR
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => setIsAddModalOpen(true)}
                isLoading={loading}
                leftIcon={<MdAdd />}
                borderRadius="lg"
              >
                إضافة طالب
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={() => setIsExamGradesModalOpen(true)}
                borderRadius="lg"
              >
                الدرجات
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                onClick={() => setIsAttendanceHistoryOpen(true)}
                borderRadius="lg"
              >
                سجل الحضور
              </Button>
            </HStack>
          </Flex>

          {/* قائمة الطلاب */}
          {isMobile ? (
            <VStack w="100%" spacing={{ base: 3, md: 4 }}>
              {filteredStudents.map((s) => {
                const dateKey = selectedDate.toISOString().split("T")[0];
                const currentStatus = attendance[s.id]?.[dateKey] || "not_set";
                return (
                  <Card
                    key={s.id}
                    w="100%"
                    bg={cardBg}
                    borderRadius="xl"
                    shadow="sm"
                    borderWidth="1px"
                    borderColor={borderColor}
                    p={4}
                    _hover={{ borderColor: "blue.200" }}
                    transition="border-color 0.15s"
                  >
                    <VStack
                      align="stretch"
                      spacing={{ base: 3, md: 4 }}
                      w="100%"
                    >
                      <Stack
                        direction={{ base: "column", sm: "row" }}
                        align="center"
                        spacing={{ base: 2, sm: 3 }}
                        w="100%"
                        justify="space-between"
                      >
                        <Link
                          to={`/group/${id}/student/${s.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <HStack
                            spacing={{ base: 2, sm: 3 }}
                            cursor="pointer"
                            _hover={{ opacity: 0.8 }}
                            transition="opacity 0.2s"
                          >
                            <Avatar
                              size={{ base: "sm", sm: "md" }}
                              name={s.student_name}
                              bg={primaryColor}
                              color="white"
                              fontWeight="bold"
                              border="2px"
                              borderColor="white"
                            />
                            <VStack align="start" spacing={1}>
                              <Text
                                fontWeight="bold"
                                color={textColor}
                                fontSize={{ base: "sm", sm: "md" }}
                                noOfLines={1}
                              >
                                {s.student_name}
                              </Text>
                              <Badge
                                colorScheme="blue"
                                variant="subtle"
                                px={2}
                                py={0.5}
                                borderRadius="full"
                                fontSize="2xs"
                                fontWeight="medium"
                              >
                                ID: {s.id}
                              </Badge>
                            </VStack>
                          </HStack>
                        </Link>
                        <HStack
                          spacing={2}
                          w={{ base: "100%", sm: "auto" }}
                          justify={{ base: "space-between", sm: "flex-end" }}
                        >
                          <Button
                            leftIcon={<MdCheckCircle />}
                            colorScheme="green"
                            variant={
                              currentStatus === "present" ? "solid" : "outline"
                            }
                            onClick={() => handleAttendance(s.id, "present")}
                            size={{ base: "sm", sm: "md" }}
                            borderRadius="full"
                            flex={{ base: 1, sm: "none" }}
                            fontSize={{ base: "xs", sm: "sm" }}
                            px={{ base: 2, sm: 3 }}
                          >
                            حاضر
                          </Button>
                          <Button
                            leftIcon={<MdCancel />}
                            colorScheme="red"
                            variant={
                              currentStatus === "absent" ? "solid" : "outline"
                            }
                            onClick={() => handleAttendance(s.id, "absent")}
                            size={{ base: "sm", sm: "md" }}
                            borderRadius="full"
                            flex={{ base: 1, sm: "none" }}
                            fontSize={{ base: "xs", sm: "sm" }}
                            px={{ base: 2, sm: 3 }}
                          >
                            غائب
                          </Button>
                        </HStack>
                      </Stack>
                      <HStack
                        spacing={2}
                        justify="center"
                        pt={2}
                        borderTop="1px"
                        borderColor="gray.200"
                      >
                        <Tooltip label="عرض التفاصيل" placement="top" hasArrow>
                          <IconButton
                            as={Link}
                            to={`/group/${id}/student/${s.id}`}
                            icon={<BiSearch size={14} />}
                            colorScheme="blue"
                            variant="ghost"
                            aria-label="عرض التفاصيل"
                            size="sm"
                            borderRadius="full"
                          />
                        </Tooltip>
                        <Tooltip label="حذف الطالب" placement="top" hasArrow>
                          <IconButton
                            icon={<MdDelete size={14} />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteStudent(s.id)}
                            aria-label="حذف"
                            borderRadius="full"
                          />
                        </Tooltip>
                      </HStack>
                    </VStack>
                  </Card>
                );
              })}

              {/* Mobile Attendance Action Buttons */}
              {filteredStudents.length > 0 && (
                <Card
                  className="mb-[50px]"
                  w="100%"
                  bg={cardBg}
                  borderRadius="xl"
                  shadow="sm"
                  borderWidth="1px"
                  borderColor={borderColor}
                  p={5}
                  mt={4}
                >
                  <VStack spacing={4} w="100%">
                    <Text fontWeight="bold" color={textColor} fontSize="md">
                      تسجيل الحضور
                    </Text>
                    <HStack
                      spacing={{ base: 2, md: 4 }}
                      w="full"
                      justify="center"
                      flexWrap="wrap"
                    >
                      <Button
                        colorScheme="orange"
                        size={{ base: "sm", md: "md" }}
                        variant="outline"
                        onClick={startQrScanner}
                        borderRadius="lg"
                        flex={{ base: 1, sm: "none" }}
                        minW={{ base: "120px", sm: "auto" }}
                      >
                        QR
                      </Button>
                      <Button
                        size={{ base: "sm", md: "md" }}
                        onClick={handleSaveAttendance}
                        isLoading={savingAttendance}
                        loadingText="جاري الحفظ..."
                        w={{ base: "100%", sm: "auto" }}
                        borderRadius="lg"
                        colorScheme="blue"
                        flex={{ base: 1, sm: "none" }}
                        minW={{ base: "120px", sm: "auto" }}
                        leftIcon={<MdCheckCircle />}
                      >
                        حفظ الحضور
                      </Button>
                    </HStack>
                  </VStack>
                </Card>
              )}
            </VStack>
          ) : (
            <Card
              bg={cardBg}
              shadow="sm"
              borderRadius="xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor={borderColor}
              w="100%"
            >
              <Box
                p={{ base: 4, md: 5 }}
                borderBottomWidth="1px"
                borderColor={borderColor}
                bg={tableHeadBg}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <HStack spacing={2}>
                    <Text fontWeight="bold" color={textColor} fontSize="lg">
                      قائمة الطلاب
                    </Text>
                    <Badge colorScheme="blue" borderRadius="full">
                      {filteredStudents.length} من {students?.length || 0}
                    </Badge>
                  </HStack>
                  {loading && (
                    <HStack>
                      <Spinner size="sm" color={primaryColor} />
                      <Text fontSize="sm" color="gray.500">
                        جاري التحديث...
                      </Text>
                    </HStack>
                  )}
                </Flex>
                {students?.length > 0 && (
                  <HStack mt={4} spacing={3} flexWrap="wrap" align="center">
                    <Text fontSize="sm" fontWeight="600" color={textColor}>
                      تصدير كروت PDF:
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color={mutedText}>
                        من
                      </Text>
                      <Input
                        type="number"
                        size="sm"
                        w="70px"
                        value={exportStartIndex}
                        min={1}
                        max={students.length}
                        onChange={(e) =>
                          setExportStartIndex(
                            Math.max(
                              1,
                              Math.min(
                                students.length,
                                Number(e.target.value) || 1,
                              ),
                            ),
                          )
                        }
                      />
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color={mutedText}>
                        إلى
                      </Text>
                      <Input
                        type="number"
                        size="sm"
                        w="70px"
                        value={exportEndIndex}
                        min={1}
                        max={students.length}
                        onChange={(e) =>
                          setExportEndIndex(
                            Math.max(
                              1,
                              Math.min(
                                students.length,
                                Number(e.target.value) || 1,
                              ),
                            ),
                          )
                        }
                      />
                    </HStack>
                    <Text fontSize="xs" color={mutedTextSecondary}>
                      (إجمالي {students.length} طالب)
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaFileAlt} />}
                      onClick={handleExportStudentsPdf}
                      disabled={
                        isExportingPdf || exportStartIndex > exportEndIndex
                      }
                      isLoading={isExportingPdf}
                      loadingText="جاري التصدير..."
                    >
                      تصدير من {exportStartIndex} إلى {exportEndIndex}
                    </Button>
                  </HStack>
                )}
              </Box>

              <CardBody p={0}>
                {loading && !students?.length ? (
                  <VStack spacing={4} py={16}>
                    <Spinner size="lg" color="blue.500" thickness="3px" />
                    <Text fontSize="sm" color={mutedTextSecondary}>
                      جاري تحميل بيانات الطلاب...
                    </Text>
                  </VStack>
                ) : studentsError ? (
                  <Alert status="error" borderRadius="xl" m={6}>
                    <AlertIcon />
                    <Text fontWeight="medium">{studentsError}</Text>
                  </Alert>
                ) : filteredStudents.length === 0 ? (
                  <Center py={16}>
                    <VStack spacing={4}>
                      <Flex w={12} h={12} borderRadius="lg" bg="blue.50" align="center" justify="center">
                        <Icon as={FaUsers} boxSize={6} color="blue.500" />
                      </Flex>
                      <Text fontSize="md" fontWeight="semibold" color={textColor} textAlign="center">
                        {searchTerm ? "لا توجد نتائج" : "لا يوجد طلاب بعد"}
                      </Text>
                      <Text color={mutedTextSecondary} textAlign="center" fontSize="sm" maxW="320px">
                        {searchTerm ? "غيّر كلمات البحث" : "أضف أول طالب للمجموعة"}
                      </Text>
                      {!searchTerm && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => setIsAddModalOpen(true)}
                          leftIcon={<MdAdd />}
                          borderRadius="lg"
                        >
                          إضافة طالب
                        </Button>
                      )}
                    </VStack>
                  </Center>
                ) : (
                  <Box overflowX="auto">
                    <Table
                      variant="simple"
                      colorScheme="gray"
                      size={{ base: "sm", md: "md" }}
                    >
                      <Thead bg={tableHeadBg}>
                        <Tr>
                          <Th
                            color="gray.600"
                            fontSize={{ base: "xs", md: "sm" }}
                            py={{ base: 2, md: 3 }}
                          >
                            الاسم
                          </Th>
                          <Th
                            color="gray.600"
                            fontSize={{ base: "xs", md: "sm" }}
                            py={{ base: 2, md: 3 }}
                            textAlign="center"
                          >
                            الحضور
                          </Th>
                          <Th
                            color="gray.600"
                            fontSize={{ base: "xs", md: "sm" }}
                            py={{ base: 2, md: 3 }}
                            textAlign="center"
                          >
                            الإجراءات
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredStudents.map((s) => {
                          const dateKey = selectedDate
                            .toISOString()
                            .split("T")[0];
                          const currentStatus =
                            attendance[s.id]?.[dateKey] || "not_set";
                          return (
                            <Tr key={s.id} _hover={{ bg: rowHoverBg }}>
                              <Td py={{ base: 2, md: 3 }}>
                                <Link
                                  to={`/group/${id}/student/${s.id}`}
                                  style={{ textDecoration: "none" }}
                                >
                                  <HStack
                                    spacing={{ base: 2, md: 3 }}
                                    cursor="pointer"
                                    _hover={{ opacity: 0.8 }}
                                    transition="opacity 0.2s"
                                  >
                                    <Avatar
                                      size={{ base: "xs", md: "sm" }}
                                      name={s.student_name}
                                      bg="blue.400"
                                      color="white"
                                    />
                                    <VStack align="start" spacing={0}>
                                      <Text
                                        fontWeight="semibold"
                                        color={textColor}
                                        fontSize={{ base: "xs", md: "sm" }}
                                        noOfLines={1}
                                      >
                                        {s.student_name}
                                      </Text>
                                      <Badge
                                        colorScheme="blue"
                                        variant="subtle"
                                        px={2}
                                        py={0.5}
                                        borderRadius="full"
                                        fontSize="2xs"
                                        fontWeight="medium"
                                      >
                                        ID: {s.id}
                                      </Badge>
                                    </VStack>
                                  </HStack>
                                </Link>
                              </Td>
                              <Td textAlign="center" py={{ base: 2, md: 3 }}>
                                <HStack
                                  justify="center"
                                  spacing={{ base: 1, md: 3 }}
                                >
                                  <Button
                                    leftIcon={<MdCheckCircle />}
                                    colorScheme="green"
                                    variant={
                                      currentStatus === "present"
                                        ? "solid"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      handleAttendance(s.id, "present")
                                    }
                                    size={{ base: "xs", md: "sm" }}
                                    borderRadius="full"
                                    fontSize={{ base: "2xs", md: "xs" }}
                                    px={{ base: 2, md: 3 }}
                                  >
                                    حاضر
                                  </Button>
                                  <Button
                                    leftIcon={<MdCancel />}
                                    colorScheme="red"
                                    variant={
                                      currentStatus === "absent"
                                        ? "solid"
                                        : "outline"
                                    }
                                    onClick={() =>
                                      handleAttendance(s.id, "absent")
                                    }
                                    size={{ base: "xs", md: "sm" }}
                                    borderRadius="full"
                                    fontSize={{ base: "2xs", md: "xs" }}
                                    px={{ base: 2, md: 3 }}
                                  >
                                    غائب
                                  </Button>
                                </HStack>
                              </Td>
                              <Td textAlign="center" py={{ base: 2, md: 3 }}>
                                <HStack
                                  spacing={{ base: 1, md: 2 }}
                                  justify="center"
                                >
                                  <Tooltip
                                    label="عرض التفاصيل"
                                    placement="top"
                                    hasArrow
                                  >
                                    <IconButton
                                      as={Link}
                                      to={`/group/${id}/student/${s.id}`}
                                      icon={
                                        <BiSearch size={{ base: 14, md: 16 }} />
                                      }
                                      colorScheme="blue"
                                      variant="ghost"
                                      aria-label="عرض التفاصيل"
                                      size={{ base: "sm", md: "md" }}
                                      borderRadius="full"
                                    />
                                  </Tooltip>
                                  <Tooltip
                                    label="حذف الطالب"
                                    placement="top"
                                    hasArrow
                                  >
                                    <IconButton
                                      icon={
                                        <MdDelete size={{ base: 14, md: 16 }} />
                                      }
                                      colorScheme="red"
                                      variant="ghost"
                                      onClick={() => handleDeleteStudent(s.id)}
                                      aria-label="حذف"
                                      size={{ base: "sm", md: "md" }}
                                      borderRadius="full"
                                    />
                                  </Tooltip>
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>

              {filteredStudents.length > 0 && (
                <Flex
                  justify="center"
                  mt={4}
                  p={{ base: 3, md: 4 }}
                  borderTop="1px"
                  borderColor={borderColor}
                >
                  <VStack spacing={{ base: 3, md: 4 }} w="full">
                    <HStack
                      spacing={{ base: 2, md: 4 }}
                      w="full"
                      justify="center"
                      flexWrap="wrap"
                    >
                      <Button
                        colorScheme="orange"
                        size={{ base: "sm", md: "md" }}
                        variant="outline"
                        onClick={startQrScanner}
                        borderRadius="lg"
                        flex={{ base: 1, sm: "none" }}
                        minW={{ base: "120px", sm: "auto" }}
                      >
                        QR
                      </Button>
                      <Button
                        size={{ base: "sm", md: "md" }}
                        onClick={handleSaveAttendance}
                        isLoading={savingAttendance}
                        loadingText="جاري الحفظ..."
                        w={{ base: "100%", sm: "auto" }}
                        borderRadius="lg"
                        colorScheme="blue"
                        flex={{ base: 1, sm: "none" }}
                        minW={{ base: "120px", sm: "auto" }}
                        leftIcon={<MdCheckCircle />}
                      >
                        حفظ الحضور
                      </Button>
                    </HStack>
                  </VStack>
                </Flex>
              )}
            </Card>
          )}
        </VStack>
      </Container>

      <AddStudentDualModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBulk={handleAddStudentsBulk}
        loading={loading}
      />

      <AddExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        groupId={id}
        groupName={groupData?.name || "المجموعة"}
        onExamAdded={handleExamAdded}
        loading={loading}
      />

      <ExamGradesModal
        isOpen={isExamGradesModalOpen}
        onClose={() => setIsExamGradesModalOpen(false)}
        groupId={id}
        groupName={groupData?.name || "المجموعة"}
        students={students || []}
      />

      {selectedStudent && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onEditStudent={handleEditStudent}
        />
      )}

      <AttendanceHistoryModal
        isOpen={isAttendanceHistoryOpen}
        onClose={() => setIsAttendanceHistoryOpen(false)}
        groupId={id}
      />

      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        size={{ base: "full", sm: "xl", md: "4xl", lg: "6xl" }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          borderRadius={{ base: "none", md: "xl" }}
          m={{ base: 0, md: 4 }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <ModalHeader
            fontSize={{ base: "md", md: "lg" }}
            p={{ base: 3, md: 6 }}
          >
            طلاب المجموعة - {groupData?.name || `#${id}`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={{ base: 3, md: 6 }}>
            {modalLoading ? (
              <Center py={12}>
                <VStack>
                  <Spinner size="xl" color={primaryColor} />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    جاري جلب الطلاب...
                  </Text>
                </VStack>
              </Center>
            ) : modalError ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize={{ base: "sm", md: "md" }}>{modalError}</Text>
              </Alert>
            ) : modalStudents.length === 0 ? (
              <Center py={12}>
                <Text fontSize={{ base: "sm", md: "md" }}>
                  لا يوجد طلاب لعرضهم لهذا التاريخ.
                </Text>
              </Center>
            ) : (
              <SimpleGrid
                columns={{ base: 1, sm: 1, md: 2 }}
                spacing={{ base: 5, md: 6 }}
                p={{ base: 0, md: 4 }}
                justifyItems="center"
              >
                {modalStudents.map((s) => {
                  const groupColor = getGroupCardColor(id);
                  return (
                    <Card
                      key={s.id}
                      w="500px"
                      maxW="100%"
                      h="250px"
                      minH="250px"
                      borderRadius="xl"
                      overflow="hidden"
                      boxShadow="sm"
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <Flex
                        h="46px"
                        bg={`${groupColor}.500`}
                        align="center"
                        justify="space-between"
                        px={4}
                        flexShrink={0}
                      >
                        <Image
                          src={nextEduLogo}
                          alt="NextEdu"
                          h="30px"
                          w="auto"
                          maxW="130px"
                          objectFit="contain"
                        />
                        <HStack spacing={2} flex="1" justify="center">
                          <Icon
                            as={MdPeople}
                            boxSize={4}
                            color="white"
                            opacity={0.95}
                          />
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="white"
                            noOfLines={1}
                            letterSpacing="0.01em"
                          >
                            {s.group_name ||
                              groupData?.name ||
                              `المجموعة #${id}`}
                          </Text>
                        </HStack>
                        <Box w="130px" />
                      </Flex>

                      <CardBody
                        p={0}
                        flex={1}
                        display="flex"
                        h="calc(250px - 46px)"
                      >
                        {/* يسار: كود + اسم الطالب */}
                        <Flex
                          flex="1"
                          direction="column"
                          align="center"
                          justify="center"
                          px={5}
                          py={4}
                          bg={`${groupColor}.50`}
                          borderRightWidth="1px"
                          borderRightColor={dividerColor}
                          position="relative"
                        >
                          <Image
                            src={nextEduLogo}
                            alt=""
                            position="absolute"
                            top={3}
                            right={3}
                            h="26px"
                            w="auto"
                            maxW="85px"
                            objectFit="contain"
                            opacity={0.4}
                          />
                          <VStack spacing={3} align="center" w="full">
                            {s.number_in_group != null && (
                              <Badge
                                colorScheme={groupColor}
                                variant="subtle"
                                px={3}
                                py={1}
                                borderRadius="full"
                                fontSize="xs"
                                fontWeight="700"
                              >
                                كود الطالب : {s.number_in_group}
                              </Badge>
                            )}
                            <VStack spacing={1} align="center">
                              <Text
                                fontSize="xs"
                                fontWeight="600"
                                color={`${groupColor}.600`}
                                letterSpacing="0.04em"
                                textTransform="uppercase"
                              >
                                اسم الطالب
                              </Text>
                              <Text
                                fontWeight="bold"
                                fontSize="xl"
                                textAlign="center"
                                noOfLines={2}
                                color={textColor}
                                lineHeight="1.4"
                                letterSpacing="0.01em"
                              >
                                {s.student_name}
                              </Text>
                            </VStack>
                          </VStack>
                        </Flex>

                        {/* يمين: QR */}
                        <Flex
                          flex="1"
                          align="center"
                          justify="center"
                          p={4}
                          bg={cardBg}
                          position="relative"
                        >
                          <Image
                            src={nextEduLogo}
                            alt=""
                            position="absolute"
                            bottom={3}
                            left={3}
                            h="22px"
                            w="auto"
                            maxW="75px"
                            objectFit="contain"
                            opacity={0.4}
                          />
                          {s.qr_code ? (
                            <Box
                              p={3}
                              bg="white"
                              borderRadius="xl"
                              boxShadow="0 2px 12px rgba(0,0,0,0.06)"
                              borderWidth="1px"
                              borderColor={mutedBorder}
                            >
                              <Image
                                src={s.qr_code}
                                alt={`QR ${s.student_name}`}
                                maxW="130px"
                                maxH="130px"
                                objectFit="contain"
                              />
                            </Box>
                          ) : (
                            <Text color="gray.400" fontSize="xs">
                              لا يوجد QR
                            </Text>
                          )}
                        </Flex>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={isQrScannerOpen}
        onClose={stopQrScanner}
        size={{ base: "full", sm: "xl" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          borderRadius={{ base: "none", sm: "xl" }}
          m={{ base: 0, sm: 4 }}
          maxH={{ base: "100vh", sm: "90vh" }}
        >
          <ModalHeader
            fontSize={{ base: "md", sm: "lg" }}
            p={{ base: 3, sm: 6 }}
          >
            مسح QR لتسجيل الحضور
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={{ base: 3, sm: 6 }}>
            <Center flexDirection="column" py={{ base: 2, sm: 4 }}>
              <Box
                id="qr-scanner"
                w="full"
                minH={{ base: "280px", sm: "320px" }}
                borderRadius="md"
                overflow="hidden"
                bg="black"
              />
              <Text
                mt={3}
                color="gray.500"
                fontSize={{ base: "xs", sm: "sm" }}
                textAlign="center"
                px={2}
              >
                ضع QR داخل المربع. سيتم استخدام الكاميرا الخلفية تلقائياً.
              </Text>
              {qrProcessing && (
                <Text
                  mt={2}
                  color="green.500"
                  fontWeight="semibold"
                  fontSize={{ base: "xs", sm: "sm" }}
                >
                  جاري معالجة الكود...
                </Text>
              )}
              <HStack mt={4} spacing={2}>
                <Button
                  onClick={stopQrScanner}
                  colorScheme="red"
                  variant="ghost"
                  size={{ base: "sm", sm: "md" }}
                  fontSize={{ base: "xs", sm: "sm" }}
                >
                  إيقاف
                </Button>
              </HStack>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CenterGroupDetails;
