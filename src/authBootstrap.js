/**
 * يجب أن يكون أول import في main.jsx:
 * يفعّل مخزن التوكن بالذاكرة + جسر التوافق مع localStorage
 * قبل تحميل أي وحدة أخرى قد تقرأ التوكن.
 */
import { initTokenStore } from "./services/tokenStore";

initTokenStore();
