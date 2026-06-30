import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Image,
  VStack,
  HStack,
  Progress,
  IconButton,
  Badge,
  useToast,
  ScaleFade, // لتأثير الظهور
  Checkbox, // للوضع الجديد للمدرس
  Spacer, // لضبط المساحات
  Divider,
  Icon, // للفصل بين الأسئلة في وضع المدرس
} from "@chakra-ui/react";
import { FaArrowRight, FaCheckCircle, FaTimesCircle, FaLightbulb, FaFilePdf, FaDownload } from "react-icons/fa";
import { motion } from "framer-motion";
import UserType from "../../Hooks/auth/userType"; // تأكد من المسار الصحيح لـ UserType Hook

// استيراد مكتبات PDF
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const MotionBox = motion(Box);
const MotionButton = motion(Button);

// بيانات افتراضية للأسئلة
const mockQuestions = [
  {
    id: 1,
    text: "ما هي عاصمة مصر؟",
    image: null,
    options: [
      { id: "a", text: "الرياض" },
      { id: "b", text: "القاهرة" },
      { id: "c", text: "دبي" },
      { id: "d", text: "بغداد" },
    ],
    correctAnswer: "b",
    explanation: "القاهرة هي عاصمة جمهورية مصر العربية وأكبر مدنها.",
  },
  {
    id: 2,
    text: "أي من هذه الكواكب هو الأكبر في المجموعة الشمسية؟",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg",
    options: [
      { id: "a", text: "المريخ" },
      { id: "b", text: "الأرض" },
      { id: "c", text: "المشتري" },
      { id: "d", text: "زحل" },
    ],
    correctAnswer: "c",
    explanation: "المشتري هو أكبر كوكب في المجموعة الشمسية من حيث الكتلة والحجم.",
  },
  {
    id: 3,
    text: "من هو مؤلف كتاب 'الأمير'؟",
    image: null,
    options: [
      { id: "a", text: "ويليام شكسبير" },
      { id: "b", text: "نيكولو مكيافيلي" },
      { id: "c", text: "ليوناردو دافنشي" },
      { id: "d", text: "أفلاطون" },
    ],
    correctAnswer: "b",
    explanation: "نيكولو مكيافيلي هو كاتب ودبلوماسي وفيلسوف سياسي إيطالي شهير، ومن أشهر أعماله كتاب 'الأمير'.",
  },
  {
    id: 4,
    text: "ما هو العنصر الكيميائي الذي رمزه O؟",
    image: null,
    options: [
      { id: "a", text: "الذهب" },
      { id: "b", text: "الهيدروجين" },
      { id: "c", text: "الأكسجين" },
      { id: "d", text: "الحديد" },
    ],
    correctAnswer: "c",
    explanation: "الرمز الكيميائي O يمثل عنصر الأكسجين.",
  },
  {
    id: 5,
    text: "ما هي ألوان قوس قزح الرئيسية؟",
    image: null,
    options: [
      { id: "a", text: "أحمر، أصفر، أزرق" },
      { id: "b", text: "أحمر، برتقالي، أصفر، أخضر، أزرق، نيلي، بنفسجي" },
      { id: "c", text: "أبيض، أسود، رمادي" },
      { id: "d", text: "وردي، بنفسجي، أخضر" },
    ],
    correctAnswer: "b",
    explanation: "ألوان قوس قزح الرئيسية هي الأحمر، البرتقالي، الأصفر، الأخضر، الأزرق، النيلي، والبنفسجي.",
  },
  {
    id: 6,
    text: "كم عدد الكروموسومات في الخلية البشرية الطبيعية؟",
    image: null,
    options: [
      { id: "a", text: "23" },
      { id: "b", text: "46" },
      { id: "c", text: "48" },
      { id: "d", text: "52" },
    ],
    correctAnswer: "b",
    explanation: "تحتوي الخلية البشرية الطبيعية (الجسمية) على 46 كروموسوم (23 زوجاً).",
  },
];

