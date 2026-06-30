import React, { useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Heading,
  Image,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import UserType from "../../Hooks/auth/userType";
import { Link } from "react-router-dom";
import useDeleateComp from "../../Hooks/comp/useDeleateComp";

const CompCard = ({ comp, onEditClick }) => {
  const { isOpen, onOpen, onClose } = useDisclosure(); // للتحكم في المودال
  const cancelRef = useRef(); // مرجع لزر الإلغاء
  const [userData, isAdmin, isTeacher, student] = UserType();
  const [deleteLoading, deleteComp] = useDeleateComp();

  // عند النقر على زر الحذف
  const handleDelete = () => {
    deleteComp(comp.id).then(() => {
      onClose(); // إغلاق المودال بعد الحذف
    });
  };
  if (comp) {
    return (
      <>
        <Card
          key={comp.id}
          maxW='sm'
          borderRadius='lg'
          overflow='hidden'
          mb={4}
          className='shadow-2xl m-2 md:w-[300px]'
        >
          <Image
            src={comp.assets?.[0]?.path || "default-image-path.jpg"} // وضع مسار صورة افتراضية في حال عدم وجود بيانات
            alt={comp.name || "اسم غير متوفر"}
            objectFit='cover'
            height='250px'
            width='300px'
            className='shadow'
          />
          <CardBody>
            <Stack spacing={3}>
              <Heading size='md'>{comp.name || "اسم غير متوفر"}</Heading>

              <div fontSize='sm' className='flex justify-between'>
                <div>
                  <Badge
                    colorScheme={
                      comp.is_ready || comp.is_available ? "green" : "red"
                    }
                  >
                    {comp.is_ready || comp.is_available ? "جاهز" : "غير جاهز"}
                  </Badge>
                </div>
                {isAdmin ? (
                  <div>
                    <Button
                      className='mx-2'
                      colorScheme={comp.is_ready ? "gray" : "green"}
                      onClick={() => onEditClick(comp)}
                    >
                      {comp.is_ready ? " تعطيل " : " تفعيل "}
                    </Button>
                    <Button colorScheme='red' onClick={onOpen}>
                      حذف
                    </Button>
                  </div>
                ) : null}
              </div>
              <Text
                fontSize='sm'
                color='gray.600'
                className='flex justify-between'
              >
                <span>
                  <strong>من:</strong>{" "}
                  {new Date(comp.start_at).toLocaleDateString("ar-EG")}
                </span>
                <span>
                  <strong>إلى:</strong>{" "}
                  {new Date(comp.end_at).toLocaleDateString("ar-EG")}
                </span>
              </Text>
            </Stack>
          </CardBody>
          <div className='my-2 text-center'>
            <Link to={`/competition/${comp.id}`}>
              <Button colorScheme='blue' type='submit' className='w-[90%]'>
                الدخول الى المسابقة
              </Button>
            </Link>
          </div>
        </Card>

        {/* مودال التأكيد */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                تأكيد الحذف
              </AlertDialogHeader>

              <AlertDialogBody>
                هل أنت متأكد أنك تريد حذف المسابقة؟ هذه العملية لا يمكن التراجع
                عنها.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  إلغاء
                </Button>
                <Button
                  colorScheme='red'
                  onClick={handleDelete}
                  ml={3}
                  isLoading={deleteLoading}
                >
                  حذف
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </>
    );
  } else {
    return <h1>لا يوجد بيانات </h1>;
  }
};

export default CompCard;
