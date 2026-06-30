import React from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiUser, FiLogIn, FiStar, FiUsers, FiBookOpen } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const WelcomePage = () => {
  const navigate = useNavigate();

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
    "0 0 0 1px rgba(255,255,255,0.08), 0 0 40px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1), 0 24px 48px -16px rgba(0,0,0,0.45), 0 12px 24px -8px rgba(0,0,0,0.35)"
  );

  const handleNewUser = () => navigate("/signup");
  const handleExistingUser = () => navigate("/login");

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
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        opacity={useColorModeValue(0.04, 0.06)}
        bgImage="url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%234299E1%22 fill-opacity=%22.4%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v4h-4v2h4v4h2v-4h4v-2h-4v-4h-2z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      />

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
          overflow="hidden"
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
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="bold"
                color={headingColor}
              >
                مرحباً بك في Next Edu
              </Text>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                color={subtextColor}
                maxW="400px"
                lineHeight="1.6"
              >
                إذا كان لديك حساب سجّل الدخول. إذا كنت جديداً أنشئ حساباً جديداً
                وابدأ رحلتك.
              </Text>
            </VStack>

            <VStack spacing={4} w="full" maxW="400px">
              <Text fontSize="xl" fontWeight="bold" color={headingColor}>
                هل لديك حساب من قبل؟
              </Text>

              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                size="lg"
                w="full"
                h="56px"
                bg="blue.500"
                color="white"
                _hover={{
                  bg: "blue.400",
                  boxShadow: "0 10px 25px rgba(66, 153, 225, 0.35)",
                }}
                borderRadius="xl"
                fontSize="lg"
                fontWeight="bold"
                leftIcon={<Icon as={FiLogIn} />}
                onClick={handleExistingUser}
                boxShadow="0 8px 20px rgba(66, 153, 225, 0.3)"
                transition="all 0.2s"
              >
                نعم، لدي حساب - تسجيل الدخول
              </MotionButton>

              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                size="lg"
                w="full"
                h="56px"
                bg="orange.500"
                color="white"
                _hover={{
                  bg: "orange.400",
                  boxShadow: "0 10px 25px rgba(237, 137, 54, 0.35)",
                }}
                borderRadius="xl"
                fontSize="lg"
                fontWeight="bold"
                leftIcon={<Icon as={FiUser} />}
                onClick={handleNewUser}
                boxShadow="0 8px 20px rgba(237, 137, 54, 0.3)"
                transition="all 0.2s"
              >
                لا، أنا جديد - إنشاء حساب
              </MotionButton>
            </VStack>

            <Box
              bg={hintBg}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={hintBorder}
              w="full"
            >
              <Text fontSize="sm" color={hintText} textAlign="center">
                💡 غير متأكد؟ جرّب "تسجيل الدخول" أولاً. إن لم يكن لديك حساب
                سنوجهك لإنشاء حساب جديد.
              </Text>
            </Box>

            <Text fontSize="sm" color={bottomColor}>
              انضم إلى آلاف الطلاب في Next Edu
            </Text>
          </VStack>
        </MotionBox>

        <HStack
          mt={8}
          spacing={6}
          justify="center"
          flexWrap="wrap"
          color={bottomColor}
          fontSize="sm"
        >
          <HStack spacing={2}>
            <Icon as={FiStar} w="4" h="4" color="yellow.500" />
            <span>تقييم 4.9/5</span>
          </HStack>
          <HStack spacing={2}>
            <Icon as={FiUsers} w="4" h="4" color="blue.500" />
            <span>+10,000 طالب</span>
          </HStack>
          <HStack spacing={2}>
            <Icon as={FiBookOpen} w="4" h="4" color="orange.500" />
            <span>+500 درس</span>
          </HStack>
        </HStack>
      </MotionBox>
    </Box>
  );
};

export default WelcomePage;
