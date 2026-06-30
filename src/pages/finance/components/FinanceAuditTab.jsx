import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { fetchFinanceAuditLogs } from "../../../api/financeApi";
import { AUDIT_ENTITY_LABELS, formatDate } from "../financeConstants";

const ENTITY_OPTIONS = Object.entries(AUDIT_ENTITY_LABELS);

export default function FinanceAuditTab({ refreshKey }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const codeBg = useColorModeValue("gray.50", "gray.900");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFinanceAuditLogs({
        entity_type: entityFilter || undefined,
        limit: 50,
      });
      setLogs(result.logs);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [entityFilter]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const actionLabel = (action) => {
    if (action === "create") return "إنشاء";
    if (action === "update") return "تعديل";
    if (action === "delete") return "حذف";
    return action;
  };

  const actionColor = (action) => {
    if (action === "create") return "green";
    if (action === "update") return "blue";
    if (action === "delete") return "red";
    return "gray";
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Heading size="md">سجل التدقيق</Heading>
        <Text fontSize="sm" color={muted} mt={1}>
          تتبع كل العمليات المالية والتعديلات
        </Text>
      </Box>

      <Select
        w={{ base: "full", sm: "280px" }}
        value={entityFilter}
        onChange={(e) => setEntityFilter(e.target.value)}
        borderRadius="xl"
      >
        <option value="">كل العمليات</option>
        {ENTITY_OPTIONS.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="hidden">
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" py={14}>
              <Spinner color="blue.500" />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="800px">
                <Thead>
                  <Tr>
                    <Th>التاريخ</Th>
                    <Th>النوع</Th>
                    <Th>الإجراء</Th>
                    <Th>المنفّذ</Th>
                    <Th>التفاصيل</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {logs.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={8} color={muted}>
                        لا توجد سجلات
                      </Td>
                    </Tr>
                  ) : (
                    logs.map((log) => (
                      <Tr key={log.id}>
                        <Td whiteSpace="nowrap">{formatDate(log.created_at)}</Td>
                        <Td>
                          <Badge variant="subtle">
                            {AUDIT_ENTITY_LABELS[log.entity_type] || log.entity_type}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={actionColor(log.action)}>
                            {actionLabel(log.action)}
                          </Badge>
                        </Td>
                        <Td>{log.actor_name || log.actor_id || "—"}</Td>
                        <Td>
                          <Box
                            as="pre"
                            fontSize="xs"
                            p={2}
                            borderRadius="md"
                            bg={codeBg}
                            maxW="280px"
                            overflow="auto"
                            whiteSpace="pre-wrap"
                          >
                            {JSON.stringify(log.after_data || log.before_data || {}, null, 0)
                              .slice(0, 120)}
                            {(JSON.stringify(log.after_data || {}).length || 0) > 120 ? "…" : ""}
                          </Box>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}
