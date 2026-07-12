import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Badge,
  Icon,
  NumberInput,
  NumberInputField,
} from "@chakra-ui/react";
import { FaBuilding, FaPlus, FaArrowLeft } from "react-icons/fa";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import {
  useCenters,
  useCenterMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { ACCENT, field, formatMoney } from "./centerMgmtUtils";
import { EmptyState, PageHeader, Surface } from "./components/UiBits";

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  defaultFee: 300,
  currency: "EGP",
};

export default function CentersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: centers = [], isLoading, isError, error, refetch } = useCenters();
  const { createCenter } = useCenterMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState(emptyForm);

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "اسم السنتر مطلوب", status: "warning", duration: 2500 });
      return;
    }
    try {
      const center = await createCenter.mutateAsync({
        name: form.name.trim(),
        phone: form.phone || undefined,
        address: form.address || undefined,
        defaultFee: Number(form.defaultFee) || 0,
        currency: form.currency || "EGP",
      });
      toast({ title: "تم إنشاء السنتر بنجاح", status: "success", duration: 2500 });
      setForm(emptyForm);
      onClose();
      if (center?.id) {
        navigate(`/center-mgmt/${center.id}`);
      }
    } catch (err) {
      toast({ title: apiErrorMessage(err, "فشل إنشاء السنتر"), status: "error", duration: 3500 });
    }
  };

  if (isLoading) return <BrandLoadingScreen />;

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" py={{ base: 6, md: 10 }}>
      <Container maxW="6xl">
        <PageHeader
          title="إدارة السنتر"
          description="نظام مستقل للطلاب · الحضور · الاشتراكات · الماليات"
          actions={
            <Button
              leftIcon={<FaPlus />}
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#004494" }}
              borderRadius="xl"
              onClick={onOpen}
            >
              سنتر جديد
            </Button>
          }
        />

        {isError ? (
          <Surface>
            <Text color="red.500" mb={3}>
              {apiErrorMessage(error, "تعذر تحميل السناتر")}
            </Text>
            <Button onClick={() => refetch()} colorScheme="blue" size="sm">
              إعادة المحاولة
            </Button>
          </Surface>
        ) : centers.length === 0 ? (
          <EmptyState
            icon={FaBuilding}
            title="لا يوجد سنتر بعد"
            description="أنشئ سنترك الأول لتبدأ بإضافة الصفوف والمجموعات والطلاب."
            action={
              <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={onOpen}>
                إنشاء سنتر
              </Button>
            }
          />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {centers.map((center) => {
              const id = center.id;
              const name = field(center, "name");
              const phone = field(center, "phone");
              const fee = field(center, "default_fee", "defaultFee");
              const currency = field(center, "currency") || "EGP";
              return (
                <Box
                  key={id}
                  as={RouterLink}
                  to={`/center-mgmt/${id}`}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={border}
                  borderRadius="2xl"
                  p={5}
                  transition="all 0.2s"
                  _hover={{ borderColor: "blue.300", transform: "translateY(-3px)", shadow: "md" }}
                  textDecoration="none"
                >
                  <Flex justify="space-between" align="flex-start" mb={4}>
                    <Flex
                      w={12}
                      h={12}
                      borderRadius="xl"
                      bg="blue.50"
                      align="center"
                      justify="center"
                    >
                      <Icon as={FaBuilding} color={ACCENT} boxSize={5} />
                    </Flex>
                    <Badge colorScheme={center.is_active === false ? "red" : "green"} borderRadius="md">
                      {center.is_active === false ? "غير نشط" : "نشط"}
                    </Badge>
                  </Flex>
                  <Heading size="md" color={titleColor} mb={2} noOfLines={1}>
                    {name}
                  </Heading>
                  <VStack align="stretch" spacing={1} color="gray.500" fontSize="sm">
                    <Text>{phone || "بدون هاتف"}</Text>
                    <Text>الرسوم الافتراضية: {formatMoney(fee, currency)}</Text>
                  </VStack>
                  <Flex mt={4} color={ACCENT} fontSize="sm" fontWeight="bold" align="center" gap={2}>
                    فتح السنتر
                    <Icon as={FaArrowLeft} boxSize={3} />
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3}>
          <ModalHeader>إنشاء سنتر جديد</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم السنتر</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="سنتر النور"
                  borderRadius="xl"
                />
              </FormControl>
              <FormControl>
                <FormLabel>الهاتف</FormLabel>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="01000000000"
                  borderRadius="xl"
                />
              </FormControl>
              <FormControl>
                <FormLabel>العنوان</FormLabel>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <FormControl>
                <FormLabel>الرسوم الافتراضية</FormLabel>
                <NumberInput
                  min={0}
                  value={form.defaultFee}
                  onChange={(_, n) => setForm((f) => ({ ...f, defaultFee: Number.isNaN(n) ? 0 : n }))}
                >
                  <NumberInputField borderRadius="xl" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>العملة</FormLabel>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreate}
              isLoading={createCenter.isPending}
              borderRadius="xl"
            >
              إنشاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
