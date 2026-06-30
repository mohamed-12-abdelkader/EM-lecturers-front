import { Button, Input, Spinner } from "@chakra-ui/react";
import CreateCode from "../../Hooks/admin/CreateCode";

const AdminCreateCode = () => {
  const [
    handleCreateCode,
    handleValueChange,
    handleNChange,
    loading,
    value,
    n,
  ] = CreateCode();
  return (
    <div>
      <div className="text-center">
        <h1 className="font-bold text-xl">انشاء اكواد الشحن </h1>
      </div>
      <div className="mt-7">
        <Input
          className="my-3"
          placeholder="عدد الاكواد "
          size="lg"
          value={n}
          onChange={handleNChange}
        />
        <Input
          className="my-3"
          placeholder="سعر الكود "
          size="lg"
          value={value}
          onChange={handleValueChange}
        />
        <div className="text-center">
          <Button
            className=" m-auto"
            colorScheme="blue"
            onClick={handleCreateCode}
          >
            {loading ? <Spinner /> : "انشاء الاكواد"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateCode;
