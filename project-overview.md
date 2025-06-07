# Family Tree / Family Database Project Overview

This project is a Family Tree/Database application with a Node.js/Express backend and a React frontend. It allows users to manage family members, their relationships (parent, child, spouse, sibling), marriages, deaths, and events. The system also supports user authentication and authorization using JWT tokens, with roles for access control.

---

## Backend (`api` folder)

### Stack & Structure

- **Node.js** with **Express** for RESTful API.
- **Knex.js** for SQL database access (likely PostgreSQL or MySQL).
- **Project Structure:**
  - `index.js`: Main entry point for the API server.
  - `src/`
    - `config/db.js`: Database connection setup.
    - `dtos/`: Data Transfer Objects for API responses.
    - `entities/`: Entity classes for business logic.
    - `routes/`: Express route definitions (`familyRoutes.js`, `UserRoutes.js`).
    - `services/`: Business logic for each domain (Person, Marriage, Relationship, Event, User, etc.).
  - `database/`
    - `migrations/`: Knex migration files for creating tables (persons, deaths, marriages, relationships, users, events, etc.).
    - `seeds/`: Seed data for initial database population.
  - `test/`: Contains functional API tests using Mocha, Supertest, and Assert.

### Key Features

- **Family Members:** Create, edit, retrieve, and delete persons. Each person can have detailed info (name, gender, DOB, occupation, etc.).
- **Relationships:** Parent-child, spouse, sibling, and other relationships are supported and can be queried in both directions.
- **Marriages:** Marriages between members can be created and queried.
- **Deaths:** Death records can be added to members.
- **Events:** Family events can be created and listed.
- **Users & Roles:** User registration, login, and management. JWT-based authentication and role-based authorization.
- **API Endpoints:** RESTful endpoints for all above entities, with proper authorization checks.
- **Testing:** Comprehensive functional tests for all major API endpoints and flows.

---

## Frontend (`frontend` folder)

### Stack & Structure

- **React** (likely with hooks and functional components).
- **Vite** for fast development and build.
- **Project Structure:**
  - `src/`
    - `components/`: Reusable UI components (FamilyTree, Header, RecentMembersCarousel, Search, etc.).
    - `pages/`: Page-level components for different routes (AddMember, EditMember, Events, FamilyTree, etc.).
    - `services/`: Likely contains API service functions for backend communication.
    - `styles/`: CSS files for styling.
    - `App.jsx`, `index.jsx`: Main app and entry point.
  - `public/`: Static assets (favicon, logos, manifest, etc.).

### Key Features

- **Family Tree Visualization:** UI to display and navigate the family tree.
- **Member Management:** Forms and pages to add, edit, and view family members.
- **Relationship Management:** UI to view and manage relationships between members.
- **Event Management:** UI for family events.
- **User Authentication:** Login and registration forms, session management using JWT.
- **Recent Members Carousel:** UI to show recently added members.
- **Search:** Search functionality for family members.
- **Responsive Design:** Modern, user-friendly interface.

---

## Authentication & Authorization

- **JWT Tokens:** Used for session management and securing API endpoints.
- **Roles:** Users have roles (e.g., admin, user) that determine access to certain features.
- **Login Flow:** Users log in to receive a JWT, which is used for subsequent API requests.

---

## Testing

- **Backend:** Uses Mocha, Supertest, and Assert for functional API tests (`api/test/api.functional.test.js`). Tests cover member creation, relationships, marriages, deaths, user management, and more.
- **Frontend:** Likely uses Jest and React Testing Library (see `App.test.js`).

---

## Database

- **Tables:** persons, deaths, marriages, relationships, users, events, etc.
- **Migrations:** Managed via Knex migration files.
- **Seeds:** Initial data population.

---

## How to Use

- **Backend:** Start the Express server (likely with `npm start` or `node index.js` or `nodemon index.js` in the `api` folder).
- **Frontend:** Start the React app (likely with `npm run dev` or `npm start` in the `frontend` folder).
- **API:** Interact with the backend via RESTful endpoints, secured with JWT.
- **Frontend:** Interacts with backend via API services.

---

## Extensibility

- **Add new relationship types, events, or member attributes by updating migrations, services, and DTOs.**
- **Enhance frontend with new pages or components as needed.**
- **Add more roles or permissions for finer-grained access control.**

---