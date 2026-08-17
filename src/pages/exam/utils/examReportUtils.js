/** توحيد حقول تقرير الامتحان (شامل / محاضرة / واجب) */

function normalizeStudent(student) {
  if (!student || typeof student !== "object") return student;
  const selectedAnswer =
    student.selectedAnswer ??
    (student.selectedChoiceId != null ? String(student.selectedChoiceId) : null);
  return {
    ...student,
    selectedAnswer,
    selectedAnswerText: student.selectedAnswerText ?? null,
  };
}

function normalizeQuestion(question) {
  if (!question || typeof question !== "object") return question;
  const wrongStudentsRaw = question.wrongStudents ?? question.incorrectStudents ?? [];
  const unansweredStudents = (question.unansweredStudents ?? []).map(normalizeStudent);
  const wrongStudents = wrongStudentsRaw.map(normalizeStudent);
  const correctStudents = (question.correctStudents ?? []).map(normalizeStudent);

  const wrongCount =
    question.wrongCount ??
    question.incorrectCount ??
    wrongStudents.length;

  const correctCount = question.correctCount ?? correctStudents.length;
  const totalStudents =
    question.statistics?.totalStudents ??
    question.totalResponses ??
    correctCount + wrongCount;

  return {
    ...question,
    correctCount,
    wrongCount,
    unansweredCount: question.unansweredCount ?? unansweredStudents.length,
    correctStudents,
    wrongStudents,
    unansweredStudents,
    statistics: question.statistics ?? {
      totalStudents,
      totalAnswers: totalStudents,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
    },
  };
}

export function normalizeReportPayload(data) {
  if (!data || typeof data !== "object") {
    return {
      exam: {},
      overallStatistics: {},
      questions: [],
      sortedQuestions: [],
      mostProblematicQuestions: [],
    };
  }

  const questions = (Array.isArray(data.questions) ? data.questions : []).map(
    normalizeQuestion,
  );

  const sortedQuestions = Array.isArray(data.sortedQuestions)
    ? data.sortedQuestions.map(normalizeQuestion)
    : [...questions].sort((a, b) => (b.wrongCount ?? 0) - (a.wrongCount ?? 0));

  const mostProblematicQuestions = Array.isArray(data.mostProblematicQuestions)
    ? data.mostProblematicQuestions
    : sortedQuestions
        .filter((q) => (q.wrongCount ?? 0) > 0)
        .slice(0, 5)
        .map((q) => ({
          questionId: q.questionId,
          questionText: q.questionText,
          wrongAnswers: q.wrongCount,
          wrongCount: q.wrongCount,
          wrongPercentage: q.statistics?.wrongPercentage ?? 0,
        }));

  return {
    exam: data.exam || {},
    overallStatistics: data.overallStatistics || {},
    questions,
    sortedQuestions,
    mostProblematicQuestions,
  };
}

export function resolveExamReportRoute(pathname = "") {
  const path = String(pathname);

  if (path.includes("/lecture-exam/")) {
    return { kind: "lecture", backSegment: "lecture-exam" };
  }
  if (path.startsWith("/exam/")) {
    return { kind: "course-level", backSegment: "exam" };
  }
  if (path.includes("/ComprehensiveExam/")) {
    return { kind: "lecture", backSegment: "ComprehensiveExam" };
  }

  return { kind: "lecture", backSegment: "ComprehensiveExam" };
}

export function buildExamReportPath(examId, { from = "lecture" } = {}) {
  if (from === "course-level") return `/exam/${examId}/report`;
  return `/lecture-exam/${examId}/report`;
}

export function buildExamManagePath(examId, { from = "lecture" } = {}) {
  if (from === "course-level") return `/exam/${examId}`;
  return `/ComprehensiveExam/${examId}`;
}
