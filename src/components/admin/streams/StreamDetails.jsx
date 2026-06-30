import { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button as ChakraButton,
} from "@chakra-ui/react";
import { CiStreamOn } from "react-icons/ci";
import baseUrl from "../../../api/baseUrl";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import StartStreamModel from "./StartStreamModel";
import LiveStreamStatusMessage from "./LiveStreamStatusMessage";
import { FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import { useEffect } from "react";
import StreamPlayer from "./StreamPlayer";

export default function StreamDetails() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);

  const {
    data: stream,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["currentStream"],
    queryFn: async () => {
      const res = await baseUrl.get("/api/streams/status", {
        headers: { token: localStorage.getItem("token") },
      });
      return res.data;
    },
    refetchInterval: 1000,
    retry: true,
    retryDelay: 3000,
  });

  useEffect(() => {
    if (
      stream?.channel?.State === "DELETING" ||
      stream?.channel?.State === "DELETED" ||
      stream?.channel?.State === "STOPPING"
    ) {
      setIsStopping(true);
    } else {
      setIsStopping(false);
    }
  }, [stream?.channel?.State]);

  const stopStreaming = async () => {
    setIsStopping(true);
    try {
      setIsDeleteModalOpen(false);
      toast.success("جاري ايقاف البث...");
      await baseUrl.post(`/api/streams/${stream.stream.id}/stop`, null, {
        headers: { token: localStorage.getItem("token") },
      });
      refetch();
    } catch {
      toast.error("فشل في إيقاف البث.");
    } finally {
      setIsStopping(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ!");
  };

  const serverUrl =
    stream?.channel_input?.Destinations?.[0].Url?.split("/")
      .slice(0, -1)
      .join("/") || "غير متوفر";

  const streamKey =
    stream?.channel_input?.Destinations?.[0].Url?.split("/").pop() ||
    "غير متوفر";
  console.log("URL", stream?.stream?.url);
  return (
    <div className="p-6 text-right">
      <h1 className="text-2xl font-bold mb-6 text-center">
        البث المباشر <CiStreamOn className="inline-block text-red-500 mr-2" />
      </h1>

      {isLoading && (
        <div className="text-center mt-10">
          <div className="animate-spin border-4 border-t-teal-500 rounded-full w-10 h-10 mx-auto"></div>
        </div>
      )}

      {!isLoading && !stream?.is_live && (
        <div className="flex flex-col mt-4 items-center gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            ابدأ البث الآن
          </button>
        </div>
      )}

      {stream?.is_live && (
        <div className="mt-4">
          <LiveStreamStatusMessage status={stream.channel.State} />
        </div>
      )}

      {stream?.is_live && (
        <>
          <h2 className="mt-10 mb-4 text-xl font-semibold">إعدادات البث</h2>
          <div className="border p-4 rounded-md shadow-sm space-y-4">
            <div className="flex relative">
              <label className="block max-w-[70px] md:max-w-[100px] w-full font-medium text-lg mb-1">
                الخادم
              </label>
              <input
                readOnly
                className="w-full border px-3 py-2 rounded bg-gray-100"
                value={serverUrl}
              />
              <button
                onClick={() => handleCopy(serverUrl)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                title="نسخ"
              >
                <FiCopy size={18} />
              </button>
            </div>

            <div className="flex relative">
              <label className="block max-w-[70px] md:max-w-[100px] w-full font-medium text-lg mb-1">
                مفتاح البث
              </label>
              <input
                readOnly
                type={showStreamKey ? "text" : "password"}
                className="w-full border px-3 py-2 rounded bg-gray-100"
                value={streamKey}
              />
              <button
                onClick={() => setShowStreamKey((prev) => !prev)}
                className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
              >
                {showStreamKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
              <button
                onClick={() => handleCopy(streamKey)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
                title="نسخ"
              >
                <FiCopy size={18} />
              </button>
            </div>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              disabled={isStopping}
            >
              {isStopping ? "جارٍ الإيقاف..." : "إيقاف البث"}
            </button>
          </div>

          <StreamPlayer src={stream.stream.url} />
        </>
      )}

      {/* Start Stream Modal */}
      <StartStreamModel
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        refetch={refetch}
      />

      {/* Stop Stream Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد إيقاف البث</ModalHeader>
          <ModalCloseButton position="absolute" top={2} left={2} right="auto" />
          <ModalBody>هل أنت متأكد من إيقاف البث؟</ModalBody>
          <ModalFooter>
            <ChakraButton
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              marginLeft={4}
            >
              إلغاء
            </ChakraButton>
            <ChakraButton
              colorScheme="red"
              onClick={stopStreaming}
              isLoading={isStopping}
            >
              إيقاف
            </ChakraButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
