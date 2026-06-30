import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";

const fetchfreeMonthData = async (token) => {
  const response = await baseUrl.get("api/month/free", {
    headers: { token: token },
  });
  return response.data;
};

const useGitFreeCourses = () => {
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();

  const {
    data: freeMonth,
    isLoading: freeMonthLoading,
    error,
  } = useQuery({
    queryKey: ["freeMonth"],
    queryFn: () => fetchfreeMonthData(token),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchInterval: 10000,
  });

  const refetchData = () => {
    queryClient.invalidateQueries(["freeMonth"]); // Force refetch
  };

  return { freeMonth, freeMonthLoading, refetchData };
};

export default useGitFreeCourses;
