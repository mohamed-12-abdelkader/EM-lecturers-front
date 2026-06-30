import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Skeleton,
  Alert,
  AlertIcon,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../../api/baseUrl";

export default function ChannelsList() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    data: channels,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["channelsList"],
    queryFn: async () => {
      const res = await baseUrl.get("/api/streams/channels-list", {
        headers: { token: localStorage.getItem("token") },
      });
      return res.data.channels || [];
    },
    refetchInterval: 10000,
    retry: true,
  });

  const handleDelete = async () => {
    if (!selectedChannel) return;

    setDeleting(true);
    try {
      await baseUrl.delete(`/api/streams/channels/${selectedChannel.Id}`, {
        headers: { token: localStorage.getItem("token") },
      });
      toast.success("تم حذف القناة بنجاح.");
      refetch();
      onClose();
    } catch (err) {
      toast.error("فشل في حذف القناة. حاول مرة أخرى.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 mt-20" dir="rtl">
      {isError && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          فشل في تحميل قنوات البث. حاول مرة أخرى.
        </Alert>
      )}

      <h1 className="text-3xl mb-6 font-bold text-gray-800">
        قنوات البث المتاحة (Admins)
      </h1>

      <Box overflowX="auto" className="rounded-lg shadow-lg">
        <Table variant="simple" colorScheme="teal">
          <TableCaption>احذف القنوات غير المستخدمة</TableCaption>
          <Thead>
            <Tr>
              <Th>معرف القناة</Th>
              <Th>معرف البث</Th>
              <Th>الصيانة</Th>
              <Th>الحالة</Th>
              <Th>نقطة النهاية RTMP</Th>
              <Th>معرف المستخدم</Th>
              <Th>الإجراءات</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={7}>
                  <Box display="flex" justifyContent="center" py={6}>
                    <Spinner
                      size="lg"
                      color="teal.500"
                      thickness="4px"
                      speed="0.65s"
                    />
                  </Box>
                </Td>
              </Tr>
            ) : channels?.length > 0 ? (
              channels.map((channel, index) => (
                <Tr key={index}>
                  <Td>{channel.Id}</Td>
                  <Td>{channel.Stream?.id || "غير متوفر"}</Td>
                  <Td>
                    {`${channel.Maintenance?.MaintenanceDay || ""} ${
                      channel.Maintenance?.MaintenanceStartTime || ""
                    }`}
                  </Td>
                  <Td>{channel.State || "غير معروف"}</Td>
                  <Td>
                    <Box maxWidth="100px" overflow="hidden" whiteSpace="nowrap">
                      <Box overflowX="auto" maxWidth="100%">
                        {channel.Input?.Destinations?.[0]?.Url || "غير متوفر"}
                      </Box>
                    </Box>
                  </Td>
                  <Td>
                    {channel?.Stream?.user_id
                      ? `${channel.Stream.user_role} ${channel.Stream.user_id}`
                      : "غير متوفر"}
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<BsThreeDotsVertical />}
                        variant="ghost"
                        size="sm"
                        aria-label="الإجراءات"
                      />
                      <MenuList>
                        <MenuItem
                          icon={<MdDelete />}
                          onClick={() => {
                            setSelectedChannel(channel);
                            onOpen();
                          }}
                        >
                          حذف القناة
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} className="text-center py-4">
                  لا توجد قنوات بث متاحة.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Confirm Delete Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد الحذف</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            هل أنت متأكد أنك تريد حذف هذه القناة؟
            <Text mt={2} fontSize="sm" color="gray.500">
              معرف القناة: {selectedChannel?.Id}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} ml={3} isDisabled={deleting}>
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={deleting}
              loadingText="جاري الحذف"
            >
              حذف
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
