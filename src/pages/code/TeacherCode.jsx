import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  useColorModeValue,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { FaPhoneAlt, FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const TeacherCode = () => {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const codes = JSON.parse(localStorage.getItem("code")) || {
    name: "",
    codes: [],
  };
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");

  const exportToPDF = async () => {
    if (codes.codes.length === 0) {
      toast({
        title: "لا توجد أكواد لتصديرها!",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExporting(true);
    const pdf = new jsPDF("l", "mm", "a4");
    const codesPerPage = 15; // Adjusted to 3 columns × 5 rows to fit more codes
    const cardWidth = 385; // Width of each card
    const cardHeight = 160; // Reduced height of each card to fit more rows
    const pageWidth = 1200; // Width for rendering (3 cards + smaller gaps)
    const pageHeight = 900; // Height for rendering (5 rows + smaller gaps)

    for (let i = 0; i < codes.codes.length; i += codesPerPage) {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = `${pageWidth}px`;
      tempDiv.style.height = `${pageHeight}px`; // Ensure enough height
      tempDiv.style.background = "white"; // Match PDF background
      document.body.appendChild(tempDiv);

      // Generate HTML for the current page's codes with reduced gaps and padding
      tempDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, ${cardWidth}px); gap: 5px; padding: 5px;">
          ${codes.codes
            .slice(i, i + codesPerPage)
            .map(
              (code, index) => `
                <div class="code" style="padding: 5px; width: ${cardWidth}px; height: ${cardHeight}px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); text-align: center; position: relative; overflow: hidden;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0;">
                    <h1 style="font-size: 14px; font-weight: bold; color: #3182ce; margin-bottom: 4px;">${codes.name}</h1>
                  </div>
                  <div style="display: flex; margin-top: 20px; justify-content: space-between; align-items: center; padding: 2px 0;">
                    <h3 style="font-size: 18px; font-weight: bold; color: #c53030;"> كود التفعيل :</h3>
                    <h3 style="font-size: 18px; font-weight: bold; color: #c53030;"> ${code}</h3>
                  </div>
                  <div style="margin-top: 20px;">
                    <p style="font-size: 13px; font-weight: bold; color: #4a5568; display: flex; justify-content: center; align-items: center; gap: 4px;">
                      01286525940 | 01111272393
                    </p>
                  </div>
                </div>`
            )
            .join("")}
        </div>
      `;

      // Wait for the content to render
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure rendering
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Higher resolution for clarity
        useCORS: true,
        width: pageWidth,
        height: pageHeight,
      });

      // Calculate scaling to fit A4 page (297mm × 210mm in landscape)
      const pdfWidth = 297; // A4 width in mm (landscape)
      const pdfHeight = 210; // A4 height in mm (landscape)
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 10; // Reduced margin to 5mm on each side
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - 10) {
        imgHeight = pdfHeight - 10; // Reduced margin to 5mm on top/bottom
        imgWidth = imgHeight * canvasAspectRatio;
      }

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        5, // X position (5mm margin)
        5, // Y position (5mm margin)
        imgWidth,
        imgHeight
      );

      if (i + codesPerPage < codes.codes.length) pdf.addPage();
      document.body.removeChild(tempDiv);
    }

    pdf.save("teacher_codes.pdf");
    setIsExporting(false);
  };

  return (
    <Box my='120px' w='100%' mx='auto'>
      <Button
        colorScheme='red'
        mb='6'
        onClick={exportToPDF}
        leftIcon={<FaFilePdf />}
      >
        {isExporting ? <Spinner size='sm' /> : "تصدير الأكواد كـ PDF"}
      </Button>
      {codes.codes.length === 0 ? (
        <Text fontSize='lg' color='gray.500' textAlign='center'>
          لا توجد أكواد متاحة حاليًا
        </Text>
      ) : (
        <Flex flexWrap='wrap' gap='6' justifyContent='center'>
          {codes.codes.map((code, index) => (
            <Box
              className='code'
              key={index}
              flex={{ base: "1 1 100%", md: "1 1 calc(33.33% - 24px)" }}
              maxW={{ base: "100%", md: "calc(33.33% - 24px)" }}
              p='6'
              borderWidth='1px'
              borderColor={borderColor}
              borderRadius='xl'
              boxShadow='md'
              bg={cardBg}
              transition='all 0.2s'
              _hover={{ transform: "scale(1.02)", boxShadow: "lg" }}
            >
              <VStack align='start' spacing='4'>
                <div className='flex justify-between w-[100%]'>
                  <Text fontSize='xl' fontWeight='bold' color='blue.500'>
                    {codes.name}
                  </Text>
                  <Text fontSize='xl' fontWeight='bold' color='blue.500'>
                    {index + 1} رقم الكود
                  </Text>
                </div>
                <div className='flex justify-between w-[100%]'>
                  <h1>كود التفعيل:</h1>
                  <h1>{code}</h1>
                </div>
                <VStack align='start' spacing='2' mt='4'>
                  <Text fontSize='md' fontWeight='semibold' color={textColor}>
                    أرقام الدعم الفني:
                  </Text>
                  <HStack spacing='4'>
                    <HStack>
                      <Icon as={FaPhoneAlt} color='green.400' boxSize='5' />
                      <Text fontWeight='medium' color={textColor}>
                        01286525940
                      </Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaPhoneAlt} color='green.400' boxSize='5' />
                      <Text fontWeight='medium' color={textColor}>
                        01111272393
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default TeacherCode;