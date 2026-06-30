import {
  Box,
  Flex,
  Text,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaVideo, FaTrophy } from "react-icons/fa";
import { IoIosPeople, IoIosWallet } from "react-icons/io";
import { MdAdminPanelSettings } from "react-icons/md";
import { Link } from "react-router-dom";

const Footer = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const footerBg = useColorModeValue("blue.500", "gray.800");
  const footerBorder = useColorModeValue("blue.600", "gray.700");
  const linkColor = useColorModeValue("white", "gray.200");
  const linkHoverBg = useColorModeValue("whiteAlpha.200", "whiteAlpha.100");
  const linkHoverColor = useColorModeValue("white", "white");

  if (!user) return null;

  const linkBaseProps = {
    py: 2,
    px: 4,
    borderRadius: "xl",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
    color: linkColor,
    fontWeight: "600",
    fontSize: "sm",
    _hover: { bg: linkHoverBg, color: linkHoverColor, transform: "translateY(-2px)" },
    transition: "all 0.2s",
  };

  return (
    <Box
      as="footer"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      w="full"
      bg={footerBg}
      borderTopWidth="2px"
      borderTopColor={footerBorder}
      boxShadow="0 -4px 20px rgba(0,0,0,0.08)"
      _dark={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.3)" }}
      zIndex={10}
      display={{ base: "none", md: "block" }}
    >
      <Box h="1" w="full" bgGradient="linear(to-r, blue.500, orange.500)" flexShrink={0} />
      <Flex justify="center" align="center" gap={2} py={3} px={4} flexWrap="wrap">
        {user.role === "admin" && (
          <>
            <Box as={Link} to="/admin/management" {...linkBaseProps}>
              <Icon as={MdAdminPanelSettings} boxSize={5} />
              <Text fontSize="xs">لوحة التحكم</Text>
            </Box>
            <Box as={Link} to="/competitions" {...linkBaseProps}>
              <Icon as={FaTrophy} boxSize={5} />
              <Text fontSize="xs">المسابقات</Text>
            </Box>
          </>
        )}

        {user.role === "teacher" && (
          <>
            <Box as={Link} to="/my_groups" {...linkBaseProps}>
              <Icon as={IoIosPeople} boxSize={5} />
              <Text fontSize="xs">مجموعاتى</Text>
            </Box>
            <Box as={Link} to="/teacher_courses" {...linkBaseProps}>
              <Icon as={FaVideo} boxSize={5} />
              <Text fontSize="xs">كورساتى</Text>
            </Box>
            <Box as={Link} to="/admin/add_month" {...linkBaseProps}>
              <Icon as={MdAdminPanelSettings} boxSize={5} />
              <Text fontSize="xs">لوحة التحكم</Text>
            </Box>
            <Box as={Link} to="/teacher_wallet" {...linkBaseProps}>
              <Icon as={IoIosWallet} boxSize={5} />
              <Text fontSize="xs">محفظتى</Text>
            </Box>
          </>
        )}

        {user.role !== "admin" && user.role !== "teacher" && (
          <>
            <Box as={Link} to="/teachers" {...linkBaseProps}>
              <Icon as={IoIosPeople} boxSize={5} />
              <Text fontSize="xs">المدرسين</Text>
            </Box>
            <Box as={Link} to="/my_courses" {...linkBaseProps}>
              <Icon as={FaVideo} boxSize={5} />
              <Text fontSize="xs">كورساتى</Text>
            </Box>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default Footer;
