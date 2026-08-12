import { Component } from "react";
import { Box, Button, Heading, Spinner, Text } from "@chakra-ui/react";
import { isChunkLoadError, recoverFromChunkError } from "../utils/chunkLoadRecovery";

/**
 * يمنع الشاشة البيضاء عند أي خطأ غير متوقع في شجرة React.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    const message = error?.message || "حدث خطأ غير متوقع";
    if (isChunkLoadError(error)) {
      return { hasError: true, message, chunkError: true };
    }
    return { hasError: true, message, chunkError: false };
  }

  componentDidCatch(error, info) {
    console.error("AppErrorBoundary:", error, info);
    if (isChunkLoadError(error)) {
      recoverFromChunkError(error);
    }
  }

  handleReload = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      if (isChunkLoadError({ message: this.state.message })) {
        return (
          <Box
            minH="100vh"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={4}
            bg="#0A1628"
            color="white"
            dir="rtl"
          >
            <Spinner size="lg" color="blue.400" thickness="3px" />
            <Text color="#7EB8D9" fontSize="sm">
              جاري تحديث النسخة…
            </Text>
          </Box>
        );
      }

      return (
        <Box
          minH="100vh"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={4}
          px={6}
          textAlign="center"
          bg="#0A1628"
          color="white"
          dir="rtl"
        >
          <Heading size="md">تعذّر فتح الصفحة</Heading>
          <Text color="#7EB8D9" maxW="md" fontSize="sm" lineHeight="1.8">
            حصل خطأ أثناء التحميل. جرّب تحديث الصفحة. إذا استمرت المشكلة امسح
            بيانات الموقع من المتصفح ثم أعد المحاولة.
          </Text>
          <Button colorScheme="blue" borderRadius="xl" onClick={this.handleReload}>
            تحديث الصفحة
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
