import React from "react";
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  IconButton,
  Heading,
} from "@chakra-ui/react";
import { MdCancel, MdEdit, MdDelete, MdCheck } from "react-icons/md";
import { Link } from "react-router-dom";

const ExamCard = ({ exam, isAdmin, onEdit, onDelete, onActivate }) => {
  return (
    <Box boxShadow='md' borderRadius='md' className='w-[270px]' p={3}>
      <Image
        src={exam.cover?.path || "https://via.placeholder.com/150"}
        alt={exam.name}
        borderRadius='md'
        mb={4}
        maxHeight='250px'
        objectFit='cover'
        width='100%'
      />
      <Box w='90%' m='auto'>
        <Heading size='sm'>{exam.name}</Heading>
        <Text mt={1}>السعر: {exam.price} جنيه</Text>
      </Box>

      {isAdmin && (
        <Flex gap={3} justifyContent='space-between' mt={3}>
          <IconButton
            icon={<MdEdit />}
            onClick={() => onEdit(exam.id)}
            aria-label='تعديل'
            colorScheme='blue'
          />
          <IconButton
            icon={<MdDelete />}
            onClick={() => onDelete(exam.id)}
            aria-label='حذف'
            colorScheme='red'
          />
          <IconButton
            icon={exam.is_ready ? <MdCancel /> : <MdCheck />}
            onClick={() => onActivate(exam.id)}
            aria-label='تفعيل'
            colorScheme={exam.is_ready ? "red" : "green"}
          />
        </Flex>
      )}

      {exam.pay || isAdmin ? (
        <Box textAlign='center' mt={3}>
          <Link to={`/exam_content/${exam.id}`}>
            <Button colorScheme='blue' w='100%'>
              دخول
            </Button>
          </Link>
        </Box>
      ) : (
        <Box textAlign='center' mt={3}>
          <Button colorScheme='red' w='100%'>
            شراء
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ExamCard;
