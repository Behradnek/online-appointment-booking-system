# Online Appointment Booking System

A beginner-friendly appointment booking system built with Node.js, Express, SQLite, JWT authentication, bcrypt password hashing, and a simple HTML/CSS/JavaScript frontend.

## Features

- Register and log in as a user.
- View available services.
- Book appointments.
- View and cancel your own appointments.
- Admin users can view all appointments, confirm appointments, and cancel appointments.
- SQLite database and seed data are created automatically when the backend starts.

## Project Structure

```text
project/
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── routes/
│   ├── middlewares/
│   └── database.sqlite
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── README.md
└── README.fa.md
```

## Requirements

- Node.js
- npm

## Backend Setup

```bash
cd backend
npm install
npm start
```

For development with nodemon:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

## Environment Variables

Create or update `backend/.env`:

```env
PORT=3000
JWT_SECRET=replace_this_with_a_secure_secret
```

`PORT` is optional. If it is not provided, the server uses port `3000`.

`JWT_SECRET` is required for signing and verifying JWT tokens.

## Database

The SQLite database is created automatically at:

```text
backend/database.sqlite
```

When the backend starts, it creates these tables if they do not exist:

- `users`
- `services`
- `appointments`

It also seeds these services if the services table is empty:

- General Consultation
- Nutrition Consultation
- Dentistry

## Admin Login

An admin user is created automatically if it does not already exist:

```text
Email: admin@example.com
Password: 123456
Role: admin
```

The admin password is stored as a bcrypt hash.

## Frontend

Open this file in your browser:

```text
frontend/index.html
```

Make sure the backend is running first. The frontend sends API requests to:

```text
http://localhost:3000/api
```

## API Endpoints

### Authentication

```http
POST /api/register
POST /api/login
```

### Services

```http
GET /api/services
```

### User Appointments

These routes require:

```http
Authorization: Bearer <token>
```

```http
GET /api/appointments
POST /api/appointments
DELETE /api/appointments/:id
```

### Admin Appointments

These routes require a valid admin token:

```http
GET /api/admin/appointments
PUT /api/admin/appointments/:id/confirm
PUT /api/admin/appointments/:id/cancel
```

## Appointment Rules

- Date must use `YYYY-MM-DD`.
- Time must use `HH:MM`.
- Date must be today or in the future.
- Time must be between `09:00` and `17:00`.
- A date/time cannot be booked if another non-canceled appointment already exists at that slot.
- Canceling an appointment updates its status to `canceled`; it does not delete the row.

## Persian Documentation

Persian setup and usage instructions are available in:

```text
README.fa.md
```
