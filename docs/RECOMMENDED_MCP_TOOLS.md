# Recommended MCP Tools - Go-Out Integration

> רשימת כלים מומלצים לממש ב-MCP, עם דגש על סטטיסטיקות אנשי מכירות ויכולות נוספות למשתתפים

---

## 🎯 עדיפות גבוהה - סטטיסטיקות אנשי מכירות

### ✅ `get_salesman_statistics` - **IMPLEMENTED** ⭐⭐⭐
**Status**: ✅ מומש ועובד!

**תיאור**: קבלת סטטיסטיקות מפורטות לפי איש מכירות/מנהל לאירוע מסוים

**Endpoint**: `POST /getEventUserRoles`

**פרמטרים**:
- `eventId` (required) - מזהה האירוע
- `search` (optional) - חיפוש לפי שם איש מכירות
- `skipNum` (optional) - pagination offset

**נתונים חשובים**:
- `views` - צפיות
- `freeRegistrations` (`frees`) - הרשמות בחינם
- `paidRegistrations` (`paid`) - הרשמות בכסף
- `revenue.amount` - סכום הכסף שנכנס מכרטיסים (שייך ל-paid)
- `revenue.credit` / `revenue.cash` - הכנסות מכרטיס אשראי/מזומן

**שימוש**:
- "תראה לי את הסטטיסטיקות של כל אנשי המכירות לאירוע X"
- "מי איש המכירות הכי מוצלח לאירוע X?"
- "כמה צפיות יש לכל איש מכירות?"

---

### ✅ `get_participants_by_salesman` - **IMPLEMENTED** ⭐⭐⭐
**Status**: ✅ מומש ועובד!

**תיאור**: קבלת רשימת משתתפים מסוננת לפי איש מכירות ספציפי

**Endpoint**: משתמש ב-`getEventParticipants` + סינון

**פרמטרים**:
- `eventId` (required) - מזהה האירוע
- `salesmanId` (required) - מספר טלפון/מזהה של איש המכירות
- `status` (optional) - סינון לפי סטטוס
- `limit` (optional) - מגבלת תוצאות
- `skip` (optional) - pagination

**תגובה**:
```json
{
  "success": true,
  "eventId": "abc123",
  "salesman": {
    "id": "0523012300",
    "name": "Shlomi Yona"
  },
  "count": 45,
  "participants": [...]
}
```

**שימוש**:
- "תביא לי את כל המשתתפים של Shlomi Yona לאירוע X"
- "כמה משתתפים יש לאיש המכירות 0523012300?"

---

## 🎯 עדיפות גבוהה - יכולות נוספות למשתתפים

### 3. `get_total_participants_count` ⭐⭐
**תיאור**: ספירת משתתפים לפי סטטוס (משתמש ב-`getTotalParticipants`)

**Endpoint**: `POST /getTotalParticipants/`

**⚠️ חשוב**: צריך לקרוא ל-`getTotalParticipants` **מספר פעמים** - פעם אחת לכל סטטוס:
- `All`
- `Pending`
- `Accepted`
- `Rejected`
- `Hidden`

**למה?** כי `status: "All"` פשוט מחזיר את הסכום של כולם, ולא את הפירוט לפי סטטוסים.

**פרמטרים**:
- `eventId` (required) - מזהה האירוע
- `status` (required) - סטטוס לספירה: `"All"`, `"Pending"`, `"Accepted"`, `"Rejected"`, או `"Hidden"`

**תגובת API (לכל קריאה)**:
```json
{
  "status": true,
  "users": 361
}
```
התגובה מחזירה את מספר המשתתפים (`users`) בהתאם לסטטוס ששלחנו.

**לוגיקה**:
1. קוראים ל-`getTotalParticipants` 5 פעמים במקביל (או ברצף) - פעם אחת לכל סטטוס:
   - `status: "All"` → מחזיר `{ status: true, users: 450 }`
   - `status: "Accepted"` → מחזיר `{ status: true, users: 300 }`
   - `status: "Pending"` → מחזיר `{ status: true, users: 100 }`
   - `status: "Rejected"` → מחזיר `{ status: true, users: 30 }`
   - `status: "Hidden"` → מחזיר `{ status: true, users: 20 }`
