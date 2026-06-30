import { Skeleton, Stack } from "@chakra-ui/react";

const Loading = () => {
  return (
    <div>
      <Stack
        className="w-[90%] m-auto my-5 mt-[150px]"
        style={{ minHeight: "80vh" }}
      >
        <Skeleton height="20px" className="mt-5" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
      </Stack>
    </div>
  );
};

export default Loading;
