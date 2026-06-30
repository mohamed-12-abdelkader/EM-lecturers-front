import { useParams } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import GitTeacherQuistions from "../../Hooks/teacher/GitTeacherQuistions";
import {
  Button,
  Radio,
  RadioGroup,
  Skeleton,
  Spinner,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
} from "@chakra-ui/react";
import React, { useState } from "react";
import DeleatQuestions from "../../Hooks/teacher/DeleatQuestions";
const ExamTeacher = () => {
  const { examId } = useParams();
  const [quistionsLoading, quistions] = GitTeacherQuistions({ id: examId });
  const [selectedQustion, setSelectedQustions] = useState(null);
  {
    quistionsLoading ? null : console.log(quistions);
  }
  const [deleteQuestionLoading, deletQuestion] = DeleatQuestions();
  const examquestions = quistions.qusetions;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  if (quistionsLoading) {
    return (
      <Stack className="w-[90%] m-auto mt-[150px]" style={{ height: "60vh" }}>
        <Skeleton height="20px" className="mt-5" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <ScrollToTop />
      </Stack>
    );
  }
  return (
    <div className="mt-[150px]" style={{ minHeight: "60vh" }}>
      <div className="flex justify-center">
        <div className="ribbon2">
          <h1 className="font-bold mx-4 m-2 text-white">{quistions.name}</h1>
        </div>
      </div>
      <div>
        {examquestions ? (
          <div>
            {examquestions.map((question, index) => {
              return (
                <div key={question.id} className="my-5  w-[90%] m-auto">
                  <div>
                    <div className="flex justify-between">
                      <h1 className="font-bold">
                        {" "}
                        {index + 1}- {question.question}
                      </h1>
                      <MdDelete
                        className="text-red-500 text-2xl"
                        onClick={() => {
                          setSelectedQustions(question);
                          onOpen();
                        }}
                      />
                      <AlertDialog
                        isOpen={isOpen}
                        leastDestructiveRef={cancelRef}
                        onClose={onClose}
                      >
                        <AlertDialogOverlay>
                          <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                              حذف سؤال
                            </AlertDialogHeader>

                            <AlertDialogBody>
                              {selectedQustion && (
                                <h1 className="font-bold ">
                                  هل بالتاكيد تريد حذف سؤال :
                                  {selectedQustion.question} ؟
                                </h1>
                              )}
                            </AlertDialogBody>

                            <AlertDialogFooter>
                              <Button
                                ref={cancelRef}
                                onClick={onClose}
                                className="mx-2"
                              >
                                الغاء
                              </Button>
                              <Button
                                colorScheme="red"
                                onClick={() => {
                                  deletQuestion(selectedQustion.id);
                                }}
                                ml={3}
                                className="mx-2"
                              >
                                {deleteQuestionLoading ? (
                                  <Spinner />
                                ) : (
                                  " نعم حذف"
                                )}
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialogOverlay>
                      </AlertDialog>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <RadioGroup>
                          <Stack className="block">
                            <Radio value={question.answer1} isDisabled>
                              {question.answer1}
                            </Radio>
                            <Radio value={question.answer2} isDisabled>
                              {question.answer2}
                            </Radio>
                            <Radio value={question.answer3} isDisabled>
                              {question.answer3}
                            </Radio>
                            <Radio value={question.answer4} isDisabled>
                              {question.answer4}
                            </Radio>
                          </Stack>
                        </RadioGroup>
                      </div>
                      <div>
                        {question.image ? (
                          <img
                            src={question.image}
                            className="h-[200px ] w-[200px] "
                            alt="Question"
                          />
                        ) : null}
                      </div>
                    </div>
                            {" "}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div> لا يوجد اسئلة </div>
        )}
      </div>
      <div className="text-center"></div>
      <ScrollToTop />
    </div>
  );
};

export default ExamTeacher;
