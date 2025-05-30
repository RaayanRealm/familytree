# Deployment Guide: FamilyTree (Node/Express + PostgreSQL + React)

## Free Hosting Options

### 1. Render.com (Recommended for Fullstack with PostgreSQL)
- **Backend:** Node.js/Express
- **Database:** Free PostgreSQL
- **Frontend:** Static React build

#### Steps:

##### Backend (API + DB)
1. **Push your code to GitHub.**
2. **Create a Render.com account.**
3. **Create a new PostgreSQL database** on Render (Dashboard → New → PostgreSQL).
   - Note the connection string, username, password, host, and database name.
4. **Create a new Web Service** (Dashboard → New → Web Service).
   - Connect your GitHub repo.
   - Set build command: `npm install && npm run build` (if you have a build step, else just `npm install`)
   - Set start command: `node index.js` (or your backend entry point)
   - Set environment variables for your DB connection (e.g. `DATABASE_URL`)
   - In your backend, use `process.env.DATABASE_URL` for knex/pg config.
5. **Deploy.** Render will build and run your backend, and provide a public API URL.

##### Frontend (React)
1. **Build your React app:**
   ```
   cd frontend
   npm install
   npm run build
   ```
   This will create a `build` directory inside the `frontend` folder:  
   `frontend/build`
2. **Create a new Static Site** on Render or Vercel.
   - Connect your GitHub repo.
   - Set build command: `npm run build`
   - **Set publish/output directory:** `frontend/build`
     - On **Vercel**, go to Project Settings → Build & Output Settings → Output Directory and set it to `frontend/build`
   - Set environment variable for API URL if needed (e.g. `REACT_APP_API_URL`)
   - Deploy.

##### Notes:
- If you see "No Output Directory named 'build' found":
  - Make sure you run `npm install` before `npm run build` so dependencies are installed.
  - Make sure your build command is `npm run build` and your output directory is set to `frontend/build` (not just `build`).
  - The path is relative to your repo root.
  - On Vercel, you may need to set the **Root Directory** to `frontend` if you want Vercel to treat `frontend` as the project root. In this case, set Output Directory to just `build`.

---

### 2. Railway.app (Alternative, similar steps)
- Free for small projects, supports Node.js and PostgreSQL.
- Steps are similar: create a project, add PostgreSQL plugin, deploy backend, set up frontend as static site.

---

### 3. Vercel/Netlify (Frontend only)
- Use for React frontend only.
- Backend/API must be deployed separately (e.g. on Render or Railway).
- Set API URL in frontend to point to your backend deployment.

---

## Quick Checklist

- [ ] Push code to GitHub.
- [ ] Create PostgreSQL DB on Render/Railway, update backend config.
- [ ] Deploy backend (Express) as a web service.
- [ ] Deploy frontend (React) as a static site.
- [ ] Set environment variables for DB/API URLs.
- [ ] Test both frontend and backend endpoints.

---

## Useful Links

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)

---

**Tip:** For hobby/free plans, your backend may sleep after inactivity. For production, consider paid plans.

