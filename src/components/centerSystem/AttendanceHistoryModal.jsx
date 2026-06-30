import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Box,
  useColorModeValue
} from '@chakra-ui/react';
import { MdRefresh } from 'react-icons/md';
import baseUrl from '../../api/baseUrl';

const formatDateYMD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AttendanceHistoryModal = ({ isOpen, onClose, groupId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ range: null, summary: [], details: [] });

  // Filters
  const [mode, setMode] = useState('default'); // default | period | days | custom
  const [period, setPeriod] = useState('week'); // week | month
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const queryParams = useMemo(() => {
    // Priority: custom -> period -> days -> default
    if (mode === 'custom' && startDate && endDate) {
      return { start_date: startDate, end_date: endDate };
    }
    if (mode === 'period' && (period === 'week' || period === 'month')) {
      return { period };
    }
    if (mode === 'days' && Number(days) > 0) {
      return { days: Number(days) };
    }
    return {}; // default: last 7 days
  }, [mode, period, days, startDate, endDate]);

  const fetchHistory = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(
        `/api/study-groups/${groupId}/attendance-range`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: queryParams
        }
      );
      const body = response.data || {};
      setData({
        range: body.range || null,
        summary: Array.isArray(body.summary) ? body.summary : [],
        details: Array.isArray(body.details) ? body.details : []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في جلب سجل الحضور');
      setData({ range: null, summary: [], details: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset errors when opened and fetch
      setError(null);
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Refetch when filters change while open
  useEffect(() => {
    if (isOpen) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, period, days, startDate, endDate]);

  const rangeLabel = useMemo(() => {
    if (!data.range) return 'آخر 7 أيام';
    const from = new Date(data.range.from).toLocaleDateString('ar-EG');
    const to = new Date(data.range.to).toLocaleDateString('ar-EG');
    return `${from} - ${to}`;
  }, [data.range]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>سجل الحضور والغياب</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <HStack spacing={3} flexWrap="wrap">
              <Select value={mode} onChange={(e) => setMode(e.target.value)} width="auto">
                <option value="default">افتراضي (آخر 7 أيام)</option>
                <option value="period">فترة: أسبوع/شهر</option>
                <option value="days">آخر X يوم</option>
                <option value="custom">مدى مخصص</option>
              </Select>

              {mode === 'period' && (
                <Select value={period} onChange={(e) => setPeriod(e.target.value)} width="auto">
                  <option value="week">أسبوع</option>
                  <option value="month">شهر</option>
                </Select>
              )}

              {mode === 'days' && (
                <HStack>
                  <Text>عدد الأيام:</Text>
                  <Input
                    type="number"
                    value={days}
                    min={1}
                    onChange={(e) => setDays(e.target.value)}
                    width="120px"
                  />
                </HStack>
              )}

              {mode === 'custom' && (
                <HStack>
                  <HStack>
                    <Text>من</Text>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </HStack>
                  <HStack>
                    <Text>إلى</Text>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                    />
                  </HStack>
                </HStack>
              )}

              <Button leftIcon={<MdRefresh />} onClick={fetchHistory} isLoading={loading}>
                تحديث
              </Button>

              <Box flex={1} textAlign="end">
                <Badge colorScheme="purple" fontSize="0.9em" p={2} borderRadius="md">
                  {rangeLabel}
                </Badge>
              </Box>
            </HStack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontWeight="medium">{error}</Text>
              </Alert>
            )}

            {loading ? (
              <HStack justify="center" py={8}>
                <Spinner size="lg" />
                <Text>جاري التحميل...</Text>
              </HStack>
            ) : (
              <Tabs variant="enclosed">
                <TabList>
                  <Tab>الملخص</Tab>
                  <Tab>التفاصيل</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                      <Table size="sm" variant="simple">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th>الطالب</Th>
                            <Th isNumeric>الأيام الكلية</Th>
                            <Th isNumeric>حضور</Th>
                            <Th isNumeric>غياب</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {data.summary.map((row) => (
                            <Tr key={row.student_id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                              <Td>
                                <HStack>
                                  <Badge colorScheme="blue">ID: {row.student_id}</Badge>
                                  <Text fontWeight="semibold">{row.student_name}</Text>
                                </HStack>
                              </Td>
                              <Td isNumeric>{row.total_days}</Td>
                              <Td isNumeric>
                                <Badge colorScheme="green">{row.present_days}</Badge>
                              </Td>
                              <Td isNumeric>
                                <Badge colorScheme="red">{row.absent_days}</Badge>
                              </Td>
                            </Tr>
                          ))}
                          {data.summary.length === 0 && (
                            <Tr>
                              <Td colSpan={4}>
                                <Text textAlign="center" color="gray.500">لا توجد بيانات</Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                  </TabPanel>

                  <TabPanel>
                    <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                      <Table size="sm" variant="simple">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th>التاريخ</Th>
                            <Th>الطالب</Th>
                            <Th>الحالة</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {data.details.map((row, idx) => (
                            <Tr key={`${row.student_id}-${idx}`} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                              <Td>{new Date(row.date).toLocaleDateString('ar-EG')}</Td>
                              <Td>
                                <HStack>
                                  <Badge colorScheme="blue">ID: {row.student_id}</Badge>
                                  <Text fontWeight="semibold">{row.student_name}</Text>
                                </HStack>
                              </Td>
                              <Td>
                                <Badge colorScheme={row.status === 'present' ? 'green' : 'red'}>
                                  {row.status === 'present' ? 'حاضر' : 'غائب'}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                          {data.details.length === 0 && (
                            <Tr>
                              <Td colSpan={3}>
                                <Text textAlign="center" color="gray.500">لا توجد بيانات</Text>
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AttendanceHistoryModal;




