2. אוספים את ה-`users` מכל תגובה לפי הסטטוס
3. מחזירים אובייקט עם כל הספירות

**תגובה של הכלי (לאחר עיבוד)**:
```json
{
  "success": true,
  "eventId": "abc123",
  "counts": {
    "All": 450,
    "Accepted": 300,
    "Pending": 100,
    "Rejected": 30,
    "Hidden": 20
  }
}
```

**שימוש**:
- "כמה משתתפים יש לאירוע X בסטטוס Accepted?"
- "מה הספירה הכוללת של משתתפים לאירוע X?"
- "תראה לי את כל הספירות לפי סטטוס לאירוע X"

---

### 4. `get_participant_change_logs` ⭐⭐
**תיאור**: קבלת היסטוריית שינויים של משתתף (changeLogs)

**Endpoint**: משתמש ב-`getEventParticipants` + חילוץ changeLogs

**פרמטרים**:
- `eventId` (required) - מזהה האירוע
- `participantId` (required) - מזהה המשתתף

**תגובה**:
```json
{
  "success": true,
  "participantId": "user123",
  "changeLogs": [
    {
      "previousStatus": "Pending",
      "newStatus": "Accepted",
      "timestamp": "2025-12-09T10:30:00.000Z",
      "operator": {
        "firstName": "Admin",
        "lastName": "User",
        "phoneNumber": "0501234567"
      }
    }
  ]
}
```

**שימוש**:
- "מה ההיסטוריה של משתתף X?"
- "מי אישר את המשתתף X ומתי?"

---

### 5. `get_table_report` ⭐⭐⭐
**תיאור**: דוח משתמשים שרוצים שולחנות (reserved seating), מקבץ לפי איש מכירות

**Endpoint**: `POST /getUserCSVFilesByStatus` + עיבוד

**פרמטרים**:
- `eventId` (required) - מזהה האירוע
- `status` (optional) - סטטוס (default: "Accepted")

**תגובה**:
```json
{
  "success": true,
  "eventId": "abc123",
  "statistics": {
    "totalParticipants": 450,
    "usersWantingTables": 120,
    "tableRequestRatio": "26.7%"
  },
  "salesmanData": {
    "0523012300": {
      "salesmanName": "Shlomi Yona",
      "totalParticipants": 45,
      "usersWantingTables": 15,
      "participants": [...]
    }
  },
  "sortedByCount": [...]
}
```

**שימוש**:
- "תראה לי את דוח השולחנות לאירוע X"
- "כמה אנשים רוצים שולחנות מכל איש מכירות?"

---

### 6. `get_birthday_report` ⭐⭐
**תיאור**: דוח ימי הולדת לטווח תאריכים, עם אפשרות סינון לפי אנשי מכירות

**Endpoint**: משתמש ב-`getEventParticipants` + סינון לפי תאריך לידה

**פרמטרים**:
- `eventId` (required) - מזהה האירוע
- `startDate` (required) - תאריך התחלה (format: "MM-DD")
- `endDate` (required) - תאריך סיום (format: "MM-DD")
- `salesmanIds` (optional) - מערך של מספרי טלפון של אנשי מכירות

**תגובה**:
```json
{
  "success": true,
  "eventId": "abc123",
  "dateRange": {
    "start": "12-07",
    "end": "12-15"
  },
  "count": 25,
  "participants": [
    {
      "id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "birthdate": "1995-12-10",
      "age": 30,
      "salesman": {
        "id": "0523012300",
        "name": "Shlomi Yona"
      }
    }
  ],
  "groupedBySalesman": {
    "0523012300": [...]
  }
}
```

**שימוש**:
- "תביא לי את כל האנשים שיש להם יום הולדת בין 7.12-15.12 לאירוע X"
- "תראה לי ימי הולדת של אנשי המכירות X, Y, Z"

---

## 🎯 עדיפות בינונית - שיפורים למשתתפים קיימים

### 7. `get_participants_with_payment_info` ⭐
**תיאור**: קבלת משתתפים עם מידע על תשלומים (`payed_to_venue`)

