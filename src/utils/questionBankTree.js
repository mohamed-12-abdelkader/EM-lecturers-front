/** ترتيب وتوحيد شجرة: مادة → كتب → فصول → دروس */

export function sortByOrder(items = []) {
  return [...items].sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0));
}

export function sortChapters(chapters = []) {
  return sortByOrder(chapters).map((chapter) => ({
    ...chapter,
    lessons: sortByOrder(chapter.lessons),
  }));
}

/**
 * يبني قائمة الكتب من استجابة with-books أو من chapters مسطّحة (legacy).
 * @param {object} data — كائن data من API أو كائن مادة من قائمة المدرس
 */
export function normalizeSubjectBooks(data) {
  if (!data) return [];

  let booksList = Array.isArray(data.books) ? [...data.books] : [];

  if (!booksList.length && Array.isArray(data.chapters)?.length) {
    const byBook = new Map();
    data.chapters.forEach((chapter) => {
      const bookId = chapter.book_id ?? "legacy";
      if (!byBook.has(bookId)) {
        byBook.set(bookId, {
          id: chapter.book_id ?? `legacy-${data.id ?? data.subject?.id ?? "x"}`,
          name: "كتاب عام",
          description: "تم إنشاؤه تلقائياً أثناء ترقية النظام",
          order_num: 1,
          chapters: [],
        });
      }
      byBook.get(bookId).chapters.push(chapter);
    });
    booksList = [...byBook.values()];
  }

  return sortByOrder(booksList).map((book) => ({
    ...book,
    chapters: sortChapters(book.chapters),
  }));
}

/** كتب المادة من كائن مادة (قائمة مدرس أو مادة في بنك) */
export function getSubjectBooks(subject) {
  if (!subject) return [];
  return normalizeSubjectBooks(subject);
}

export function countSubjectChapters(subject) {
  return getSubjectBooks(subject).reduce(
    (total, book) => total + (book.chapters?.length || 0),
    0,
  );
}

export function countSubjectLessons(subject) {
  return getSubjectBooks(subject).reduce(
    (total, book) =>
      total +
      (book.chapters || []).reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0),
    0,
  );
}

export function countSubjectBooks(subject) {
  return getSubjectBooks(subject).length;
}

export function subjectMatchesSearch(subject, term) {
  if (!term) return true;
  const q = term.toLowerCase().trim();
  const haystack = [
    subject.name,
    subject.description,
    subject.grade_name,
    subject.question_bank_name,
  ];
  getSubjectBooks(subject).forEach((book) => {
    haystack.push(book.name, book.description);
    (book.chapters || []).forEach((ch) => {
      haystack.push(ch.name, ch.description);
      (ch.lessons || []).forEach((lesson) => {
        haystack.push(lesson.name, lesson.description);
      });
    });
  });
  return haystack.some((v) => v && String(v).toLowerCase().includes(q));
}

export function getChapterStats(chapter) {
  const lessonsCount =
    chapter.lessons_count ?? chapter.lesson_count ?? chapter.lessons?.length ?? 0;
  const questionsCount =
    chapter.questions_count ?? chapter.question_count ?? chapter.questions?.length ?? 0;
  return { lessonsCount, questionsCount };
}

export function getBookStats(book) {
  return (book.chapters || []).reduce(
    (acc, chapter) => {
      const stats = getChapterStats(chapter);
      return {
        chapters: acc.chapters + 1,
        lessons: acc.lessons + stats.lessonsCount,
        questions: acc.questions + stats.questionsCount,
      };
    },
    { chapters: 0, lessons: 0, questions: 0 },
  );
}

export function getSubjectTreeStats(subjectOrBooks) {
  const books = Array.isArray(subjectOrBooks)
    ? subjectOrBooks
    : getSubjectBooks(subjectOrBooks);
  return books.reduce(
    (totals, book) => {
      const stats = getBookStats(book);
      return {
        books: totals.books + 1,
        chapters: totals.chapters + stats.chapters,
        lessons: totals.lessons + stats.lessons,
        questions: totals.questions + stats.questions,
      };
    },
    { books: 0, chapters: 0, lessons: 0, questions: 0 },
  );
}
