import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { getCourseFileDisplayName } from "../../../api/courseFilesApi";

export default function DeleteCourseFileModal({ isOpen, onClose, file, onConfirm, loading }) {
  const cancelRef = useRef(null);
  const name = getCourseFileDisplayName(file);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={() => !loading && onClose?.()}
    >
      <AlertDialogOverlay backdropFilter="blur(4px)">
        <AlertDialogContent borderRadius="2xl" mx={4}>
          <AlertDialogHeader fontSize="lg">حذف الملف</AlertDialogHeader>
          <AlertDialogBody>
            هل أنت متأكد من حذف &quot;{name}&quot;؟ سيختفي الملف من الكورس ولن يتمكن الطلاب من
            عرضه.
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} onClick={onClose} isDisabled={loading}>
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              isLoading={loading}
              loadingText="جاري الحذف..."
            >
              حذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
