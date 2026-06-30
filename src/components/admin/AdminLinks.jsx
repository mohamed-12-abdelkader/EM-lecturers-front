import { useLocation, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import UserType from "../../Hooks/auth/userType";
// أيقونات من react-icons
import { MdDashboard, MdPersonAdd, MdCode, MdAccountBalanceWallet, MdPhoneIphone, MdDateRange, MdOndemandVideo, MdPictureAsPdf, MdGroupAdd, MdPersonAddAlt, MdQuiz, MdListAlt, MdAssignment, MdQuestionAnswer, MdCheckCircle, MdViewList, MdGroups, MdBook } from "react-icons/md";

const AdminLinks = ({ currentLink, setCurrentLink }) => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState("");
  const [userData, isAdmin, isTeacher, student] = UserType();

  const adminLinks = [
    {
      id: Math.random(),
      link: "ادارة المنصة",
      path: "/admin/management",
      icon: <MdDashboard size={22} />,
    },
    {
      id: Math.random(),
      link: " اضافة موظف جديد",
      path: "/admin/add_employees",
      icon: <MdDashboard size={22} />,
    },
    {
      id: Math.random(),
      link: " ادارة الموظفين ",
      path: "/admin/mange_employees",
      icon: <MdDashboard size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة مدرس جديد",
      path: "/admin/addteacher",
      icon: <MdPersonAdd size={22} />,
    },
    {
      id: Math.random(),
      link: "انشاء اكواد شحن",
      path: "/admin/create_code",
      icon: <MdCode size={22} />,
    },
    {
      id: Math.random(),
      link: "ارصدة المدرسين",
      path: "/admin/cridet",
      icon: <MdAccountBalanceWallet size={22} />,
    },
    {
      id: Math.random(),
      link: " فتح جهاز للطالب",
      path: "/admin/open_phone",
      icon: <MdPhoneIphone size={22} />,
    },
    {
      id: Math.random(),
      link: "إدارة المجموعات الدراسية",
      path: "/center-groups",
      icon: <MdGroups size={22} />,
    },
    {
      id: Math.random(),
      link: "إدارة الكورسات العامة",
      path: "/admin/general-courses",
      icon: <MdBook size={22} />,
    },
  ];

  const teacherLinks = [
    {
      id: Math.random(),
      link: "انشاء شهر ",
      path: "/admin/add_month",
      icon: <MdDateRange size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة  محاضرة للشهر  ",
      path: "/admin/add_lecture_month",
      icon: <MdAssignment size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة فيديوهات المحاضرات ",
      path: "/admin/add_video",
      icon: <MdOndemandVideo size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة  pdf ",
      path: "/admin/add_pdf",
      icon: <MdPictureAsPdf size={22} />,
    },
    {
      id: Math.random(),
      link: " انشاء مجموعة  ",
      path: "/admin/create_group",
      icon: <MdGroupAdd size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة طالب الى المجموعة  ",
      path: "/admin/add_student",
      icon: <MdPersonAddAlt size={22} />,
    },
    {
      id: Math.random(),
      link: "   انشاء اكواد   ",
      path: "/admin/create_codee",
      icon: <MdCode size={22} />,
    },
    {
      id: Math.random(),
      link: "   عرض  اكواد   ",
      path: "/admin/all_codee",
      icon: <MdViewList size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة امتحان ",
      path: "/admin/addexam",
      icon: <MdQuiz size={22} />,
    },
    {
      id: Math.random(),
      link: "اضافة اسئلة للامتحان  ",
      path: "/admin/add_question",
      icon: <MdQuestionAnswer size={22} />,
    },
    {
      id: Math.random(),
      link: "  نتائج الامتحانات   ",
      path: "/admin/result",
      icon: <MdCheckCircle size={22} />,
    },
    // ... (remaining links)
  ];

  useEffect(() => {
    const initialActiveLink =
      adminLinks.find((link) => link.path === location.pathname) ||
      teacherLinks.find((link) => link.path === location.pathname);

    if (initialActiveLink) {
      setActiveLink(initialActiveLink.path);
      setCurrentLink(initialActiveLink.path);
    }
  }, [location.pathname, adminLinks, teacherLinks, setCurrentLink]);

  useEffect(() => {
    setActiveLink(currentLink);
    localStorage.setItem("activeLink", currentLink);
  }, [currentLink]);

  useEffect(() => {
    const storedActiveLink = localStorage.getItem("activeLink");
    if (storedActiveLink) {
      setActiveLink(storedActiveLink);
    }
  }, []);

  const handleClick = (link) => {
    setCurrentLink(link.path);
  };

  const linksToRender = isAdmin ? adminLinks : isTeacher ? teacherLinks : [];

  return (
    <>
      <div className="links-container m-auto">
        {linksToRender.map((link) => (
          <NavLink
            key={link.id}
            to={link.path}
            className="grid justify-center"
            activeClassName="active-link"
          >
            <div
              onClick={() => handleClick(link)}
              className="flex items-center m-auto"
              style={{
                backgroundColor: activeLink === link.path ? "#3b82f6" : "white",
                color: activeLink === link.path ? "white" : "black",
                width: "250px",
              }}
            >
              {/* الأيقونة */}
              <span className="mr-2 flex items-center">{link.icon}</span>
              <h5 className="font-bold p-2">{link.link}</h5>
            </div>
          </NavLink>
        ))}
      </div>
    </>
  );
};

export default AdminLinks;
