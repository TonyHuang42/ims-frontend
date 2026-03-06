### 2. Install dependencies

Install the required Node.js packages:

```bash
npm install
```

### 3. Environment Configuration

Create a copy of the example environment file:

```bash
cp .env.example .env
```

Open the `.env` file and verify your backend API connection string. By default, it points to the local Laravel backend:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

If your backend is running on a different port or host, update this value accordingly.


### 5. Start the Development Server

Start the Vite development server:

```bash
npm run dev
```

Open the URL in your browser. You can log in using the credentials configured in your backend database seeder (e.g., `admin@example.com` / `password`).
