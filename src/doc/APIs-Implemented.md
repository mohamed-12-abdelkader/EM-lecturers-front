# توثيق الـ APIs المستخدمة في المنصة

هذا الملف يلخص الـ APIs التي تم التعامل معها في واجهات الأدمن والطالب والدعم الفني وتقارير الامتحانات.

---

## 1. إدارة أكواد التفعيل (أدمن)

### الحصول على تفاصيل كود التفعيل

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/course/admin/activation-code/:code` |
| **مثال** | `GET /api/course/admin/activation-code/12345678` |
| **الصلاحية** | مستخدم مسجّل دخول بدور **admin** |

**الهيدر:**
```
Authorization: Bearer <token>
```

**الاستجابة عند النجاح (200):**
```json
{
  "code": "12345678",
  "id": 1,
  "course": {
    "id": 5,
    "title": "اسم الكورس"
  },
  "teacher": {
    "id": 10,
    "name": "اسم المدرس",
    "email": "teacher@example.com",
    "phone": "01xxxxxxxx"
  },
  "max_uses": 1,
  "uses": 1,
  "is_used": true,
  "is_expired": false,
  "expires_at": null,
  "created_at": "2025-01-01T00:00:00.000Z",
  "used_by": [
    {
      "user_id": 20,
      "name": "اسم الطالب",
      "email": "student@example.com",
      "phone": "01xxxxxxxx",
      "used_at": "2025-02-01T12:00:00.000Z"
    }
  ]
}
```

**أخطاء:**
- **400** — الكود مفقود أو فارغ
- **404** — الكود غير موجود في النظام

**الاستخدام في الواجهة:** صفحة إدارة أكواد التفعيل (رابط: `/activation-codes`) — بحث بالكود وعرض التفاصيل والكورس والمدرس وقائمة من استخدموا الكود.

---

## 2. تقرير الامتحان للطالب

### الحصول على تقرير امتحان الطالب (محاضرة أو كورس)

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/exams/:examId/my-report` |
| **مثال** | `GET /api/exams/5/my-report` |
| **الصلاحية** | مستخدم مسجّل دخول بدور **student** |

**الهيدر:**
```
Authorization: Bearer <token>
```

**السلوك:** يُجرّب أولاً امتحان محاضرة بالمعرّف، فإن لم يُعثر يُجرّب امتحان الكورس. يُؤخذ آخر محاولة مُسلَّمة للطالب، ويُطبَّق إعدادات إظهار الإجابات (فوري / بعد ساعات / في تاريخ محدد).

**استجابة امتحان محاضرة (200):**
```json
{
  "examType": "lecture",
  "exam": {
    "id": 1,
    "title": "امتحان المحاضرة الأولى",
    "totalGrade": 10
  },
  "attempt": {
    "attemptId": 50,
    "totalGrade": 10,
    "obtainedGrade": 7,
    "submittedAt": "2025-02-06T12:00:00.000Z",
    "passed": true
  },
  "questions": [
    {
      "questionId": 101,
      "questionText": "نص السؤال",
      "questionImage": null,
      "yourAnswer": { "letter": null, "text": "الإجابة التي اختارها الطالب" },
      "correctAnswer": { "letter": null, "text": "الإجابة الصحيحة" },
      "isCorrect": true
    }
  ]
}
```

**استجابة امتحان كورس (200):**
```json
{
  "examType": "course",
  "exam": {
    "id": 2,
    "title": "امتحان الكورس الشامل",
    "totalGrade": 20
  },
  "attempt": {
    "attemptId": 80,
    "totalGrade": 20,
    "obtainedGrade": 16,
    "submittedAt": "2025-02-06T14:00:00.000Z",
    "passed": true
  },
  "questions": [
    {
      "questionId": 201,
      "questionText": "نص السؤال",
      "questionImage": null,
      "type": "TEXT",
      "optionA": "أ",
      "optionB": "ب",
      "optionC": "ج",
      "optionD": "د",
      "yourAnswer": "B",
      "correctAnswer": "B",
      "isCorrect": true
    }
  ]
}
```

**أخطاء:**
- **403** — غير مسموح بعرض التقرير في هذا التوقيت
- **404** — لا توجد محاولة مُسلَّمة أو التقرير غير متوفر

**الاستخدام في الواجهة:** من صفحة درجات الامتحانات (`/exam_grades`) — زر "عرض التقرير" على كل امتحان مُسلَّم يفتح مودالاً يعرض التقرير (امتحان محاضرة أو كورس) مع الأسئلة وإجابات الطالب والإجابات الصحيحة.

