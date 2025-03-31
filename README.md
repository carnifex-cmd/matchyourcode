# MatchYourCode - LeetCode Practice with Spaced Repetition

MatchYourCode is a web application designed to help developers practice LeetCode problems effectively using a spaced repetition system. It provides a personalized learning experience by tracking your progress and organizing problems based on your learning needs.

## Features

### Problem Management
- View and filter LeetCode problems by difficulty (Easy, Medium, Hard)
- Filter problems by topics (Arrays, Trees, Dynamic Programming, etc.)
- Mark problems as "Need to Learn" or "Know It"
- Direct links to LeetCode problem pages
- Visual indicators for problem difficulty and topics

### Spaced Repetition System
- Smart organization of problems into different states:
  - New problems
  - Problems to learn
  - Problems to revise
- Weekly problem refresh mechanism
- Progress tracking for each problem

### User Features
- Secure authentication system
- Personalized problem preferences
- Progress tracking across sessions
- Customizable difficulty and topic filters

## Technical Stack

### Frontend
- React.js with Vite build tool
- Context API for state management
- CSS for modern, responsive styling
- Component-based architecture

### Backend
- Express.js server
- PostgreSQL database with Prisma ORM
- LeetCode API integration
- JWT-based authentication

## Project Structure

```
├── backend/
│   ├── prisma/           # Database schema and migrations
│   └── src/
│       ├── config/       # Database and server configuration
│       ├── controllers/  # Request handlers
│       ├── middleware/   # Auth and validation middleware
│       ├── routes/       # API endpoints
│       └── utils/        # LeetCode API integration
└── src/
    ├── components/       # React UI components
    ├── context/          # Auth and state management
    └── services/         # API integration services
```

## Database Schema

### User Model
- Authentication details (username, email, password)
- Problem preferences (difficulty, topics)
- Progress tracking

### Problem Model
- LeetCode problem metadata
- Difficulty and topic categorization
- Unique identifiers and slugs

### UserProblem Model
- Tracks user-problem interactions
- Manages learning states
- Records progress history

## Data Synchronization

- Automated LeetCode problem fetching
- Weekly data refresh mechanism
- Batch processing for efficiency
- Duplicate prevention system

This application enhances LeetCode practice by providing a structured, personalized approach to problem-solving through spaced repetition learning.
