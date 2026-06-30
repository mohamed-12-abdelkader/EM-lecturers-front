import { useState } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  MdAccountBalance,
  MdAssessment,
  MdAutorenew,
  MdDashboard,
  MdLocalOffer,
  MdPayments,
  MdReceipt,
  MdRefresh,
  MdSubscriptions,
  MdWarning,
  MdDescription,
} from "react-icons/md";
import FinanceDashboardTab from "./components/FinanceDashboardTab";
import FinancePlansTab from "./components/FinancePlansTab";
import FinanceSubscriptionsTab from "./components/FinanceSubscriptionsTab";
import FinanceCustomPricesTab from "./components/FinanceCustomPricesTab";
import FinanceExpensesTab from "./components/FinanceExpensesTab";
import FinanceAuditTab from "./components/FinanceAuditTab";
import FinanceExpiringSoonTab from "./components/FinanceExpiringSoonTab";
import FinanceInvoicesTab from "./components/FinanceInvoicesTab";
import FinanceOutstandingTab from "./components/FinanceOutstandingTab";
import FinanceReportsTab from "./components/FinanceReportsTab";

const MotionBox = motion(Box);

const TABS = [
  { key: "dashboard", label: "لوحة المالية", icon: MdDashboard },
  { key: "plans", label: "الباقات", icon: MdLocalOffer },
  { key: "subscriptions", label: "الاشتراكات", icon: MdSubscriptions },
  { key: "outstanding", label: "المستحقات", icon: MdPayments },
  { key: "expiring", label: "على وشك الانتهاء", icon: MdWarning },
  { key: "invoices", label: "الفواتير", icon: MdDescription },
  { key: "pricing", label: "تسعير مخصص", icon: MdAccountBalance },
  { key: "expenses", label: "المصروفات", icon: MdReceipt },
  { key: "reports", label: "التقارير", icon: MdAssessment },
  { key: "audit", label: "سجل التدقيق", icon: MdAutorenew },
];

export default function FinanceManagementPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [renewRequestSub, setRenewRequestSub] = useState(null);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const heroGradient = useColorModeValue(
    "linear(to-br, blue.500, orange.500)",
    "linear(to-br, blue.600, orange.600)",
  );
  const heroText = useColorModeValue("white", "gray.50");
  const heroSubtext = useColorModeValue("whiteAlpha.900", "whiteAlpha.800");
  const panelBg = useColorModeValue("white", "gray.800");
  const panelBorder = useColorModeValue("gray.200", "gray.700");
  const tabListBg = useColorModeValue("gray.50", "gray.900");
  const tabSelectedBg = useColorModeValue("white", "gray.800");

  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  const handleRenewRequest = (sub) => {
    setRenewRequestSub(sub);
    setTabIndex(2);
  };

  const tabPanels = [
    <FinanceDashboardTab refreshKey={refreshKey} />,
    <FinancePlansTab refreshKey={refreshKey} />,
    <FinanceSubscriptionsTab
      refreshKey={refreshKey}
      onChanged={bumpRefresh}
      renewRequestSub={renewRequestSub}
      onRenewRequestHandled={() => setRenewRequestSub(null)}
    />,
    <FinanceOutstandingTab refreshKey={refreshKey} onChanged={bumpRefresh} />,
    <FinanceExpiringSoonTab refreshKey={refreshKey} onRenewRequest={handleRenewRequest} />,
    <FinanceInvoicesTab refreshKey={refreshKey} />,
    <FinanceCustomPricesTab refreshKey={refreshKey} onChanged={bumpRefresh} />,
    <FinanceExpensesTab refreshKey={refreshKey} onChanged={bumpRefresh} />,
    <FinanceReportsTab refreshKey={refreshKey} />,
    <FinanceAuditTab refreshKey={refreshKey} />,
  ];
  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" className="mt-[40px]" pb={10}>
      <Box bgGradient={heroGradient} color={heroText} py={{ base: 6, md: 8 }} px={4} shadow="lg">
        <Container maxW="1600px">
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={4}
          >
            <HStack spacing={4} align="start">
              <Flex
                w={12}
                h={12}
                borderRadius="xl"
                bg="whiteAlpha.300"
                border="1px solid"
                borderColor="whiteAlpha.400"
                align="center"
                justify="center"
              >
                <Icon as={MdAccountBalance} boxSize={6} />
              </Flex>
              <VStack align="start" spacing={1}>
                <Heading size={{ base: "md", md: "lg" }} fontWeight="extrabold">
                  الحسابات والمالية
                </Heading>
                <Text fontSize="sm" color={heroSubtext} maxW="xl" lineHeight="1.8">
                  إدارة إيرادات المنصة، اشتراكات المدرسين (دفع كامل/جزئي، ترقية، تجديد)، المصروفات،
                  الفواتير، والتقارير المالية — عبر <Text as="code" fontSize="xs">/api/finance</Text>
                </Text>
              </VStack>
            </HStack>
            <Tooltip label="تحديث البيانات" hasArrow>
              <IconButton
                aria-label="تحديث"
                icon={<MdRefresh />}
                variant="outline"
                borderColor="whiteAlpha.500"
                color={heroText}
                _hover={{ bg: "whiteAlpha.200" }}
                borderRadius="xl"
                onClick={bumpRefresh}
              />
            </Tooltip>
          </Flex>
        </Container>
      </Box>

      <Container maxW="1600px" px={{ base: 3, md: 6 }} mt={6}>
        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          bg={panelBg}
          borderWidth="1px"
          borderColor={panelBorder}
          borderRadius="2xl"
          shadow="lg"
          overflow="hidden"
        >
          <Tabs
            index={tabIndex}
            onChange={setTabIndex}
            variant="unstyled"
            isLazy
            colorScheme="blue"
          >
            <TabList
              overflowX="auto"
              flexWrap="nowrap"
              bg={tabListBg}
              borderBottomWidth="1px"
              borderColor={panelBorder}
              px={2}
              py={2}
              gap={1}
              css={{
                "&::-webkit-scrollbar": { height: "6px" },
              }}
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.key}
                  whiteSpace="nowrap"
                  borderRadius="xl"
                  px={4}
                  py={2.5}
                  fontWeight="semibold"
                  fontSize="sm"
                  _selected={{
                    bg: tabSelectedBg,
                    color: "blue.500",
                    shadow: "sm",
                  }}
                  _dark={{
                    _selected: { color: "blue.300" },
                  }}
                >
                  <HStack spacing={2}>
                    <Icon as={tab.icon} boxSize={4} />
                    <Text display={{ base: "none", sm: "block" }}>{tab.label}</Text>
                  </HStack>
                </Tab>
              ))}
            </TabList>

            <TabPanels p={{ base: 4, md: 6 }}>
              {tabPanels.map((panel, index) => (
                <TabPanel key={TABS[index].key} px={0}>
                  {panel}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </MotionBox>
      </Container>
    </Box>
  );
}
