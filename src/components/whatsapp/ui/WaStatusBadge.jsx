import { Badge } from "@chakra-ui/react";
import { CONVO_STATUS_META, SESSION_STATUS_META } from "./waTheme";

export default function WaStatusBadge({ status, kind = "session", ...rest }) {
  const map = kind === "convo" ? CONVO_STATUS_META : SESSION_STATUS_META;
  const meta = map[status] || { label: status || "غير معروف", color: "gray" };
  return (
    <Badge
      colorScheme={meta.color}
      borderRadius="full"
      px={2.5}
      py={0.5}
      fontSize="xs"
      fontWeight="700"
      {...rest}
    >
      {meta.label}
    </Badge>
  );
}
