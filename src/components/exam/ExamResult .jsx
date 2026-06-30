import React from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";

const ExamResult = ({ isOpen, onClose, cancelRef, result }) => {
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader
            fontSize="lg"
            fontWeight="bold"
            className="flex justify-between"
          >
            <h1>نتيجة امتحانك!</h1>
            <Button
              colorScheme="red"
              onClick={() => {
                window.location.reload();
                onClose();
              }}
              ml={3}
            >
              x
            </Button>
          </AlertDialogHeader>
          <AlertDialogBody className="font-bold">
            <h1>
              الدرجة: {result.result}/{result.total}
            </h1>
            {result.wrongQuestions && result.wrongQuestions.length > 0 ? (
              <div>
                <h1 className="my-5">الأسئلة الخطأ!</h1>
                {result.wrongQuestions.map((wrong, index) => (
                  <div key={index}>
                    <div>
                      <h1>
                        {index + 1} - {wrong.question}
                      </h1>
                      <h1 className="h-[30px] w-[100%] bg-red-500 flex justify-center items-center text-white my-3">
                        {wrong.useranswer}
                      </h1>
                      <h1 className="h-[30px] w-[100%] bg-green-500 flex justify-center items-center text-white my-3">
                        {wrong.correctanswer}
                      </h1>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <h1>عاش! استمر يا بطل 🥳👏</h1>
              </div>
            )}
          </AlertDialogBody>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ExamResult;
