import React from 'react'
import { useParams } from 'react-router-dom'
import baseUrl from '../../api/baseUrl'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Textarea,
  IconButton,
  Button,
  Divider,
  Spinner,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react'
import { FaPaperPlane, FaReply, FaCommentDots, FaSync } from 'react-icons/fa'

const LecturCommints = () => {
  const { id: lectureId } = useParams()
  const [comments, setComments] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [newComment, setNewComment] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [lastRefresh, setLastRefresh] = React.useState(Date.now())
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const streamAbortRef = React.useRef(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const sectionBg = useColorModeValue('blue.50', 'gray.700')
  const borderColor = useColorModeValue('blue.200', 'gray.600')
  const headingColor = useColorModeValue('blue.800', 'blue.100')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subTextColor = useColorModeValue('gray.600', 'gray.400')

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  }, [])

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('ar-EG', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return iso
    }
  }

  const fetchComments = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await baseUrl.get(`/api/course-content/lecture/${lectureId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setComments(res.data?.comments || [])
      setLastRefresh(Date.now())
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في جلب التعليقات')
    } finally {
      if (!isAutoRefresh) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  const addCommentLocally = (comment) => {
    if (!comment) return
    // Ensure replies array exists
    const normalized = { ...comment, replies: Array.isArray(comment.replies) ? comment.replies : [] }
    if (!normalized.parent_comment_id) {
      setComments((prev) => [normalized, ...prev])
      return
    }
    const insertReply = (list) => list.map((c) => {
      if (c.id === normalized.parent_comment_id) {
        const replies = Array.isArray(c.replies) ? c.replies.slice() : []
        return { ...c, replies: [...replies, normalized] }
      }
      if (Array.isArray(c.replies) && c.replies.length > 0) {
        return { ...c, replies: insertReply(c.replies) }
      }
      return c
    })
    setComments((prev) => insertReply(prev))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await baseUrl.post(
        `/api/course-content/lecture/${lectureId}/comments`,
        { content: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const created = res.data?.comment || res.data
      // Enrich with current user info for immediate UI
      addCommentLocally({
        ...created,
        user_name: currentUser?.name || currentUser?.fname || 'أنا',
        user_avatar: currentUser?.avatar || currentUser?.image,
      })
      setNewComment('')
      
      // تحديث تلقائي للتعليقات بعد إضافة تعليق جديد
      setTimeout(() => {
        fetchComments(true)
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إضافة التعليق')
    } finally {
      setSubmitting(false)
    }
  }

  const connectStream = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const controller = new AbortController()
    streamAbortRef.current = controller
    const base = baseUrl?.defaults?.baseURL?.replace(/\/$/, '') || ''
    const url = `${base}/api/course-content/lecture/${lectureId}/comments/stream`
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      if (!response.ok || !response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const part of parts) {
          const lines = part.split('\n').map(l => l.trim())
          const dataLine = lines.find(l => l.startsWith('data:'))
          if (!dataLine) continue
          const jsonStr = dataLine.replace(/^data:\s*/, '')
          try {
            const payload = JSON.parse(jsonStr)
            if (payload?.type === 'comment_created' && payload.comment) {
              addCommentLocally(payload.comment)
            }
          } catch {}
        }
      }
    } catch (err) {
      // silent retry strategy can be added if needed
    }
  }

  React.useEffect(() => {
    fetchComments()
    connectStream()
    return () => {
      try {
        streamAbortRef.current?.abort()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId])

  const handleReplySubmit = async (parentId, content, setLocalLoading, clear) => {
    if (!content.trim()) return
    setLocalLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await baseUrl.post(
        `/api/course-content/lecture/${lectureId}/comments`,
        { content: content.trim(), parent_comment_id: parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const created = res.data?.comment || res.data
      addCommentLocally({
        ...created,
        parent_comment_id: parentId,
        user_name: currentUser?.name || currentUser?.fname || 'أنا',
        user_avatar: currentUser?.avatar || currentUser?.image,
      })
      clear()
      
      // تحديث تلقائي للتعليقات بعد إضافة رد
      setTimeout(() => {
        fetchComments(true)
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إضافة الرد')
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <VStack className='mt-[50px]' spacing={8} align="stretch" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }} dir="rtl">
      <Box
        bg={sectionBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
      >
        <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
          <HStack>
            <Heading size={{ base: 'md', md: 'lg' }} color={headingColor}>تعليقات المحاضرة</Heading>
            <Badge colorScheme="blue">{comments.length} تعليق</Badge>
            {isRefreshing && (
              <Badge colorScheme="green" variant="subtle">
                <HStack spacing={1}>
                  <Spinner size="xs" />
                  <Text fontSize="xs">تحديث...</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
          <HStack>
            <IconButton 
              aria-label="تحديث" 
              icon={<FaSync />} 
              onClick={() => fetchComments()} 
              variant="outline" 
              colorScheme="blue"
              isLoading={isRefreshing}
            />
          </HStack>
        </HStack>

        <HStack align="start" spacing={3} mb={2}>
          <Avatar name={currentUser?.name} src={currentUser?.avatar} size="sm" />
          <Textarea
            placeholder="اكتب تعليقك..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            bg={cardBg}
            borderColor={borderColor}
            _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
            resize="vertical"
          />
        </HStack>
        <HStack justify="flex-end">
          <Button
            rightIcon={<FaPaperPlane />}
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitting}
            borderRadius="full"
          >
            إرسال
          </Button>
        </HStack>
      </Box>

      <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={{ base: 3, md: 5 }}>
        {loading ? (
          <HStack justify="center" py={10}><Spinner size="lg" /></HStack>
        ) : error ? (
          <Box textAlign="center" color="red.500" py={6}>{error}</Box>
        ) : comments.length === 0 ? (
          <Box textAlign="center" color={subTextColor} py={6}>لا توجد تعليقات بعد. كن أول من يعلّق!</Box>
        ) : (
          <VStack align="stretch" spacing={4}>
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={handleReplySubmit}
                headingColor={headingColor}
                textColor={textColor}
                subTextColor={subTextColor}
                borderColor={borderColor}
                cardBg={cardBg}
              />
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  )
}

const CommentItem = ({ comment, onReply, headingColor, textColor, subTextColor, borderColor, cardBg }) => {
  const [showReply, setShowReply] = React.useState(false)
  const [replyContent, setReplyContent] = React.useState('')
  const [replyLoading, setReplyLoading] = React.useState(false)

  return (
    <Box border="1px solid" borderColor={borderColor} borderRadius="xl" p={4} bg={cardBg}>
      <HStack align="start" spacing={3}>
        <Avatar name={comment.user_name} src={comment.user_avatar} size="sm" />
        <VStack align="start" spacing={1} flex={1}>
          <HStack justify="space-between" w="full" align="center">
            <HStack spacing={2}>
              <Text fontWeight="bold" color={headingColor}>{comment.user_name || 'مستخدم'}</Text>
              <Text fontSize="sm" color={subTextColor}>{comment.user_role ? `• ${comment.user_role}` : ''}</Text>
            </HStack>
            <HStack spacing={2}>
              <Text fontSize="xs" color={subTextColor}>{new Date(comment.created_at).toLocaleString('ar-EG')}</Text>
              <IconButton
                aria-label="رد"
                icon={<FaReply />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={() => setShowReply((s) => !s)}
              />
            </HStack>
          </HStack>
          <Text color={textColor} whiteSpace="pre-wrap">{comment.content}</Text>
          {showReply && (
            <Box w="full" mt={2}>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="اكتب ردك..."
                bg={cardBg}
                borderColor={borderColor}
                _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                resize="vertical"
              />
              <HStack justify="flex-end" mt={2}>
                <Button
                  rightIcon={<FaCommentDots />}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => onReply(comment.id, replyContent, setReplyLoading, () => { setReplyContent(''); setShowReply(false) })}
                  isLoading={replyLoading}
                  borderRadius="full"
                >
                  رد
                </Button>
              </HStack>
            </Box>
          )}
          {Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <VStack align="stretch" spacing={3} mt={3} pl={4} borderRight="2px solid" borderColor={borderColor} pr={2}>
              {comment.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  onReply={onReply}
                  headingColor={headingColor}
                  textColor={textColor}
                  subTextColor={subTextColor}
                  borderColor={borderColor}
                  cardBg={cardBg}
                />
              ))}
            </VStack>
          )}
        </VStack>
      </HStack>
      <Divider mt={3} />
    </Box>
  )
}

export default LecturCommints