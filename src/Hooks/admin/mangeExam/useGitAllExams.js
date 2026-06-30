import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseUrl from "../../../api/baseUrl";

const fetchExamsData = async (token) => {
  const response = await baseUrl.get("api/exams-manage/collections", {
    headers: { token: token },
  });
  return response.data;
};

const useGitAllExams = () => {
  const queryClient = useQueryClient(); // للحصول على queryClient
  const token = localStorage.getItem("token");

  const {
    data: exams,
    isLoading: examsLoading,
    error,
  } = useQuery({
    queryKey: ["exams"], // Cache key
    queryFn: () => fetchExamsData(token), // Fetch function
    staleTime: 1000 * 60 * 5, // Keep data cached for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep data in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const refetchExam = () => {
    queryClient.invalidateQueries(["exams"]); // تحديث الكاش وجلب البيانات من جديد
  };

  return [examsLoading, exams, refetchExam];
};

export default useGitAllExams;
