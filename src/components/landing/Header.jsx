import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import logo from "../../../public/2 (5).png";
import logo2 from "../../../public/logooo.png";
import { Link } from 'react-router-dom';
import { Button } from '@chakra-ui/react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.98)']
  )

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: "#services", label: "خدماتنا" },
    { href: "#about", label: "عن المنصة" },
    { href: "#reviews", label: "آراء المعلمين" },
    { href: "#contact", label: "اتصل بنا" }
  ]

  return (
    <motion.div 
      dir='ltr'
      style={{ background: headerBackground }}
      className="sticky top-0 z-50 w-full border-b border-gray-200/50 backdrop-blur-md"
    >
      <motion.header 
        className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="flex items-center space-x-2 space-x-reverse"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <img 
            src={logo} 
            alt="شعار أكاديمية EM"  
            className="h-12 w-auto transition-all duration-300 hover:drop-shadow-lg"
          />
        </motion.div>
  
        <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link 
                href={item.href} 
                className="relative text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-300 group"
              >
                {item.label}
                <motion.span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full"
                  whileHover={{ width: "100%" }}
                />
              </Link>
            </motion.div>
          ))}
        </nav>
  
        <motion.div 
          className="flex items-center space-x-4 space-x-reverse"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              className="hidden md:inline-flex text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              تسجيل الدخول
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              ابدأ الآن
            </Button>
          </motion.div>
        </motion.div>
      </motion.header>
    </motion.div>
  )
}

export default Header