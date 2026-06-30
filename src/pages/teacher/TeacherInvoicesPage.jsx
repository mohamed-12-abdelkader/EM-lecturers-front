import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MdArrowForward,
  MdDescription,
  MdReceiptLong,
  MdVisibility,
} from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchTeacherInvoiceById,
  fetchTeacherInvoices,
} from "../../api/financeApi";
import InvoiceDetailView from "../finance/components/InvoiceDetailView";
import {
  formatDate,
  formatMoney,
  INVOICE_STATUS,
  invoiceTypeLabel,
} from "../finance/financeConstants";

const PAGE_SIZE = 20;

function InvoiceListCard({ invoice, onOpen }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const st = INVOICE_STATUS[invoice.status] || {
    label: invoice.status,
    colorScheme: "gray",
  };

  return (
    <Box
      p={4}
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      cursor="pointer"
      onClick={onOpen}
      _hover={{ borderColor: "blue.300", shadow: "md" }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="start" gap={3} mb={3}>
        <Box minW={0}>
          <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color="blue.500">
            {invoice.invoice_number || `#${invoice.id}`}
          </Text>
          <Text fontWeight="semibold" fontSize="sm" mt={1} noOfLines={1}>
            {invoice.plan_name_ar || invoice.plan_name || "—"}
          </Text>
        </Box>
        <Badge colorScheme={st.colorScheme} borderRadius="full" flexShrink={0}>
          {st.label}
        </Badge>
      </Flex>
      <HStack justify="space-between" fontSize="xs" color={muted}>
        <Text>{invoiceTypeLabel(invoice)}</Text>
        <Text>{formatDate(invoice.issued_at)}</Text>
      </HStack>
      <Text fontSize="lg" fontWeight="bold" mt={3} color="green.500">
        {formatMoney(invoice.amount)}
      </Text>
    </Box>
  );
}

export default function TeacherInvoicesPage() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState(null);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const heroGradient = useColorModeValue(
    "linear(to-br, blue.500, orange.500)",
    "linear(to-br, blue.600, orange.600)",
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const billToName =
    user.name ||
    `${user.fname || ""} ${user.lname || ""}`.trim() ||
    user.email ||
    "المدرس";

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTeacherInvoices({ limit: PAGE_SIZE, offset });
      setInvoices(result.invoices);
      setTotal(result.total);
    } catch (err) {
      setError(err.message || "فشل تحميل الفواتير");
      setInvoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const loadDetail = useCallback(async (id) => {
    setDetailLoading(true);
    setError(null);
    try {
      const invoice = await fetchTeacherInvoiceById(id);
      setSelectedInvoice(invoice);
    } catch (err) {
      setError(err.message || "فشل تحميل الفاتورة");
      setSelectedInvoice(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!invoiceId) loadList();
  }, [loadList, invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      loadDetail(invoiceId);
    } else {
      setSelectedInvoice(null);
    }
  }, [invoiceId, loadDetail]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const showDetail = Boolean(invoiceId);

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10}>
      <Box bgGradient={heroGradient} color="white" py={{ base: 5, md: 7 }} px={4} shadow="md">
        <Container maxW="1100px">
          <HStack spacing={4} align="start">
            <Flex
              w={11}
              h={11}
              borderRadius="xl"
              bg="whiteAlpha.300"
              border="1px solid"
              borderColor="whiteAlpha.400"
              align="center"
              justify="center"
            >
              <Icon as={MdReceiptLong} boxSize={5} />
            </Flex>
            <VStack align="start" spacing={0.5}>
              <Heading size={{ base: "sm", md: "md" }} fontWeight="extrabold">
                فواتير الاشتراك
              </Heading>
              <Text fontSize="xs" color="whiteAlpha.900" lineHeight="1.7">
                سجل فواتير اشتراك منصتك — اشتراكات جديدة وتجديدات
              </Text>
            </VStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="1100px" px={{ base: 3, md: 5 }} mt={5}>
        {showDetail ? (
          <VStack align="stretch" spacing={4}>
            <Button
              as={Link}
              to="/teacher-invoices"
              leftIcon={<MdArrowForward />}
              variant="ghost"
              alignSelf="flex-start"
              borderRadius="xl"
              size="sm"
              className="no-print"
            >
              العودة للقائمة
            </Button>

            {detailLoading ? (
              <Flex justify="center" py={16}>
                <Spinner color="blue.500" size="lg" />
              </Flex>
            ) : error ? (
              <Text color="red.500" fontWeight="semibold">
                {error}
              </Text>
            ) : (
              <InvoiceDetailView
                invoice={selectedInvoice}
                showPrintButton
                billToName={billToName}
              />
            )}
          </VStack>
        ) : (
          <VStack align="stretch" spacing={4}>
            {error ? (
              <Text color="red.500" fontWeight="semibold">
                {error}
              </Text>
            ) : null}

            {loading ? (
              <Flex justify="center" py={14}>
                <Spinner color="blue.500" />
              </Flex>
            ) : invoices.length === 0 ? (
              <Card bg={cardBg} borderRadius="2xl" borderColor={border}>
                <CardBody py={12} textAlign="center">
                  <Icon as={MdDescription} boxSize={10} color={muted} mb={3} />
                  <Text color={muted} fontWeight="medium">
                    لا توجد فواتير بعد
                  </Text>
                  <Text fontSize="sm" color={muted} mt={1}>
                    ستظهر هنا فواتير اشتراكك وتجديداتك
                  </Text>
                </CardBody>
              </Card>
            ) : (
              <>
                {/* بطاقات — موبايل */}
                <Grid
                  display={{ base: "grid", lg: "none" }}
                  templateColumns="1fr"
                  gap={3}
                >
                  {invoices.map((inv) => (
                    <InvoiceListCard
                      key={inv.id}
                      invoice={inv}
                      onOpen={() => navigate(`/teacher-invoices/${inv.id}`)}
                    />
                  ))}
                </Grid>

                {/* جدول — ديسكتوب */}
                <Card
                  display={{ base: "none", lg: "block" }}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={border}
                  borderRadius="2xl"
                  overflow="hidden"
                >
                  <CardBody p={0}>
                    <Box overflowX="auto">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>رقم الفاتورة</Th>
                            <Th>النوع</Th>
                            <Th>الباقة</Th>
                            <Th isNumeric>المبلغ</Th>
                            <Th>الإصدار</Th>
                            <Th>الحالة</Th>
                            <Th />
                          </Tr>
                        </Thead>
                        <Tbody>
                          {invoices.map((inv) => {
                            const st = INVOICE_STATUS[inv.status] || {
                              label: inv.status,
                              colorScheme: "gray",
                            };
                            return (
                              <Tr
                                key={inv.id}
                                cursor="pointer"
                                _hover={{ bg: rowHoverBg }}
                                onClick={() => navigate(`/teacher-invoices/${inv.id}`)}
                              >
                                <Td fontFamily="mono" fontSize="xs" fontWeight="semibold">
                                  {inv.invoice_number || `#${inv.id}`}
                                </Td>
                                <Td>
                                  <Badge colorScheme="blue" variant="subtle">
                                    {invoiceTypeLabel(inv)}
                                  </Badge>
                                </Td>
                                <Td>{inv.plan_name_ar || inv.plan_name || "—"}</Td>
                                <Td isNumeric fontWeight="bold">
                                  {formatMoney(inv.amount)}
                                </Td>
                                <Td whiteSpace="nowrap">{formatDate(inv.issued_at)}</Td>
                                <Td>
                                  <Badge colorScheme={st.colorScheme}>{st.label}</Badge>
                                </Td>
                                <Td>
                                  <IconButton
                                    aria-label="عرض الفاتورة"
                                    icon={<MdVisibility />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/teacher-invoices/${inv.id}`);
                                    }}
                                  />
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  </CardBody>
                </Card>
              </>
            )}

            {totalPages > 1 ? (
              <HStack justify="space-between">
                <Text fontSize="sm" color={muted}>
                  صفحة {page} من {totalPages}
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    borderRadius="xl"
                    isDisabled={offset === 0}
                    onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
                  >
                    السابق
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    borderRadius="xl"
                    isDisabled={offset + PAGE_SIZE >= total}
                    onClick={() => setOffset((p) => p + PAGE_SIZE)}
                  >
                    التالي
                  </Button>
                </HStack>
              </HStack>
            ) : null}
          </VStack>
        )}
      </Container>
    </Box>
  );
}
