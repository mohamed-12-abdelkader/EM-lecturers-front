import { Box, Flex, Heading, Text, useColorModeValue, Icon } from "@chakra-ui/react";
import { FaHeadset, FaShieldAlt, FaRocket, FaUserShield } from "react-icons/fa";

const SectionFour = () => {
  const bgGradient = useColorModeValue(
    "linear(to-br, blue.50, purple.50)",
    "linear(to-br, gray.800, gray.900)"
  );
  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(26, 32, 44, 0.6)");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const descriptionColor = useColorModeValue("gray.600", "gray.400");

  const teacherServices = [
    {
      id: 1,
      title: "خدمة عملاء 24/7",
      description: "دعم فني متاح على مدار الساعة لضمان تجربة سلسة.",
      icon: FaHeadset,
      color: "blue.400",
    },
    {
      id: 2,
      title: "حماية المحتوى",
      description: "تقنيات أمان متقدمة لضمان حماية دروسك من النسخ غير المصرح به.",
      icon: FaShieldAlt,
      color: "green.400",
    },
    {
      id: 3,
      title: "أداء سريع ومستقر",
      description: "منصة مستقرة وسريعة لضمان تجربة تدريس سلسة دون انقطاعات.",
      icon: FaRocket,
      color: "purple.400",
    },
    {
      id: 4,
      title: "تحكم كامل بالمحتوى",
      description: "إدارة مرنة لدوراتك وإعدادات متقدمة لضبط المحتوى كما تريد.",
      icon: FaUserShield,
      color: "orange.400",
    },
  ];

  return (
    <Box w="full" py={20} px={6} bgGradient={bgGradient} textAlign="center">
      <Heading fontSize={{ base: "3xl", md: "4xl" }} fontWeight="bold" color={textColor} mb={4}>
        خدماتنا للمحاضرين 🎓
      </Heading>
      <Text fontSize="lg" color={descriptionColor} mb={10}>
        وفرنا لك أفضل الأدوات لحماية محتواك وضمان تجربة تدريس مثالية.
      </Text>

      <Flex wrap="wrap" justify="center" gap={8}>
        {teacherServices.map((service) => (
          <Box
            key={service.id}
            p={8}
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid rgba(255, 255, 255, 0.18)"
            borderRadius="2xl"
            boxShadow="0 4px 30px rgba(0, 0, 0, 0.1)"
            transition="transform 0.4s ease, box-shadow 0.4s ease"
            _hover={{
              transform: "translateY(-10px)",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.2)",
            }}
            w={{ base: "100%", sm: "45%", md: "22%" }}
          >
            <Flex justify="center" align="center" mb={6}>
              <Box
                bg={service.color}
                p={5}
                borderRadius="full"
                boxShadow="inset 0 0 10px rgba(0,0,0,0.1)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.4s"
                _hover={{ transform: "rotate(10deg) scale(1.1)" }}
              >
                <Icon as={service.icon} boxSize={10} color="white" />
              </Box>
            </Flex>
            <Heading fontSize="xl" fontWeight="bold" color={textColor} mb={3}>
              {service.title}
            </Heading>
            <Text fontSize="md" color={descriptionColor}>
              {service.description}
            </Text>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default SectionFour;
