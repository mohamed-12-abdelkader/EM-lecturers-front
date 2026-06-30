import { useQuery } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";

const fetchTeacherData = async (token) => {
  const response = await baseUrl.get("/api/student/available-teachers", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.teachers; // فقط teachers
};

const useGitTeacherByToken = () => {
  const token = localStorage.getItem("token");

  const {
    data: teachers,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeacherData(token),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  if (error) {
    console.error("Error fetching teacher data:", error);
  }

  return [loading, teachers];
};

export default useGitTeacherByToken;
