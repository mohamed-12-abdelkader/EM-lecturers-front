import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import HomeLogin from "../homeLogin/HomeLogin";
import Footer from "../../components/home/Footer";
import EmStoryLanding from "../../components/home/emStory/EmStoryLanding";

const Home = () => {
  const [userData] = UserType();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData) {
      navigate("/home");
    }
  }, [userData, navigate]);

  return (
    <div style={!userData ? { background: "#070B14", colorScheme: "dark" } : undefined}>
      {userData ? (
        <HomeLogin />
      ) : (
        <EmStoryLanding />
      )}

      <Footer forceDark={!userData} />
      <ScrollToTop />
    </div>
  );
};

export default Home;
