import React from 'react';
import {
  Box,
  IconButton,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Spinner,
  Center,
  useToast,
  Collapse,
  Button,
} from '@chakra-ui/react';
import { FaPlay, FaPause, FaExpand, FaCompress, FaTimes } from 'react-icons/fa';

const VideoPlayer = ({ 
  videoUrl, 
  videoTitle, 
  isVisible, 
  onClose, 
  onToggleVisibility,
  isTeacher = false 
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showControls, setShowControls] = React.useState(false);
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  // دالة لاستخراج معرف الفيديو من رابط YouTube
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // دالة لاستخراج معرف الفيديو من رابط Bunny
  const getBunnyVideoId = (url) => {
    // مثال: https://iframe.mediadelivery.net/embed/12345/abcdef
    const match = url.match(/embed\/([^\/]+)\/([^\/\?]+)/);
    return match ? { libraryId: match[1], videoId: match[2] } : null;
  };

  // تحديد نوع الفيديو
  const getVideoType = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('mediadelivery.net') || url.includes('bunny.net')) {
      return 'bunny';
    }
    return 'unknown';
  };

  const videoType = getVideoType(videoUrl);
  const youtubeVideoId = videoType === 'youtube' ? getYouTubeVideoId(videoUrl) : null;
  const bunnyVideoData = videoType === 'bunny' ? getBunnyVideoId(videoUrl) : null;

  // دالة لإنشاء iframe YouTube
  const renderYouTubePlayer = () => {
    if (!youtubeVideoId) return null;
    
    return (
      <Box position="relative" w="full" h="full">
        <iframe
          ref={videoRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&enablejsapi=1`}
          title={videoTitle || 'YouTube video player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          style={{ borderRadius: '12px' }}
        />
        {/* Overlay لمنع التفاعل مع أزرار YouTube */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={1}
          pointerEvents="none"
          _hover={{ pointerEvents: "auto" }}
          onClick={(e) => {
            // منع النقر على أزرار YouTube
            e.preventDefault();
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            // منع القائمة اليمنى
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </Box>
    );
  };

  // دالة لإنشاء iframe Bunny
  const renderBunnyPlayer = () => {
    if (!bunnyVideoData) return null;
    
    return (
      <iframe
        ref={videoRef}
        width="100%"
        height="100%"
        src={`https://iframe.mediadelivery.net/embed/${bunnyVideoData.libraryId}/${bunnyVideoData.videoId}?autoplay=${isPlaying ? 1 : 0}`}
        title={videoTitle || 'Bunny video player'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        style={{ borderRadius: '12px' }}
      />
    );
  };

  // دالة لإنشاء video element عادي
  const renderNativePlayer = () => {
    return (
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        controls
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ borderRadius: '12px' }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  };

  // دالة تبديل التشغيل/الإيقاف
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoType === 'youtube' || videoType === 'bunny') {
        // للـ iframe، نحتاج لإرسال رسائل
        const message = isPlaying ? 'pauseVideo' : 'playVideo';
        videoRef.current.contentWindow.postMessage(
          `{"event":"command","func":"${message}","args":""}`,
          '*'
        );
      } else {
        // للـ video element العادي
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  // دالة تبديل ملء الشاشة
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.msRequestFullscreen) {
          containerRef.current.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // مراقبة تغييرات ملء الشاشة
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // دالة إغلاق الفيديو
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // دالة تبديل الظهور
  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      onToggleVisibility();
    }
  };

  if (!isVisible) return null;

  return (
    <Collapse in={isVisible} animateOpacity>
      <Box
        ref={containerRef}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius={{ base: "lg", md: "xl" }}
        boxShadow="xl"
        overflow="hidden"
        position="relative"
        mb={{ base: 4, md: 6 }}
        mx="auto"
        maxW="container.xl"
        w="full"
        px={{ base: 2, md: 0 }}
      >
        {/* Header - متجاوب */}
        <Flex
          justify="space-between"
          align="center"
          p={{ base: 2, md: 4 }}
          bg={useColorModeValue("gray.50", "gray.700")}
          borderBottom="1px solid"
          borderColor={borderColor}
          direction={{ base: "column", sm: "row" }}
          gap={{ base: 2, sm: 0 }}
        >
          <HStack spacing={2} minW={0} flex={1}>
            <Badge colorScheme="blue" variant="subtle" fontSize={{ base: "xs", md: "sm" }}>
              {videoType === "youtube" ? "YouTube" : videoType === "bunny" ? "Bunny" : "Video"}
            </Badge>
            <Text fontWeight="bold" color={textColor} fontSize={{ base: "sm", md: "lg" }} noOfLines={1}>
              {videoTitle || "عرض الفيديو"}
            </Text>
          </HStack>
          
          <HStack spacing={2} flexShrink={0}>
            {isTeacher && (
               <Button
                 size="sm"
                 variant="ghost"
                 colorScheme={isVisible ? "green" : "yellow"}
                 onClick={handleToggleVisibility}
                 leftIcon={isVisible ? <FaPlay /> : <FaPause />}
               >
                 {isVisible ? "إظهار" : "إخفاء"}
               </Button>
             )}
             
             <IconButton
               size="sm"
               variant="ghost"
               icon={isPlaying ? <FaPause /> : <FaPlay />}
               onClick={togglePlay}
               aria-label={isPlaying ? "إيقاف" : "تشغيل"}
             />
             
             <IconButton
               size="sm"
               variant="ghost"
               icon={isFullscreen ? <FaCompress /> : <FaExpand />}
               onClick={toggleFullscreen}
               aria-label="ملء الشاشة"
             />
             
             <IconButton
               size="sm"
               variant="ghost"
               icon={<FaTimes />}
               onClick={handleClose}
               aria-label="إغلاق"
             />
           </HStack>
        </Flex>

        {/* Video Container */}
        <Box
          position="relative"
          w="full"
          h={{ base: '180px', sm: '250px', md: '320px', lg: '400px' }}
          bg="black"
        >
          {isLoading && (
            <Center position="absolute" top="0" left="0" right="0" bottom="0" zIndex={1}>
              <VStack spacing={3}>
                <Spinner size="xl" color="blue.500" />
                <Text color="white" fontSize="sm">جاري تحميل الفيديو...</Text>
              </VStack>
            </Center>
          )}

                     {/* Video Controls Overlay */}
           <Box
             position="absolute"
             bottom="0"
             left="0"
             right="0"
             bg="rgba(0, 0, 0, 0.8)"
             p={3}
             opacity={showControls ? 1 : 0}
             onMouseEnter={() => setShowControls(true)}
             onMouseLeave={() => setShowControls(false)}
             transition="opacity 0.3s"
             zIndex={2}
           >
             <VStack spacing={2}>
               <HStack justify="space-between" align="center" w="full">
                 <IconButton
                   size="sm"
                   variant="ghost"
                   color="white"
                   icon={isPlaying ? <FaPause /> : <FaPlay />}
                   onClick={togglePlay}
                   aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                   _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                 />
                 
                 <Text color="white" fontSize="sm" fontWeight="medium" textAlign="center" flex={1}>
                   {videoTitle}
                 </Text>
                 
                 <IconButton
                   size="sm"
                   variant="ghost"
                   color="white"
                   icon={isFullscreen ? <FaCompress /> : <FaExpand />}
                   onClick={toggleFullscreen}
                   aria-label="ملء الشاشة"
                   _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                 />
               </HStack>
               
               {/* Progress Bar Placeholder */}
               <Box w="full" h="2px" bg="rgba(255, 255, 255, 0.3)" borderRadius="full">
                 <Box 
                   w="30%" 
                   h="full" 
                   bg="red.500" 
                   borderRadius="full"
                   transition="width 0.3s"
                 />
               </Box>
             </VStack>
           </Box>

                     {/* Video Player */}
           {videoType === 'youtube' && renderYouTubePlayer()}
           {videoType === 'bunny' && renderBunnyPlayer()}
           {videoType === 'unknown' && renderNativePlayer()}

           {/* Side Controls */}
           <VStack
             position="absolute"
             right="4"
             top="50%"
             transform="translateY(-50%)"
             spacing={2}
             opacity={showControls ? 1 : 0}
             onMouseEnter={() => setShowControls(true)}
             onMouseLeave={() => setShowControls(false)}
             transition="opacity 0.3s"
             zIndex={3}
           >
             <IconButton
               size="sm"
               variant="solid"
               colorScheme="blackAlpha"
               color="white"
               icon={isPlaying ? <FaPause /> : <FaPlay />}
               onClick={togglePlay}
               aria-label={isPlaying ? "إيقاف" : "تشغيل"}
               _hover={{ bg: 'rgba(0, 0, 0, 0.8)' }}
             />
             
             <IconButton
               size="sm"
               variant="solid"
               colorScheme="blackAlpha"
               color="white"
               icon={isFullscreen ? <FaCompress /> : <FaExpand />}
               onClick={toggleFullscreen}
               aria-label="ملء الشاشة"
               _hover={{ bg: 'rgba(0, 0, 0, 0.8)' }}
             />
           </VStack>
        </Box>

        {/* Error Message */}
        {!youtubeVideoId && !bunnyVideoData && videoType !== 'unknown' && (
          <Center p={8}>
            <VStack spacing={3}>
              <Text color="red.500" fontSize="lg" fontWeight="bold">
                رابط الفيديو غير صحيح
              </Text>
              <Text color="gray.500" textAlign="center">
                يرجى التأكد من أن الرابط صحيح وأنه من YouTube أو Bunny
              </Text>
            </VStack>
          </Center>
        )}
      </Box>
    </Collapse>
  );
};

export default VideoPlayer; 