import { Link, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Spinner,
  useDisclosure,
  SimpleGrid, // استيراد SimpleGrid
} from "@chakra-ui/react";
import { GoArrowLeft } from "react-icons/go";
import {
  AlertDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import React, { useState } from "react";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import GitTeacherMonth from "../../Hooks/teacher/GitTeacherMonth";
import DeleatMonth from "../../Hooks/teacher/DeleatMonth";
import Loading from "../../components/loading/Loading";
import { CoursesCard } from "../../ui/card/CoursesCard";

const AllCourses = () => {
  const { id } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const [selectedLecture, setSelectedLecture] = useState(null);

  const [deleteMonthLoading, deleteMonth] = DeleatMonth();
  const [monthes, monthesLoading, lectureCenterLoading, mergedLectures] =
    GitTeacherMonth({ id });

  if (monthesLoading || lectureCenterLoading) {
    return (
      <div style={{ minHeight: "60vh" }} className='flex items-center'>
        <Loading />
      </div>
    );
  }

  console.log(monthes);
  return (
    <div>
      <div className='mt-8'>
        <div className='flex justify-center'>
          <div className='ribbon2'>
            <h1 className='text-white m-2 font-bold mx-4'>
              {id == 1
                ? "كورسات الصف الاول الثانوى "
                : id == 2
                ? "كورسات الصف الثانى الثانوى "
                : id == 3
                ? " كورسات الصف الثالث الثانوى "
                : ""}
            </h1>
          </div>
        </div>
        <div className='my-5 flex justify-center'>
          {mergedLectures && mergedLectures.length > 0 ? (
            <div className="flex flex-wrap justify-center"
            >
              {mergedLectures.map((lectre) => (
                <CoursesCard
                  key={lectre.id} // إضافة key لتحسين الأداء
                  href={`/month/${lectre.id}`}
                  lectre={lectre}
                  handleDeleate={() => {
                    setSelectedLecture(lectre);
                    onOpen();
                  }}
                  type={`teacher-course`}
                />
              ))}
            </div>
          ) : (
            <div>
              <div className='m-auto border shadow'>
                <h1 className='font-bold m-5 flex'>
                  لا يوجد كورسات لهذا الصف{" "}
                  <GoArrowLeft className='m-1 font-bold text-xl' />
                  <Link to='/admin/add_month'>
                    <span className='text-red-500'> اضف كورساتك !</span>
                  </Link>
                </h1>
              </div>
            </div>
          )}
        </div>
      </div>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              حذف الكورس
            </AlertDialogHeader>
            <div className='p-3'>
              {selectedLecture ? (
                <>
                  <h1 className='font-bold'>
                    هل تريد حذف {selectedLecture.description}{" "}
                  </h1>
                </>
              ) : (
                <p>Selected lecture is null</p>
              )}
            </div>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} className='mx-2'>
                الغاء
              </Button>
              <Button
                colorScheme='red'
                ml={3}
                className='mx-2'
                onClick={() => {
                  deleteMonth(selectedLecture.id);
                }}
              >
                {deleteMonthLoading ? <Spinner /> : "نعم حذف"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <ScrollToTop />
    </div>
  );
};

export default AllCourses;