import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  Spinner,
  Flex,
  Badge,
  Input,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input as ChakraInput,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  FiEdit,
  FiTrash2,
  FiXCircle,
  FiVideo,
  FiPlayCircle,
} from "react-icons/fi";
import baseUrl from "../../api/baseUrl";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

const fetchStreams = async ({ queryKey }) => {
  const [_key, { page, limit, courseId }] = queryKey;
  const skip = (page - 1) * limit;

  const { data } = await baseUrl.get("/api/meeting", {
    params: {
      skip,
      limit,
      courseId: courseId && courseId.trim() !== "" ? courseId : undefined,
    },
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  return data;
};

const StreamList = () => {
  const [page, setPage] = useState(1);
  const [courseId, setCourseId] = useState("");
  const [selectedStream, setSelectedStream] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const limit = 10;
  const toast = useToast();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["meetingsAdminList", { page, limit, courseId }],
    queryFn: fetchStreams,
    keepPreviousData: true,
  });

  const streams = data?.meetings || [];
  const pagination = data?.pagination || { totalPages: 1 };

  const getStatusBadge = (status) => {
    switch (status) {
      case "started":
        return <Badge colorScheme="green">مباشر</Badge>;
      case "ended":
        return <Badge colorScheme="red">انتهى</Badge>;
      case "idle":
        return <Badge colorScheme="orange">جاهز ولم يبدأ</Badge>;
      default:
        return <Badge colorScheme="gray">{status}</Badge>;
    }
  };

  const handleDelete = async () => {
    try {
      await baseUrl.delete(`/api/meeting/${selectedStream.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast({ title: "تم حذف البث", status: "success" });
      setIsDeleteModalOpen(false);
      refetch();
    } catch {
      toast({ title: "فشل في الحذف", status: "error" });
    }
  };

  const handleClose = async (id) => {
    try {
      await baseUrl.post(
        `/api/meeting/${id}/close`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast({ title: "تم إغلاق البث", status: "success" });
      refetch();
    } catch {
      toast({ title: "فشل في الإغلاق", status: "error" });
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      await baseUrl.put(
        `/api/meeting/${selectedStream.id}`,
        { title: updateTitle },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast({ title: "تم تحديث البث", status: "success" });
      setIsUpdateModalOpen(false);
      refetch();
    } catch {
      toast({ title: "فشل في التحديث", status: "error" });
    }
  };

  return (
    <Box p={[4, 6, 8]} dir="rtl" mt="70px">
      <Heading textAlign="center" mb={6} fontSize="2xl">
        كل البثوث المباشرة (Admin)
      </Heading>

      <Flex justify="center" mb={6}>
        <Input
          placeholder="أدخل رقم الكورس (اختياري)"
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setPage(1);
          }}
          maxW="300px"
          textAlign="center"
        />
      </Flex>

      {isLoading ? (
        <Flex justify="center" mt={10}>
          <Spinner size="xl" />
        </Flex>
      ) : isError ? (
        <Text color="red.500" textAlign="center">
          فشل في تحميل البثوث.
        </Text>
      ) : streams.length === 0 ? (
        <Text textAlign="center">لا توجد بثوث متاحة حالياً.</Text>
      ) : (
        <Flex direction="column" gap={4}>
          {streams.map((stream) => (
            <Flex
              key={stream.id}
              p={4}
              borderWidth="1px"
              borderRadius="xl"
              shadow="sm"
              bg="white"
              align="center"
              justify="space-between"
              _hover={{ shadow: "md" }}
            >
              <Flex direction="column" flex="1" mr={4}>
                <Heading fontSize="md" mb={1}>
                  {stream.title}
                </Heading>
                <Text>{getStatusBadge(stream.status)}</Text>
                <Text fontSize="xs" color="gray.600">
                  {new Date(stream.created_at).toLocaleString("ar-EG")}
                </Text>
              </Flex>

              <Flex gap={2}>
                {stream.status === "started" && (
                  <Button
                    as="a"
                    href={`${STREAM_REDIRECT_URL}/${
                      stream.id
                    }/?t=${localStorage.getItem("token")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    leftIcon={<FiVideo />}
                    size="sm"
                    colorScheme="blue"
                  >
                    دخول
                  </Button>
                )}

                {stream.status === "ended" && stream.egress_url && (
                  <Button
                    as="a"
                    href={stream.egress_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    leftIcon={<FiPlayCircle />}
                    size="sm"
                    colorScheme="purple"
                  >
                    تسجيل
                  </Button>
                )}

                <IconButton
                  aria-label="تحديث"
                  icon={<FiEdit />}
                  size="sm"
                  colorScheme="yellow"
                  onClick={() => {
                    setSelectedStream(stream);
                    setUpdateTitle(stream.title);
                    setIsUpdateModalOpen(true);
                  }}
                />
                <IconButton
                  aria-label="إغلاق"
                  icon={<FiXCircle />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleClose(stream.id)}
                  isDisabled={stream.status === "ended"}
                />
                <IconButton
                  aria-label="حذف"
                  icon={<FiTrash2 />}
                  size="sm"
                  colorScheme="gray"
                  onClick={() => {
                    setSelectedStream(stream);
                    setIsDeleteModalOpen(true);
                  }}
                />
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      {pagination.totalPages > 1 && (
        <Flex mt={10} justifyContent="center" gap={4}>
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            isDisabled={page === 1}
            colorScheme="gray"
            variant="outline"
          >
            السابق
          </Button>
          <Text fontSize="sm" alignSelf="center">
            الصفحة {page} من {pagination.totalPages}
          </Text>
          <Button
            onClick={() =>
              setPage((p) => Math.min(p + 1, pagination.totalPages))
            }
            isDisabled={page === pagination.totalPages}
            isLoading={isFetching}
            colorScheme="blue"
          >
            التالي
          </Button>
        </Flex>
      )}

      {/* Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تحديث البث</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>العنوان</FormLabel>
              <ChakraInput
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleUpdateSubmit}>
              تحديث
            </Button>
            <Button mr={3} onClick={() => setIsUpdateModalOpen(false)}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد الحذف</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              هل أنت متأكد أنك تريد حذف البث{" "}
              <strong>{selectedStream?.title}</strong>؟
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={handleDelete}>
              حذف
            </Button>
            <Button mr={3} onClick={() => setIsDeleteModalOpen(false)}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StreamList;
