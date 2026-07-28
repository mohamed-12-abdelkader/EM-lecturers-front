import { IoLogoWhatsapp } from "react-icons/io";
import React from "react";

const WhatsButton = () => {
  const handleWhatsappClick = () => {
    const phoneNumber = "+201111272393";
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-center gap-3 z-50">
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
