# Deploy Node.js Backend on Vercel

1. **Prepare your backend for deployment**
   - Ensure your backend has an `index.js` or `server.js` entry point in `/api` or root.
   - Make sure all dependencies are in `package.json`.
   - Move your backend code (e.g., `/home/raayan/familytree/backend`) to `/home/raayan/familytree/api` or similar, or set up a `vercel.json` to point to your backend folder.

2. **Add a `vercel.json` file** (in your project root):
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "api/index.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "api/index.js" }
     ]
   }
   ```
   - Adjust `"src": "api/index.js"` to your backend entry file.

3. **Configure environment variables**
   - In your Vercel dashboard, go to your project > Settings > Environment Variables.
   - Add all required variables (e.g., `DATABASE_URL`, etc.).

4. **Push your code to GitHub/GitLab/Bitbucket**
   - Make sure your backend is in the repo and committed.

5. **Connect your repo to Vercel**
   - In Vercel, create a new project and import your repo.
   - Vercel will auto-detect the backend and deploy it as serverless functions.

6. **Test your backend**
   - After deployment, your backend endpoints will be available at `https://your-vercel-domain.vercel.app/api/...`

7. **Update your frontend**
   - Point your frontend API calls to the new Vercel backend URL.

**Notes:**
- Vercel serverless functions have cold starts and timeouts (10s for Hobby, 60s for Pro).
- For persistent connections (like websockets or long-lived DB connections), consider alternatives like Render, Railway, or traditional VPS.

**References:**
- [Vercel Node.js Serverless Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/node)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
