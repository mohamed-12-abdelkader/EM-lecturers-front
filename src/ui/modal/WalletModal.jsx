import { Button, Input, Spinner } from "@chakra-ui/react";
import WalletCharging from "../../Hooks/student/WalletCharging";

const WalletModal = () => {
  const [handleCodeChange, handleWalletCharging, code, loading] =
    WalletCharging();
  return (
    <div className="mt-3">
      <Input
        placeholder="ادخل الكود  (8) "
        size="lg"
        className="my-2"
        onChange={handleCodeChange}
        value={code}
      />
      <h1 className="text-red-500 font-bold my-2">
        - الكود مكون من 8 حروف فقط وكل الحروف small
      </h1>
      <div className="text-center my-2">
        <Button
          className="w-[100%] m-auto"
          colorScheme="blue"
          onClick={handleWalletCharging}
          isDisabled={code.length < 8 || loading}
        >
          {loading ? <Spinner /> : " شحن المحفظة"}{" "}
        </Button>
      </div>
    </div>
  );
};

export default WalletModal;
