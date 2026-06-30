import React from "react";
import baseUrl from "../../../api/baseUrl";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// الدالة التي تجلب البيانات باستخدام id
const fetchExamsMarks = async (token, id) => {
  const response = await baseUrl.get(
    `api/exams-manage/marks/${id}?order=desc`,
    {
      headers: { token: token },
    }
  );
  return response.data;
};
const useGitStudentMarks = (id) => {
  const queryClient = useQueryClient(); // للحصول على queryClient
  const token = localStorage.getItem("token");

  const {
    data: marks,
    isLoading: marksLoading,
    error,
  } = useQuery({
    queryKey: ["marks", id], // Cache key يشمل id
    queryFn: () => fetchExamsMarks(token, id), // Fetch function تأخذ id
    enabled: !!id, // يتم التحقق من أن id موجود لتجنب الأخطاء
    staleTime: 1000 * 60 * 5, // Keep data cached for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const refetchExam = () => {
    queryClient.invalidateQueries(["marks", id]); // تحديث الكاش وجلب البيانات بناءً على id
  };

  return [marksLoading, marks, refetchExam];
};

export default useGitStudentMarks;
