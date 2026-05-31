# NobatYab - Appointment Booking Platform

NobatYab is a Persian-friendly multi-service appointment platform built with Express, SQLite, JWT, Vue 3, and Vite.

Persian documentation: [README.fa.md](README.fa.md)

## Features

- Three roles: admin, provider, and user.
- JWT login and registration with bcrypt password hashes.
- Service categories and provider-specific offerings.
- Provider working hours for each weekday.
- Jalali date entry in the frontend with Gregorian storage in the backend.
- Available-slot calculation and overlap prevention.
- Booking for yourself or another person.
- Simulated payment and SMS logs.
- Provider cancellation policies with optional penalty behavior.
- Admin approval workflow for new provider service requests.
- Admin user activation and deactivation.

## Project Structure

```text
backend/
├── server.js
├── database.js
├── seed.js
├── routes/
├── middleware/
└── utils/

frontend/
├── index.html
├── package.json
└── src/
    ├── components/
    ├── router/
    ├── services/
    ├── utils/
    └── views/
```

## Run the Backend

```bash
cd backend
npm install
npm start
```

Development mode:

```bash
npm run dev
```

The API runs on `http://localhost:3000`.

Create `backend/.env` from `backend/.env.example`:

```env
PORT=3000
JWT_SECRET=replace_this_with_a_secure_secret
```

## Run the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Database and Sample Data

The SQLite database is created automatically at `backend/database.sqlite`. Tables and test users are seeded on backend startup. Passwords are stored as bcrypt hashes.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `123456` |
| Provider | `provider@example.com` | `123456` |
| User | `user@example.com` | `123456` |

The seed also creates Persian categories, three services, provider working hours, and a default cancellation policy.

## Main API Routes

### Public and authentication

- `POST /api/register`
- `POST /api/login`
- `GET /api/categories`
- `GET /api/services`
- `GET /api/providers/:serviceId`
- `GET /api/available-slots?providerId=&date=`

### User

- `POST /api/simulate-payment`
- `POST /api/appointments`
- `GET /api/appointments/my`
- `DELETE /api/appointments/:id`

### Provider

- `POST /api/service-requests`
- `GET /api/service-requests/my`
- `POST /api/working-hours`
- `GET /api/working-hours/:providerId`
- `GET /api/provider/appointments`
- `PUT /api/provider/appointments/:id/status`
- `GET /api/provider/cancellation-policy`
- `PUT /api/provider/cancellation-policy`

### Admin

- `GET /api/admin/service-requests`
- `PUT /api/admin/service-requests/:id/approve`
- `PUT /api/admin/service-requests/:id/reject`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/toggle-status`

## Notes

- Dates are stored as Gregorian `YYYY-MM-DD`.
- Times are stored as `HH:MM`.
- SMS messages are simulated: they are printed in the backend terminal and inserted into `sms_logs`.
- Payments are simulated and succeed immediately.
- `backend/.env`, `backend/database.sqlite`, `node_modules`, and frontend build output are ignored by git.
