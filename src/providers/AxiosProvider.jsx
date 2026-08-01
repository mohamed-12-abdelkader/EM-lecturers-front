/**
 * AxiosProvider — يتيح الوصول لنسخة axios الموحدة عبر Context/hook
 * بدل الاستيراد المباشر (الـ interceptors مركّبة مسبقاً في api/baseUrl.js).
 */
import { createContext, useContext } from "react";
import baseUrl from "../api/baseUrl";

const AxiosContext = createContext(baseUrl);

/** نسخة axios الجاهزة (Bearer من الذاكرة + refresh تلقائي + هيدر المنصة) */
export function useAxios() {
  return useContext(AxiosContext);
}

export default function AxiosProvider({ children }) {
  return <AxiosContext.Provider value={baseUrl}>{children}</AxiosContext.Provider>;
}
