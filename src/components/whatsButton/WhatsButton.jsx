import { IoLogoWhatsapp } from "react-icons/io";
import { FaHeadset } from "react-icons/fa";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

const WhatsButton = () => {
  const supportPath = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!token) return "/support-guest";
      if (user?.role === "teacher") return "/support-teacher";
      if (user?.role === "admin") return "/support-chat";
      return "/support";
    } catch {
      return "/support-guest";
    }
  }, []);

  const handleWhatsappClick = () => {
    const phoneNumber = "+201111272393";
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-center gap-3 z-50">
      <Link
        to={supportPath}
        className="md:hidden bg-[#075e54] hover:opacity-90 text-white p-3 rounded-full shadow-lg transition flex items-center justify-center"
        aria-label="الدعم الفني"
      >
        <FaHeadset className="text-2xl" />
      </Link>

      <button
        className="flex bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition"
        onClick={handleWhatsappClick}
        aria-label="Contact via WhatsApp"
      >
        <IoLogoWhatsapp className="text-2xl" />
      </button>
    </div>
  );
};

export default WhatsButton;
