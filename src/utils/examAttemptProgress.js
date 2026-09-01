import { toPositiveAttemptId } from "./examFlowUtils";

function currentUserStorageId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.id || user.user_id || user.student_id || "u";
  } catch {
    return "u";
  }
}

export function examAttemptStorageKey(examId) {
  return `em-lecture-exam-attempt:${currentUserStorageId()}:${examId}`;
}

export function examProgressStorageKey(examId, attemptId) {
  return `em-lecture-exam-progress:${currentUserStorageId()}:${examId}:${attemptId}`;
}

export function readExamProgress(examId, attemptId) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return null;
  const key = examProgressStorageKey(examId, id);
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeExamProgress(examId, attemptId, payload = {}) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return;
  const key = examProgressStorageKey(examId, id);
  const value = JSON.stringify({
    attemptId: id,
    answers: payload.answers && typeof payload.answers === "object" ? payload.answers : {},
    current: Number.isInteger(payload.current) ? payload.current : 0,
    endsAt: payload.endsAt ?? null,
    startedAt: payload.startedAt ?? null,
    savedAt: Date.now(),
  });
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
}

export function clearExamProgress(examId, attemptId) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return;
  const key = examProgressStorageKey(examId, id);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readPersistedAttemptId(examId) {
  if (!examId || typeof window === "undefined") return null;
  const key = examAttemptStorageKey(examId);
  try {
    return (
      toPositiveAttemptId(sessionStorage.getItem(key)) ||
      toPositiveAttemptId(localStorage.getItem(key))
    );
  } catch {
    return null;
  }
}

export function persistAttemptId(examId, attemptId) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return;
  const key = examAttemptStorageKey(examId);
  const value = String(id);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
}

export function clearPersistedAttemptId(examId) {
  if (!examId || typeof window === "undefined") return;
  const attemptId = readPersistedAttemptId(examId);
  const key = examAttemptStorageKey(examId);
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  if (attemptId) clearExamProgress(examId, attemptId);
}

export function hasInProgressExamAttempt(examId) {
  return Boolean(readPersistedAttemptId(examId));
}

export function isQuestionAnswered(question, answers = {}) {
  if (!question) return false;
  const qId = question.type === "passage_sub" ? question.sub_question?.id : question.id;
  const value = answers[qId] ?? answers[String(qId)];
  return value != null && String(value).trim() !== "";
}

export function countAnsweredQuestions(questions = [], answers = {}) {
  return questions.filter((question) => isQuestionAnswered(question, answers)).length;
}
