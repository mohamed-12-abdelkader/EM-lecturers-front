import { Button, Card, CardBody } from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";
import img from "../../img/Red and Blue Badminton Team Sport Logo (7).png";
const PlatformExams = () => {
  return (
    <div className='w-[90%] m-auto'>
      <div className='text-center my-5'>
        <h1 className='font-bold text-xl'>الامتحانات المتاحة </h1>
      </div>
      <div className='flex flex-wrap'>
        <Card
          className=' w-[280px] my-3  md:mx-3 w-[330px] m-2 '
          style={{ border: "1px solid #ccc" }}
        >
          <CardBody>
            <img src={img} className='h-[220px] w-[100%]' alt='Course' />
            <div className='my-2'></div>
            <div className='flex justify-between mt-4'>
              <div>
                <h1 className='font-bold'> امتحان شهر يناير </h1>
              </div>

              <h1 className='font-bold text-red-500'> السعر :50 جنية </h1>
            </div>
          </CardBody>
          <hr />
          <div className='my-3 text-center'>
            <Link to={`/exams/1`}>
              <Button
                colorScheme='blue'
                variant='outline'
                className='w-[90%] m-auto'
              >
                دخول الامتحان
              </Button>
            </Link>
          </div>
        </Card>
        <Card
          className=' w-[280px] my-3  md:mx-3 w-[330px] m-2 '
          style={{ border: "1px solid #ccc" }}
        >
          <CardBody>
            <img src={img} className='h-[220px] w-[100%]' alt='Course' />
            <div className='my-2'></div>
            <div className='flex justify-between mt-4'>
              <div>
                <h1 className='font-bold'> امتحان شهر يناير </h1>
              </div>

              <h1 className='font-bold text-red-500'> السعر :50 جنية </h1>
            </div>
          </CardBody>
          <hr />
          <div className='my-3 text-center'>
            <Link to={`/month/1`}>
              <Button colorScheme='blue' className='w-[90%] m-auto'>
                شراء
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformExams;
