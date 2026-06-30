# API تغيير حالة مشكلة المدرس وإرسال رسالة له

هذا التوثيق خاص بـ **قائمة تذاكر المدرسين** و **تحديث التذكرة** (حالة + رسالة للمدرس) كما تُستدعى من واجهة الأدمن في "تذاكر المدرسين".

---

## 1. قائمة تذاكر الدعم (مشاكل المدرسين)

```
GET /api/support/teacher/tickets
```

**Query (اختياري):** `limit`, `offset`, `status` (قيم: `open`, `in_progress`, `resolved`, `closed`)

**الصلاحية:** `admin` فقط.

**الاستجابة (200):**  
`{ "tickets": [ { "id", "chat_id", "teacher_id", "teacher_name", "teacher_email", "message_text", "status", "admin_notes", "created_at", "updated_at" } ], "pagination": { "total", "limit", "offset", "has_more" } }`

مناسب لعرض "صندوق مشاكل المدرسين" في لوحة الأدمن.

---

## 2. تحديث حالة التذكرة + إرسال رسالة للمدرس عند الحل

```
PATCH /api/support/teacher/tickets/:ticketId
Content-Type: application/json
```

**الصلاحية:** `admin` فقط.

**Body (اختياري):**

| الحقل | النوع | الوصف |
|--------|------|--------|
| status | string | `open` \| `in_progress` \| `resolved` \| `closed` |
| admin_notes | string | ملاحظات الأدمن على التذكرة |
| message_to_teacher | string | نص الرسالة التي تُرسل للمدرس عند تعيين الحالة "تم الحل". إذا لم يُرسل يُستخدم الافتراضي: "تم حل مشكلتك. لو عندك أي استفسار آخر اكتب هنا." |

**السلوك:** عند تحديث `status` إلى `resolved` أو `closed` تُرسل تلقائياً رسالة للمدرس في شات الدعم (وتصل له فوراً عبر Socket). يمكن تخصيص النص عبر `message_to_teacher`.

**الاستجابة (200):**  
`{ "ticket": { ... }, "message_sent_to_teacher": true }`  
(يظهر `message_sent_to_teacher` فقط عند إرسال رسالة الحل).

---

### كيفية التعامل من الفرونت (ما تم تنفيذه)

- من جدول **تذاكر المدرسين**، الزر **"تحديث / إرسال رسالة"** يفتح مودالاً فيه:
  - **حالة المشكلة:** Select (open, in_progress, resolved, closed).
  - **ملاحظات الأدمن على التذكرة:** Textarea — تُحفظ في `admin_notes` (داخلية، لا تُرسل للمدرس).
  - **رسالة للمدرس:** Textarea اختياري — تُرسل في الشات عند تعيين تم الحل/مغلق؛ إن تُركت فارغة يُستخدم النص الافتراضي.
- عند **"حفظ وإرسال للمدرس"**: PATCH مع `status`, `admin_notes` (إن وُجد)، `message_to_teacher` (إن وُجد).
- بعد النجاح: إذا وُجد `message_sent_to_teacher: true` تُعرض "تم تحديث التذكرة وإرسال الرسالة للمدرس"، وإلا "تم تحديث التذكرة".

---

## 3. شات الدعم للمدرس — عدم قفل الشات

**مطلوب من الباكند:** في شات الدعم الفني، المدرس يجب أن يستطيع الإرسال في **كل الحالات** (حتى عند انتظار الأدمن أو بعد رد الأدمن). لا يُقفل الشات على المدرس.

الفرونت يرسل مع كل طلبات الدعم عندما المستخدم مدرساً الهيدر:

```
X-Support-User-Role: teacher
```

على الـ endpoints: `GET /api/support/chat`, `GET /api/support/chats/:id/messages`, `POST /api/support/messages`, `POST /api/support/messages/media`, `POST /api/support/messages/audio`.

**السلوك المطلوب:** إذا وُجد هذا الهيدر (أو إذا كان المستخدم المصادق له دور `teacher`)، لا تُرجع **403** بسبب "انتظار رد الأدمن" أو "الشات مقفول" — اسمح دائماً بإرسال الرسائل للمدرس.
