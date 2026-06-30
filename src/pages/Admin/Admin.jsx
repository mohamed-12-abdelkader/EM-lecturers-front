import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminLinks from "../../components/admin/AdminLinks";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const Admin = () => {
  const [currentLink, setCurrentLink] = useState("");

  return (
    <div className='mb-[120px]'>
      <div className='border shadow mt-[150px] w-[90%] m-auto mb-[50px]'>
        <div className='row'>
          <div className='my-3 flex justify-center'>
            <div className='ribbon'>
              <h5 className='font-bold m-2 text-xl'> صفحات الادمن </h5>
            </div>
          </div>

          <div className='container-aitem md:flex'>
            {/* Start AdminLinks at the top */}
            <div className='aitem-1'>
              <AdminLinks
                currentLink={currentLink}
                setCurrentLink={setCurrentLink}
              />
            </div>
            <div className='aitem-2 flex-1'>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Admin;
