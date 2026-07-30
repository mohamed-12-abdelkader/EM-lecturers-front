import React from "react";
import {
  Box,
  Button,
  Flex,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";

export const GUEST_TOKEN_KEY = "support_guest_token";

const URL_REGEX =
  /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

const WA_SENT_BUBBLE = "#dcf8c6";
const WA_BOT_BUBBLE = "#e7f8e5";
const WA_RECEIVED_BUBBLE = "#ffffff";

/** يستخرج روابط من النص ويعرضها قابلة للنقر */
export function MessageTextWithLinks({ text, fontSize = "15px" }) {
  if (!text) return null;

  const parts = String(text).split(URL_REGEX);
  return (
    <Text whiteSpace="pre-wrap" fontSize={fontSize} wordBreak="break-word">
      {parts.map((part, i) => {
        if (!part) return null;
        const isUrl = /^https?:\/\//i.test(part) || /^www\./i.test(part);
        if (!isUrl) return <React.Fragment key={i}>{part}</React.Fragment>;
        const href = part.startsWith("http") ? part : `https://${part}`;
        return (
          <Link
            key={i}
            href={href}
            isExternal
            color="blue.600"
            textDecoration="underline"
            fontWeight="600"
          >
            {part}
          </Link>
        );
      })}
    </Text>
  );
}

/**
 * أزرار منصات المدرسين من حقل teachers في رد SubscribeTeacher
 * @param {{ teachers?: Array<{ teacher_id?: number, teacher_name?: string, subject?: string|null, platform_url?: string }> }} props
 */
export function TeacherPlatformButtons({ teachers }) {
  const list = Array.isArray(teachers)
    ? teachers.filter((t) => t?.platform_url)
    : [];
  if (!list.length) return null;

  return (
    <VStack align="stretch" spacing={2} mt={2}>
      {list.map((t, i) => {
        const labelParts = [t.teacher_name, t.subject].filter(Boolean);
        const label =
          list.length === 1
            ? "الذهاب إلى المنصة"
            : `منصة ${labelParts.join(" — ") || "المدرس"}`;
        return (
          <Button
            key={`${t.teacher_id || t.platform_url}-${i}`}
            as="a"
            href={t.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            colorScheme="green"
            borderRadius="full"
            leftIcon={<FaExternalLinkAlt />}
            fontWeight="700"
          >
            {label}
          </Button>
        );
      })}
    </VStack>
  );
}

function formatMsgDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

/** هل الرسالة صادرة من المستخدم (ضيف/طالب)؟ */
export function isOutgoingSupportMessage(msg) {
  const role = msg?.sender_role;
  return role === "guest" || role === "student";
}

/**
 * فقاعة رسالة حسب الشكل الجديد:
 * sender_role: guest | student | bot
 */
export function SupportMessageBubble({ msg }) {
  const outgoing = isOutgoingSupportMessage(msg);
  const isBot = msg?.sender_role === "bot";

  return (
    <Flex justify={outgoing ? "flex-end" : "flex-start"} w="full">
      <Box
        maxW="85%"
        px={3}
        py={2}
        borderRadius="18px"
        borderBottomRightRadius={outgoing ? "4px" : "18px"}
        borderBottomLeftRadius={!outgoing ? "4px" : "18px"}
        bg={outgoing ? WA_SENT_BUBBLE : isBot ? WA_BOT_BUBBLE : WA_RECEIVED_BUBBLE}
        color="gray.800"
        boxShadow="0 1px 1px rgba(0,0,0,0.1)"
      >
        {msg?.text ? <MessageTextWithLinks text={msg.text} /> : null}
        <TeacherPlatformButtons teachers={msg?.teachers} />
        <Text
          fontSize="11px"
          color="gray.500"
          mt={1}
          textAlign={outgoing ? "left" : "right"}
        >
          {isBot ? "المساعد · " : ""}
          {formatMsgDate(msg?.created_at)}
        </Text>
      </Box>
    </Flex>
  );
}

/**
 * يدمج user_message + bot_message من رد POST /messages
 * ويُلحق teachers على رسالة البوت إن وُجدت.
 */
export function appendAssistantSendResponse(prev, data) {
  const next = Array.isArray(prev) ? [...prev] : [];
  if (data?.user_message) {
    next.push({
      ...data.user_message,
      id: data.user_message.id ?? `user-${Date.now()}`,
    });
  }
  if (data?.bot_message) {
    next.push({
      ...data.bot_message,
      id: data.bot_message.id ?? `bot-${Date.now()}`,
      teachers: data.teachers || data.bot_message.teachers || null,
    });
  }
  return next;
}

export function persistGuestToken(token) {
  const t = String(token || "").trim();
  if (!t) return "";
  try {
    localStorage.setItem(GUEST_TOKEN_KEY, t);
  } catch {
    // ignore
  }
  return t;
}

export function readGuestToken() {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function clearGuestToken() {
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export const SUPPORT_EMPTY_HINTS = [
  "عايز أشترك",
  "عايز منصة مستر محمد عبدالقادر",
  "مش قادر أسجل دخول",
  "مشكلة تقنية في المنصة",
];
