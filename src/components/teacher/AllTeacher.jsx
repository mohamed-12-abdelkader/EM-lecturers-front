import Marquee from "react-fast-marquee";
import GitAllTeacher from "../../Hooks/teacher/GitAllTeacher";

import { Skeleton, Stack } from "@chakra-ui/react";

const AllTeacher = () => {
  const [loading, teachers] = GitAllTeacher();

  // Function to shuffle array elements
  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  if (loading) {
    return (
      <Stack className='w-[90%] m-auto'>
        <div className='flex justify-center'>
          <div className=''>
            <h1 className='text-center text-2xl font-bold mb-8'>
              محاضرين  المنصة
            </h1>
          </div>
        </div>
        <Skeleton height='20px' className='mt-5' />
        <Skeleton height='20px' />
        <Skeleton height='20px' />
        <Skeleton height='20px' />
        <Skeleton height='20px' />
      </Stack>
    );
  }

  // Shuffle teachers array
  const shuffledTeachers = shuffleArray([...teachers]);

  return (
    <div className='py-5 mb-5 w-full'>
      <div className='flex justify-center'>
        <div className=''>
          <h1 className='text-center text-2xl font-bold mb-8'>محاضرين المنصة</h1>
        </div>
      </div>
      {shuffledTeachers.length === 0 ? (
        <div>
          <div className='w-90 border shadow h-250 m-auto my-8 flex justify-center items-center'>
            <div className='ribbon'>
              <h1 className='font-bold text-xl m-2'>لا يوجد محاضرين الان !!!</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className='w-[95%] m-auto flex justify-center my-5' dir='rtl'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl m-auto'>
            {shuffledTeachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{ border: "2px solid white" }}
                className='flex justify-center flex-col w-[320px] items-center justify-center p-5 shadow-lg rounded-lg  hover:shadow-2xl transition duration-300'
              >
                <div className=' w-[300px] text-center'>
                  <div className='flex justify-center'>
                    <img
                      src={teacher.image}
                      className='w-[60px] h-[60px] rounded-full border border-white'
                      alt={teacher.name}
                    />
                  </div>
                  <div className='ml-4 mx-3'>
                    <h1 className='font-bold text-lg mx-2'>{teacher.name}</h1>
                    <h1 className='font-bold text-lg mx-2'>
                      {teacher.subject}
                    </h1>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTeacher;
