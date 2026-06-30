import React, { useRef } from "react";
import { FaArrowLeft, FaPlay, FaRocket, FaUsers, FaAward } from "react-icons/fa";
import { motion, useScroll, useTransform } from "framer-motion";

const HeroSection = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);

  // تأثيرات الحركة للعناصر
  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const features = [
    { icon: FaRocket, text: "تعلم سريع وفعال" },
    { icon: FaUsers, text: "مجتمع تعليمي نشط" },
    { icon: FaAward, text: "شهادات معتمدة" },
  ];

  return (
    <motion.div
      ref={containerRef}
      className="relative bg-gradient-to-b from-white to-blue-500 overflow-hidden"
      
    >
    
   

      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="space-y-6">
              <motion.span
                className="inline-block bg-gradient-to-r from-orange-200 to-pink-200 text-orange-800 text-sm font-semibold px-6 py-3 rounded-full shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                🎓 ارتقِ بمسيرتك التعليمية
              </motion.span>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900"
                style={{ fontFamily: "'Amiri', serif" }}
                variants={fadeInUp}
              >
                طوّر مهاراتك التعليمية مع{" "}
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                  EM Academy
                </span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                انضم إلى آلاف المعلمين الذين ارتقوا بمهاراتهم التدريسية من خلال منصتنا التعليمية الشاملة.
                دورات يقدمها خبراء، تعلم تفاعلي، ودعم مخصص.
              </motion.p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              <motion.button
                className="group flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaArrowLeft className="ml-2 transform group-hover:-translate-x-1 transition-transform" />
                ابدأ التدريس اليوم
              </motion.button>

              <motion.button
                className="group flex items-center justify-center border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-lg font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlay className="ml-2 transform group-hover:scale-110 transition-transform" />
                شاهد العرض التوضيحي
              </motion.button>
            </motion.div>

            {/* المميزات */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-6 mt-12"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 space-x-reverse bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default HeroSection;
