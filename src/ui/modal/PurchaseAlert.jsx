import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Input,
  Spinner,
} from "@chakra-ui/react";
import useOpenMonthByCode from "../../Hooks/student/OpenMonthByCode";

const PurchaseAlert = ({
  isOpen,
  onClose,
  cancelRef,
  selectedLecture,
  buyLoading,
  buyMonth,
}) => {
  // حالة لتخزين نوع الشراء (الكود أو المحفظة)
  const [type, setType] = useState("");
  // حالة لتخزين الكود الذي يقوم المستخدم بإدخاله

  const [buycodeLoading, buyMonthbyCode, setcode, code] =
    useOpenMonthByCode("");
  const handleBuy = () => {
    // تنفيذ عملية الشراء عن طريق المحفظة
    buyMonth(selectedLecture.id);
  };
  const handleBuyByCode = () => {
    // تنفيذ عملية الشراء عن طريق المحفظة
    buyMonthbyCode(selectedLecture.id);
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent className="p-2">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            شراء الكورس
          </AlertDialogHeader>
          <div>
            {selectedLecture && (
              <>
                {/* الأزرار لاختيار نوع الشراء */}
                <div className="flex justify-around my-3">
                  <Button colorScheme="blue" onClick={() => setType("code")}>
                    الشراء عن طريق الكود
                  </Button>
                  <Button colorScheme="teal" onClick={() => setType("wallet")}>
                    الشراء عن طريق المحفظة
                  </Button>
                </div>

                {/* عرض المحتوى بناءً على نوع الشراء */}
                {type === "code" && (
                  <div className="my-3">
                    <h1 className="font-bold m-3">ادخل الكود الخاص بك:</h1>
                    <Input
                      value={code}
                      onChange={(e) => setcode(e.target.value)}
                      placeholder="ادخل الكود هنا"
                      className=" w-[90%] m-auto my-2"
                    />
                    <div style={{ direction: "ltr" }}>
                      <Button
                        ref={cancelRef}
                        colorScheme="red"
                        onClick={onClose}
                        className="m-1"
                      >
                        الغاء
                      </Button>
                      <Button
                        colorScheme="blue"
                        ml={3}
                        className="m-1"
                        onClick={handleBuyByCode}
                        isDisabled={buycodeLoading}
                      >
                        {buycodeLoading ? <Spinner /> : " تفعيل الشهر "}
                      </Button>
                    </div>
                  </div>
                )}

                {type === "wallet" && (
                  <>
                    <h1 className="font-bold m-3">
                      - هل بالتأكيد تريد شراء {selectedLecture.description}؟
                    </h1>
                    <h1 className="font-bold m-3">
                      - سوف يتم خصم {selectedLecture.price} جنية من محفظتك ثمن
                      الكورس
                    </h1>
                    <h1 className="font-bold m-3 text-red-500">
                      - تاكد من عملية الشراء جيدا قبل اتمامها لان المنصة غير
                      مسئولة عن اى عملية شراء خطاء
                    </h1>
                    <div style={{ direction: "ltr" }}>
                      <Button
                        ref={cancelRef}
                        colorScheme="red"
                        onClick={onClose}
                        className="m-1"
                      >
                        الغاء
                      </Button>
                      <Button
                        colorScheme="blue"
                        ml={3}
                        className="m-1"
                        onClick={handleBuy}
                        isDisabled={buyLoading}
                      >
                        {buyLoading ? <Spinner /> : "نعم شراء"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default PurchaseAlert;
