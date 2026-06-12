# InterVue

![InterVue Homepage](./public/homepage.png)


InterVue is an AI-powered collaborative technical interview platform designed to help engineering teams conduct structured, scalable, and data-driven hiring processes.

The platform combines real-time video communication, collaborative coding environments, automated candidate evaluation, and AI-assisted interview insights into a single unified experience.

---

## Overview

Traditional technical interviews often require multiple disconnected tools for video calls, coding assessments, note-taking, candidate evaluation, and hiring decisions.

InterVue solves this problem by providing a centralized interview workspace where interviewers and candidates can collaborate in real time while AI continuously assists with evaluation and monitoring.

---

## Key Features

### Real-Time Collaborative Coding

* Shared code editor for interviewer and candidate
* Multi-language code execution
* Live synchronization across participants
* Interactive coding environment with instant feedback

### Integrated Video Interviewing

* High-quality video communication powered by Stream
* Real-time participant management
* Screen sharing support
* Session recording capabilities

### AI Proctoring Agent

* Live face detection during interviews
* Continuous candidate presence monitoring
* Attention tracking system
* Interview integrity monitoring
* Real-time visual indicators for interviewers

### AI Interview Evaluation

* Automated candidate assessment
* Technical competency analysis
* Communication quality evaluation
* Performance scoring
* Structured interview summaries

### AI Interview Summary Agent

Generates:

* Candidate strengths
* Areas for improvement
* Interview performance overview
* Hiring recommendations
* Recruiter-ready summaries

### Session Management

* Create interview sessions
* Invite candidates
* Join active sessions
* End and archive interviews
* Session history tracking

### Recruiter Analytics

* Interview statistics
* Candidate performance insights
* Hiring trends
* Session activity monitoring
* Data-driven decision support

### Authentication & Security

* Secure authentication powered by Clerk
* Protected routes
* Role-based access controls
* Secure API communication

---

## Technology Stack

### Frontend

* React
* Vite
* React Router
* Clerk Authentication
* Stream Video SDK
* Framer Motion
* Lucide React
* Axios
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Clerk Backend SDK
* Inngest
* Stream APIs

### AI & Computer Vision

* MediaPipe Face Mesh
* TensorFlow.js
* Browser-based AI Processing
* Real-Time Face Tracking
* Attention Detection System

### Deployment

* Vercel (Frontend)
* Render / Railway / VPS (Backend)
* MongoDB Atlas
* Clerk Authentication Platform
* Stream Video Infrastructure

---

# Architecture

```text
Frontend (React + Vite)
        |
        |
        v
Backend (Node.js + Express)
        |
        |
        +---- MongoDB Atlas
        |
        +---- Clerk Authentication
        |
        +---- Stream Video Services
        |
        +---- AI Evaluation Services
```

---

# Environment Variables

## Frontend (.env)

```env
VITE_CLERK_PUBLISHABLE_KEY=

VITE_API_BASE_URL=

VITE_STREAM_API_KEY=
```

---

## Backend (.env)

```env
PORT=3000

NODE_ENV=development

MONGODB_URI=

CLERK_SECRET_KEY=

STREAM_API_KEY=

STREAM_API_SECRET=

OPENAI_API_KEY=
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/intervue.git

cd intervue
```

---

## Install Frontend

```bash
cd frontend

npm install
```

---

## Install Backend

```bash
cd backend

npm install
```

---

# Running Locally

## Start Backend

```bash
cd backend

npm run dev
```

---

## Start Frontend

```bash
cd frontend

npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3000
```

---

# Project Structure

```text
InterVue
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── lib
│   │   └── services
│   │
│   └── public
│
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── routes
│   │   ├── middleware
│   │   ├── models
│   │   ├── lib
│   │   └── services
│   │
│   └── server.js
│
└── README.md
```

---

# Use Cases

### Engineering Teams

Conduct structured technical interviews with real-time collaboration.

### Recruiters

Receive AI-generated interview summaries and hiring recommendations.

### Startups

Standardize hiring workflows without purchasing multiple tools.

### Enterprises

Scale technical interviewing processes across distributed teams.

---

# Future Roadmap

* AI-generated interview questions
* AI-powered coding hints
* Resume analysis
* ATS integrations
* Behavioral interview scoring
* Automated interviewer feedback
* Multi-round interview workflows
* Organization-level analytics
* Custom evaluation rubrics
* Voice sentiment analysis

---

# Why InterVue

InterVue was built to eliminate fragmented interview workflows and provide engineering teams with a single platform for conducting, evaluating, and improving technical interviews.

By combining collaborative coding, live communication, AI-powered monitoring, and automated evaluation, InterVue helps organizations make faster and more informed hiring decisions.

---

## License

This project is licensed under the MIT License.

---

Developed for AlphaWare Private Limited.
