# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teachers can sign in to register or unregister students for activities
- Students can still view activities and current participants without signing in

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/auth/status`                                                    | Get the current teacher authentication status                       |
| POST   | `/auth/login`                                                     | Log in as a teacher                                                 |
| POST   | `/auth/logout`                                                    | Log out the current teacher session                                 |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity as a teacher                     |
| DELETE | `/activities/{activity_name}/unregister?email=student@...`        | Remove a student from an activity as a teacher                      |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All activity data is stored in memory, which means registrations will reset when the server restarts.

Teacher usernames and passwords are stored in `teachers.json` for this demo.
