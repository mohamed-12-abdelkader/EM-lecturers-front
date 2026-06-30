import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Skeleton,
  Flex,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Button,
  Container,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FaChalkboardTeacher, FaBookOpen } from "react-icons/fa";
import { BiSearch } from "react-icons/bi";
import { MdCancelPresentation } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import useGitMyTeacher from "../../Hooks/student/useGitMyTeacher";
import useGitTeacherByToken from "../../Hooks/student/GitTeacherByToken";

const fuzzySearch = (query, text) => {
  if (!query || !text) return 0;
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = String(text).toLowerCase().trim();
  if (normalizedText === normalizedQuery) return 100;
  let score = 0;
  const queryWords = normalizedQuery.split(/\s+/);
  const textWords = normalizedText.split(/\s+/);
  queryWords.forEach((qWord) => {
    textWords.forEach((tWord) => {
      if (tWord.includes(qWord)) score += (qWord.length / tWord.length) * 50;
    });
  });
  let matchLength = 0;
  for (let i = 0; i < normalizedText.length && i < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[i]) matchLength++;
  }
  score += (matchLength / normalizedText.length) * 50;
  return Math.min(score, 100);
};

const MyTeacher = ({ embedded = false, onLoadingChange }) => {
  const [loading, teachers, error] = useGitMyTeacher();
  const [loadingAll, allTeachers] = useGitTeacherByToken();
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = loading || loadingAll;
  useEffect(() => {
    if (typeof onLoadingChange === "function") onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);

  const mainBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const searchBoxBg = useColorModeValue("white", "gray.800");
  const searchBoxBorder = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const emptyBg = useColorModeValue("gray.50", "gray.800");
  const emptyBorder = useColorModeValue("gray.200", "gray.600");
  const pillBg = useColorModeValue("blue.50", "blue.900");
  const pillColor = useColorModeValue("blue.600", "blue.200");
  const sectionBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("gray.200", "gray.700");
  const searchShadow = useColorModeValue("0 10px 40px rgba(0,0,0,0.08)", "0 10px 40px rgba(0,0,0,0.3)");
  const cardHoverShadow = useColorModeValue("0 24px 48px rgba(66, 153, 225, 0.15)", "0 24px 48px rgba(0,0,0,0.45)");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSearchClicked(false);
  };

  const handleSearchClick = () => {
    setSearchClicked(true);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let results = [];
    if (Array.isArray(allTeachers)) {
      results = allTeachers.filter(
        (t) => t.name?.trim().toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (results.length === 0) {
        results = allTeachers
          .map((teacher) => ({
            teacher,
            score: fuzzySearch(searchQuery, teacher.name),
          }))
          .filter((item) => item.score > 20)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.teacher);
      }
    }
    setSearchResults(results);
  };

  const displayList = searchClicked ? searchResults : teachers?.teachers ?? [];
  const isSearchMode = searchClicked;
  const hasResults = displayList.length > 0;

  const getInitials = (name) => {
    if (!name) return "؟";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return name.slice(0, 2);
  };

  const renderTeacherCard = (teacher, index = 0) => (
    <motion.div
      key={teacher.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
    >
      <Link to={`/teacher/${teacher.id}`} style={{ display: "block", height: "100%" }}>
        <Box
          as="article"
          bg={cardBg}
          borderRadius="2xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor={cardBorder}
          boxShadow="md"
          h="100%"
          display="flex"
          flexDirection="column"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            transform: "translateY(-8px) scale(1.02)",
            boxShadow: cardHoverShadow,
            borderColor: "blue.400",
          }}
        >
          {/* صورة المحاضر أو الحروف الأولى */}
          <Box
            position="relative"
            h="168px"
            bgGradient="linear(135deg, blue.500 0%, blue.600 50%, blue.700 100%)"
            overflow="hidden"
          >
            {teacher.avatar ? (
              <Box
                as="img"
                src={teacher.avatar}
                alt=""
                w="100%"
                h="100%"
                objectFit="cover"
                opacity={0.92}
              />
            ) : (
              <Flex
                position="absolute"
                inset="0"
                align="center"
                justify="center"
                fontSize="4xl"
                fontWeight="bold"
                color="whiteAlpha.900"
                letterSpacing="0.05em"
              >
                {getInitials(teacher.name)}
              </Flex>
            )}
            <Box
              position="absolute"
              inset="0"
              bgGradient="linear(to-t, blackAlpha.800 0%, transparent 40%)"
            />
            <Box
              position="absolute"
              bottom="3"
              right="3"
              px="3"
              py="1"
              borderRadius="full"
              bg="blackAlpha.600"
              backdropFilter="blur(10px)"
            >
              <Text fontSize="xs" fontWeight="bold" color="white">
                {teacher.subject || "معلم متميز"}
              </Text>
            </Box>
          </Box>

          <VStack
            flex="1"
            align="stretch"
            p="5"
            pt="5"
            spacing="4"
            justify="space-between"
          >
            <VStack align="stretch" spacing="2">
              <HStack justify="space-between" align="flex-start">
                <Avatar
                  size="lg"
                  src={teacher.avatar}
                  name={teacher.name}
                  borderWidth="3px"
                  borderColor={cardBg}
                  boxShadow="lg"
                  mt="-12"
                  position="relative"
                  zIndex="1"
                  bg="blue.500"
                  color="white"
                />
                <Box
                  w="3.5"
                  h="3.5"
                  borderRadius="full"
                  bg="green.400"
                  borderWidth="2px"
                  borderColor={cardBg}
                  flexShrink={0}
                  mt="0"
                  boxShadow="sm"
                />
              </HStack>
              <Heading
                as="h3"
                size="md"
                color={headingColor}
                noOfLines={2}
                fontWeight="bold"
                lineHeight="tight"
              >
                {teacher.name}
              </Heading>
            </VStack>

            <Button
              as="span"
              w="full"
              bg="orange.500"
              color="white"
              size="md"
              borderRadius="xl"
              rightIcon={<Icon as={FaBookOpen} boxSize="4" />}
              _hover={{ bg: "orange.400" }}
              fontWeight="bold"
              fontSize="md"
              py={3}
              transition="all 0.2s"
            >
              عرض الكورسات
            </Button>
          </VStack>
        </Box>
      </Link>
    </motion.div>
  );

  if (loading) {
    return (
      <Box w="100%" py={embedded ? 0 : 8} bg={embedded ? "transparent" : mainBg} minH={embedded ? "200px" : "100vh"}>
        {!embedded && <Container maxW="container.xl" px={4}><Skeleton height="140px" borderRadius="2xl" mb={8} /></Container>}
        <Box px={embedded ? 0 : 4}>
          <Skeleton height="64px" borderRadius="xl" mb={8} maxW="560px" display={embedded ? "none" : "block"} />
          <Skeleton height={embedded ? "80px" : "64px"} borderRadius="xl" mb={6} />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 3, md: 4 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="340px" borderRadius="2xl" />
            ))}
          </SimpleGrid>
        </Box>
      </Box>
    );
  }

  const sectionHeader = (
    <Flex
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      gap={4}
      mb={6}
      p={5}
      borderRadius="2xl"
      bg={sectionBg}
      borderWidth="1px"
      borderColor={sectionBorder}
      boxShadow="sm"
    >
      <HStack spacing={4} flexWrap="wrap">
        <Flex
          w="12"
          h="12"
          borderRadius="xl"
          bg="blue.500"
          color="white"
          align="center"
          justify="center"
          boxShadow="md"
        >
          <Icon as={FaChalkboardTeacher} boxSize={6} />
        </Flex>
        <VStack align="flex-start" spacing={0}>
          <Heading size="md" color={headingColor} fontWeight="bold">
            محاضروك والبحث عن محاضر
          </Heading>
          <Text fontSize="sm" color={subtextColor}>
            ابحث بالاسم أو تصفح محاضريك المفضلين
          </Text>
        </VStack>
      </HStack>
    </Flex>
  );

  const searchBar = (
    <Box
      bg={searchBoxBg}
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      boxShadow={searchShadow}
      borderWidth="1px"
      borderColor={searchBoxBorder}
      mb={6}
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        gap={3}
        align={{ base: "stretch", sm: "center" }}
      >
        <InputGroup size="lg" flex="1">
          <InputLeftElement height="52px" pointerEvents="none">
            <Icon as={BiSearch} color="gray.400" boxSize={5} />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="ابحث باسم المحاضر..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            borderRadius="xl"
            height="52px"
            pl="48px"
            pr={searchQuery.trim() ? "44px" : "4"}
            bg={inputBg}
            borderWidth="2px"
            borderColor={searchBoxBorder}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.2)",
            }}
          />
          {searchQuery.trim() && (
            <InputRightElement height="52px">
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                borderRadius="full"
                p={0}
                minW="8"
                h="8"
                onClick={() => {
                  setSearchQuery("");
                  setSearchClicked(false);
                }}
                aria-label="مسح البحث"
              >
                <Icon as={IoClose} boxSize={5} />
              </Button>
            </InputRightElement>
          )}
        </InputGroup>
        <Button
          onClick={handleSearchClick}
          bg="orange.500"
          color="white"
          px={8}
          h="52px"
          borderRadius="xl"
          leftIcon={<Icon as={BiSearch} />}
          _hover={{ bg: "orange.400" }}
          _active={{ transform: "scale(0.98)" }}
          fontWeight="bold"
          fontSize="md"
          transition="all 0.2s"
        >
          بحث
        </Button>
      </Flex>
      <Text fontSize="xs" color={subtextColor} mt={2}>
        مثال: أحمد محمد
      </Text>
    </Box>
  );

  const sectionTitleRow = (
    <Flex
      justify="space-between"
      align="center"
      mt={6}
      mb={6}
      flexWrap="wrap"
      gap={3}
    >
      <HStack spacing={3} flexWrap="wrap">
        <Heading size="md" color={headingColor} fontWeight="bold">
          {isSearchMode
            ? hasResults
              ? "نتائج البحث"
              : "نتائج البحث"
            : "محاضروك المفضلون"}
        </Heading>
        {hasResults && (
          <Box
            px="3"
            py="1"
            borderRadius="full"
            bg={pillBg}
            color={pillColor}
            fontSize="sm"
            fontWeight="bold"
          >
            {displayList.length} محاضر
          </Box>
        )}
      </HStack>
      {isSearchMode && (
        <Button
          variant="outline"
          size="sm"
          colorScheme="blue"
          borderRadius="xl"
          onClick={() => {
            setSearchClicked(false);
            setSearchQuery("");
          }}
        >
          عرض محاضري
        </Button>
      )}
    </Flex>
  );

  const contentBlock = (
    <AnimatePresence mode="wait">
      {hasResults ? (
        <motion.div
          key="grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={{ base: 3, md: 4 }}
          >
            {displayList.map((teacher, index) =>
              renderTeacherCard(teacher, index)
            )}
          </SimpleGrid>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="340px"
            bg={emptyBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={emptyBorder}
            borderStyle="dashed"
            textAlign="center"
            p={10}
          >
            <Box
              w="24"
              h="24"
              borderRadius="2xl"
              bg={isSearchMode ? "red.50" : "blue.50"}
              _dark={{ bg: isSearchMode ? "red.900" : "blue.900" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={6}
            >
              <Icon
                as={isSearchMode ? MdCancelPresentation : FaChalkboardTeacher}
                boxSize="12"
                color={isSearchMode ? "red.400" : "blue.500"}
              />
            </Box>
            <Heading size="md" color={headingColor} mb={2}>
              {isSearchMode ? "لا توجد نتائج" : "لا يوجد اشتراكات بعد"}
            </Heading>
            <Text color={subtextColor} maxW="sm" fontSize="sm" lineHeight="tall" mb={4}>
              {isSearchMode
                ? "لم نعثر على محاضر بهذا الاسم. جرّب كلمة أخرى أو اعرض قائمة محاضريك."
                : "لم تشترك مع أي محاضر بعد. استخدم البحث أعلاه للعثور على محاضر والاشتراك معه."}
            </Text>
            {!isSearchMode && (
              <Box
                p={4}
                borderRadius="xl"
                bg={pillBg}
                color={pillColor}
                fontSize="xs"
                maxW="xs"
              >
                💡 اكتب اسم المحاضر في مربع البحث ثم اضغط "بحث" للعثور عليه والاشتراك في كورساته.
              </Box>
            )}
            {isSearchMode && (
              <Button
                mt={2}
                variant="outline"
                colorScheme="blue"
                size="md"
                borderRadius="xl"
                onClick={() => {
                  setSearchClicked(false);
                  setSearchQuery("");
                }}
              >
                عرض محاضري
              </Button>
            )}
          </Flex>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (embedded) {
    return (
      <Box w="100%">
        {sectionHeader}
        {searchBar}
        {sectionTitleRow}
        {contentBlock}
      </Box>
    );
  }

  return (
    <Box
      w="100%"
      minH="100vh"
      bg={mainBg}
      dir="rtl"
      pb={20}
      style={{ fontFamily: "'Changa', sans-serif" }}
    >
      <Box
        bgGradient="linear(135deg, blue.500 0%, blue.600 50%, blue.700 100%)"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset="0"
          opacity={0.08}
          bgImage="radial-gradient(circle at 20% 80%, white 1px, transparent 1px)"
          bgSize="24px 24px"
        />
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          h="24px"
          bg={mainBg}
          borderRadius="2xl 2xl 0 0"
        />
        <Container maxW="container.xl" px={4} py={12} position="relative" zIndex="1">
          <VStack spacing={4} align="flex-start" textAlign="right">
            <HStack spacing={4}>
              <Flex
                w="16"
                h="16"
                borderRadius="2xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
                borderWidth="1px"
                borderColor="whiteAlpha.300"
              >
                <Icon as={FaChalkboardTeacher} boxSize={8} color="white" />
              </Flex>
              <VStack align="flex-start" spacing={1}>
                <Heading size="xl" color="white" fontWeight="bold">
                  محاضروك والبحث عن محاضر
                </Heading>
                <Text color="whiteAlpha.900" fontSize="md">
                  ابحث بالاسم أو تصفح محاضريك المفضلين
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Container>
      </Box>
      <Container maxW="container.xl" px={4}>
        <Box mt="-6" position="relative" zIndex="2">
          {searchBar}
        </Box>
        {sectionTitleRow}
        {contentBlock}
      </Container>
    </Box>
  );
};

export default MyTeacher;
