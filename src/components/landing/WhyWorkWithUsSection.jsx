import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Icon,
  useColorModeValue,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaRegLightbulb,
  FaRocket,
  FaUsers,
  FaHourglassEnd,
  FaLaptopCode,
  FaHandshake,
  FaChartLine,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaVideo,
  FaMoneyBill,
  FaComments,
} from "react-icons/fa";

const MotionBox = motion(Box);

const benefitsData = [
  {
    icon: FaChalkboardTeacher,
    title: "إدارة شاملة للدورات والطلاب",
    description:
      "إنشاء الدورات، تنظيم الجداول، وإدارة التسجيلات والطلاب بسهولة.",
  },
  {
    icon: FaVideo,
    title: "بث مباشر وتسجيل تلقائي",
    description:
      "بث المحاضرات بجودة عالية مع حفظ التسجيلات وإتاحتها للطلاب فورًا.",
  },
  {
    icon: FaLaptopCode,
    title: "اختبارات وبنوك أسئلة",
    description:
      "إنشاء امتحانات فرعية وشاملة، تصحيح تلقائي، وتقارير تفصيلية للنتائج.",
  },
  {
    icon: FaMoneyBill,
    title: "لوحة أرباح ودفعات مرنة",
    description:
      "متابعة الإيرادات لحظيًا وسحب الأرباح بطرق دفع متعددة وآمنة.",
  },
  {
    icon: FaComments,
    title: "تواصل وإشعارات ذكية",
    description:
      "قنوات محادثة، تنبيهات للطلاب، ورسائل موجهة لتعزيز التفاعل.",
  },
  {
    icon: FaHandshake,
    title: "دعم فني وتسويق للدورات",
    description:
      "فريق دعم مخصص وخطط ترويجية لزيادة الوصول إلى طلاب أكثر.",
  },
  {
    icon: FaCalendarAlt,
    title: "جدولة ذكية وحجز المقاعد",
    description:
      "تقويم مرن، تحديد سعة المجموعات، وتذكيرات تلقائية للطلاب.",
  },
  {
    icon: FaChartLine,
    title: "تحليلات متقدمة للأداء",
    description:
      "لوحات معلومات تبرز أداء الدورات والطلاب لتحديد نقاط التحسين.",
  },
];

const WhyWorkWithUsSection = () => {
  const sectionBg = useColorModeValue("blue.50", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("blue.800", "blue.100");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blue.200", "gray.600");
  const iconBg = useColorModeValue("blue.100", "blue.900");
  const iconColor = useColorModeValue("blue.600", "blue.300");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <VStack
      spacing={14}
      align="center"
      py={20}
      px={{ base: 6, md: 12 }}
      bg={sectionBg}
      dir="rtl"
      fontFamily="'Changa', sans-serif"
    >
      <MotionBox
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        textAlign="center"
      >
        <Heading
          as="h2"
          size={{ base: "xl", md: "2xl", lg: "3xl" }}
          fontWeight="extrabold"
          color={headingColor}
          mb={4}
        >
          خدماتنا للمدرسين
        </Heading>
        <Text
          fontSize={{ base: "lg", md: "xl" }}
          color={textColor}
          maxW="3xl"
          mx="auto"
        >
          نوفر منظومة متكاملة لبناء وإدارة أعمالك التعليمية عبر الإنترنت، من
          إنشاء الدورات والبث المباشر إلى الاختبارات والأرباح والتسويق.
        </Text>
      </MotionBox>

      <MotionBox
        as={SimpleGrid}
        columns={{ base: 1, sm: 2, lg: 4 }}
        spacing={8}
        width="full"
        maxW="7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {benefitsData.map((benefit, index) => (
          <MotionBox
            key={index}
            variants={itemVariants}
            p={6}
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="lg"
            border="1px solid"
            borderColor={borderColor}
            textAlign="center"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            _hover={{
              transform: "translateY(-10px) scale(1.03)",
              boxShadow: "2xl",
            }}
            transition="all 0.3s ease-in-out"
          >
            <Box
              w={16}
              h={16}
              borderRadius="full"
              bg={iconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={4}
              transition="all 0.3s ease"
              _groupHover={{ bg: iconColor, color: "white" }}
            >
              <Icon as={benefit.icon} w={8} h={8} color={iconColor} />
            </Box>
            <Heading size="md" fontWeight="bold" color={headingColor} mb={3}>
              {benefit.title}
            </Heading>
            <Text fontSize="md" color={subTextColor} lineHeight="taller">
              {benefit.description}
            </Text>
          </MotionBox>
        ))}
      </MotionBox>
    </VStack>
  );
};

export default WhyWorkWithUsSection;
