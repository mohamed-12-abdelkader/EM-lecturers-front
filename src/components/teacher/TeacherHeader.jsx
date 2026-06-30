import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  Icon,
  Avatar,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiUserCheck, FiStar } from 'react-icons/fi'; // أيقونات إضافية

// Motion components
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionIcon = motion(Icon);

const TeacherHeader = ({ subject, name, teacherAvatar }) => {
  // استخدام useColorModeValue للألوان المتكيفة مع الثيم
  const gradientStart = useColorModeValue("blue.400", "blue.600");
  const gradientEnd = useColorModeValue("purple.600", "purple.800");
  const textColor = useColorModeValue("white", "gray.100");
  const subTextColor = useColorModeValue("blue.50", "purple.100");
  const highlightColor = useColorModeValue("yellow.300", "cyan.300"); // لون للتمييز

  // Variants for Framer Motion animations
  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.7, ease: "easeOut" } },
  };

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { delay: 0.6, duration: 0.6, ease: "easeOut" } },
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1, transition: { delay: 0.8, duration: 0.6, ease: "spring", stiffness: 120 } },
  };

  // Staggered animation for stars
  const starContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const starItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeOut",
        delay: Math.random() * 0.5, // Random delay for twinkling effect
      },
    },
  };

  return (
    <MotionBox
      className='teacher-header-new' // يمكنك استخدام هذا الكلاس لـ CSS إضافي إذا أردت
      initial="hidden"
      animate="visible"
      variants={headerVariants}
      minH={{ base: "250px", md: "300px" }} // ارتفاع أكبر
      w="100%"
      mb={8} // مسافة أكبر بعد الهيدر
      bgGradient={`linear(to-br, ${gradientStart}, ${gradientEnd})`}
      position="relative"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      p={{ base: 4, md: 8 }}
      boxShadow="dark-lg" // ظل أعمق
    >
      {/* Background shapes/particles for dynamic feel */}
      <MotionBox
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        bg="rgba(255,255,255,0.05)"
        clipPath="polygon(0 0, 100% 0, 100% 80%, 0% 100%)"
        initial={{ scale: 1.2, rotate: 10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <MotionBox
        position="absolute"
        bottom="0"
        right="0"
        w="80%"
        h="80%"
        bg="rgba(0,0,0,0.05)"
        clipPath="polygon(100% 0, 0 100%, 100% 100%)"
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
      />

      {/* Twinkling stars effect */}
      <MotionBox
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        variants={starContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(15)].map((_, i) => ( // 15 نجمة متلألئة
          <MotionIcon
            key={i}
            as={FiStar}
            position="absolute"
            left={`${Math.random() * 90 + 5}%`}
            top={`${Math.random() * 90 + 5}%`}
            fontSize={`${Math.random() * 10 + 8}px`} // حجم عشوائي للنجوم
            color={highlightColor}
            opacity={0.7}
            variants={starItemVariants}
          />
        ))}
      </MotionBox>

      {/* Content */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
        zIndex="1" // لجعل المحتوى فوق الأشكال الخلفية
        p={{ base: 4, md: 0 }}
      >
        <MotionBox variants={avatarVariants} mb={4}>
          <Avatar
            size={{ base: "xl", md: "2xl" }}
            name={name}
            src={teacherAvatar || "https://via.placeholder.com/150"} // صورة افتراضية إذا لم توجد
            border="4px solid"
            borderColor={highlightColor}
            boxShadow="xl"
            transition="all 0.3s ease-in-out"
            _hover={{
              borderColor: textColor,
              transform: "scale(1.05)",
            }}
          />
        </MotionBox>

        <MotionHeading
          as="h1"
          size={{ base: "xl", md: "2xl", lg: "3xl" }}
          color={textColor}
          mb={2}
          fontWeight="extrabold"
          textShadow="2px 2px 4px rgba(0,0,0,0.3)"
          variants={titleVariants}
        >
          <Icon as={FiBookOpen} mr={3} color={highlightColor} />
          منهج <Text as="span" color={highlightColor}>{subject}</Text>
        </MotionHeading>

        <MotionText
          fontSize={{ base: "lg", md: "xl" }}
          color={subTextColor}
          maxWidth="600px"
          variants={textVariants}
        >
          مع الأستاذ <Text as="span" fontWeight="bold" color={highlightColor}>{name}</Text>
          <Icon as={FiUserCheck} ml={2} />
        </MotionText>
      </Flex>
    </MotionBox>
  );
};

export default TeacherHeader;