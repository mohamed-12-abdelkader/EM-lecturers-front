import React, { useState, useRef, useEffect } from "react"; // Added useRef and useEffect
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  useColorModeValue,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import HTMLFlipBook from "react-pageflip";
import { FaBookReader } from "react-icons/fa";

// بيانات وهمية للصور التي ستعرض في الكتاب
const flipbookImages = [
  "/63dceec5-d794-40fd-855c-27efea0f70a2.jfif",
  "/757d8e67-01a4-4e66-bc9e-9532d2f61d63.jfif",
  "/daa8c1e4-7b6d-4436-b401-9e5dff5f2439.jfif",
  "/f4befc5a-8632-42ae-bb43-f130edb6cc2b.jfif",
  "/63dceec5-d794-40fd-855c-27efea0f70a2.jfif",
  "/757d8e67-01a4-4e66-bc9e-9532d2f61d63.jfif",
  "/daa8c1e4-7b6d-4436-b401-9e5dff5f2439.jfif",
  "/f4befc5a-8632-42ae-bb43-f130edb6cc2b.jfif",
];

const MotionBox = motion(Box);

const ImageFlipbookSection = () => {
  const bookRef = useRef(null); // Ref to access HTMLFlipBook methods
  // Removed autoFlipIntervalId state as auto-flipping is disabled
  // Removed AUTO_FLIP_DELAY constant as auto-flipping is disabled

  // الألوان المتكيفة مع الوضع الفاتح والداكن
  const sectionBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("blue.700", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Framer Motion variants
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  // Removed resetAutoFlipTimer function as auto-flipping is disabled
  // Removed useEffect hook for auto-flipping as it's disabled

  // Event handler for manual page flips (no longer resets timer, just for logging if needed)
  const onFlip = (e) => {
    // console.log("Page flipped:", e.data); // Optional: log page flip
  };

  return (
    <MotionBox
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      
      borderRadius="2xl"
     
      p={8}
      textAlign="center"
      dir="rtl" // الاتجاه من اليمين لليسار للمحتوى العربي
      fontFamily="'Changa', sans-serif"
    >
      <Heading size="lg" mb={8} color={headingColor}>
        <Icon as={FaBookReader} mr={3} /> تصفح  خدماتنا 
      </Heading>
      <Text fontSize="md" color={textColor} mb={6}>
       انقر على الصفحات أو اسحبها للتقليب بينها.
      </Text>

      <Flex justifyContent="center" alignItems="center" flexWrap="wrap" gap={4}>
        {/* HTMLFlipBook Component */}
        <HTMLFlipBook
          width={400} // عرض كل صفحة
          height={400} // طول كل صفحة
          showCover={false} // تم تغييرها إلى false لإزالة الصفحات البيضاء (الأغطية)
          flippingTime={800} // سرعة التقليب بالمللي ثانية
          size="stretch" // لتكييف الكتاب مع حجم الحاوية
          minWidth={200} // الحد الأدنى لعرض الصفحة
          maxWidth={500} // الحد الأقصى لعرض الصفحة
          minHeight={300} // الحد الأدنى لارتفاع الصفحة
          maxHeight={700} // الحد الأقصى لارتفاع الصفحة
          maxShadowOpacity={0.5} // شفافية الظل القصوى عند التقليب
          mobileScrollSupport={true} // دعم التمرير على الجوال
          className="demo-book" // يمكن إضافة كلاس لتخصيص إضافي عبر CSS خارجي
          style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.25)", borderRadius: "10px", overflow: "hidden" }} // ظل وحواف مستديرة للكتاب
          ref={bookRef} // Attach the ref to the book
          onFlip={onFlip} // Listen for page flips (optional, can be removed if no logic needed)
        >
          {flipbookImages.map((imageSrc, index) => (
            <Box
              key={index}
              className="demoPage" // كلاس لتمييز الصفحات
              display="flex"
              justifyContent="center"
              alignItems="center"
              bg={useColorModeValue("gray.100", "gray.700")}
              borderRadius="md"
              overflow="hidden"
              border="1px solid"
              borderColor={borderColor}
            >
              <Image
                src={imageSrc}
                alt={`Page ${index + 1}`}
                objectFit="cover" // تغطية مساحة الصفحة بالكامل
                width="100%"
                height="100%"
                draggable="false" // لمنع سحب الصورة بدلاً من تقليب الصفحة
              />
            </Box>
          ))}
        </HTMLFlipBook>
      </Flex>
      <Text mt={4} fontSize="sm" color={subTextColor}>
      
      </Text>
    </MotionBox>
  );
};

export default ImageFlipbookSection;
