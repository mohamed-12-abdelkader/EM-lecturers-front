import React, { useMemo } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiUser, FiLogIn, FiBookOpen } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getCurrentTenant } from "../../utils/tenantHost";
import {
  fetchTenantPublic,
  readCachedTenantPublic,
} from "../../api/tenantPublicApi";
import { getPostLoginPath } from "../../utils/authRoles";
import { Navigate } from "react-router-dom";

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const tenant = getCurrentTenant();

  const cached = useMemo(
    () => (tenant ? readCachedTenantPublic(tenant) : undefined),
    [tenant],
  );

  const { data: tenantPayload, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant-welcome", tenant],
    queryFn: () => fetchTenantPublic(tenant),
    enabled: Boolean(tenant),
    staleTime: 5 * 60_000,
    initialData: cached,
  });

  const tenantData = tenantPayload?.data ?? tenantPayload ?? null;
  const teacherName =
    tenantData?.teacher?.name ||
    tenantData?.teacher_name ||
    tenantData?.display_name ||
    (tenant ? tenant.replace(/-/g, " ") : "المدرس");

  const pageBg = useColorModeValue(
    "linear(to-br, blue.50, white)",
    "linear(to-br, gray.900, gray.800)",
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const hintBg = useColorModeValue("blue.50", "blue.900");
  const hintBorder = useColorModeValue("blue.200", "blue.800");
  const hintText = useColorModeValue("blue.700", "blue.200");
  const bottomColor = useColorModeValue("gray.600", "gray.500");
  const cardShadow = useColorModeValue(
    "0 0 0 1px rgba(0,0,0,0.04), 0 12px 24px -8px rgba(0,0,0,0.12), 0 24px 48px -16px rgba(0,0,0,0.08)",
    "0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px -16px rgba(0,0,0,0.45)",
  );

  if (isAuthLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" color="blue.500" thickness="3px" />
      </Center>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getPostLoginPath()} replace />;
  }

  return (
    <Box
      className="mt-[100px]"
      minH="100vh"
      bgGradient={pageBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      position="relative"
      overflow="hidden"
      dir="rtl"
      style={{ fontFamily: "'Changa', sans-serif" }}
    >
      <MotionBox
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        maxW="520px"
        w="full"
        textAlign="center"
        position="relative"
        zIndex="1"
      >
        <MotionBox
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          bg={cardBg}
          borderRadius="2xl"
          p={{ base: 8, md: 10 }}
          boxShadow={cardShadow}
          borderWidth="1px"
          borderColor={cardBorder}
        >
          <VStack spacing={8} align="center">
            <Box
              w="20"
              h="20"
              bg="blue.500"
              borderRadius="2xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 12px 28px rgba(66, 153, 225, 0.35)"
            >
              <Icon as={FiBookOpen} w="10" h="10" color="white" />
            </Box>

            <VStack spacing={3}>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color={headingColor}>
                أهلًا بك 👋
              </Text>
              {tenantLoading && !tenantData ? (
                <Spinner size="sm" color="blue.400" />
              ) : (
                <Text fontSize={{ base: "md", md: "lg" }} color={subtextColor} maxW="400px" lineHeight="1.7">
                  هل لديك حساب بالفعل على منصة الأستاذ{" "}
                  <Text as="span" fontWeight="bold" color={headingColor}>
                    {teacherName}
                  </Text>
                  ؟
                </Text>
              )}
            </VStack>

            <VStack spacing={4} w="full" maxW="400px">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                size="lg"
                w="full"
                h="56px"
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.400" }}
                borderRadius="xl"
                fontSize="lg"
                fontWeight="bold"
                leftIcon={<Icon as={FiLogIn} />}
                onClick={() => navigate("/login")}
              >
                تسجيل الدخول
              </MotionButton>

              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                size="lg"
                w="full"
                h="56px"
                bg="orange.500"
                color="white"
                _hover={{ bg: "orange.400" }}
                borderRadius="xl"
                fontSize="lg"
                fontWeight="bold"
                leftIcon={<Icon as={FiUser} />}
                onClick={() => navigate("/signup")}
              >
                إنشاء حساب جديد
              </MotionButton>
            </VStack>

            <Box bg={hintBg} borderRadius="xl" p={4} borderWidth="1px" borderColor={hintBorder} w="full">
              <VStack spacing={2} fontSize="sm" color={hintText}>
                <Text textAlign="center">
                  إذا كنت سجلت من قبل على هذه المنصة، اختر تسجيل الدخول.
                </Text>
                <Text textAlign="center">
                  إذا كانت هذه أول مرة تستخدم فيها المنصة، اختر إنشاء حساب جديد.
                </Text>
              </VStack>
            </Box>

            <Text fontSize="sm" color={bottomColor}>
              كل منصة مدرس مستقلة — حسابك هنا لا يُشارك مع منصات أخرى.
            </Text>
          </VStack>
        </MotionBox>
      </MotionBox>
    </Box>
  );
};

export default WelcomePage;
