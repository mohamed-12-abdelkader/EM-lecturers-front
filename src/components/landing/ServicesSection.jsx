import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaBroadcastTower,
  FaMap,
  FaHeadset,
  FaCogs,
  FaRobot,
  FaQuestionCircle,
  FaPaintBrush,
  FaShareAlt,
  FaBullhorn,
} from "react-icons/fa";

const ServicesSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const zoomIn = {
    hidden: { opacity: 0, scale: 0.85, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2 },
    },
  };

  const services = [
    { icon: FaBroadcastTower, title: "بث مباشر", description: "بث دروس تفاعلية مباشرة مع المعلمين لتوفير تجربة تعليمية ديناميكية ومباشرة." },
    { icon: FaMap, title: "خطة مدروسة للنجاح", description: "خطط تعليمية مخصصة لتحقيق أهدافك الأكاديمية بكفاءة وفعالية عالية." },
    { icon: FaHeadset, title: "خدمة عملاء", description: "دعم عملاء متاح 24/7 للإجابة على استفساراتك وحل مشكلاتك بسرعة." },
    { icon: FaCogs, title: "سيستم إدارة السناتر", description: "نظام متكامل لإدارة السناتر التعليمية بسهولة وكفاءة عالية." },
    { icon: FaRobot, title: "أدوات ذكاء اصطناعي", description: "أدوات مدعومة بالذكاء الاصطناعي لتحسين التجربة التعليمية والتقييم." },
    { icon: FaQuestionCircle, title: "بنك أسئلة", description: "مكتبة ضخمة من الأسئلة التعليمية لتدريب الطلاب على مختلف المواد." },
    { icon: FaPaintBrush, title: "تصميمات سوشيال ميديا", description: "تصميمات احترافية للسوشيال ميديا لتعزيز الحضور الرقمي للسناتر." },
    { icon: FaShareAlt, title: "باقات إدارة السوشيال ميديا", description: "إدارة شاملة للسوشيال ميديا لزيادة التفاعل والانتشار." },
    { icon: FaBullhorn, title: "ماركتينج", description: "حملات تسويقية مخصصة لزيادة الوعي بالعلامة التجارية والجذب." },
  ];

  return (
    <section
      dir="rtl"
      className="py-20 "
      style={{ fontFamily: "'Changa', sans-serif" }}
      ref={ref}
    >
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2
            variants={zoomIn}
            className="text-4xl font-bold text-gray-800"
            style={{ fontFamily: "'Amiri', serif" }}
          >
            خدماتنا
          </motion.h2>
          <motion.p
            variants={zoomIn}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mt-4"
          >
            نقدم مجموعة شاملة من الخدمات التعليمية والتسويقية لدعم الطلاب والمراكز التعليمية.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={zoomIn}
              whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
              className="bg-white p-6 rounded-xl shadow-md transition-transform duration-300 text-center border border-gray-100 hover:border-orange-400"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-orange-100 p-4 rounded-full">
                  <service.icon className="text-orange-500 text-4xl" />
                </div>
              </div>
              <h3
                className="text-xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: "'Tajawal', sans-serif" }}
              >
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
