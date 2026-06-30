import Mange from "../../Hooks/admin/Mange";
import { Skeleton, Stack } from "@chakra-ui/react";

const AdminTeacherBalances = () => {
  const [loading, mange] = Mange();

  if (loading) {
    return (
      <Stack className="w-[90%] m-auto">
        <div className="flex justify-center">
          <div className="ribbon">
            <h1 className="big-font m-4 text-xl text-center">ارصدة المدرسين</h1>
          </div>
        </div>
        <Skeleton height="20px" className="mt-5" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
      </Stack>
    );
  }

  return (
    <div>
      {mange && mange.length > 0 ? (
        mange.map((man) => (
          <div
            key={man.id}
            className="w-[90%] m-auto border shadow   p-3 md:flex justify-between items-center my-3"
          >
            <div>
              <h1 className="my-2 font-bold"> اسم المدرس:{man.name}</h1>
              <h1 className="my-2 font-bold"> ايميل المدرس:{man.mail}</h1>
            </div>
            <div>
              <h1 className="my-2 font-bold"> رصيد المدرس:{man.value}</h1>
              <h1 className="my-2 font-bold">
                {" "}
                عدد اشتراكات المدرس:{man.nonline}
              </h1>
              <h1 className="my-2 font-bold">
                {" "}
                عدد طلبة السنتر :{man.ngroup}{" "}
              </h1>
            </div>
          </div>
        ))
      ) : (
        <div className="w-[90%] border shadow   p-3 md:flex justify-between items-center my-3">
          <h1 className="my-2 font-bold text-center">لا يوجد ارصدة للمدرسين</h1>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherBalances;
