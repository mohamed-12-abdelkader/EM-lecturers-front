import { Tab, TabList } from "@chakra-ui/react";
import { CR_TAB_COLORS } from "../courseTheme";

const chakraColorMap = {
  red: { active: "red.500", hover: "red.50", border: "red.200" },
  blue: { active: "blue.500", hover: "blue.50", border: "blue.200" },
  green: { active: "green.500", hover: "green.50", border: "green.200" },
  purple: { active: "purple.500", hover: "purple.50", border: "purple.200" },
  orange: { active: "orange.500", hover: "orange.50", border: "orange.200" },
};

export function getCourseTabStyles(colorKey = "blue") {
  const c = chakraColorMap[colorKey] || chakraColorMap.blue;
  const tw = CR_TAB_COLORS[colorKey] || CR_TAB_COLORS.blue;
  return {
    className: `!rounded-xl !font-bold !border !transition-all !duration-200 ${tw.border}`,
    fontWeight: "bold",
    fontSize: { base: "13px", sm: "15px" },
    borderRadius: "xl",
    py: { base: 2.5, md: 3 },
    px: { base: 4, md: 5 },
    flex: { base: "1 1 calc(50% - 8px)", md: "initial" },
    justifyContent: "center",
    display: "flex",
    alignItems: "center",
    gap: 2,
    border: "1px solid",
    borderColor: c.border,
    color: "gray.600",
    transition: "all 0.2s",
    _selected: {
      color: "white",
      bg: c.active,
      borderColor: c.active,
      boxShadow: `0 4px 14px rgba(0,0,0,0.12)`,
    },
    _hover: {
      bg: c.hover,
    },
  };
}

export default function CourseProTabBar({ children }) {
  return (
    <TabList
      display="flex"
      flexWrap="wrap"
      gap={2}
      p={2}
      borderRadius="2xl"
      bg="gray.50"
      _dark={{ bg: "whiteAlpha.50", borderColor: "whiteAlpha.200" }}
      borderWidth="1px"
      borderColor="gray.200"
      mb={6}
      w="full"
      boxShadow="none"
    >
      {children}
    </TabList>
  );
}

export function CourseProTab({ colorKey = "blue", children, ...props }) {
  return (
    <Tab {...getCourseTabStyles(colorKey)} {...props}>
      {children}
    </Tab>
  );
}
