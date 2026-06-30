import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";

const fetchcomps = async (token) => {
  const response = await baseUrl.get("api/manage-comps", {
    headers: { token: token },
  });
  return response.data;
};

const useGitCompByAdmin = () => {
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient(); // لإدارة الكاش

  const {
    data: comps,
    isLoading: compsLoading,
    error,
  } = useQuery({
    queryKey: ["comps"], // مفتاح تعريف الكاش
    queryFn: () => fetchcomps(token), // الدالة التي تجلب البيانات
    staleTime: 1000 * 60 * 5, // احتفاظ البيانات بالكاش لمدة 5 دقائق قبل إعادة التحميل
    cacheTime: 1000 * 60 * 10, // إبقاء الكاش لمدة 10 دقائق
    refetchOnWindowFocus: false, // يمنع إعادة التحميل عند التركيز على النافذة
  });

  // وظيفة لتحديث البيانات يدويًا
  const refetchComps = () => {
    queryClient.invalidateQueries(["comps"]); // تحديث الكاش وجلب البيانات من جديد
  };

  if (error) {
    console.error("Error fetching data:", error);
  }

  return [compsLoading, comps, refetchComps];
};

export default useGitCompByAdmin;
