import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  Button,
  useColorModeValue,
  Container,
  AspectRatio,
  Center,
  Spinner,
} from '@chakra-ui/react';
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaDesktop,
  FaPhoneSlash,
  FaExpand,
  FaCompress,
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const containerRef = useRef(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  
  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          setLocalStream(stream);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };
    
    initMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Toggle camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };
  
  // Toggle microphone
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
          setIsScreenSharing(true);
        }
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (screenShareRef.current) {
            screenShareRef.current.srcObject = null;
          }
        };
      } else {
        if (screenShareRef.current && screenShareRef.current.srcObject) {
          screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
          screenShareRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };
  
  // Leave meeting
  const leaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenShareRef.current && screenShareRef.current.srcObject) {
      screenShareRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    navigate(-1);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  return (
    <Box
      ref={containerRef}
      w="100vw"
      h="100vh"
      bg={bgColor}
      position="relative"
      overflow="hidden"
    >
      <Flex
        w="100%"
        h="100%"
        direction={{ base: 'column', lg: 'row' }}
        gap={4}
        p={4}
        pb={{ base: 24, lg: 4 }}
      >
        {/* Left Side - Vertical Video (Portrait) */}
        <Box
          w={{ base: '100%', lg: '350px' }}
          h={{ base: '400px', lg: '100%' }}
          maxH={{ base: '400px', lg: 'none' }}
          position="relative"
          bg="black"
          borderRadius="lg"
          overflow="hidden"
          flexShrink={0}
          boxShadow="xl"
        >
          {/* LIVE Badge */}
          <Badge
            position="absolute"
            top={4}
            right={4}
            bg="red.500"
            color="white"
            px={3}
            py={1}
            borderRadius="md"
            fontSize="sm"
            fontWeight="bold"
            zIndex={10}
          >
            LIVE
          </Badge>
          
          {/* Local Video */}
          <Box
            w="100%"
            h="100%"
            position="relative"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            
            {/* Camera Off Overlay */}
            {!isCameraOn && (
              <Center
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="gray.800"
                zIndex={5}
              >
                <VStack spacing={2}>
                  <Box
                    w="80px"
                    h="80px"
                    borderRadius="full"
                    bg="gray.600"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="2xl" color="white">
                      👤
                    </Text>
                  </Box>
                  <Text color="white" fontSize="sm">
                    الكاميرا مغلقة
                  </Text>
                </VStack>
              </Center>
            )}
          </Box>
          
          {/* EM ACADEMY Branding */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
            p={4}
            zIndex={10}
          >
            <Text
              color="white"
              fontSize="lg"
              fontWeight="bold"
              textAlign="center"
            >
              EM ACADEMY
            </Text>
          </Box>
        </Box>
        
        {/* Right Side - Horizontal Content Area */}
        <Flex
          flex={1}
          direction="column"
          position="relative"
          bg={cardBg}
          borderRadius="lg"
          overflow="hidden"
          minH={0}
        >
          {/* LIVE Badge on Content Area */}
          <Badge
            position="absolute"
            top={4}
            right={4}
            bg="red.500"
            color="white"
            px={3}
            py={1}
            borderRadius="md"
            fontSize="sm"
            fontWeight="bold"
            zIndex={10}
          >
            LIVE
          </Badge>
          
          {/* Screen Share or Content Area */}
          <Box
            flex={1}
            position="relative"
            bg="white"
            minH={0}
            display="flex"
            flexDirection="column"
          >
            {isScreenSharing ? (
              <Box flex={1} bg="black">
                <video
                  ref={screenShareRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            ) : (
              <>
                {/* Blue Top Section */}
                <Box
                  bg="linear-gradient(135deg, #3182CE 0%, #2C5282 100%)"
                  p={8}
                  color="white"
                  flex={1}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  position="relative"
                >
                  <VStack spacing={4} align="flex-start" maxW="800px" mx="auto" w="100%">
                    <Text fontSize="3xl" fontWeight="bold" textAlign="right" w="100%">
                      اكتشف مسائل العلوم
                    </Text>
                    <Text fontSize="xl" fontWeight="semibold" textAlign="right" w="100%">
                      EM Academy
                    </Text>
                    <Text fontSize="md" textAlign="right" color="whiteAlpha.900" lineHeight="tall">
                      مرحباً بك في جلسة البث المباشر. يمكنك استكشاف المحتوى التعليمي ومتابعة الدروس المباشرة.
                    </Text>
                    
                    {/* Content Cards with Orange Icons */}
                    <HStack spacing={4} mt={6} flexWrap="wrap" justify="flex-start" w="100%">
                      {[1, 2, 3, 4].map((item) => (
                        <Box
                          key={item}
                          w={{ base: '100%', md: '200px' }}
                          h="100px"
                          bg="whiteAlpha.200"
                          borderRadius="md"
                          position="relative"
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          px={4}
                          border="1px solid"
                          borderColor="whiteAlpha.300"
                        >
                          <Text fontSize="lg" color="white" fontWeight="medium">
                            {item}
                          </Text>
                          <Box
                            w="24px"
                            h="24px"
                            bg="orange.500"
                            borderRadius="full"
                            flexShrink={0}
                          />
                        </Box>
                      ))}
                    </HStack>
                    
                    {/* Action Buttons in Blue Section */}
                    <HStack spacing={4} mt={6} w="100%">
                      <Button
                        bg="blue.600"
                        color="white"
                        _hover={{ bg: 'blue.700' }}
                        size="md"
                        borderRadius="md"
                      >
                        ابدأ الآن
                      </Button>
                      <Button
                        bg="orange.500"
                        color="white"
                        _hover={{ bg: 'orange.600' }}
                        size="md"
                        borderRadius="md"
                      >
                        تعرف أكثر
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
                
                {/* White Bottom Section */}
                <Box
                  bg="white"
                  p={6}
                  borderTop="1px solid"
                  borderColor="gray.200"
                >
                  <Text
                    fontSize="lg"
                    fontWeight="semibold"
                    color={textColor}
                    textAlign="right"
                  >
                    خدمات الطلابية
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    textAlign="right"
                    mt={2}
                  >
                    نوفر لك مجموعة متنوعة من الخدمات التعليمية لدعم مسيرتك التعليمية
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </Flex>
      </Flex>
      
      {/* Action Buttons - Bottom Center */}
      <HStack
        position="absolute"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        spacing={3}
        bg={cardBg}
        px={{ base: 4, md: 6 }}
        py={3}
        borderRadius="full"
        boxShadow="2xl"
        zIndex={20}
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
        maxW={{ base: '90%', md: 'auto' }}
        justify="center"
      >
        {/* Camera Toggle */}
        <IconButton
          icon={isCameraOn ? <FaVideo /> : <FaVideoSlash />}
          onClick={toggleCamera}
          colorScheme={isCameraOn ? 'blue' : 'gray'}
          aria-label="تبديل الكاميرا"
          size="lg"
          borderRadius="full"
        />
        
        {/* Microphone Toggle */}
        <IconButton
          icon={isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
          onClick={toggleMic}
          colorScheme={isMicOn ? 'blue' : 'gray'}
          aria-label="تبديل الميكروفون"
          size="lg"
          borderRadius="full"
        />
        
        {/* Screen Share */}
        <IconButton
          icon={<FaDesktop />}
          onClick={toggleScreenShare}
          colorScheme={isScreenSharing ? 'green' : 'gray'}
          aria-label="مشاركة الشاشة"
          size="lg"
          borderRadius="full"
        />
        
        {/* Fullscreen Toggle */}
        <IconButton
          icon={isFullscreen ? <FaCompress /> : <FaExpand />}
          onClick={toggleFullscreen}
          colorScheme="gray"
          aria-label="ملء الشاشة"
          size="lg"
          borderRadius="full"
        />
        
        {/* Leave Meeting */}
        <Button
          leftIcon={<FaPhoneSlash />}
          onClick={leaveMeeting}
          colorScheme="red"
          size="lg"
          borderRadius="full"
          px={6}
        >
          إنهاء
        </Button>
      </HStack>
    </Box>
  );
};

export default MeetingRoom;

