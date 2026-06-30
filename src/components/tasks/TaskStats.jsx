import React, { useState, useEffect } from "react";
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Flex,
  Text,
  Icon,
  Badge,
} from "@chakra-ui/react";
import {
  FaTasks,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaFire,
  FaCalendarTimes,
} from "react-icons/fa";
import useTasks from "../../Hooks/tasks/useTasks";

const TaskStats = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const { getTaskStats } = useTasks();

  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const statsData = await getTaskStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "إجمالي المهام",
      value: stats.total_tasks || 0,
      icon: FaTasks,
      color: "blue",
      helpText: "جميع المهام في النظام",
    },
    {
      label: "في الانتظار",
      value: stats.pending_tasks || 0,
      icon: FaClock,
      color: "orange",
      helpText: "مهام في انتظار البدء",
    },
    {
      label: "قيد التنفيذ",
      value: stats.in_progress_tasks || 0,
      icon: FaClock,
      color: "blue",
      helpText: "مهام قيد العمل",
    },
    {
      label: "مكتملة",
      value: stats.completed_tasks || 0,
      icon: FaCheckCircle,
      color: "green",
      helpText: "مهام منجزة",
    },
    {
      label: "ملغية",
      value: stats.cancelled_tasks || 0,
      icon: FaTimesCircle,
      color: "red",
      helpText: "مهام ملغية",
    },
    {
      label: "عاجلة",
      value: stats.urgent_tasks || 0,
      icon: FaFire,
      color: "red",
      helpText: "مهام عاجلة",
    },
    {
      label: "متأخرة",
      value: stats.overdue_tasks || 0,
      icon: FaCalendarTimes,
      color: "red",
      helpText: "مهام متأخرة",
    },
  ];

  if (loading) {
    return (
      <Box p={4} bg={cardBg} borderRadius="lg" boxShadow="md" border="1px solid" borderColor={borderColor}>
        <Text color={textColor} textAlign="center">جاري تحميل الإحصائيات...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg={cardBg} borderRadius="xl" boxShadow="lg" border="1px solid" borderColor={borderColor}>
      <Text fontSize="xl" fontWeight="bold" color={textColor} mb={6} textAlign="center">
        إحصائيات المهام
      </Text>
      
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
        {statCards.map((stat, index) => (
          <Stat
            key={index}
            p={4}
            bg={useColorModeValue("gray.50", "gray.700")}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "md",
            }}
            transition="all 0.2s"
          >
            <Flex align="center" justify="space-between" mb={2}>
              <StatLabel color={subTextColor} fontSize="sm" fontWeight="medium">
                {stat.label}
              </StatLabel>
              <Icon as={stat.icon} color={`${stat.color}.500`} boxSize={5} />
            </Flex>
            
            <StatNumber color={textColor} fontSize="2xl" fontWeight="bold">
              {stat.value}
            </StatNumber>
            
            <StatHelpText color={subTextColor} fontSize="xs" mt={1}>
              {stat.helpText}
            </StatHelpText>
          </Stat>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default TaskStats; 