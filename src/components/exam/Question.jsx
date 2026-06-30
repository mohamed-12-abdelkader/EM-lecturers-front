import React from "react";
import { Box, Radio, RadioGroup, Stack } from "@chakra-ui/react";

const Question = ({
  currentQuestion,
  currentQuestionIndex,
  userAnswers,
  handleSelectAnswer,
}) => {
  // استرداد الإجابة الحالية
  const currentUserAnswer = userAnswers.find(
    (answer) => answer.qid === currentQuestion.id
  )?.ans;

  return (
    <div key={currentQuestion.id} className="my-5 w-[90%] m-auto">
      <h1 className="font-bold text-xl">
        {currentQuestionIndex + 1} - {currentQuestion.question}
      </h1>
      <div>
        {/* عرض صورة السؤال إن وجدت */}
        {currentQuestion.image && (
          <img
            src={currentQuestion.image}
            className="h-[300px] w-[90%] my-5 md:w-[70%] m-auto"
            alt="Question"
          />
        )}
        <RadioGroup
          className="my-5"
          value={currentUserAnswer}
          onChange={(value) => handleSelectAnswer(currentQuestion.id, value)}
        >
          <Stack className="block my-8">
            <Radio value={currentQuestion.answer1}>
              {currentQuestion.answer1}
            </Radio>
            <Radio value={currentQuestion.answer2}>
              {currentQuestion.answer2}
            </Radio>
            <Radio value={currentQuestion.answer3}>
              {currentQuestion.answer3}
            </Radio>
            <Radio value={currentQuestion.answer4}>
              {currentQuestion.answer4}
            </Radio>
          </Stack>
        </RadioGroup>
      </div>
    </div>
  );
};

export default Question;
