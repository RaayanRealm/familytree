# How to Build and Run the API

## 1. Install dependencies

```sh
npm install
```

## 2. Set up environment variables

- Ensure `.env` is present in `/home/raayan/familytree/api` with all required variables (DB, Cloudinary, etc).

## 3. Run database migrations (if using Knex)

```sh
npx knex migrate:latest
```

## 4. Start the API

### Local Development

```sh
npm run dev
# or
node index.js
```

- The API will run on `http://localhost:5000` (or the port set in `.env`).

### On Vercel

- Deploy as usual (`vercel` CLI or Git integration).
- Vercel will use the exported handler in `index.js`.

## 5. API Endpoints

- Main API: `http://localhost:5000/api/family/...`
- Images: `http://localhost:5000/images/...`

---
