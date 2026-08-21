import React from "react";
import useBrandLoading from "./useBrandLoading";
import {
  BRAND_LOADING_HERO_SRC,
  warmupBrandLoadingHero,
} from "../../utils/brandLoadingHero";
import "./BrandLoadingScreen.css";

warmupBrandLoadingHero();

/**
 * شاشة تحميل بالبراند.
 *
 * - الاستخدام العادي (`return <BrandLoadingScreen />`): يفعّل الـ overlay الموحّد ولا يُرندر DOM محلي.
 * - `overlay`: للـ host فقط — يُرندر واجهة التحميل فعلياً.
 *
 * @param {Object} props
 * @param {boolean} [props.overlay] - عرض الواجهة (Host).
 * @param {number} [props.progress] - 0–1 لشريط تقدم محدد.
 */
export default function BrandLoadingScreen({ overlay = false, progress }) {
  useBrandLoading(!overlay);

  if (!overlay) return null;
  return <BrandLoadingScreenView progress={progress} />;
}

function BrandLoadingScreenView({ progress }) {
  const hasDeterminate = typeof progress === "number";
  const pct = hasDeterminate
    ? Math.min(100, Math.max(0, progress * 100))
    : 0;

  return (
    <div
      className="brand-loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="جاري التحميل"
    >
      <div className="brand-loading-screen__top" aria-hidden="true" />

      <div className="brand-loading-screen__pulse">
        <div className="brand-loading-screen__hero-wrap">
          <img
            className="brand-loading-screen__hero"
            src={BRAND_LOADING_HERO_SRC}
            alt=""
            width={300}
            height={300}
            decoding="sync"
            fetchPriority="high"
            loading="eager"
            draggable={false}
          />
        </div>
        <p className="brand-loading-screen__text">جاري التحميل…</p>
      </div>

      <div className="brand-loading-screen__bar" aria-hidden="true">
        {hasDeterminate ? (
          <div
            className="brand-loading-screen__bar-fill"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="brand-loading-screen__bar-indeterminate" />
        )}
      </div>
    </div>
  );
}
