import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Flex,
  useColorModeValue,
  Button,
  Icon,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  FiCheck,
  FiX,
  FiStar,
  FiAward,
  FiZap,
  FiCreditCard,
} from "react-icons/fi";

const PricingSection = () => {
  const Feature = ({ children, included }) => (
    <Flex align="center">
      <Icon
        as={included ? FiCheck : FiX}
        color={included ? "green.500" : "red.500"}
        mr={2}
      />
      <Text>{children}</Text>
    </Flex>
  );

  const PricingCard = ({ title, price, features, popular, icon }) => {
    const bgColor = useColorModeValue("white", "gray.800");
    const popularBgColor = useColorModeValue("purple.50", "purple.900");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    return (
      <Box
        bg={popular ? popularBgColor : bgColor}
        borderWidth={1}
        borderColor={popular ? "purple.500" : borderColor}
        borderRadius="lg"
        p={6}
        position="relative"
        boxShadow={popular ? "xl" : "md"}
      >
        {popular && (
          <Box
            position="absolute"
            top={-3}
            left="50%"
            transform="translateX(-50%)"
            bg="purple.500"
            color="white"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
            fontWeight="bold"
          >
            <Flex align="center">
              <Icon as={FiStar} mr={1} />
              الأكثر شيوعًا
            </Flex>
          </Box>
        )}
        <Flex direction="column" h="100%">
          <Box mb={6}>
            <Flex align="center" mb={2}>
              <Icon as={icon} fontSize="2xl" mr={2} color="purple.500" />
              <Heading fontSize="2xl" fontWeight="bold">
                {title}
              </Heading>
            </Flex>
            <Text fontSize="4xl" fontWeight="bold" mb={2}>
              {price}
              <Text as="span" fontSize="lg" color="gray.500">
                /شهريًا
              </Text>
            </Text>
           
          </Box>

          <Stack spacing={3} mb={8} flexGrow={1}>
            {features.map((feature, index) => (
              <Feature
                key={index}
                included={feature.included}
                children={feature.text}
              />
            ))}
          </Stack>

          
        </Flex>
      </Box>
    );
  };

  const plans = [
    {
      title: "الأساسية",
      price: "1000 ج.م",
      icon: FiCreditCard,
      features: [
        { text: "  عدد الطلاب : 50 طالب ", included: true },
        { text: "دعم فني 24/7", included: true },
        { text: " خطة تسويقية ", included: true },
        { text: "  سيستم ادارة السنتر  ", included: true },
        { text: "    ادارة السوشيال ميديا   ", included: false },
      
      ],
    },
    {
      title: "البرونزية ",
      price: "1500 ج.م",
      icon: FiAward,
      popular: true,
      features: [
        { text: "  عدد الطلاب : 100 طالب ", included: true },
        { text: "دعم فني 24/7", included: true },
        { text: " خطة تسويقية ", included: true },
        { text: "  سيستم ادارة السنتر  ", included: true },
        { text: "    ادارة السوشيال ميديا   ", included: true },
      
      ],
    },
    {
      title: "الفضية ",
      price: "2500 ج.م",
      icon: FiZap,
      features: [
        { text: "  عدد الطلاب : 250 طالب ", included: true },
        { text: "دعم فني 24/7", included: true },
        { text: " خطة تسويقية ", included: true },
        { text: "  سيستم ادارة السنتر  ", included: true },
        { text: "    ادارة السوشيال ميديا   ", included: true },
      
      ],
    },
    {
      title: "الذهبية ",
      price: "3000 ج.م",
      icon: FiZap,
     features: [
        { text: "  عدد الطلاب : 350 طالب ", included: true },
        { text: "دعم فني 24/7", included: true },
        { text: " خطة تسويقية ", included: true },
        { text: "  سيستم ادارة السنتر  ", included: true },
        { text: "    ادارة السوشيال ميديا   ", included: true },
      
      ],
    },
    {
      title: "الماسية ",
      price: "4000 ج.م",
      icon: FiZap,
   features: [
        { text: "  عدد الطلاب : 600 طالب ", included: true },
        { text: "دعم فني 24/7", included: true },
        { text: " خطة تسويقية ", included: true },
        { text: "  سيستم ادارة السنتر  ", included: true },
        { text: "    ادارة السوشيال ميديا   ", included: true },
      
      ],
    },
    {
      title: "الخاصة ",
      price: "5000 ج.م",
      icon: FiZap,
      features: [
        { text: "  عدد الطلاب :  عدد غير محدود  ", included: true },
        { text: "دعم فني 24/7", included: true },
        { text: " خطة تسويقية ", included: true },
        { text: "  سيستم ادارة السنتر  ", included: true },
        { text: "    ادارة السوشيال ميديا   ", included: true },
      
      ],
    },
  ];

  return (
    <Box py={12} bg={useColorModeValue("gray.50", "gray.900")}>
      <Container maxW="container.lg">
        <Box textAlign="center" mb={10}>
          <Heading as="h2" size="xl" mb={4}>
            خطط الأسعار
          </Heading>
          <Text fontSize="lg" color="gray.500" maxW="2xl" mx="auto">
            اختر الخطة التي تناسب احتياجاتك وابدأ رحلتك مع منصتنا اليوم
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default PricingSection;