**Endpoint**: משתמש ב-`getEventParticipants` + הוספת שדות תשלום

**פרמטרים**:
- `eventId` (required)
- `includePaymentInfo` (optional, default: true)

**תגובה**: כמו `get_event_participants` + שדות:
- `payedToVenue`: מספר (סכום ששולם)
- `paymentStatus`: "paid" | "unpaid" | "partial"

---

### 8. `get_participants_with_discounts` ⭐
**תיאור**: קבלת משתתפים עם מידע על הנחות (`coupon_discount`, `full_discount`)

**Endpoint**: משתמש ב-`getEventParticipants` + הוספת שדות הנחה

**תגובה**: כמו `get_event_participants` + שדות:
- `couponDiscount`: מספר
- `fullDiscount`: boolean
- `discountAmount`: מספר (סכום ההנחה)

---

### 9. `get_participants_by_city` ⭐
**תיאור**: סינון משתתפים לפי עיר

**פרמטרים**:
- `eventId` (required)
- `city` (required) - שם העיר

---

### 10. `get_participants_by_ticket_type` ⭐
**תיאור**: סינון משתתפים לפי סוג כרטיס

**פרמטרים**:
- `eventId` (required)
- `ticketName` (required) - שם סוג הכרטיס

---

## 🎯 עדיפות נמוכה - דוחות נוספים

### 11. `download_participants_csv` ⭐
**תיאור**: הורדת CSV של משתתפים לפי סטטוס

**Endpoint**: `POST /getUserCSVFilesByStatus`

**פרמטרים**:
- `eventId` (required)
- `status` (required) - "Accepted" | "Pending" | "Rejected"

**תגובה**:
```json
{
  "success": true,
  "downloadLink": "https://...",
  "expiresAt": "2025-12-10T12:00:00.000Z"
}
```

---

### 12. `get_salesman_performance_across_events` ⭐
**תיאור**: ביצועי איש מכירות על פני מספר אירועים

**פרמטרים**:
- `salesmanId` (required)
- `eventIds` (optional) - מערך של מזההי אירועים
- `startDate` (optional)
- `endDate` (optional)

---

## 📋 סיכום - מה לממש קודם?

### Phase 1 - סטטיסטיקות אנשי מכירות (עדיפות גבוהה)
1. ✅ `get_salesman_statistics` - סטטיסטיקות לפי איש מכירות - **IMPLEMENTED**
2. ✅ `get_participants_by_salesman` - סינון לפי איש מכירות - **IMPLEMENTED**
3. ⏳ `get_table_report` - דוח שולחנות לפי איש מכירות

### Phase 2 - יכולות נוספות למשתתפים (עדיפות גבוהה)
4. ⏳ `get_total_participants_count` - ספירת משתתפים (קריאה מרובת פעמים ל-getTotalParticipants - פעם לכל סטטוס)
5. ⏳ `get_participant_change_logs` - היסטוריית שינויים
6. ⏳ `get_birthday_report` - דוח ימי הולדת

### Phase 3 - שיפורים (עדיפות בינונית)
7. ✅ שיפור `get_event_participants` להוסיף:
   - `changeLogs`
   - `payedToVenue`
   - `couponDiscount` / `fullDiscount`
   - `city`
   - `ticketRound`

---

## 🔧 הערות טכניות

### נתונים זמינים ב-API:
- ✅ `ref` - מספר טלפון של איש מכירות
- ✅ `ref_first_name` / `ref_last_name` - שם איש המכירות
- ✅ `has_ref` - האם יש איש מכירות
- ✅ `changeLogs` - היסטוריית שינויים
- ✅ `payed_to_venue` - תשלום לוונו
- ✅ `coupon_discount` / `full_discount` - הנחות
- ✅ `city` - עיר
- ✅ `ticketRound` - סבב כרטיסים

### Endpoints זמינים:
- ✅ `POST /getEventParticipants/` - כבר בשימוש
- ✅ `POST /getTotalParticipants/` - זמין לספירה
- ✅ `POST /getUserCSVFilesByStatus` - זמין לדוחות CSV
- ✅ `GET /getParticipantsStatistic/` - כבר בשימוש

---

*עודכן: 9 בדצמבר 2025*

