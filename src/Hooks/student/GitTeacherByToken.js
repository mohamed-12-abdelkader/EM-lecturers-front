import { useQuery } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";
import { readAuthToken } from "../../utils/authStorage";

const fetchTeacherData = async (token) => {
  const response = await baseUrl.get("/api/student/available-teachers", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data?.teachers || [];
};

const useGitTeacherByToken = () => {
  const token = readAuthToken();

  const {
    data: teachers,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["teachers", token || "guest"],
    queryFn: () => fetchTeacherData(token),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  if (error) {
    console.error("Error fetching teacher data:", error);
  }

  return [loading, teachers || []];
};

export default useGitTeacherByToken;
