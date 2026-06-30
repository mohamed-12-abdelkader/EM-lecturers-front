import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SectionOne from "../../components/home/SectionOne";
import UserType from "../../Hooks/auth/userType";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import HomeLogin from "../homeLogin/HomeLogin";
import Footer from "../../components/home/Footer";
import SectionTwo from "../../components/home/SectionTwo";
import SectionThree from "../../components/home/SectionThree";
import AboutUsSection from "../../components/home/AboutUsSection";
import { IconButton, Tooltip, Box } from "@chakra-ui/react";
import { FaHeadset } from "react-icons/fa";

const Home = () => {
  const [userData] = UserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData) {
      navigate("/home");
    }
  }, [userData, navigate]);

  return (
    <div>
      {userData ? (
        <div>
          <HomeLogin />
        </div>
      ) : (
        <div className="mt-[80px]">
          <SectionOne />
          <SectionTwo />
          <AboutUsSection />
          <SectionThree />
        </div>
      )}

      {/* أيقونة الشات الفني للزوار (عند عدم وجود مستخدم مسجل) */}
      {!userData && (
        <Tooltip label="الدعم الفني — مساعدة التسجيل والدخول" placement="left" hasArrow>
          <Box
            position="fixed"
            bottom={{ base: "24", md: "8" }}
            left={{ base: "4", md: "8" }}
            zIndex={50}
          >
            <IconButton
              as={Link}
              to="/support-guest"
              aria-label="الدعم الفني"
              icon={<FaHeadset />}
              size="lg"
              colorScheme="green"
              borderRadius="full"
              boxShadow="lg"
              _hover={{ transform: "scale(1.05)" }}
              transition="transform 0.2s"
            />
          </Box>
        </Tooltip>
      )}

      <Footer />
      <ScrollToTop />
    </div>
  );
};
export default Home;
