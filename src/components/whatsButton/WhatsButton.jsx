import { IoLogoWhatsapp } from "react-icons/io";
import { FaHeadset } from "react-icons/fa";
import React from "react";
import { Link } from "react-router-dom";

const WhatsButton = () => {
  const handleWhatsappClick = () => {
    const phoneNumber = "+201111272393";
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-center gap-3 z-50">
      {/* على الموبايل: أيقونة الدعم الفني (تنقل لصفحة الدعم) */}
      <Link
        to="/support"
        className="md:hidden bg-[#075e54] hover:opacity-90 text-white p-3 rounded-full shadow-lg transition flex items-center justify-center"
        aria-label="الدعم الفني"
      >
        <FaHeadset className="text-2xl" />
      </Link>

      {/* على الشاشات الأكبر: زر الواتساب */}
      <button
        className="hidden md:flex bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition"
        onClick={handleWhatsappClick}
        aria-label="Contact via WhatsApp"
      >
        <IoLogoWhatsapp className="text-2xl" />
      </button>
    </div>
  );
};

export default WhatsButton;
