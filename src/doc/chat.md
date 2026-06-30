Student Support Chat API documentation:
# Student Support Chat API Documentation## OverviewThis document describes all APIs and features available to students for the support chat system with AI-powered chatbot assistance.---## Base URL
/api/support
## AuthenticationAll endpoints require JWT token in Authorization header:
Authorization: Bearer <student_token>
---## REST API Endpoints### 1. Get Student Chat*Endpoint:* GET /api/support/chat`Get or create the student's support chat.**Response (200 OK):**{  "chat": {    "id": 123,    "student_id": 5,    "admin_id": null,    "status": "bot_handling",    "last_message_at": "2024-01-15T10:00:00Z",    "created_at": "2024-01-15T09:00:00Z",    "updated_at": "2024-01-15T10:00:00Z",    "current_intent": "LOGIN_PROBLEM",    "bot_attempts": 1  }}**Chat Status Values:**- `bot_handling - 🟢 Bot is handling your request- waiting_for_admin - 🟡 Waiting for admin response (you cannot send messages)- admin_handling - 🔵 Admin is handling your request- resolved - ✅ Problem resolved- closed - ⚫ Chat closed*Example:async function getMyChat() {  const response = await fetch('/api/support/chat', {    headers: {      'Authorization': Bearer ${getToken()}    }  });  return response.json();}---### 2. Get Chat MessagesEndpoint:* GET /api/support/chats/:chatId/messages`Get messages for your chat.**Query Parameters:**- `limit (optional, default: 50) - Number of messages to retrieve- before (optional) - Timestamp for pagination (ISO string)*Response (200 OK):{  "messages": [    {      "id": 1,      "chat_id": 123,      "sender_id": 5,      "sender_role": "student",      "message_type": "text",      "text": "I can't log in to my account",      "is_auto_reply": false,      "created_at": "2024-01-15T10:00:00Z",      "sender_name": "أحمد محمد",      "status": "read"    },    {      "id": 2,      "chat_id": 123,      "sender_id": 5,      "sender_role": "admin",      "message_type": "auto_reply",      "text": "أهلاً بك! دعني أساعدك في حل مشكلة تسجيل الدخول...",      "is_auto_reply": true,      "created_at": "2024-01-15T10:00:05Z",      "sender_name": "رد تلقائي",      "status": "read"    }  ]}Message Types:- text - Text message- image - Image attachment- file - File attachment- audio - Audio/voice message- auto_reply - Bot automatic responseExample:ypescriptasync function getMessages(chatId: number, limit = 50) {  const response = await fetch(    /api/support/chats/${chatId}/messages?limit=${limit},    {      headers: {        'Authorization': Bearer ${getToken()}      }    }  );  return response.json();}---### 3. Send Text Message (Triggers Bot)Endpoint:* POST /api/support/messages`Send a text message. **Bot automatically responds if chat status allows.****Request Body:**{  "text": "I can't log in to my account"}**Note:** `chat_id is optional for students (automatically uses your chat).*Response (201 Created):{  "message": {    "id": 1,    "chat_id": 123,    "sender_id": 5,    "sender_role": "student",    "text": "I can't log in to my account",    "message_type": "text",    "is_auto_reply": false,    "created_at": "2024-01-15T10:00:00Z"  },  "bot_reply": {    "id": 2,    "chat_id": 123,    "sender_role": "admin",    "text": "أهلاً بك! دعني أساعدك في حل مشكلة تسجيل الدخول...",    "message_type": "auto_reply",    "is_auto_reply": true,    "created_at": "2024-01-15T10:00:05Z"  }}Important Notes:- Bot reply is only included if bot responds- If chat status is waiting_for_admin, you cannot send messages (see error below)- Bot automatically detects your problem type and provides helpError Response (403 Forbidden):n{  "message": "Please wait for admin response. You cannot send messages while waiting for support team.",  "status": "waiting_for_admin"}This error occurs when:- Chat status is waiting_for_admin- You must wait for admin to respond first- After admin responds, status changes to admin_handling and you can send againExample:riptasync function sendMessage(text: string) {  try {    const response = await fetch('/api/support/messages', {      method: 'POST',      headers: {        'Authorization': Bearer ${getToken()},        'Content-Type': 'application/json'      },      body: JSON.stringify({ text })    });        if (response.status === 403) {      const error = await response.json();      // Show message: "Please wait for admin response"      showError(error.message);      return;    }        return response.json();  } catch (error) {    console.error('Failed to send message:', error);  }}---### 4. Send Media MessageEndpoint:* POST /api/support/messages/media`Send an image, video, or file.**Content-Type:** `multipart/form-data*Form Data:- file (required) - File to upload (image, video, or document)- text (optional) - Text caption- chat_id (optional) - Auto-assigned for studentsResponse (201 Created):{  "message": {    "id": 3,    "chat_id": 123,    "message_type": "image",    "media_url": "https://cloudinary.com/image.jpg",    "media_type": "image/jpeg",    "media_name": "screenshot.jpg",    "media_size": 102400,    "text": "Screenshot of the error",    "created_at": "2024-01-15T10:05:00Z"  }}Example:escriptasync function sendMedia(file: File, text?: string) {  const formData = new FormData();  formData.append('file', file);  if (text) formData.append('text', text);    const response = await fetch('/api/support/messages/media', {    method: 'POST',    headers: {      'Authorization': Bearer ${getToken()}    },    body: formData  });    return response.json();}---### 5. Send Audio MessageEndpoint:* POST /api/support/messages/audio`Send a voice/audio message.**Content-Type:** `multipart/form-data*Form Data:- audio (required) - Audio file- duration (optional) - Duration in seconds- chat_id (optional) - Auto-assigned for studentsResponse (201 Created):{  "message": {    "id": 4,    "chat_id": 123,    "message_type": "audio",    "media_url": "https://cloudinary.com/audio.m4a",    "media_type": "audio/m4a",    "media_name": "voice-message.m4a",    "media_size": 51200,    "duration": 15,    "created_at": "2024-01-15T10:10:00Z"  }}Example:async function sendAudio(audioFile: File, duration?: number) {  const formData = new FormData();  formData.append('audio', audioFile);  if (duration) formData.append('duration', duration.toString());    const response = await fetch('/api/support/messages/audio', {    method: 'POST',    headers: {      'Authorization': Bearer ${getToken()}    },    body: formData  });    return response.json();}---### 6. Get Unread CountEndpoint:* GET /api/support/unread-count`Get count of unread messages from admin/bot.**Response (200 OK):**son{  "unread_count": 3}**Example:**iptasync function getUnreadCount() {  const response = await fetch('/api/support/unread-count', {    headers: {      'Authorization': `Bearer ${getToken()}    }  });  return response.json();}---### 7. Get FAQs*Endpoint:* GET /api/support/faq`Get available FAQs (Frequently Asked Questions).**Response (200 OK):**{  "faqs": [    {      "id": 1,      "question": "كيف أقوم بإعادة تعيين كلمة المرور؟",      "answer": "يمكنك إعادة تعيين كلمة المرور من خلال...",      "priority": 10    }  ]}---## Socket.io Real-time Events### ConnectionConnect to Socket.io server with authentication:escriptimport { io } from 'socket.io-client';const socket = io('http://localhost:8000', {  auth: {    token: 'your_jwt_token'  },  transports: ['websocket', 'polling']});### Socket RoomsStudents automatically join:- `support:chat:{chatId} - Your chat room- support:student:{studentId} - Your personal room---## Client → Server Events### 1. Join Chat*Event:* support:join-chat`Join your chat room to receive real-time updates.**Payload:**ypescriptsocket.emit('support:join-chat', chatId);**Server Response:**escriptsocket.on('support:joined-chat', (data) => {  console.log('Joined chat:', data.chat_id);});socket.on('chat:ready', (data) => {  console.log('Chat ready:', data.chat_id);});---### 2. Send Message**Event:** `support:send-message`Send a message via Socket.io. **Bot automatically responds if allowed.****Payload:**ypescriptsocket.emit('support:send-message', {  text: "I can't log in"  // chat_id is optional for students});**Error Event:**socket.on('error', (error) => {  if (error.status === 'waiting_for_admin') {    // Show message: "Please wait for admin response"    showError(error.message);  }});**Important:** If chat status is `waiting_for_admin, you'll receive an error event and cannot send messages.---### 3. Leave Chat*Event:* support:leave-chat`Leave the chat room.**Payload:**socket.emit('support:leave-chat', chatId);---### 4. Typing Indicator**Event:** `support:typing`Send typing indicator.**Payload:**socket.emit('support:typing', {  chat_id: chatId,  is_typing: true});---### 5. Mark Message as Delivered/Read**Event:** `support:mark-delivered / support:mark-read`Mark message status.**Payload:**socket.emit('support:mark-delivered', messageId);socket.emit('support:mark-read', messageId);---## Server → Client Events### 1. New Message**Event:** `message:receive or support:new-message`Receive new messages (from admin or bot).**Payload:**socket.on('message:receive', (data) => {  // data.message - Full message object  // data.chat_id  // data.timestamp    const message = data.message;    if (message.is_auto_reply) {    // This is a bot message    console.log('Bot replied:', message.text);  } else {    // This is from admin    console.log('Admin replied:', message.text);  }});**Message Object:**ypescriptinterface Message {  id: number;  chat_id: number;  sender_id: number;  sender_role: 'student' | 'admin';  message_type: 'text' | 'image' | 'file' | 'audio' | 'auto_reply';  text: string | null;  media_url: string | null;  media_type: string | null;  media_name: string | null;  media_size: number | null;  duration: number | null;  is_auto_reply: boolean;  // true for bot messages  created_at: string;  sender_name: string;  _timestamp: number;  // Client-side timestamp  _uniqueId: string    // Unique ID to prevent duplicates}---### 2. Bot Auto-ReplyBot messages have `is_auto_reply: true. Handle them appropriately:ptsocket.on('message:receive', (data) => {  const message = data.message;    if (message.is_auto_reply) {    // Show bot message with different styling    showBotMessage(message);  } else {    // Show admin message    showAdminMessage(message);  }});---### 3. Message Status Update*Event:* message:status-updated`Message delivery/read status updates.**Payload:**tsocket.on('message:status-updated', (data) => {  // {  //   message_id: 1,  //   status: 'delivered' | 'read',  //   delivered_at?: string,  //   read_at?: string  // }    updateMessageStatus(data.message_id, data.status);});---### 4. Chat Status Update**Event:** `conversation:update or support:conversation-updated`Chat status or metadata updated.**Payload:**tsocket.on('conversation:update', (data) => {  const chat = data.conversation;    // Update chat status in UI  updateChatStatus(chat.status);    // If status changed from 'waiting_for_admin' to 'admin_handling'  // You can now send messages again  if (chat.status === 'admin_handling') {    enableMessageInput();    showNotification('Admin is now handling your chat. You can send messages.');  }});---### 5. User Typing**Event:** `support:user-typing`Admin is typing indicator.**Payload:**escriptsocket.on('support:user-typing', (data) => {  // {  //   chat_id: 123,  //   user_id: 2,  //   user_role: 'admin',  //   user_name: 'Support Team',  //   is_typing: true  // }    if (data.is_typing) {    showTypingIndicator(data.user_name);  } else {    hideTypingIndicator();  }});---### 6. Notification**Event:** `notification:new`New notification (admin reply, etc.).**Payload:**socket.on('notification:new', (data) => {  // {  //   type: 'admin_reply',  //   chat_id: 123,  //   message: { ... }  // }    showNotification('You have a new message from support');});---## Chat Status Behavior### Status: `bot_handling 🟢- **You can:** Send messages- *Bot will:* Automatically respond to your messages- *What happens:* Bot detects your problem and provides help### Status: waiting_for_admin 🟡- *You cannot:* Send messages (403 error)- *Bot will:* Not respond- *What happens:* Chat is escalated, waiting for admin- *Message shown:* "Please wait for admin response. You cannot send messages while waiting for support team."### Status: admin_handling 🔵- *You can:* Send messages again- *Bot can:* Still help with simple issues- *What happens:* Admin is handling, but bot can assist if needed### Status: resolved ✅- *You can:* Send messages- *Bot will:* Respond to thanks/solved messages- *What happens:* Problem is marked as resolved---## Bot Behavior### Automatic ResponsesThe bot automatically responds when you send a message (if status allows):1. *Intent Detection* - Bot detects your problem type:   - LOGIN_PROBLEM - Can't log in   - PASSWORD_RESET - Password reset   - ACCOUNT_LOCKED - Account locked   - COURSE_ACCESS - Course access issues   - VIDEO_LOADING - Video not loading   - PAYMENT - Payment issues   - BUG_ERROR - Technical bugs   - OTHER - General questions2. *Automated Help* - Bot provides step-by-step guidance3. *Escalation* - Bot escalates if:   - Problem requires admin (account locked, payment verification)   - Bot fails after 3 attempts   - You explicitly request admin help### Bot Responds to ThanksIf you say "thank you" or indicate problem is solved, bot responds with a closing message:*Examples:- "شكراً" → Bot: "العفو، نحن في خدمتك دائماً..."- "Thank you, problem solved" → Bot: "You're welcome, we're at your service..."---## Frontend Implementation Example### Complete Student Chat Componenttimport { useEffect, useState, useRef } from 'react';import { io, Socket } from 'socket.io-client';interface StudentChatProps {  token: string;}export function StudentChat({ token }: StudentChatProps) {  const [socket, setSocket] = useState<Socket | null>(null);  const [chat, setChat] = useState<any>(null);  const [messages, setMessages] = useState<any[]>([]);  const [inputText, setInputText] = useState('');  const [canSend, setCanSend] = useState(true);  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());  const messagesEndRef = useRef<HTMLDivElement>(null);  useEffect(() => {    // Connect socket    const newSocket = io('http://localhost:8000', {      auth: { token },      transports: ['websocket', 'polling']    });    setSocket(newSocket);    // Load chat    loadChat();    // Listen for new messages    newSocket.on('message:receive', (data) => {      setMessages(prev => {        if (prev.some(m => m.id === data.message.id)) return prev;        return [...prev, data.message];      });    });    // Listen for chat status updates    newSocket.on('conversation:update', (data) => {      setChat(data.conversation);      updateCanSend(data.conversation.status);    });    // Listen for typing    newSocket.on('support:user-typing', (data) => {      if (data.is_typing) {        setTypingUsers(prev => new Set([...prev, data.user_id]));      } else {        setTypingUsers(prev => {          const next = new Set(prev);          next.delete(data.user_id);          return next;        });      }    });    // Listen for errors (blocked messages)    newSocket.on('error', (error) => {      if (error.status === 'waiting_for_admin') {        setCanSend(false);        showError(error.message);      }    });    return () => {      newSocket.close();    };  }, [token]);  const loadChat = async () => {    try {      // Get chat      const chatResponse = await fetch('/api/support/chat', {        headers: { 'Authorization': Bearer ${token} }      });      const chatData = await chatResponse.json();      setChat(chatData.chat);      updateCanSend(chatData.chat.status);      // Join chat room      if (socket) {        socket.emit('support:join-chat', chatData.chat.id);      }      // Load messages      const messagesResponse = await fetch(        /api/support/chats/${chatData.chat.id}/messages,        {          headers: { 'Authorization': Bearer ${token} }        }      );      const messagesData = await messagesResponse.json();      setMessages(messagesData.messages);    } catch (error) {      console.error('Failed to load chat:', error);    }  };  const updateCanSend = (status: string) => {    setCanSend(status !== 'waiting_for_admin');  };  const handleSend = async () => {    if (!inputText.trim() || !canSend || !chat) return;    const text = inputText.trim();    setInputText('');    try {      // Send via REST API      const response = await fetch('/api/support/messages', {        method: 'POST',        headers: {          'Authorization': Bearer ${token},          'Content-Type': 'application/json'        },        body: JSON.stringify({ text })      });      if (response.status === 403) {        const error = await response.json();        showError(error.message);        setCanSend(false);        return;      }      const data = await response.json();            // Add your message      setMessages(prev => [...prev, data.message]);            // Add bot reply if exists      if (data.bot_reply) {        setMessages(prev => [...prev, data.bot_reply]);      }      // Refresh chat status      loadChat();    } catch (error) {      console.error('Failed to send message:', error);    }  };  const getStatusBadge = (status: string) => {    const badges = {      bot_handling: { text: '🟢 Bot Handling', color: 'green' },      waiting_for_admin: { text: '🟡 Waiting for Admin', color: 'yellow' },      admin_handling: { text: '🔵 Admin Handling', color: 'blue' },      resolved: { text: '✅ Resolved', color: 'green' },      closed: { text: '⚫ Closed', color: 'gray' }    };    return badges[status] || { text: status, color: 'gray' };  };  // Auto-scroll  useEffect(() => {    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });  }, [messages]);  return (    <div className="student-chat">      {/ Header /}      <div className="chat-header">        <h2>Support Chat</h2>        {chat && (          <div className="status-badge">            <span className={getStatusBadge(chat.status).color}>              {getStatusBadge(chat.status).text}            </span>          </div>        )}      </div>      {/ Messages /}      <div className="messages-container">        {messages.map((message) => (          <div            key={message.id}            className={message ${              message.sender_role === 'student' ? 'sent' : 'received'            } ${message.is_auto_reply ? 'bot-message' : ''}}          >            <div className="message-header">              <span className="sender-name">                {message.is_auto_reply ? '🤖 Bot' : message.sender_name}              </span>              <span className="message-time">                {new Date(message.created_at).toLocaleTimeString()}              </span>            </div>            <div className="message-content">              {message.text && <p>{message.text}</p>}              {message.media_url && (                <div className="media">                  {message.message_type === 'image' && (                    <img src={message.media_url} alt={message.media_name || ''} />                  )}                  {message.message_type === 'audio' && (                    <audio controls src={message.media_url} />                  )}                  {message.message_type === 'file' && (                    <a href={message.media_url} download>                      📎 {message.media_name}                    </a>                  )}                </div>              )}            </div>          </div>        ))}        {/ Typing Indicator /}        {typingUsers.size > 0 && (          <div className="typing-indicator">            Admin is typing...          </div>        )}        <div ref={messagesEndRef} />      </div>      {/ Input /}      <div className="chat-input">        {!canSend && (          <div className="blocked-notice">            ⚠️ Please wait for admin response. You cannot send messages while waiting for support team.          </div>        )}        <input          type="text"          value={inputText}          onChange={(e) => setInputText(e.target.value)}          onKeyPress={(e) => {            if (e.key === 'Enter' && !e.shiftKey) {              e.preventDefault();              handleSend();            }          }}          placeholder={canSend ? "Type your message..." : "Waiting for admin response..."}          disabled={!canSend}        />        <button onClick={handleSend} disabled={!inputText.trim() || !canSend}>          Send        </button>      </div>    </div>  );}---## Error Handling### 403 Forbidden - Waiting for AdminWhen:* Trying to send message while status is waiting_for_admin*Response:{  "message": "Please wait for admin response. You cannot send messages while waiting for support team.",  "status": "waiting_for_admin"}Frontend Handling:escriptif (response.status === 403) {  const error = await response.json();  if (error.status === 'waiting_for_admin') {    // Disable input    setCanSend(false);    // Show message    showError('Please wait for admin to respond. You will be able to send messages again once admin replies.');  }}---## Best Practices1. **Always join chat room* before sending messages via Socket.io2. *Handle duplicate messages* using _uniqueId field3. *Check chat status* before allowing message input4. *Show status badge* to inform user of current state5. *Display bot messages differently* (show bot badge/icon)6. *Listen for status updates* to enable/disable input7. *Handle errors gracefully* when blocked from sending8. *Show typing indicators* for better UX9. *Auto-scroll to bottom* when new messages arrive10. *Poll for messages on load, then use Socket.io for updates---## Complete Flow Example### Scenario: Login Problem1. **Student sends:* "I can't log in"   - Status: bot_handling   - Bot detects: LOGIN_PROBLEM   - Bot responds: "أهلاً بك! دعني أساعدك..."2. *Student says:* "This didn't work"   - Bot escalates   - Status: waiting_for_admin   - Student blocked from sending3. *Admin responds*   - Status: admin_handling   - Student can send again4. *Student sends:* "Thank you, problem solved"   - Bot detects thanks   - Bot responds: "العفو، نحن في خدمتك دائماً..."   - Status: resolved---This documentation covers all student-facing APIs and features for the support chat system.
Chat Status Values:
bot_handling - 🟢 Bot is handling your request
waiting_for_admin - 🟡 Waiting for admin response (you cannot send messages)
admin_handling - 🔵 Admin is handling your request
resolved - ✅ Problem resolved
closed - ⚫ Chat closed
Example:
async function getMyChat() {  const response = await fetch('/api/support/chat', {    headers: {      'Authorization': Bearer ${getToken()}    }  });  return response.json();}
2. Get Chat Messages
Endpoint: GET /api/support/chats/:chatId/messages
Get messages for your chat.
Query Parameters:
limit (optional, default: 50) - Number of messages to retrieve
before (optional) - Timestamp for pagination (ISO string)
Response (200 OK):
{  "messages": [    {      "id": 1,      "chat_id": 123,      "sender_id": 5,      "sender_role": "student",      "message_type": "text",      "text": "I can't log in to my account",      "is_auto_reply": false,      "created_at": "2024-01-15T10:00:00Z",      "sender_name": "أحمد محمد",      "status": "read"    },    {      "id": 2,      "chat_id": 123,      "sender_id": 5,      "sender_role": "admin",      "message_type": "auto_reply",      "text": "أهلاً بك! دعني أساعدك في حل مشكلة تسجيل الدخول...",      "is_auto_reply": true,      "created_at": "2024-01-15T10:00:05Z",      "sender_name": "رد تلقائي",      "status": "read"    }  ]}
Message Types:
text - Text message
image - Image attachment
file - File attachment
audio - Audio/voice message
auto_reply - Bot automatic response
Example:
async function getMessages(chatId: number, limit = 50) {  const response = await fetch(    /api/support/chats/${chatId}/messages?limit=${limit},    {      headers: {        'Authorization': Bearer ${getToken()}      }    }  );  return response.json();}
3. Send Text Message (Triggers Bot)
Endpoint: POST /api/support/messages
Send a text message. Bot automatically responds if chat status allows.
Request Body:
{  "text": "I can't log in to my account"}
Note: chat_id is optional for students (automatically uses your chat).
Response (201 Created):
{  "message": {    "id": 1,    "chat_id": 123,    "sender_id": 5,    "sender_role": "student",    "text": "I can't log in to my account",    "message_type": "text",    "is_auto_reply": false,    "created_at": "2024-01-15T10:00:00Z"  },  "bot_reply": {    "id": 2,    "chat_id": 123,    "sender_role": "admin",    "text": "أهلاً بك! دعني أساعدك في حل مشكلة تسجيل الدخول...",    "message_type": "auto_reply",    "is_auto_reply": true,    "created_at": "2024-01-15T10:00:05Z"  }}
Important Notes:
Bot reply is only included if bot responds
If chat status is waiting_for_admin, you cannot send messages (see error below)
Bot automatically detects your problem type and provides help
Error Response (403 Forbidden):
{  "message": "Please wait for admin response. You cannot send messages while waiting for support team.",  "status": "waiting_for_admin"}
This error occurs when:
Chat status is waiting_for_admin
You must wait for admin to respond first
After admin responds, status changes to admin_handling and you can send again
Example:
async function sendMessage(text: string) {  try {    const response = await fetch('/api/support/messages', {      method: 'POST',      headers: {        'Authorization': Bearer ${getToken()},        'Content-Type': 'application/json'      },      body: JSON.stringify({ text })    });        if (response.status === 403) {      const error = await response.json();      // Show message: "Please wait for admin response"      showError(error.message);      return;    }        return response.json();  } catch (error) {    console.error('Failed to send message:', error);  }}
4. Send Media Message
Endpoint: POST /api/support/messages/media
Send an image, video, or file.
Content-Type: multipart/form-data
Form Data:
file (required) - File to upload (image, video, or document)
text (optional) - Text caption
chat_id (optional) - Auto-assigned for students
Response (201 Created):
{  "message": {    "id": 3,    "chat_id": 123,    "message_type": "image",    "media_url": "https://cloudinary.com/image.jpg",    "media_type": "image/jpeg",    "media_name": "screenshot.jpg",    "media_size": 102400,    "text": "Screenshot of the error",    "created_at": "2024-01-15T10:05:00Z"  }}
Example:
async function sendMedia(file: File, text?: string) {  const formData = new FormData();  formData.append('file', file);  if (text) formData.append('text', text);    const response = await fetch('/api/support/messages/media', {    method: 'POST',    headers: {      'Authorization': Bearer ${getToken()}    },    body: formData  });    return response.json();}
5. Send Audio Message
Endpoint: POST /api/support/messages/audio
Send a voice/audio message.
Content-Type: multipart/form-data
Form Data:
audio (required) - Audio file
duration (optional) - Duration in seconds
chat_id (optional) - Auto-assigned for students
Response (201 Created):
{  "message": {    "id": 4,    "chat_id": 123,    "message_type": "audio",    "media_url": "https://cloudinary.com/audio.m4a",    "media_type": "audio/m4a",    "media_name": "voice-message.m4a",    "media_size": 51200,    "duration": 15,    "created_at": "2024-01-15T10:10:00Z"  }}
Example:
async function sendAudio(audioFile: File, duration?: number) {  const formData = new FormData();  formData.append('audio', audioFile);  if (duration) formData.append('duration', duration.toString());    const response = await fetch('/api/support/messages/audio', {    method: 'POST',    headers: {      'Authorization': Bearer ${getToken()}    },    body: formData  });    return response.json();}
6. Get Unread Count
Endpoint: GET /api/support/unread-count
Get count of unread messages from admin/bot.
Response (200 OK):
{  "unread_count": 3}
Example:
async function getUnreadCount() {  const response = await fetch('/api/support/unread-count', {    headers: {      'Authorization': Bearer ${getToken()}    }  });  return response.json();}
7. Get FAQs
Endpoint: GET /api/support/faq
Get available FAQs (Frequently Asked Questions).
Response (200 OK):
{  "faqs": [    {      "id": 1,      "question": "كيف أقوم بإعادة تعيين كلمة المرور؟",      "answer": "يمكنك إعادة تعيين كلمة المرور من خلال...",      "priority": 10    }  ]}
Socket.io Real-time Events
Connection
Connect to Socket.io server with authentication:
import { io } from 'socket.io-client';const socket = io('http://localhost:8000', {  auth: {    token: 'your_jwt_token'  },  transports: ['websocket', 'polling']});
Socket Rooms
Students automatically join:
support:chat:{chatId} - Your chat room
support:student:{studentId} - Your personal room
Client → Server Events
1. Join Chat
Event: support:join-chat
Join your chat room to receive real-time updates.
Payload:
socket.emit('support:join-chat', chatId);
Server Response:
socket.on('support:joined-chat', (data) => {  console.log('Joined chat:', data.chat_id);});socket.on('chat:ready', (data) => {  console.log('Chat ready:', data.chat_id);});
2. Send Message
Event: support:send-message
Send a message via Socket.io. Bot automatically responds if allowed.
Payload:
socket.emit('support:send-message', {  text: "I can't log in"  // chat_id is optional for students});
Error Event:
socket.on('error', (error) => {  if (error.status === 'waiting_for_admin') {    // Show message: "Please wait for admin response"    showError(error.message);  }});
Important: If chat status is waiting_for_admin, you'll receive an error event and cannot send messages.
3. Leave Chat
Event: support:leave-chat
Leave the chat room.
Payload:
socket.emit('support:leave-chat', chatId);
4. Typing Indicator
Event: support:typing
Send typing indicator.
Payload:
socket.emit('support:typing', {  chat_id: chatId,  is_typing: true});
5. Mark Message as Delivered/Read
Event: support:mark-delivered / support:mark-read
Mark message status.
Payload:
socket.emit('support:mark-delivered', messageId);socket.emit('support:mark-read', messageId);
Server → Client Events
1. New Message
Event: message:receive or support:new-message
Receive new messages (from admin or bot).
Payload:
socket.on('message:receive', (data) => {  // data.message - Full message object  // data.chat_id  // data.timestamp    const message = data.message;    if (message.is_auto_reply) {    // This is a bot message    console.log('Bot replied:', message.text);  } else {    // This is from admin    console.log('Admin replied:', message.text);  }});
Message Object:
interface Message {  id: number;  chat_id: number;  sender_id: number;  sender_role: 'student' | 'admin';  message_type: 'text' | 'image' | 'file' | 'audio' | 'auto_reply';  text: string | null;  media_url: string | null;  media_type: string | null;  media_name: string | null;  media_size: number | null;  duration: number | null;  is_auto_reply: boolean;  // true for bot messages  created_at: string;  sender_name: string;  _timestamp: number;  // Client-side timestamp  _uniqueId: string    // Unique ID to prevent duplicates}
2. Bot Auto-Reply
Bot messages have is_auto_reply: true. Handle them appropriately:
socket.on('message:receive', (data) => {  const message = data.message;    if (message.is_auto_reply) {    // Show bot message with different styling    showBotMessage(message);  } else {    // Show admin message    showAdminMessage(message);  }});
3. Message Status Update
Event: message:status-updated
Message delivery/read status updates.
Payload:
socket.on('message:status-updated', (data) => {  // {  //   message_id: 1,  //   status: 'delivered' | 'read',  //   delivered_at?: string,  //   read_at?: string  // }    updateMessageStatus(data.message_id, data.status);});
4. Chat Status Update
Event: conversation:update or support:conversation-updated
Chat status or metadata updated.
Payload:
socket.on('conversation:update', (data) => {  const chat = data.conversation;    // Update chat status in UI  updateChatStatus(chat.status);    // If status changed from 'waiting_for_admin' to 'admin_handling'  // You can now send messages again  if (chat.status === 'admin_handling') {    enableMessageInput();    showNotification('Admin is now handling your chat. You can send messages.');  }});
5. User Typing
Event: support:user-typing
Admin is typing indicator.
Payload:
socket.on('support:user-typing', (data) => {  // {  //   chat_id: 123,  //   user_id: 2,  //   user_role: 'admin',  //   user_name: 'Support Team',  //   is_typing: true  // }    if (data.is_typing) {    showTypingIndicator(data.user_name);  } else {    hideTypingIndicator();  }});
6. Notification
Event: notification:new
New notification (admin reply, etc.).
Payload:
socket.on('notification:new', (data) => {  // {  //   type: 'admin_reply',  //   chat_id: 123,  //   message: { ... }  // }    showNotification('You have a new message from support');});
Chat Status Behavior
Status: bot_handling 🟢
You can: Send messages
Bot will: Automatically respond to your messages
What happens: Bot detects your problem and provides help
Status: waiting_for_admin 🟡
You cannot: Send messages (403 error)
Bot will: Not respond
What happens: Chat is escalated, waiting for admin
Message shown: "Please wait for admin response. You cannot send messages while waiting for support team."
Status: admin_handling 🔵
You can: Send messages again
Bot can: Still help with simple issues
What happens: Admin is handling, but bot can assist if needed
Status: resolved ✅
You can: Send messages
Bot will: Respond to thanks/solved messages
What happens: Problem is marked as resolved
Bot Behavior
Automatic Responses
The bot automatically responds when you send a message (if status allows):
Intent Detection - Bot detects your problem type:
LOGIN_PROBLEM - Can't log in
PASSWORD_RESET - Password reset
ACCOUNT_LOCKED - Account locked
COURSE_ACCESS - Course access issues
VIDEO_LOADING - Video not loading
PAYMENT - Payment issues
BUG_ERROR - Technical bugs
OTHER - General questions
Automated Help - Bot provides step-by-step guidance
Escalation - Bot escalates if:
Problem requires admin (account locked, payment verification)
Bot fails after 3 attempts
You explicitly request admin help
Bot Responds to Thanks
If you say "thank you" or indicate problem is solved, bot responds with a closing message:
Examples:
"شكراً" → Bot: "العفو، نحن في خدمتك دائماً..."
"Thank you, problem solved" → Bot: "You're welcome, we're at your service..."
Frontend Implementation Example
Complete Student Chat Component
import { useEffect, useState, useRef } from 'react';import { io, Socket } from 'socket.io-client';interface StudentChatProps {  token: string;}export function StudentChat({ token }: StudentChatProps) {  const [socket, setSocket] = useState<Socket | null>(null);  const [chat, setChat] = useState<any>(null);  const [messages, setMessages] = useState<any[]>([]);  const [inputText, setInputText] = useState('');  const [canSend, setCanSend] = useState(true);  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());  const messagesEndRef = useRef<HTMLDivElement>(null);  useEffect(() => {    // Connect socket    const newSocket = io('http://localhost:8000', {      auth: { token },      transports: ['websocket', 'polling']    });    setSocket(newSocket);    // Load chat    loadChat();    // Listen for new messages    newSocket.on('message:receive', (data) => {      setMessages(prev => {        if (prev.some(m => m.id === data.message.id)) return prev;        return [...prev, data.message];      });    });    // Listen for chat status updates    newSocket.on('conversation:update', (data) => {      setChat(data.conversation);      updateCanSend(data.conversation.status);    });    // Listen for typing    newSocket.on('support:user-typing', (data) => {      if (data.is_typing) {        setTypingUsers(prev => new Set([...prev, data.user_id]));      } else {        setTypingUsers(prev => {          const next = new Set(prev);          next.delete(data.user_id);          return next;        });      }    });    // Listen for errors (blocked messages)    newSocket.on('error', (error) => {      if (error.status === 'waiting_for_admin') {        setCanSend(false);        showError(error.message);      }    });    return () => {      newSocket.close();    };  }, [token]);  const loadChat = async () => {    try {      // Get chat      const chatResponse = await fetch('/api/support/chat', {        headers: { 'Authorization': Bearer ${token} }      });      const chatData = await chatResponse.json();      setChat(chatData.chat);      updateCanSend(chatData.chat.status);      // Join chat room      if (socket) {        socket.emit('support:join-chat', chatData.chat.id);      }      // Load messages      const messagesResponse = await fetch(        /api/support/chats/${chatData.chat.id}/messages,        {          headers: { 'Authorization': Bearer ${token} }        }      );      const messagesData = await messagesResponse.json();      setMessages(messagesData.messages);    } catch (error) {      console.error('Failed to load chat:', error);    }  };  const updateCanSend = (status: string) => {    setCanSend(status !== 'waiting_for_admin');  };  const handleSend = async () => {    if (!inputText.trim() || !canSend || !chat) return;    const text = inputText.trim();    setInputText('');    try {      // Send via REST API      const response = await fetch('/api/support/messages', {        method: 'POST',        headers: {          'Authorization': Bearer ${token},          'Content-Type': 'application/json'        },        body: JSON.stringify({ text })      });      if (response.status === 403) {        const error = await response.json();        showError(error.message);        setCanSend(false);        return;      }      const data = await response.json();            // Add your message      setMessages(prev => [...prev, data.message]);            // Add bot reply if exists      if (data.bot_reply) {        setMessages(prev => [...prev, data.bot_reply]);      }      // Refresh chat status      loadChat();    } catch (error) {      console.error('Failed to send message:', error);    }  };  const getStatusBadge = (status: string) => {    const badges = {      bot_handling: { text: '🟢 Bot Handling', color: 'green' },      waiting_for_admin: { text: '🟡 Waiting for Admin', color: 'yellow' },      admin_handling: { text: '🔵 Admin Handling', color: 'blue' },      resolved: { text: '✅ Resolved', color: 'green' },      closed: { text: '⚫ Closed', color: 'gray' }    };    return badges[status] || { text: status, color: 'gray' };  };  // Auto-scroll  useEffect(() => {    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });  }, [messages]);  return (    <div className="student-chat">      {/* Header /}      <div className="chat-header">        <h2>Support Chat</h2>        {chat && (          <div className="status-badge">            <span className={getStatusBadge(chat.status).color}>              {getStatusBadge(chat.status).text}            </span>          </div>        )}      </div>      {/ Messages /}      <div className="messages-container">        {messages.map((message) => (          <div            key={message.id}            className={message ${              message.sender_role === 'student' ? 'sent' : 'received'            } ${message.is_auto_reply ? 'bot-message' : ''}}          >            <div className="message-header">              <span className="sender-name">                {message.is_auto_reply ? '🤖 Bot' : message.sender_name}              </span>              <span className="message-time">                {new Date(message.created_at).toLocaleTimeString()}              </span>            </div>            <div className="message-content">              {message.text && <p>{message.text}</p>}              {message.media_url && (                <div className="media">                  {message.message_type === 'image' && (                    <img src={message.media_url} alt={message.media_name || ''} />                  )}                  {message.message_type === 'audio' && (                    <audio controls src={message.media_url} />                  )}                  {message.message_type === 'file' && (                    <a href={message.media_url} download>                      📎 {message.media_name}                    </a>                  )}                </div>              )}            </div>          </div>        ))}        {/ Typing Indicator /}        {typingUsers.size > 0 && (          <div className="typing-indicator">            Admin is typing...          </div>        )}        <div ref={messagesEndRef} />      </div>      {/ Input */}      <div className="chat-input">        {!canSend && (          <div className="blocked-notice">            ⚠️ Please wait for admin response. You cannot send messages while waiting for support team.          </div>        )}        <input          type="text"          value={inputText}          onChange={(e) => setInputText(e.target.value)}          onKeyPress={(e) => {            if (e.key === 'Enter' && !e.shiftKey) {              e.preventDefault();              handleSend();            }          }}          placeholder={canSend ? "Type your message..." : "Waiting for admin response..."}          disabled={!canSend}        />        <button onClick={handleSend} disabled={!inputText.trim() || !canSend}>          Send        </button>      </div>    </div>  );}
Error Handling
403 Forbidden - Waiting for Admin
When: Trying to send message while status is waiting_for_admin
Response:
{  "message": "Please wait for admin response. You cannot send messages while waiting for support team.",  "status": "waiting_for_admin"}
Frontend Handling:
if (response.status === 403) {  const error = await response.json();  if (error.status === 'waiting_for_admin') {    // Disable input    setCanSend(false);    // Show message    showError('Please wait for admin to respond. You will be able to send messages again once admin replies.');  }}
Best Practices
Always join chat room before sending messages via Socket.io
Handle duplicate messages using _uniqueId field
Check chat status before allowing message input
Show status badge to inform user of current state
Display bot messages differently (show bot badge/icon)
Listen for status updates to enable/disable input
Handle errors gracefully when blocked from sending
Show typing indicators for better UX
Auto-scroll to bottom when new messages arrive
Poll for messages on load, then use Socket.io for updates
Complete Flow Example
Scenario: Login Problem
Student sends: "I can't log in"
Status: bot_handling
Bot detects: LOGIN_PROBLEM
Bot responds: "أهلاً بك! دعني أساعدك..."
Student says: "This didn't work"
Bot escalates
Status: waiting_for_admin
Student blocked from sending
Admin responds
Status: admin_handling
Student can send again
Student sends: "Thank you, problem solved"
Bot detects thanks
Bot responds: "العفو، نحن في خدمتك دائماً..."
Status: resolved