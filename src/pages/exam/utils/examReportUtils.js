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

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStatBlock(block) {
  if (!block || typeof block !== "object") {
    return { count: 0, percentage: 0 };
  }
  const result = {
    count: toNumber(block.count),
    percentage: toNumber(block.percentage),
  };
  if (block.percentageOfExamined != null || block.percentage_of_examined != null) {
    result.percentageOfExamined = toNumber(
      block.percentageOfExamined ?? block.percentage_of_examined,
    );
  }
  return result;
}

export function normalizeEnrollmentSummary(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    passPercentage: toNumber(raw.passPercentage ?? raw.pass_percentage, 50),
    enrolledTotal: toNumber(raw.enrolledTotal ?? raw.enrolled_total),
    examined: normalizeStatBlock(raw.examined),
    notExamined: normalizeStatBlock(raw.notExamined ?? raw.not_examined),
    startedNotSubmitted: normalizeStatBlock(
      raw.startedNotSubmitted ?? raw.started_not_submitted,
    ),
    passed: normalizeStatBlock(raw.passed),
    failed: normalizeStatBlock(raw.failed),
  };
}

export function normalizeNotExaminedStudents(list) {
  if (!Array.isArray(list)) return [];
  return list.map((student) => ({
    studentId: student.studentId ?? student.student_id ?? student.id ?? null,
    studentName:
      student.studentName ?? student.student_name ?? student.name ?? "طالب",
    studentEmail: student.studentEmail ?? student.student_email ?? student.email ?? "",
    examStatus: student.examStatus ?? student.exam_status ?? "never_started",
  }));
}

export function normalizeReportPayload(data) {
  if (!data || typeof data !== "object") {
    return {
      exam: {},
      overallStatistics: {},
      questions: [],
      sortedQuestions: [],
      mostProblematicQuestions: [],
      enrollmentSummary: null,
      notExaminedStudents: [],
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
    enrollmentSummary: normalizeEnrollmentSummary(
      data.enrollmentSummary ?? data.enrollment_summary,
    ),
    notExaminedStudents: normalizeNotExaminedStudents(
      data.notExaminedStudents ?? data.not_examined_students,
    ),
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
