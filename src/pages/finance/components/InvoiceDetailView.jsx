import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  Icon,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdPrint, MdVerified } from "react-icons/md";
import {
  formatDate,
  formatMoney,
  INVOICE_STATUS,
  invoiceTypeLabel,
  paymentMethodLabel,
  teacherLabel,
} from "../financeConstants";

const PLATFORM_NAME = "EM Academy";
const PLATFORM_TAGLINE = "منصة التعليم الإلكتروني";

function MetaCell({ label, value, mono }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  return (
    <Box>
      <Text fontSize="10px" textTransform="uppercase" letterSpacing="wider" color={muted} mb={1}>
        {label}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color={textColor}
        fontFamily={mono ? "mono" : "inherit"}
      >
        {value ?? "—"}
      </Text>
    </Box>
  );
}

export default function InvoiceDetailView({
  invoice,
  showTeacher = false,
  showPrintButton = false,
  billToName,
}) {
  const paperBg = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const border = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const headBg = useColorModeValue("gray.50", "gray.700");
  const accent = useColorModeValue("blue.600", "blue.300");
  const totalBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const invoiceTitleColor = useColorModeValue("gray.200", "gray.600");

  if (!invoice) {
    return (
      <Text color={muted} textAlign="center" py={8}>
        لا توجد بيانات
      </Text>
    );
  }

  const statusMeta = INVOICE_STATUS[invoice.status] || {
    label: invoice.status || "—",
    colorScheme: "gray",
  };
  const isPaid = invoice.status === "paid";
  const isPartial = invoice.status === "partial";
  const paidAmount = invoice.paid_amount ?? (isPaid ? invoice.amount : 0);
  const remainingAmount =
    invoice.remaining_amount ?? Math.max(0, Number(invoice.amount || 0) - Number(paidAmount || 0));
  const recipient =
    billToName ||
    invoice.teacher_name ||
    teacherLabel(invoice.teacher) ||
    "المدرس";

  const lineDescription = [
    invoiceTypeLabel(invoice),
    invoice.plan_name_ar || invoice.plan_name,
  ]
    .filter(Boolean)
    .join(" — ");

  const periodLabel =
    invoice.period_start && invoice.period_end
      ? `${formatDate(invoice.period_start)} — ${formatDate(invoice.period_end)}`
      : "—";

  const handlePrint = () => window.print();

  return (
    <Box>
      {showPrintButton ? (
        <Flex justify="flex-end" mb={4} className="no-print">
          <Button
            leftIcon={<MdPrint />}
            colorScheme="blue"
            variant="outline"
            borderRadius="xl"
            size="sm"
            onClick={handlePrint}
          >
            طباعة / حفظ PDF
          </Button>
        </Flex>
      ) : null}

      <Box
        id="invoice-document"
        className="invoice-document"
        bg={pageBg}
        p={{ base: 2, md: 4 }}
        borderRadius="2xl"
        sx={{
          "@media print": {
            bg: "white",
            p: 0,
            borderRadius: 0,
            ".no-print": { display: "none !important" },
            "#invoice-document": {
              boxShadow: "none !important",
            },
          },
        }}
      >
        <Box
          bg={paperBg}
          borderRadius="xl"
          overflow="hidden"
          boxShadow="xl"
          borderWidth="1px"
          borderColor={border}
          position="relative"
          sx={{
            "@media print": {
              boxShadow: "none",
              border: "none",
            },
          }}
        >
          {/* شريط علوي */}
          <Box h="6px" bgGradient="linear(to-l, blue.500, orange.500)" />

          <Box p={{ base: 5, md: 8 }} position="relative">
            {/* ختم مدفوعة */}
            {isPaid || isPartial ? (
              <Box
                position="absolute"
                top={{ base: 4, md: 8 }}
                left={{ base: 4, md: 8 }}
                opacity={0.12}
                transform="rotate(-12deg)"
                pointerEvents="none"
                display={{ base: "none", sm: "block" }}
              >
                <HStack spacing={2} color={isPaid ? "green.500" : "orange.500"} fontSize="4xl" fontWeight="black">
                  <Icon as={MdVerified} boxSize={12} />
                  <Text>{isPaid ? "مدفوعة" : "جزئية"}</Text>
                </HStack>
              </Box>
            ) : null}

            {/* رأس الفاتورة */}
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "flex-start", md: "flex-start" }}
              gap={6}
              mb={8}
            >
              <VStack align="start" spacing={1}>
                <Text fontSize="2xl" fontWeight="black" color={accent} letterSpacing="tight">
                  {PLATFORM_NAME}
                </Text>
                <Text fontSize="xs" color={muted}>
                  {PLATFORM_TAGLINE}
                </Text>
              </VStack>

              <VStack align={{ base: "start", md: "end" }} spacing={2}>
                <Text
                  fontSize="3xl"
                  fontWeight="black"
                  letterSpacing="widest"
                  color={invoiceTitleColor}
                  lineHeight="1"
                >
                  فاتورة
                </Text>
                <Badge
                  colorScheme={statusMeta.colorScheme}
                  fontSize="sm"
                  px={4}
                  py={1}
                  borderRadius="full"
                  textTransform="none"
                >
                  {statusMeta.label}
                </Badge>
              </VStack>
            </Flex>

            {/* بيانات الفاتورة */}
            <Grid
              templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
              gap={4}
              p={4}
              bg={headBg}
              borderRadius="lg"
              mb={8}
            >
              <MetaCell
                label="رقم الفاتورة"
                value={invoice.invoice_number || `#${invoice.id}`}
                mono
              />
              <MetaCell label="تاريخ الإصدار" value={formatDate(invoice.issued_at)} />
              <MetaCell label="رقم الاشتراك" value={invoice.subscription_number || "—"} mono />
              <MetaCell label="طريقة الدفع" value={paymentMethodLabel(invoice)} />
            </Grid>

            {/* من / إلى */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={8}>
              <Box>
                <Text fontSize="10px" textTransform="uppercase" letterSpacing="wider" color={muted} mb={2}>
                  من
                </Text>
                <Text fontWeight="bold" fontSize="md">
                  {PLATFORM_NAME}
                </Text>
                <Text fontSize="sm" color={muted} mt={1} lineHeight="1.7">
                  فريق الحسابات والمالية
                  <br />
                  اشتراكات منصة المدرسين
                </Text>
              </Box>
              <Box>
                <Text fontSize="10px" textTransform="uppercase" letterSpacing="wider" color={muted} mb={2}>
                  {showTeacher ? "المدرس" : "إلى"}
                </Text>
                <Text fontWeight="bold" fontSize="md">
                  {recipient}
                </Text>
                {invoice.teacher?.email ? (
                  <Text fontSize="sm" color={muted} mt={1}>
                    {invoice.teacher.email}
                  </Text>
                ) : null}
              </Box>
            </Grid>

            {/* جدول البنود */}
            <Box overflowX="auto" mb={6}>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr bg={headBg}>
                    <Th borderColor={border} py={3}>
                      الوصف
                    </Th>
                    <Th borderColor={border} py={3} whiteSpace="nowrap">
                      فترة الاشتراك
                    </Th>
                    <Th borderColor={border} py={3} isNumeric>
                      المبلغ
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td borderColor={border} py={4}>
                      <Text fontWeight="semibold">{lineDescription}</Text>
                      <Text fontSize="xs" color={muted} mt={1}>
                        {invoice.plan_name_ar || invoice.plan_name || "باقة اشتراك المنصة"}
                      </Text>
                    </Td>
                    <Td borderColor={border} py={4} whiteSpace="nowrap" fontSize="sm">
                      {periodLabel}
                    </Td>
                    <Td borderColor={border} py={4} isNumeric fontWeight="bold" fontSize="md">
                      {formatMoney(invoice.amount)}
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>

            {/* الإجمالي */}
            <Flex justify="flex-end" mb={6}>
              <Box
                w={{ base: "full", sm: "280px" }}
                p={4}
                bg={totalBg}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={border}
              >
                <Flex justify="space-between" align="center">
                  <Text fontWeight="semibold" color={muted}>
                    إجمالي الفاتورة
                  </Text>
                  <Text fontSize="xl" fontWeight="black" color={accent}>
                    {formatMoney(invoice.amount)}
                  </Text>
                </Flex>
                <Divider my={3} borderColor={border} />
                <HStack justify="space-between" fontSize="sm" mb={2}>
                  <Text color={muted}>المدفوع</Text>
                  <Text fontWeight="semibold" color="green.500">
                    {formatMoney(paidAmount)}
                  </Text>
                </HStack>
                <HStack justify="space-between" fontSize="sm" mb={2}>
                  <Text color={muted}>المتبقي</Text>
                  <Text fontWeight="semibold" color={remainingAmount > 0 ? "orange.500" : muted}>
                    {formatMoney(remainingAmount)}
                  </Text>
                </HStack>
                <Divider my={3} borderColor={border} />
                <HStack justify="space-between" fontSize="sm">
                  <Text color={muted}>الحالة</Text>
                  <Badge colorScheme={statusMeta.colorScheme} variant="subtle">
                    {statusMeta.label}
                  </Badge>
                </HStack>
              </Box>
            </Flex>

            {invoice.notes ? (
              <Box mb={6} p={4} borderRadius="lg" borderWidth="1px" borderColor={border}>
                <Text fontSize="xs" color={muted} mb={1}>
                  ملاحظات
                </Text>
                <Text fontSize="sm">{invoice.notes}</Text>
              </Box>
            ) : null}

            <Divider borderColor={border} mb={4} />

            <Text fontSize="xs" color={muted} textAlign="center" lineHeight="1.8">
              هذه فاتورة إلكترونية صادرة من {PLATFORM_NAME} — لا تحتاج إلى توقيع أو ختم.
              <br />
              للاستفسارات تواصل مع فريق الدعم الفني.
            </Text>
          </Box>

          <Box h="4px" bgGradient="linear(to-l, orange.400, blue.400)" />
        </Box>
      </Box>
    </Box>
  );
}
