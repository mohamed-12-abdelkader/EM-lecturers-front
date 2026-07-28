import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SectionOne from "../../components/home/SectionOne";
import UserType from "../../Hooks/auth/userType";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import HomeLogin from "../homeLogin/HomeLogin";
import Footer from "../../components/home/Footer";
import SectionTwo from "../../components/home/SectionTwo";
import SectionThree from "../../components/home/SectionThree";
import AboutUsSection from "../../components/home/AboutUsSection";

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

      <Footer />
      <ScrollToTop />
    </div>
  );
};
export default Home;