---

## 3. الدعم الفني — الطالب

### 3.1 الحصول على الشات أو إنشاؤه

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/support/chat` |
| **الصلاحية** | **طالب** فقط |

**الهيدر:**
```
Authorization: Bearer <token>
```

**الاستجابة (200):**
```json
{
  "chat": {
    "id": 1,
    "student_id": 5,
    "admin_id": null,
    "status": "bot_handling",
    "last_message_at": "2025-02-06T12:00:00.000Z",
    "created_at": "...",
    "updated_at": "...",
    "student_name": "أحمد",
    "student_email": "ahmed@example.com"
  }
}
```

**حالات الشات:** `bot_handling` | `waiting_for_admin` | `admin_handling` | `resolved` | `open` | `closed`

---

### 3.2 جلب رسائل الشات

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/support/chats/:chatId/messages` |
| **الصلاحية** | طالب (شات نفسه فقط) أو أدمن |

**Query (اختياري):**
| المعامل | النوع | الوصف |
|--------|--------|--------|
| limit | number | عدد الرسائل (افتراضي 50) |
| before | string | تاريخ (cursor للصفحة) |

**الاستجابة (200):**
```json
{
  "messages": [
    {
      "id": 10,
      "chat_id": 1,
      "sender_id": 5,
      "sender_role": "student",
      "message_type": "text",
      "text": "عندي مشكلة في كود التفعيل",
      "media_url": null,
      "is_auto_reply": false,
      "created_at": "2025-02-06T12:00:00.000Z",
      "sender_name": "أحمد"
    }
  ]
}
```

**أنواع الرسائل:** `text` | `image` | `file` | `audio` | `auto_reply`

---

### 3.3 إرسال رسالة نصية (طالب)

| | |
|---|---|
| **الطريقة** | `POST` |
| **المسار** | `/api/support/messages` |
| **Content-Type** | `application/json` |
| **الصلاحية** | طالب أو أدمن |

**Body (طالب):**
```json
{
  "text": "نص الرسالة"
}
```

**ملاحظة:** الطالب **لا** يرسل `chat_id`؛ الخادم يربط الشات من الجلسة.

**الاستجابة (201):**
```json
{
  "message": {
    "id": 12,
    "chat_id": 1,
    "sender_id": 5,
    "sender_role": "student",
    "message_type": "text",
    "text": "نص الرسالة",
    "is_auto_reply": false,
    "created_at": "..."
  },
  "bot_reply": {
    "id": 13,
    "text": "رد البوت الذكي إن وُجد...",
    "message_type": "auto_reply",
    "is_auto_reply": true,
    "created_at": "..."
  }
}
```

`bot_reply` يظهر فقط عند وجود رد تلقائي من بوت الدعم.

**أخطاء:**
- **403** — الشات في حالة `waiting_for_admin` (انتظار رد الدعم)، لا يُسمح بإرسال رسالة حتى يرد الأدمن.

---

### 3.4 إرسال ميديا (صورة / فيديو / ملف)

| | |
|---|---|
| **الطريقة** | `POST` |
| **المسار** | `/api/support/messages/media` |
| **Content-Type** | `multipart/form-data` |
| **الصلاحية** | طالب أو أدمن |

**Body (form-data):**
| الحقل | النوع | إلزامي | الوصف |
|-------|--------|--------|--------|
| file | File | نعم | الملف (صورة/فيديو/ملف) |
| text | string | لا | نص مصاحب |
| chat_id | number | للأدمن فقط | معرف الشات (الطالب لا يرسله) |

**الاستجابة (201):** `{ "message": { ... } }` مع `media_url`, `media_type`, `media_name`, `media_size` حسب نوع الملف.

---

### 3.5 إرسال رسالة صوتية

| | |
|---|---|
| **الطريقة** | `POST` |
| **المسار** | `/api/support/messages/audio` |
| **Content-Type** | `multipart/form-data` |
| **الصلاحية** | طالب أو أدمن |

**Body (form-data):**
| الحقل | النوع | إلزامي | الوصف |
|-------|--------|--------|--------|
| audio | File | نعم | ملف الصوت |
| chat_id | number | للأدمن فقط | معرف الشات |
| duration | number | لا | مدة التسجيل (ثانية) |

**الاستجابة (201):** `{ "message": { ... } }` مع `message_type: "audio"` و `media_url`, `duration`.

---

