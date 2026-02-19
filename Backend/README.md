# Hospital Management System - Backend API

A RESTful API built with Node.js, Express.js, and MongoDB for managing hospital operations including patients, doctors, appointments, and medical records.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access control
- 👥 **User Management** - Support for Admin, Doctor, and Patient roles
- 📅 **Appointment Management** - Book, update, and manage appointments
- 🏥 **Medical Records** - Doctors can create and manage patient medical records
- 🔒 **Security** - Password hashing with bcrypt, protected routes
- ✅ **Validation** - Input validation and error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **Validation**: express-validator

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── models/
│   │   ├── User.js               # User model (Admin/Doctor/Patient)
│   │   ├── Appointment.js        # Appointment model
│   │   └── MedicalRecord.js      # Medical record model
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication logic
│   │   ├── appointment.controller.js
│   │   └── medicalRecord.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── appointment.routes.js
│   │   └── medicalRecord.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT verification & authorization
│   └── app.js                    # Express app configuration
├── server.js                     # Server entry point
├── .env                          # Environment variables
├── .gitignore
└── package.json
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the backend directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**

   Make sure MongoDB is running locally or use MongoDB Atlas connection string.

5. **Run the server**

   Development mode (with nodemon):

   ```bash
   npm run dev
   ```

   Production mode:

   ```bash
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient",
  "contact": "1234567890",
  "age": 35,
  "gender": "Male"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Appointments

#### Get All Appointments

```http
GET /api/appointments
Authorization: Bearer <token>
```

- **Patient**: Returns only their appointments
- **Doctor**: Returns appointments assigned to them
- **Admin**: Returns all appointments

#### Create Appointment (Patient only)

```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctor": "doctor_id",
  "date": "2024-02-10",
  "time": "10:00 AM",
  "reason": "Regular checkup"
}
```

#### Update Appointment (Admin/Doctor)

```http
PUT /api/appointments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Approved",
  "doctorName": "Dr. Sarah Williams"
}
```

#### Delete Appointment (Admin only)

```http
DELETE /api/appointments/:id
Authorization: Bearer <token>
```

### Medical Records

#### Get Medical Records

```http
GET /api/medical-records
Authorization: Bearer <token>
```

- **Patient**: Returns only their records
- **Doctor**: Returns records they created
- **Admin**: Returns all records

#### Create Medical Record (Doctor only)

```http
POST /api/medical-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient": "patient_id",
  "diagnosis": "Hypertension",
  "prescription": "Amlodipine 5mg once daily",
  "notes": "Follow up in 2 weeks"
}
```

#### Get Single Medical Record

```http
GET /api/medical-records/:id
Authorization: Bearer <token>
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Role-Based Access Control

- **Admin**: Full access to all resources
- **Doctor**: Can view assigned appointments, create/view medical records
- **Patient**: Can book appointments, view their appointments and medical records

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

Error response format:

```json
{
  "message": "Error description"
}
```

## Database Models

### User

- name, email, password (hashed)
- role: admin | doctor | patient
- contact, age, gender
- specialization (for doctors)

### Appointment

- patient (ref to User)
- doctor (ref to User)
- date, time
- status: Pending | Approved | Completed | Cancelled
- reason

### MedicalRecord

- patient (ref to User)
- doctor (ref to User)
- diagnosis, prescription, notes
- visitDate

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Testing with Postman/Thunder Client

1. Register a user
2. Login to get JWT token
3. Use the token in Authorization header for protected routes
4. Test different roles (admin, doctor, patient)

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based authorization
- ✅ Protected routes
- ✅ CORS enabled
- ✅ Environment variables for sensitive data

## Future Enhancements

- Input validation with express-validator
- Rate limiting
- File upload for medical reports
- Email notifications
- Pagination for large datasets
- Search and filtering
- Audit logs
- Unit and integration tests

## License

ISC
