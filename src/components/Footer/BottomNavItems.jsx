import React from 'react'
import { Box, HStack, VStack, Icon, Text, useColorModeValue } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaQuestionCircle, FaTrophy, FaUsers, FaUser } from 'react-icons/fa'

const BottomNavItems = () => {
     const location = useLocation();
     const borderColor = useColorModeValue('gray.200', 'gray.600');
     const isActivePath = (href) => location.pathname === href || location.pathname.startsWith(href + '/');
     const bottomNavItems = [
    { label: "الرئيسية", href: "/home", icon: FaHome },
    { label: "بنك الاسئله ", href: "/question_bank", icon: FaQuestionCircle },
    { label: "الدوري", href: "/leagues", icon: FaTrophy },
    { label: "سوشيال", href: "/social", icon: FaUsers },
   
   ];
  return (
    <div>
       <Box
       
        display={{ base: "block", md: "none" }}
        position="fixed"
        bottom={0}
        left={0}
        width="100%"
        bg={useColorModeValue("white", "gray.800")}
        borderTop="1px solid"
        borderColor={borderColor}
        zIndex={1000}
        pb="env(safe-area-inset-bottom)"
      >
        <HStack justify="space-around" align="center" py={2}>
          {bottomNavItems.map((item) => {
            const IconComp = item.icon;
            const active = isActivePath(item.href);
            return (
              <VStack key={item.href} spacing={0} as={Link} to={item.href} minW="20%">
                <Icon as={IconComp} boxSize={active ? 6 : 5} color={active ? "blue.500" : "gray.500"} />
                <Text fontSize="xs" color={active ? "blue.600" : "gray.500"} fontWeight={active ? "bold" : "medium"}>
                  {item.label}
                </Text>
              </VStack>
            );
          })}
        </HStack>
      </Box>
    </div>
  )
}

export default BottomNavItems