const QuestionsPage = () => {
  const [userData, isAdmin, isTeacher, isStudent] = UserType(); // استخدام الـ hook لتحديد نوع المستخدم
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState(Array(mockQuestions.length).fill(null));
  const [score, setScore] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState({}); // لتخزين الأسئلة المختارة للتصدير (وضع المدرس)
  const toast = useToast();

  const questionsPdfRef = useRef(null); // Ref للعنصر الذي سيتم تصديره كـ PDF

  const currentQuestion = mockQuestions[currentQuestionIndex];

  // ألوان الثيم
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.700");
  const primaryColor = useColorModeValue("blue.600", "blue.300");
  const secondaryColor = useColorModeValue("gray.700", "gray.200");
  const selectedOptionBg = useColorModeValue("blue.100", "blue.800");
  const correctOptionBg = useColorModeValue("green.100", "green.700");
  const wrongOptionBg = useColorModeValue("red.100", "red.700");
  const optionBorderColor = useColorModeValue("gray.200", "gray.600");
  const teacherBg = useColorModeValue("blue.50", "blue.900"); // خلفية خاصة لوضع المدرس

  // إعادة تعيين الحالة عند تغيير السؤال للطالب
  useEffect(() => {
    if (!isTeacher) {
      setSelectedOption(userAnswers[currentQuestionIndex]);
      setShowResult(false);
    }
  }, [currentQuestionIndex, userAnswers, isTeacher]);

  // Handle option selection for student mode
  const handleOptionSelect = (optionId) => {
    if (!showResult) {
      setSelectedOption(optionId);
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex] = optionId;
      setUserAnswers(newAnswers);
    }
  };

  // Handle next question for student mode
  const handleNextQuestion = () => {
    if (!showResult && selectedOption === null) {
      toast({
        title: "الرجاء اختيار إجابة",
        description: "يجب اختيار إجابة قبل المتابعة.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (!showResult) {
      setShowResult(true);
      if (selectedOption === currentQuestion.correctAnswer) {
        setScore((prevScore) => prevScore + 1);
        toast({
          title: "إجابة صحيحة!",
          description: "أحسنت الاختيار.",
          status: "success",
          duration: 1500,
          isClosable: true,
        });
      } else {
        toast({
          title: "إجابة خاطئة.",
          description: "حاول مرة أخرى في سؤال قادم.",
          status: "error",
          duration: 1500,
          isClosable: true,
        });
      }
    } else {
      if (currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        toast({
          title: "انتهى الاختبار!",
          description: `لقد أجبت على كل الأسئلة. نتيجتك: ${score} من ${mockQuestions.length}`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        // navigate('/results');
      }
    }
  };

  // Get option button props for student mode
  const getOptionButtonProps = (optionId) => {
    const isSelected = selectedOption === optionId;
    const isCorrect = showResult && optionId === currentQuestion.correctAnswer;
    const isWrong = showResult && isSelected && optionId !== currentQuestion.correctAnswer;

    let props = {
      bg: cardBg,
      borderColor: optionBorderColor,
      borderWidth: "1px",
      _hover: { bg: useColorModeValue("gray.100", "gray.600") },
    };

    if (showResult) {
      if (isCorrect) {
        props = {
          bg: correctOptionBg,
          borderColor: "green.500",
          color: useColorModeValue("green.800", "green.100"),
          _hover: { bg: correctOptionBg },
          leftIcon: <FaCheckCircle />,
        };
      } else if (isWrong) {
        props = {
          bg: wrongOptionBg,
          borderColor: "red.500",
          color: useColorModeValue("red.800", "red.100"),
          _hover: { bg: wrongOptionBg },
          leftIcon: <FaTimesCircle />,
        };
      } else if (isSelected) {
        props = {
          bg: wrongOptionBg,
          borderColor: "red.500",
          color: useColorModeValue("red.800", "red.100"),
          _hover: { bg: wrongOptionBg },
          leftIcon: <FaTimesCircle />,
        };
      }
      props.isDisabled = true;
    } else if (isSelected) {
      props = {
        bg: selectedOptionBg,
        borderColor: primaryColor,
        color: primaryColor,
        _hover: { bg: selectedOptionBg },
      };
    }
    return props;
  };

  // Handle checkbox change for teacher mode
  const handleCheckboxChange = (questionId) => {
    setSelectedQuestions((prevSelected) => ({
      ...prevSelected,
      [questionId]: !prevSelected[questionId],
    }));
  };

  // Export selected questions to PDF for teacher mode
  const exportQuestionsToPdf = async () => {
    const selectedQIDs = Object.keys(selectedQuestions).filter(
      (id) => selectedQuestions[id]
    );

    if (selectedQIDs.length === 0) {
      toast({
        title: "لا يوجد أسئلة مختارة",
        description: "الرجاء اختيار بعض الأسئلة لتصديرها.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // إنشاء محتوى HTML للأسئلة المختارة
    const questionsToExportHtml = mockQuestions
      .filter((q) => selectedQIDs.includes(q.id.toString()))
      .map((q, index) => {
        return `
          <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9; text-align: right; direction: rtl;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #3182CE;">السؤال ${index + 1}: ${q.text}</h3>
            ${q.image ? `<img src="${q.image}" style="max-width: 100%; height: auto; margin-bottom: 10px; border-radius: 5px;" />` : ''}
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${q.options
                .map(
                  (option) =>
                    `<li style="margin-bottom: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 5px; background-color: #fff;">
                      <span style="font-weight: bold; margin-left: 8px;">${option.id.toUpperCase()}.</span> ${option.text}
                    </li>`
                )
                .join("")}
            </ul>
            <p style="font-size: 14px; margin-top: 15px; color: #555; font-weight: bold;">الإجابة الصحيحة: <span style="color: green;">${q.correctAnswer.toUpperCase()}</span></p>
            <p style="font-size: 14px; margin-top: 5px; color: #777;">الشرح: ${q.explanation}</p>
          </div>
        `;
      })
      .join("");

    const doc = new jsPDF("p", "pt", "a4");
    const margin = 30; // هامش من جميع الجوانب
    doc.setFont("Amiri", "normal"); // محاولة لتعيين خط يدعم العربية، قد يتطلب إضافة الخط إلى jsPDF

    // إنشاء div مؤقت لعرض المحتوى الذي سيتم تحويله
    const tempDiv = document.createElement("div");
    tempDiv.style.width = "595.28pt"; // A4 width in points (210mm * 72/25.4)
    tempDiv.style.padding = `${margin}pt`;
    tempDiv.innerHTML = `<h1 style="text-align: center; color: #2C5282; margin-bottom: 30px;">الأسئلة المختارة</h1>${questionsToExportHtml}`;
    document.body.appendChild(tempDiv); // يجب أن يكون العنصر في DOM ليتمكن html2canvas من رؤيته

    toast({
      title: "جاري إنشاء PDF...",
      description: "قد يستغرق الأمر بضع لحظات.",
      status: "info",
      duration: null, // لا يختفي تلقائيا
      isClosable: false,
    });

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // لزيادة جودة الصورة في PDF
        useCORS: true, // مهم إذا كانت هناك صور من مصادر خارجية
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const imgWidth = 595.28 - 2 * margin; // عرض الصورة داخل الهوامش
      const pageHeight = 841.89; // A4 height in points
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = margin;

      doc.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin; // ضبط الموضع للصفحة التالية
        doc.addPage();
        doc.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save("selected_questions.pdf");
      toast.closeAll();
      toast({
        title: "تم التصدير بنجاح!",
        description: "تم تنزيل ملف PDF الخاص بالأسئلة.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.closeAll();
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء إنشاء ملف PDF. الرجاء المحاولة مرة أخرى.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      document.body.removeChild(tempDiv); // إزالة العنصر المؤقت من DOM
    }
  };

  // ----------------------------------------------------
  // عرض لوضع المدرس (Teacher View)
  // ----------------------------------------------------
  if (isTeacher) {
    const selectedCount = Object.values(selectedQuestions).filter(Boolean).length;
    return (
      <Flex minH="100vh" bg={bgColor} direction="column" align="center" py={{ base: 4, md: 10 }} px={{ base: 2, md: 6 }}>
        <Heading as="h1" size={{ base: "xl", md: "2xl" }} mb={8} color={primaryColor} textAlign="center">
          لوحة تحكم الأسئلة (للمدرس)
        </Heading>

        <Box w="full" maxW="1000px" p={{ base: 4, md: 8 }} bg={cardBg} borderRadius="2xl" shadow="2xl">
          <Flex justify="space-between" align="center" mb={6} flexWrap="wrap">
            <Text fontSize="lg" fontWeight="bold" color={secondaryColor}>
              الأسئلة المختارة: {selectedCount}
            </Text>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="green"
              onClick={exportQuestionsToPdf}
              isDisabled={selectedCount === 0}
              size="lg"
              py={7}
              borderRadius="full"
              shadow="md"
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            >
              تصدير إلى PDF
            </Button>
          </Flex>

          <VStack spacing={8} align="stretch" ref={questionsPdfRef}> {/* Ref هنا */}
            {mockQuestions.map((question, index) => (
              <MotionBox
                key={question.id}
                p={6}
                bg={useColorModeValue("gray.50", "gray.700")}
                borderRadius="xl"
                shadow="md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <HStack align="flex-start" mb={4}>
                  <Checkbox
                    isChecked={selectedQuestions[question.id] || false}
                    onChange={() => handleCheckboxChange(question.id)}
                    size="lg"
                    colorScheme="blue"
                    mr={4}
                  />
                  <VStack align="flex-start" spacing={2} flex={1}>
                    <Heading as="h3" size="md" color={primaryColor}>
                      السؤال {index + 1}: {question.text}
                    </Heading>
                    {question.image && (
                      <Image
                        src={question.image}
                        alt={`Question ${question.id} Image`}
                        maxH="200px"
                        objectFit="contain"
                        borderRadius="md"
                        shadow="sm"
                        mt={2}
                      />
                    )}
                    <VStack align="flex-start" spacing={1} mt={3} w="full">
                      {question.options.map((option) => (
                        <Text key={option.id} fontSize="md"  pr={4}>
                          <Text as="span" fontWeight="bold" mr={2}>
                            {option.id.toUpperCase()}.
                          </Text>
                          {option.text}
                        </Text>
                      ))}
                    </VStack>
                    <Divider mt={4} mb={2} borderColor={useColorModeValue("gray.200", "gray.600")} />
                    <HStack align="flex-start" w="full" mt={2}>
                      <Icon as={FaCheckCircle} color="green.500" />
                      <Text fontWeight="bold" color="green.500">
                        الإجابة الصحيحة: {question.correctAnswer.toUpperCase()}
                      </Text>
                    </HStack>
                    <HStack align="flex-start" w="full" mt={1}>
                      <Icon as={FaLightbulb} color={primaryColor} />
                      <Text fontSize="sm" color={secondaryColor}>
                        الشرح: {question.explanation}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </MotionBox>
            ))}
          </VStack>
        </Box>
      </Flex>
    );
  }

  // ----------------------------------------------------
  // عرض لوضع الطالب (Student View) - الكود الأصلي
  // ----------------------------------------------------
  return (
    <Flex minH="100vh" bg={bgColor} direction="column" align="center" py={{ base: 4, md: 10 }} px={{ base: 2, md: 6 }}>
      {/* شريط التقدم */}
      <Box w="full" maxW="900px" mb={8} px={4}>
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="bold" color={secondaryColor}>
            السؤال {currentQuestionIndex + 1} / {mockQuestions.length}
          </Text>
          <Text fontWeight="bold" color="green.500">
            النتيجة: {score}
          </Text>
        </HStack>
        <Progress
          value={((currentQuestionIndex + (showResult ? 1 : 0)) / mockQuestions.length) * 100}
          size="lg"
          colorScheme="blue"
          borderRadius="full"
          hasStripe
          isAnimated
        />
      </Box>

      {/* بطاقة السؤال الرئيسية */}
      <ScaleFade initialScale={0.9} in={true} key={currentQuestion.id}>
        <MotionBox
          bg={cardBg}
          p={{ base: 6, md: 8 }}
          borderRadius="2xl"
          shadow="2xl"
          maxW="900px"
          w="full"
          textAlign="center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {currentQuestion.image && (
            <Image
              src={currentQuestion.image}
              alt="Question Image"
              maxH="300px"
              objectFit="contain"
              mx="auto"
              mb={6}
              borderRadius="lg"
              shadow="md"
            />
          )}

          <Heading as="h2" size={{ base: "lg", md: "xl" }} mb={8} color={primaryColor} lineHeight="tall">
            {currentQuestion.text}
          </Heading>

          <VStack spacing={4} mb={8} align="stretch">
            {currentQuestion.options.map((option) => (
              <MotionButton
                key={option.id}
                size="lg"
                height={{ base: "50px", md: "60px" }}
                onClick={() => handleOptionSelect(option.id)}
                justifyContent="flex-start" // محاذاة النص لليمين
                px={6}
                borderRadius="xl" // حواف دائرية أكبر
                fontWeight="semibold"
                fontSize={{ base: "md", md: "lg" }}
                transition="all 0.2s ease-in-out"
                {...getOptionButtonProps(option.id)} // تطبيق خصائص الأزرار
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Badge
                  minW="30px"
                  textAlign="center"
                  variant="solid"
                  colorScheme="blue"
                  p={1}
                  borderRadius="md"
                  mr={3}
                >
                  {option.id.toUpperCase()}
                </Badge>
                {option.text}
              </MotionButton>
            ))}
          </VStack>

          {showResult && (
            <MotionBox
              mt={6}
              p={4}
              bg={useColorModeValue("blue.50", "blue.900")}
              borderRadius="lg"
              shadow="md"
              textAlign="right"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <HStack align="flex-start" mb={2}>
                <FaLightbulb color={primaryColor} size="20px" />
                <Text fontWeight="bold" color={primaryColor} fontSize="md">
                  الشرح:
                </Text>
              </HStack>
              <Text fontSize="md" color={secondaryColor}>
                {currentQuestion.explanation}
              </Text>
            </MotionBox>
          )}

          <Button
            colorScheme="blue"
            size="lg"
            rightIcon={<FaArrowRight />}
            onClick={handleNextQuestion}
            mt={8}
            w={{ base: "full", sm: "auto" }}
            px={10}
            py={7}
            borderRadius="full"
            shadow="lg"
            _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
            isLoading={false}
            isDisabled={showResult ? false : selectedOption === null}
          >
            {currentQuestionIndex === mockQuestions.length - 1 && showResult
              ? "إنهاء الاختبار"
              : showResult
              ? "السؤال التالي"
              : "تأكيد الإجابة"}
          </Button>
        </MotionBox>
      </ScaleFade>

      {/* Pagination - شريط التنقل بين الأسئلة (فقط للطالب) */}
      <HStack spacing={2} mt={10} justify="center" wrap="wrap">
        {mockQuestions.map((_, index) => (
          <IconButton
            key={index}
            aria-label={`Go to question ${index + 1}`}
            icon={<Text>{index + 1}</Text>}
            size="md"
            variant={index === currentQuestionIndex ? "solid" : "outline"}
            colorScheme={index === currentQuestionIndex ? "blue" : "gray"}
            onClick={() => {
              if (index < currentQuestionIndex || showResult) {
                setCurrentQuestionIndex(index);
              } else if (index > currentQuestionIndex && !showResult && userAnswers[currentQuestionIndex] === null) {
                toast({
                  title: "أكمل السؤال الحالي",
                  description: "الرجاء الإجابة على السؤال الحالي قبل الانتقال.",
                  status: "info",
                  duration: 2000,
                  isClosable: true,
                });
              } else {
                setCurrentQuestionIndex(index);
              }
            }}
            borderRadius="full"
            shadow={index === currentQuestionIndex ? "md" : "sm"}
          />
        ))}
      </HStack>
    </Flex>
  );
};

export default QuestionsPage;