import React from "react";
import { Box, Heading, Text, Button, Icon, Flex } from "@chakra-ui/react";
import { FaBook, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const SupjectQuestion = () => {
  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)" position="relative">
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        backgroundImage="radial-gradient(circle at 25px 25px, white 2px, transparent 0), radial-gradient(circle at 75px 75px, white 2px, transparent 0)"
        backgroundSize="100px 100px"
      />
      
      <Flex minH="100vh" align="center" justify="center" position="relative" zIndex={1}>
        <Box
          textAlign="center"
          py={16}
          px={8}
          bg="rgba(255, 255, 255, 0.9)"
          backdropFilter="blur(20px)"
          borderRadius="25px"
          boxShadow="0 15px 35px rgba(0, 0, 0, 0.1)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          maxW="500px"
        >
          <Box
            w="100px"
            h="100px"
            bg="linear-gradient(135deg, rgba(49, 130, 206, 0.1) 0%, rgba(44, 90, 160, 0.1) 100%)"
            borderRadius="50%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={6}
          >
            <FaBook size={40} color="#3182ce" />
          </Box>
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, #3182ce, #2c5aa0)"
            bgClip="text"
            fontWeight="bold"
            mb={4}
          >
            صفحة قيد التطوير
          </Heading>
          <Text color="gray.600" fontSize="lg" mb={8}>
            هذه الصفحة قيد التطوير حالياً
          </Text>
          <Link to="/question-bank-dashboard">
            <Button
              bg="linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)"
              color="white"
              size="lg"
              borderRadius="15px"
              boxShadow="0 10px 30px rgba(49, 130, 206, 0.3)"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 15px 40px rgba(49, 130, 206, 0.4)",
              }}
              leftIcon={<FaArrowLeft />}
              px={8}
              py={6}
            >
              العودة لبنوك الأسئلة
            </Button>
          </Link>
        </Box>
      </Flex>
    </Box>
  );
};

export default SupjectQuestion;