### 3.6 عدد الرسائل غير المقروءة

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/support/unread-count` |
| **الصلاحية** | طالب أو أدمن |

**الاستجابة (200):**
```json
{
  "unread_count": 3
}
```

---

### 3.7 الأسئلة الشائعة (للطالب)

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/support/faq` |
| **الصلاحية** | طالب فقط |

**الاستجابة (200):** قائمة FAQs نشطة (سؤال/جواب) للعرض في واجهة الدعم. الشكل المتوقّع: مصفوفة عناصر فيها على الأقل `question` و `answer` (وقد تأتي داخل `faqs` أو كجذر الاستجابة).

**الاستخدام في الواجهة:** صفحة الدعم الفني للطالب (`/support`) — درج "الأسئلة الشائعة" وواجهة شات واتساب.

---

## 4. الدعم الفني — تذاكر المدرسين (أدمن)

### 4.1 قائمة التذاكر (مشاكل المدرسين)

| | |
|---|---|
| **الطريقة** | `GET` |
| **المسار** | `/api/support/teacher/tickets` |
| **الصلاحية** | **أدمن** فقط |

**Query (اختياري):**
| المعامل | النوع | الوصف |
|--------|--------|--------|
| status | string | فلترة: `open` \| `in_progress` \| `resolved` \| `closed` |
| limit | number | عدد النتائج (مثال: 50) |
| offset | number | للإرجاع (صفحة التذاكر) |

**مثال:** `GET /api/support/teacher/tickets?status=open&limit=50&offset=0`

**الاستجابة (200):**
```json
{
  "tickets": [
    {
      "id": 1,
      "chat_id": 5,
      "teacher_id": 28,
      "teacher_name": "أحمد محمد",
      "teacher_email": "teacher@example.com",
      "message_text": "الطلاب بيقولوا الأكواد مش شغالة",
      "status": "open",
      "admin_notes": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**الاستخدام في الواجهة:** تبويب "تذاكر المدرسين" في صفحة شات الدعم للأدمن — جدول + فلتر حسب الحالة + تحميل المزيد.

---

### 4.2 تحديث تذكرة المدرس (حالة + رسالة للمدرس)

| | |
|---|---|
| **الطريقة** | `PATCH` |
| **المسار** | `/api/support/teacher/tickets/:ticketId` |
| **Content-Type** | `application/json` |
| **الصلاحية** | أدمن فقط |

**مثال:** `PATCH /api/support/teacher/tickets/1`

**Body:**
```json
{
  "status": "resolved",
  "admin_notes": "تم حل مشكلتك. يمكنك التجربة الآن."
}
```

| الحقل | النوع | إلزامي | الوصف |
|-------|--------|--------|--------|
| status | string | لا | `open` \| `in_progress` \| `resolved` \| `closed` |
| admin_notes | string | لا | رسالة/ملاحظة تُحفظ وقد تُرسل للمدرس (إشعار أو بريد) |

**الاستجابة المتوقعة:** 200 مع التذكرة المحدّثة أو رسالة نجاح.

**الاستخدام في الواجهة:** من جدول التذاكر — زر "تحديث / إرسال رسالة" يفتح مودالاً لتغيير الحالة وكتابة رسالة للمدرس ثم استدعاء هذا الـ PATCH.

---

## ملخص المسارات والصلاحيات

| المسار | الطريقة | الصلاحية |
|--------|---------|----------|
| `/api/course/admin/activation-code/:code` | GET | admin |
| `/api/exams/:examId/my-report` | GET | student |
| `/api/support/chat` | GET | student |
| `/api/support/chats/:chatId/messages` | GET | student (شات نفسه) / admin |
| `/api/support/messages` | POST | student / admin |
| `/api/support/messages/media` | POST | student / admin |
| `/api/support/messages/audio` | POST | student / admin |
| `/api/support/unread-count` | GET | student / admin |
| `/api/support/faq` | GET | student |
| `/api/support/teacher/tickets` | GET | admin |
| `/api/support/teacher/tickets/:ticketId` | PATCH | admin |

---

## الهيدر المشترك للمصادقة

جميع الطلبات التي تتطلب تسجيل دخول تستخدم:

```
Authorization: Bearer <token>
```

حيث `token` هو توكن الجلسة المُخزَّن بعد تسجيل الدخول (مثلاً من `localStorage.getItem("token")`).

---

*آخر تحديث: وفق تنفيذ واجهات إدارة أكواد التفعيل، تقرير الامتحان، الدعم الفني للطالب، وتذاكر المدرسين.*
