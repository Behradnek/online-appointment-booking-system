# نوبت‌یاب - سامانه رزرو آنلاین نوبت

نوبت‌یاب یک سامانه فارسی برای مدیریت رزرو خدمات است. کاربران می‌توانند نوبت بگیرند، ارائه‌دهندگان برنامه کاری خود را تنظیم کنند و مدیر سامانه درخواست‌ها و کاربران را مدیریت کند.

## امکانات اصلی

- سه نقش کاربری: مدیر، ارائه‌دهنده و کاربر
- ثبت‌نام و ورود امن با JWT و رمز عبور هش‌شده
- دسته‌بندی خدمات و انتخاب ارائه‌دهنده
- انتخاب تاریخ شمسی در رابط کاربری
- تبدیل خودکار تاریخ شمسی به میلادی برای ذخیره در دیتابیس
- محاسبه زمان‌های آزاد بر اساس برنامه کاری ارائه‌دهنده
- جلوگیری از ثبت دو نوبت هم‌زمان برای یک ارائه‌دهنده
- رزرو برای خود کاربر یا شخص دیگر
- شبیه‌سازی پرداخت و ارسال پیامک
- تنظیم قوانین لغو نوبت و جریمه توسط ارائه‌دهنده
- ارسال درخواست خدمت جدید و تایید یا رد آن توسط مدیر
- فعال یا غیرفعال‌سازی کاربران توسط مدیر

## پیش‌نیازها

- Node.js
- npm

## اجرای بک‌اند

ابتدا وارد پوشه بک‌اند شوید و پکیج‌ها را نصب کنید:

```bash
cd backend
npm install
npm start
```

برای اجرای حالت توسعه:

```bash
npm run dev
```

بک‌اند روی آدرس زیر اجرا می‌شود:

```text
http://localhost:3000
```

## تنظیم فایل `.env`

یک فایل با نام `backend/.env` بسازید یا فایل موجود را بررسی کنید:

```env
PORT=3000
JWT_SECRET=replace_this_with_a_secure_secret
```

- `PORT`: پورت اجرای سرور
- `JWT_SECRET`: کلید محرمانه برای ساخت و بررسی توکن‌های JWT

نمونه تنظیمات در فایل `backend/.env.example` وجود دارد.

## اجرای فرانت‌اند

در یک ترمینال جدید:

```bash
cd frontend
npm install
npm run dev
```

سپس این آدرس را در مرورگر باز کنید:

```text
http://localhost:5173
```

## دیتابیس

دیتابیس SQLite به صورت خودکار ساخته می‌شود:

```text
backend/database.sqlite
```

برنامه هنگام اولین اجرا جدول‌های مورد نیاز را ایجاد می‌کند:

1. `users`
2. `categories`
3. `services`
4. `provider_services`
5. `service_requests`
6. `working_hours`
7. `cancellation_policies`
8. `appointments`
9. `sms_logs`

## کاربران نمونه

کاربران آزمایشی به صورت خودکار ساخته می‌شوند:

| نقش | ایمیل | رمز عبور |
| --- | --- | --- |
| مدیر | `admin@example.com` | `123456` |
| ارائه‌دهنده | `provider@example.com` | `123456` |
| کاربر | `user@example.com` | `123456` |

رمزهای عبور به صورت هش‌شده با bcrypt داخل دیتابیس ذخیره می‌شوند.

## مسیرهای API

### عمومی و احراز هویت

```http
POST /api/register
POST /api/login
GET  /api/categories
GET  /api/services
GET  /api/providers/:serviceId
GET  /api/available-slots?providerId=&date=
```

### کاربر

```http
POST   /api/simulate-payment
POST   /api/appointments
GET    /api/appointments/my
DELETE /api/appointments/:id
```

### ارائه‌دهنده

```http
POST /api/service-requests
GET  /api/service-requests/my
POST /api/working-hours
GET  /api/working-hours/:providerId
GET  /api/provider/appointments
PUT  /api/provider/appointments/:id/status
GET  /api/provider/cancellation-policy
PUT  /api/provider/cancellation-policy
```

### مدیر

```http
GET /api/admin/service-requests
PUT /api/admin/service-requests/:id/approve
PUT /api/admin/service-requests/:id/reject
GET /api/admin/users
PUT /api/admin/users/:id/toggle-status
```

## قوانین رزرو

- تاریخ انتخاب‌شده در فرانت‌اند شمسی است و پیش از ارسال به API به میلادی تبدیل می‌شود.
- تاریخ داخل دیتابیس با فرمت `YYYY-MM-DD` ذخیره می‌شود.
- ساعت با فرمت `HH:MM` ذخیره می‌شود.
- هر ارائه‌دهنده در هر بازه زمانی فقط یک نوبت فعال دارد.
- زمان‌های آزاد از روی ساعات کاری هفتگی محاسبه می‌شوند.
- نوبت‌های لغوشده و انجام‌شده مانع رزرو مجدد یک زمان نمی‌شوند.
- لغو نوبت فقط پیش از حداقل زمان تعیین‌شده توسط ارائه‌دهنده مجاز است.
- اگر جریمه لغو غیرفعال باشد، وضعیت پرداخت به `refunded` تغییر می‌کند.
- اگر جریمه فعال باشد، وضعیت پرداخت `paid` باقی می‌ماند.

## پرداخت و پیامک آزمایشی

پرداخت واقعی انجام نمی‌شود و پاسخ پرداخت همیشه موفق است. پیامک نیز واقعی نیست؛ متن پیام در ترمینال بک‌اند نمایش داده می‌شود و در جدول `sms_logs` ذخیره می‌شود.

## فایل‌های خصوصی

موارد زیر در گیت قرار نمی‌گیرند:

- `backend/.env`
- `backend/database.sqlite`
- پوشه‌های `node_modules`
- خروجی build فرانت‌اند
