import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Header from '../../components/landing/Header'
import HeroSection from '../../components/landing/HeroSection'
import ServicesSection from '../../components/landing/ServicesSection'
import TimelineSection from '../../components/landing/TimelineSection'
import WhyUsSection from '../../components/landing/WhyUsSection'
import TestimonialsSection from '../../components/landing/TestimonialsSection'
import PricingSection from '../../components/landing/PricingSection'
import ImageFlipbookSection from '../../components/landing/ImageFlipbookSection'
import WhyWorkWithUsSection from '../../components/landing/WhyWorkWithUsSection'

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  useEffect(() => {
    // تحميل الصفحة مع تأثير انتقالي
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div 
      dir='rtl'
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden"
    >
      {/* شريط التقدم المحسن */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transform origin-left z-50 shadow-lg"
        style={{ scaleX }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* مؤشر الموقع */}
      <motion.div
        className="fixed top-4 right-4 z-40 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        {Math.round(scrollYProgress.get() * 100)}%
      </motion.div>

      {/* خلفية متحركة محسنة */}
   

      {/* تأثيرات الجزيئات المتحركة المحسنة */}
      

    
      {/* تأثيرات الضوء */}
     

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Header/>
      </motion.div>

     
        <HeroSection/>
     

      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        whileInView={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ scale: 1.02 }}
      >
        <WhyWorkWithUsSection/>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0, rotateY: -15 }}
        whileInView={{ y: 0, opacity: 1, rotateY: 0 }}
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          type: "spring",
          stiffness: 80
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ rotateY: 5 }}
      >
        <ImageFlipbookSection/>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0, x: -30 }}
        whileInView={{ y: 0, opacity: 1, x: 0 }}
        transition={{ 
          duration: 1, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ x: 5 }}
      >
        <ServicesSection/>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0, x: 30 }}
        whileInView={{ y: 0, opacity: 1, x: 0 }}
        transition={{ 
          duration: 1, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ x: -5 }}
      >
        <WhyUsSection/>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.9 }}
        whileInView={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.1, 
          ease: "easeOut",
          type: "spring",
          stiffness: 90
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ scale: 1.03 }}
      >
        <TimelineSection/>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0, rotateX: 15 }}
        whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          type: "spring",
          stiffness: 80
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ rotateX: -5 }}
      >
        <TestimonialsSection/>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        whileInView={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{ scale: 1.02 }}
      >
        <PricingSection/>
      </motion.div>

      {/* زر العودة للأعلى المحسن */}
      <motion.button
        className="fixed bottom-8 left-8 z-40 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-sm border border-white/20"
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        initial={{ opacity: 0, y: 100, rotate: -180 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ 
          delay: 1.5, 
          duration: 0.8,
          type: "spring",
          stiffness: 200
        }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true }}
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        </motion.div>
        
        {/* تلميح */}
        <motion.div
          className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 pointer-events-none"
          initial={{ opacity: 0, x: 10 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          العودة للأعلى
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </motion.div>
      </motion.button>
    </motion.div>
  )
}

export default LandingPage