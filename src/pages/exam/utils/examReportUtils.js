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
  const groupId = raw.groupId ?? raw.group_id ?? null;
  return {
    passPercentage: toNumber(raw.passPercentage ?? raw.pass_percentage, 50),
    groupId: groupId == null || groupId === "" ? null : toNumber(groupId, groupId),
    groupName: raw.groupName ?? raw.group_name ?? "",
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

export function normalizeGroupFilter(raw) {
  if (!raw || typeof raw !== "object") return null;
  const groupId = raw.groupId ?? raw.group_id ?? null;
  if (groupId == null || groupId === "") return null;
  return {
    groupId: toNumber(groupId, groupId),
    groupName: raw.groupName ?? raw.group_name ?? "",
  };
}

export function normalizeStudyGroups(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((group) => ({
      id: group.id ?? group.groupId ?? group.group_id ?? null,
      name: group.name ?? group.groupName ?? group.group_name ?? "مجموعة",
      gradeId: group.gradeId ?? group.grade_id ?? null,
    }))
    .filter((group) => group.id != null);
}

export function normalizeNotExaminedStudents(list) {
  if (!Array.isArray(list)) return [];
  return list.map((student) => ({
    studentId: student.studentId ?? student.student_id ?? student.id ?? null,
    studentName:
      student.studentName ?? student.student_name ?? student.name ?? "طالب",
    studentEmail: student.studentEmail ?? student.student_email ?? student.email ?? "",
    groupName:
      student.groupName ??
      student.group_name ??
      student.studyGroupName ??
      student.study_group_name ??
      "",
    examStatus: student.examStatus ?? student.exam_status ?? "never_started",
    startedAt: student.startedAt ?? student.started_at ?? null,
    lastAutosaveAt: student.lastAutosaveAt ?? student.last_autosave_at ?? null,
    remainingSeconds: student.remainingSeconds ?? student.remaining_seconds ?? null,
    answeredCount: student.answeredCount ?? student.answered_count ?? null,
    questionsCount: student.questionsCount ?? student.questions_count ?? null,
  }));
}

export function normalizeExaminedStudents(list) {
  if (!Array.isArray(list)) return [];
  return list.map((student) => ({
    studentId: student.studentId ?? student.student_id ?? student.id ?? null,
    studentName:
      student.studentName ?? student.student_name ?? student.name ?? "طالب",
    studentEmail: student.studentEmail ?? student.student_email ?? student.email ?? "",
    groupName:
      student.groupName ??
      student.group_name ??
      student.studyGroupName ??
      student.study_group_name ??
      "",
    obtainedGrade: toNumber(student.obtainedGrade ?? student.obtained_grade),
    totalGrade: toNumber(student.totalGrade ?? student.total_grade),
    percentage: toNumber(student.percentage),
    passed: Boolean(student.passed),
    submittedAt: student.submittedAt ?? student.submitted_at ?? null,
  }));
}

export function normalizeReportPayload(data) {
  const payload =
    data?.exam || data?.enrollmentSummary || Array.isArray(data?.questions)
      ? data
      : data?.data && typeof data.data === "object"
        ? data.data
        : data;

  if (!payload || typeof payload !== "object") {
    return {
      exam: {},
      overallStatistics: {},
      questions: [],
      sortedQuestions: [],
      mostProblematicQuestions: [],
      enrollmentSummary: null,
      groupFilter: null,
      availableStudyGroups: [],
      examinedStudents: [],
      notExaminedStudents: [],
    };
  }

  const questions = (Array.isArray(payload.questions) ? payload.questions : []).map(
    normalizeQuestion,
  );

  const sortedQuestions = Array.isArray(payload.sortedQuestions)
    ? payload.sortedQuestions.map(normalizeQuestion)
    : [...questions].sort((a, b) => (b.wrongCount ?? 0) - (a.wrongCount ?? 0));

  const mostProblematicQuestions = Array.isArray(payload.mostProblematicQuestions)
    ? payload.mostProblematicQuestions
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
    exam: payload.exam || {},
    overallStatistics: payload.overallStatistics || payload.overall_statistics || {},
    questions,
    sortedQuestions,
    mostProblematicQuestions,
    enrollmentSummary: normalizeEnrollmentSummary(
      payload.enrollmentSummary ?? payload.enrollment_summary,
    ),
    groupFilter: normalizeGroupFilter(payload.groupFilter ?? payload.group_filter),
    availableStudyGroups: normalizeStudyGroups(
      payload.availableStudyGroups ??
        payload.available_study_groups ??
        payload.studyGroups ??
        payload.study_groups ??
        payload.groups ??
        payload.data?.availableStudyGroups ??
        payload.data?.available_study_groups ??
        payload.data?.studyGroups ??
        payload.data?.groups,
    ),
    examinedStudents: normalizeExaminedStudents(
      payload.examinedStudents ?? payload.examined_students,
    ),
    notExaminedStudents: normalizeNotExaminedStudents(
      payload.notExaminedStudents ?? payload.not_examined_students,
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
