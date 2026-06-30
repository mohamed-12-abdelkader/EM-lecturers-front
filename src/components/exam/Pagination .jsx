import React from "react";
import { Button } from "@chakra-ui/react";

const Pagination = ({
  currentQuestionIndex,
  examQuestions,
  handlePreviousQuestion,
  handleNextQuestion,
  handlePageChange,
}) => {
  const renderPagination = () => {
    const totalQuestions = examQuestions.length;
    const buttonsToShow = 2; // عدد الأزرار التي تريد عرضها باستثناء البداية والنهاية والنقاط

    const pagination = [];

    // زر البداية
    pagination.push(
      <Button
        key={0}
        colorScheme={currentQuestionIndex === 0 ? "blue" : "gray"}
        onClick={() => handlePageChange(0)}
      >
        1
      </Button>
    );

    // النقاط إذا كان السؤال الحالي بعيدًا عن البداية
    if (currentQuestionIndex > buttonsToShow + 1) {
      pagination.push(
        <Button key="start-ellipsis" isDisabled>
          ...
        </Button>
      );
    }

    // الأزرار حول السؤال الحالي
    const startPage = Math.max(currentQuestionIndex - buttonsToShow, 1);
    const endPage = Math.min(
      currentQuestionIndex + buttonsToShow,
      totalQuestions - 2
    );

    for (let i = startPage; i <= endPage; i++) {
      pagination.push(
        <Button
          key={i}
          colorScheme={currentQuestionIndex === i ? "blue" : "gray"}
          onClick={() => handlePageChange(i)}
        >
          {i + 1}
        </Button>
      );
    }

    // النقاط إذا كان السؤال الحالي بعيدًا عن النهاية
    if (currentQuestionIndex < totalQuestions - buttonsToShow - 2) {
      pagination.push(
        <Button key="end-ellipsis" isDisabled>
          ...
        </Button>
      );
    }

    // زر النهاية
    pagination.push(
      <Button
        key={totalQuestions - 1}
        colorScheme={
          currentQuestionIndex === totalQuestions - 1 ? "blue" : "gray"
        }
        onClick={() => handlePageChange(totalQuestions - 1)}
      >
        {totalQuestions}
      </Button>
    );

    return pagination;
  };

  return (
    <div className="flex flex-wrap justify-center mt-4">
      {/* زر الانتقال للسؤال السابق */}
      <Button
        colorScheme="blue"
        onClick={handlePreviousQuestion}
        isDisabled={currentQuestionIndex === 0}
        className="mx-2"
      >
        السابق
      </Button>

      {/* أزرار الباجنيشن */}
      {renderPagination()}

      {/* زر الانتقال للسؤال التالي */}
      <Button
        colorScheme="blue"
        onClick={handleNextQuestion}
        isDisabled={currentQuestionIndex === examQuestions.length - 1}
        className="mx-2"
      >
        التالي
      </Button>
    </div>
  );
};

export default Pagination;
