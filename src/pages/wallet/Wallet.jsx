import { Button, Spinner, useDisclosure } from "@chakra-ui/react";
import { IoWalletSharp } from "react-icons/io5";
import { IoLogoWhatsapp } from "react-icons/io";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import React from "react";
import WalletModal from "../../ui/modal/WalletModal";
import MyWallet from "../../Hooks/student/MyWallet";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
const Wallet = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletLoading, mytwallet] = MyWallet();
  const cancelRef = React.useRef();

  return (
    <div className="mt-[150px] mb-[50px]" style={{ minHeight: "70vh" }}>
      <div className="w-[90%] m-auto border shadow p-5">
        <div className="flex justify-center ">
          <div className="ribbon">
            <h1 className="font-bold m-2">محفظة الطالب</h1>
          </div>
        </div>

        <div className="mt-[80px] md:flex ">
          <div className="w-[300px]  border shadow p-5">
            <div className="my-2">
              <h1 className="font-bold flex">
                <IoWalletSharp className="m-1 text-blue-500" />
                المحفظة الالكترونية
              </h1>
            </div>
            <hr />
            <div>
              <h1 className="font-bold m-2">الرصيد الحالى: </h1>
              {walletLoading ? (
                <Spinner />
              ) : (
                <h1 className="font-bold m-2">{mytwallet.value} جنية </h1>
              )}
            </div>
            <div className="my-5">
              <Button
                colorScheme="blue"
                className="w-[100%] m-auto"
                onClick={onOpen}
              >
                اشحن محفظتك
              </Button>

              <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
                className="p-3"
              >
                <AlertDialogOverlay>
                  <AlertDialogContent className="p-3 flex flex-wrap">
                    <div className="p-3 flex flex-wrap w-[100%]">
                      <Button
                        colorScheme="red"
                        ref={cancelRef}
                        onClick={onClose}
                      >
                        x
                      </Button>
                      <h1 className="font-bold m-2">شحن المحفظة</h1>
                    </div>
                    <WalletModal />
                  </AlertDialogContent>
                </AlertDialogOverlay>
              </AlertDialog>
            </div>
            <div>
              <h1 className="font-bold">
                يمكنك شحن رصيد محفظتك بوسائل الدفع التي ندعمها لتتمكن من استخدام
                محفظتك في الشراء داخل المنصة
              </h1>
            </div>
          </div>
          <div>
            <div className="mx-[50px] my-[20px]">
              <h1 className="font-bold md:text-xl">
                تواصل معنا من خلال هذة الارقام على الواتساب لشحن المحفظة{" "}
              </h1>
              <div className="flex flex-wrap">
                <h1 className="flex font-bold m-2 my-5">
                  <IoLogoWhatsapp className="m-1 text-green-600 " />
                  01111272393
                </h1>
                <h1 className="flex font-bold m-2 my-5">
                  <IoLogoWhatsapp className="m-1 text-green-600 " />
                  01227145090
                </h1>
                <h1 className="flex font-bold m-2 my-5">
                  <IoLogoWhatsapp className="m-1 text-green-600" />
                  01282602134
                </h1>
                <h1 className="flex font-bold m-2 my-5">
                  <IoLogoWhatsapp className="m-1 text-green-600" />
                  01282602857
                </h1>
              </div>
              <div>
                <h1 className="font-bold">
                  او يمكنك التواصل مع المحاضر مباشرة للحصول على كود شحن{" "}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Wallet;
