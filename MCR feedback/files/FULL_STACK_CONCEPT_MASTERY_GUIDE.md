# Full-Stack Concept Mastery Guide
## Loan App — File-by-File Deep Reading Map

> **How to use this guide:**
> Every concept follows this structure:
> 1. **The Problem** — What pain existed before this concept?
> 2. **The Mental Model** — How do you picture it in plain words?
> 3. **How It Actually Works** — What steps happen internally?
> 4. **What This Looks Like In Your Code** — Exact files, exact lines, explained.
> 5. **Common Mistakes** — What breaks if you misunderstand it?
> 6. **Interview-Grade Check** — Can you explain the "why", not just the "what"?

This guide follows a deliberate reading sequence. Start from Step 1 and work forward. Each step teaches concepts that the next step builds upon.

---

# PHASE 1 — THE FOUNDATION: HOW THE APP STARTS

## STEP 1 — Read: `backend/src/server.js`

### Concept: Entry Point and Process Lifecycle

#### The Problem
A Node.js app is just a script. Without an entry point that sets up a server, no request can ever reach your app. You also need to handle crashes before any request logic runs.

#### Mental Model
Think of `server.js` as the **ignition switch** of a car. It does not drive the car, but without it nothing starts.

#### How It Works
1. `dotenv.config()` loads your `.env` file into `process.env` before any other code runs. This must happen first, or configs are undefined.
2. The `uploads` directory is created if it doesn't exist. This is defensive bootstrapping.
3. `process.on('uncaughtException', ...)` registers a global error trap. If any code crashes without a try/catch, this is the last resort.
4. `connectDatabase()` fires an async connection to MongoDB. The app can run even if the DB is pending, but queries will fail.
5. `http.createServer(app)` wraps the Express `app` in an HTTP server. This distinction matters because Socket.IO needs the raw HTTP server, not just Express.
6. `socketIo(server, {...})` attaches a WebSocket server on top of the same HTTP server.
7. `server.listen(PORT)` actually starts accepting connections.

#### What This Looks Like In Your Code

```js
// server.js line 1
require('dotenv').config();
```
This is the first line. If it were on line 20, any `process.env.PORT` call on line 3 would get `undefined`.

```js
// server.js
process.on('uncaughtException', (err) => {
  logger.error(`${err.name}: ${err.message}`);
  process.exit(1);
});
```
**Why `process.exit(1)` here?**
After an uncaught exception, your Node process is in an unknown state. Continuing to run is dangerous. Exit with code `1` (failure) and let your hosting platform restart.

```js
// server.js
const server = http.createServer(app);
const io = socketIo(server, { cors: { ... } });
```
This is why you use `http.createServer(app)` instead of `app.listen()`. Socket.IO needs to hook into the underlying HTTP server to upgrade connections to WebSocket protocol.

#### Common Mistakes
- Calling `app.listen()` instead of `server.listen()` means Socket.IO never gets its HTTP server.
- Not loading dotenv first causes silent undefined errors for all env-based configs.

#### Interview-Grade Check
> "Why does server.js create an HTTP server separately instead of calling app.listen()?"
> Answer: Socket.IO requires the raw Node HTTP server to set up the WebSocket upgrade handler. `app.listen()` internally creates an HTTP server but does not return it, so Socket.IO cannot attach to it.

---

## STEP 2 — Read: `backend/src/app.js`

### Concept: Express Application + Middleware Stack

#### The Problem
You have thousands of requests per day. Every request needs security headers, rate limiting, body parsing, sanitization, and logging. If you put this in every controller, you write it 50 times and miss it in 5 places. Middleware solves this.

#### Mental Model
Middleware is a **conveyor belt**. Every request rides the belt. Each middleware station processes the request and decides: pass it forward, or stop it here. If a station calls `next()`, the belt moves. If it calls `res.json(...)` without `next()`, the belt stops.

#### The Conveyor Belt Order In Your App
Reading `app.js` from top to bottom shows your exact security layers:

```
Request enters
    ↓
helmet()           → Sets security HTTP headers (CSP, HSTS, etc.)
    ↓
cors()             → Allows or blocks based on origin
    ↓
morgan('dev')      → Logs the request (dev only)
    ↓
rateLimit()        → Blocks abuse (600 req/hour per IP on /api)
    ↓
express.json()     → Parses JSON body into req.body
    ↓
mongoSanitize()    → Strips $, . from body to block NoSQL injection
    ↓
xss()              → Strips HTML tags from input to block XSS
    ↓
compression()      → Gzips response body
    ↓
Route Handlers     → Your actual business logic
    ↓
notFound()         → Catches unmatched routes
    ↓
errorConverter()   → Normalizes all errors to ApiError format
    ↓
errorHandler()     → Sends final JSON error response
```

#### Concept Deep-Dive: CORS

**The Problem:**
Browsers block cross-origin requests by default. Your frontend (running at `localhost:3000`) and backend (running at `localhost:5000`) are different origins. Without CORS configuration, the browser would block every API call.

**How It Works:**
1. Browser sends a `preflight` OPTIONS request.
2. Server responds with `Access-Control-Allow-Origin` header.
3. If origin matches, browser proceeds with the real request.
4. If it doesn't match, browser blocks the response.

**Your Code:**
```js
// app.js
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [...]; // localhost, Vercel URL, production domain
    if (normalizedAllowed.includes(normalizedOrigin)) {
      callback(null, true);     // Allow
    } else {
      callback(new Error('Not allowed by CORS')); // Block
    }
  },
  credentials: true  // Allow cookies and Authorization headers
}));
```
The `credentials: true` is essential because your JWT token is sent via the `Authorization` header. Without this, CORS would strip custom headers.

#### Concept Deep-Dive: Helmet

**What It Does:**
Sets HTTP response headers that prevent common browser-level attacks:
- `Content-Security-Policy`: Tells browser which sources are allowed to load scripts, styles, images.
- `X-Frame-Options`: Prevents your pages from being embedded in iframes (clickjacking).
- `HSTS` (Strict-Transport-Security): Forces HTTPS.

**Your Code:**
```js
// app.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      ...
    }
  }
}));
```
Note: `'unsafe-inline'` and `'unsafe-eval'` are needed by Next.js hydration scripts. In a more locked-down environment, you would use nonces instead.

#### Concept Deep-Dive: Rate Limiting

**The Problem:**
Without rate limiting, a bot can send 100,000 requests per second and either crash your server or brute-force login credentials.

**Your Code:**
```js
// app.js
const limiter = rateLimit({
  max: 600,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP...'
});
app.use('/api', limiter);
```
600 requests per hour per IP. After that, every request from that IP gets a 429 Too Many Requests response automatically, no controller logic needed.

#### Concept Deep-Dive: NoSQL Injection and XSS

**NoSQL Injection Example:**
```json
{ "username": { "$gt": "" }, "password": { "$gt": "" } }
```
MongoDB would interpret `$gt: ""` as "greater than empty string" — matching every user. `mongoSanitize()` removes `$` and `.` from input keys, blocking this.

**XSS Example:**
```
<script>document.cookie = 'stolen=' + document.cookie</script>
```
If a user submits this as their name, and another page renders it unescaped, it runs. `xss()` removes these tags at input time.

#### Common Mistakes
- Middleware order matters. Putting `express.json()` after route handlers means `req.body` is always undefined in routes.
- `credentials: true` in CORS without also setting `origin` to a specific domain (not `*`) causes a CORS error in all browsers.

---

## STEP 3 — Read: `backend/src/config/database.js`

### Concept: Database Connection Management

#### The Problem
MongoDB connections are not free. Each connection consumes memory on the DB server. You want to open one connection at startup and reuse it for all requests, not open a new one per request.

#### How It Works
`mongoose.connect()` establishes a connection pool. Mongoose then reuses connections from this pool for every query, automatically.

#### What This Looks Like In Your Code
```js
// config/database.js
const connectDatabase = async () => {
  await mongoose.connect(mongoURI, options);

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close(); // Clean shutdown
    process.exit(0);
  });
};
```

**`SIGINT`** is what happens when you press `Ctrl+C`. Instead of killing the process mid-query, your app waits to close the DB connection cleanly. This prevents partial writes and corruption.

**Why `process.exit(1)` in the catch?**
If your app can't connect to the database at startup, there is no point running. Every request would fail. Better to exit immediately so your process manager (PM2, Render, etc.) restarts and tries again.

---

# PHASE 2 — AUTHENTICATION: WHO ARE YOU?

## STEP 4 — Read: `backend/src/config/auth.js`

### Concept: JWT (JSON Web Token)

#### The Problem
HTTP is stateless. Every request arrives with no memory of previous requests. Early solutions used server-side sessions: "I'll store your session in memory and give you a session ID cookie." This breaks when you have multiple servers (Server A has your session, you hit Server B, which knows nothing).

JWT solves this by making authentication stateless: all identity information is encoded in the token itself, which the client carries.

#### What Is a JWT
A JWT is three Base64-encoded parts separated by dots:
```
HEADER.PAYLOAD.SIGNATURE
```

**Header:** Algorithm and token type.
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload (Claims):** The actual data.
```json
{ "id": "64a1...", "email": "john@example.com", "role": "borrower", "exp": 1712340000 }
```

**Signature:**
```
HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```
The signature proves nobody tampered with the payload. If even one character changes, the signature no longer matches.

#### How It Works In Your App
```js
// config/auth.js
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,            // Your secret key
    { expiresIn: '1d' }    // Token expires in 1 day
  );
};
```

```js
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
  // Returns decoded payload if valid
  // Throws if expired or tampered
};
```

**The Flow:**
1. User logs in.
2. `generateToken(user)` creates a signed token.
3. Token is sent to client.
4. Client stores it in `localStorage` (your app does this in `AuthContext.js`).
5. On every request: `Authorization: Bearer <token>`.
6. `authenticate` middleware calls `verifyToken`, extracts claims.
7. Controller knows who the user is via `req.user`.

#### The Security Trade-Off
JWTs **cannot be revoked** before expiry. If a token is stolen and you haven't implemented a blacklist, it is valid until it expires. This is why your token expires in **1 day**, not 30 days.

#### Common Mistakes
- Storing sensitive data (like SSN or credit score) in the JWT payload. It is Base64-encoded, not encrypted. Anyone can decode the payload.
- Using the same secret in development and production. If it leaks, all tokens ever signed with it become forgeable.

---

## STEP 5 — Read: `backend/src/middleware/auth.middleware.js`

### Concept: Authentication vs Authorization Middleware

#### Two Different Guards

**Authentication:** "Who are you?" — Verify the token signature and find the user.
**Authorization:** "Are you allowed to do this?" — Check if the user's role permits the action.

These are separate because:
- Many routes need authentication but not strict role checking.
- Authorization logic can change independently of token verification.

#### What This Looks Like In Your Code

```js
// auth.middleware.js
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError('Access denied. No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);   // Throw if invalid

  const user = await User.findById(decoded.id).select('-password');
  // Note: .select('-password') means: give me every field EXCEPT password

  if (!user) return next(new ApiError('User not found', 404));
  if (!user.isActive) return next(new ApiError('User account is inactive', 403));

  req.user = user;   // Attach user for downstream use
  next();            // Pass to next middleware or controller
};
```

**Why `User.findById()` every single request?**
The JWT payload (decoded) may be stale. A user could have been deactivated after the token was issued. By fetching the user from the database every request, you always get the current state. The cost is one extra DB query per request. The benefit is real-time access control.

```js
// auth.middleware.js
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role.toLowerCase().trim();
    const normalizedRoles = roles.map(r => r.toLowerCase().trim());
    if (!normalizedRoles.includes(userRole)) {
      return next(new ApiError('Not authorized', 403));
    }
    next();
  };
};
```

**How Routes Use These:**
```js
// loan.routes.js
router.use(authenticate);       // Applied to all routes in this file

router.get('/:id',
  authorize('lender', 'company', 'admin'),  // Only these roles can GET a loan by ID
  loanController.getLoan
);
```

#### Difference Between 401 and 403
- **401 Unauthorized:** "I don't know who you are." No token or invalid token.
- **403 Forbidden:** "I know who you are, but you're not allowed." Valid token but wrong role.

#### Common Mistakes
- Forgetting `router.use(authenticate)` at the top of a route file. All routes become public.
- Checking role with `==` instead of normalized comparison. `'Lender'` and `'lender'` would fail incorrectly.
- Calling `next()` after `res.json()`. You send a response AND continue middleware, causing "headers already sent" errors. Your code uses `return next(...)` correctly.

---

# PHASE 3 — DATA LAYER: HOW DATA IS STORED AND SHAPED

## STEP 6 — Read: `backend/src/models/user.model.js`

### Concept: Mongoose Schemas, Validation, Hooks, and Instance Methods

#### The Problem
MongoDB accepts any JSON document. Without a schema, nothing stops you from saving `{ name: 123, email: null, role: 'overlord' }`. Schemas define shape, type constraints, default values, relationships between collections, and reusable logic.

#### What This Looks Like In Your Code

**Schema Field Options:**
```js
// user.model.js
email: {
  type: String,
  required: true,    // Cannot save without this
  unique: true,      // MongoDB creates a unique index
  trim: true,        // Auto-strip leading/trailing spaces
  lowercase: true    // Auto-convert to lowercase before saving
}
```
The `trim` and `lowercase` options mean `"  John@EXAMPLE.COM  "` is stored as `"john@example.com"` automatically. No manual `.toLowerCase()` needed.

**Enum Validation:**
```js
role: {
  type: String,
  enum: ['borrower', 'lender', 'admin', 'company'],
  default: 'borrower'
}
```
If you try to save `role: 'superuser'`, Mongoose throws a validation error before anything reaches the database.

**Mongoose Pre-Save Hook:**
```js
// user.model.js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();   // Only run if password changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Why This Is Genius:**
The password is hashed automatically before any `user.save()` call. The controller never manually calls `bcrypt.hash()`. The model takes care of it. If you update any other field like `user.email = '...'` and save, the password check (`this.isModified('password')`) returns false and the hook skips hashing — critical, because double-hashing destroys the password.

**Instance Method:**
```js
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```
You call this like: `await user.comparePassword('entered_password')`. The method has access to `this` (the document). This is the correct way to add behavior to a model document.

**`timestamps: true`:**
```js
const userSchema = new mongoose.Schema({ ... }, { timestamps: true });
```
This auto-adds `createdAt` and `updatedAt` fields and keeps `updatedAt` current on every save. No manual date management needed.

#### Concept: References Between Collections

```js
// user.model.js
company: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company'        // Name of the related Model
}
```
This stores the MongoDB `_id` of a Company document. It is similar to a foreign key in SQL. When you want to load the full company:
```js
await User.findById(id).populate('company');  // Replaces ObjectId with the full Company document
```
Without `.populate()`, you get just the raw ID string.

#### Common Mistakes
- Using `findByIdAndUpdate()` bypasses pre-save hooks. Hooks only run on `.save()` or `.create()`. For password hashing, this means you must handle bcrypt manually if you use update operations.
- Not using `.select('-password')` when returning a user. You expose the hashed password in the response.

---

## STEP 7 — Read: `backend/src/models/loan.model.js`

### Concept: Nested Schemas, Enums, Complex Document Structure

#### The Problem
A loan application is a deeply nested data structure: property info, multiple borrowers, multiple employers per borrower, financial details, compliance fields. Flat documents would either miss structure or become impossible to query efficiently.

#### What This Looks Like In Your Code

```js
// loan.model.js
const propertySchema = new mongoose.Schema({
  streetAddress: { type: String, trim: true },
  propertyValue: { type: Number, required: true, min: 0 },
  propertyType: {
    type: String,
    enum: ['Single Family Home', 'Condominium', 'Townhouse', ...]
  },
  occupancyType: {
    type: String,
    enum: ['Primary Residence', 'Vacation Home', 'Investment', 'Other']
  }
});
```

**Nested sub-schemas** let you define reusable document shapes. `propertySchema` is embedded inside the loan schema. This is called **embedding** (vs referencing).

**When to Embed vs Reference:**
- Embed (sub-schema): The data is always needed together, only makes sense in context of the parent, and doesn't grow unboundedly. Example: property details always belong to one loan.
- Reference (ObjectId + ref): The data is shared between documents, or could grow large. Example: User is referenced from Loan because a user exists independently.

#### Enum As Data Integrity Guard
```js
loanType: {
  type: String,
  enum: ['Purchase', 'Refinance', 'Cash-Out Refinance', 'Construction', ...],
  required: true
}
```
If the frontend sends `loanType: 'Random Text'`, Mongoose throws a `ValidationError`. Your controller can catch this and return a 400 Bad Request. This is **validation at the model layer** — independent of any request-level validation you do in middleware.

**Status Auto-Date Pattern:**
```js
// loan.controller.js
async function applyStatusDateToCompensation(loanId, newStatus) {
  const dateMap = {
    'Application Submitted': 'applicationDate',
    'Conditional Approval': 'approvalDate',
    'Clear to Close': 'clearToCloseDate',
    ...
  };
  const dateField = dateMap[newStatus];
  if (!dateField) return;
  const comp = await LoanCompensation.findOne({ loan: loanId });
  if (!comp[dateField]) {    // Only set if not already set (idempotent)
    comp[dateField] = new Date();
    await comp.save();
  }
}
```
When a loan status changes to `'Funded'`, the system automatically sets `fundedDate` — but only if it was never set before. This is an **idempotency guard**: calling it twice for the same status doesn't change the date. This matters in financial systems where events must be timestamped accurately.

---

# PHASE 4 — ROUTING AND CONTROLLERS: WHERE BUSINESS LOGIC LIVES

## STEP 8 — Read: `backend/src/routes/loan.routes.js`

### Concept: Express Router, Route Structure, and HTTP Methods

#### The Problem
All routes in one file becomes unmanageable. Separate route files let each domain (loans, auth, users) own its own route definitions.

#### What This Looks Like In Your Code

```js
// loan.routes.js
const router = express.Router();

// Apply authenticate middleware to ALL routes in this file
router.use(authenticate);

// GET /api/v1/loans
router.get('/', loanController.getAllLoans);

// POST /api/v1/loans
router.post('/', loanController.createLoan);

// GET /api/v1/loans/:id — only lender, company, admin
router.get('/:id', authorize('lender', 'company', 'admin'), loanController.getLoan);

// PATCH /api/v1/loans/:id/status
router.patch('/:id/status', loanController.updateLoanStatus);

// DELETE /api/v1/loans/:id/conditions/:conditionId
router.delete('/:id/conditions/:conditionId', loanController.removeCondition);
```

**HTTP Methods Are Not Just Decoration:**
- `GET`: Reads data. Must be safe (no side effects) and idempotent (same result called multiple times).
- `POST`: Creates a new resource.
- `PUT`: Replaces a resource entirely.
- `PATCH`: Partially updates a resource.
- `DELETE`: Removes a resource.

**`:id` Is a URL Parameter.**
`router.get('/:id', ...)` means any request matching `/api/v1/loans/64a1...` will have `req.params.id = '64a1...'`.

**Route Ordering Matters:**
```js
router.get('/borrower/:borrowerId', ...);   // Must be BEFORE /:id
router.get('/:id', ...);
```
If `/:id` comes first, Express matches `/borrower/...` as an `id` parameter. More specific routes must precede more general ones.

**How Routes Are Mounted:**
```js
// app.js
app.use('/api/v1/loans', loanRoutes);
```
So `POST /api/v1/loans` → `router.post('/')` → `loanController.createLoan`.

---

## STEP 9 — Read: `backend/src/controllers/auth.controller.js`

### Concept: Controller Responsibilities, Separation of Concerns

#### The Problem
If you put database queries, business rules, email sending, token generation, and HTTP response formatting all in one function, it becomes a 300-line function that is impossible to test or reuse.

#### Controller Responsibility
A controller is the **glue layer**. It:
1. Reads from `req` (params, body, user).
2. Calls services/models to do the work.
3. Sends the HTTP response.
4. Calls `next(error)` on failure.

**Example in your app:**
```js
// auth.controller.js (pattern used throughout)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;   // 1. Read from req

    const user = await User.findOne({ email });  // 2. Call model
    if (!user) return next(new ApiError('Invalid credentials', 401));

    const isMatch = await user.comparePassword(password);  // 3. Use instance method
    if (!isMatch) return next(new ApiError('Invalid credentials', 401));

    const token = generateToken(user);    // 4. Generate token

    res.status(200).json({               // 5. Send response
      status: 'success',
      data: { token, user }
    });
  } catch (err) {
    next(err);   // 6. Pass errors to error middleware
  }
};
```

**Why "Invalid credentials" instead of "User not found" or "Wrong password"?**
Security. Telling attackers which part is wrong lets them enumerate valid email addresses. By returning the same message for both failures, you give attackers no information.

#### The `next(error)` Pattern
Notice `next(err)` instead of `res.status(500).json(...)`. This passes the error to your error middleware chain:
```
Controller throws/calls next(error)
    → errorConverter middleware (normalizes to ApiError)
    → errorHandler middleware (sends JSON response with status code)
```
This means error formatting is always consistent across all endpoints.

---

# PHASE 5 — ERROR HANDLING: THE SAFETY NET

## STEP 10 — Read: `backend/src/utils/apiError.js` and `backend/src/middleware/error.middleware.js`

### Concept: Centralized Error Handling Architecture

#### The Problem
Without a centralized error handler, every controller writes its own `res.status(400).json({ error: '...' })`. Some return `{ error: 'msg' }`, others `{ message: 'msg' }`, others `{ status: 'fail' }`. Clients can't predict the shape.

#### `ApiError` Class

```js
// utils/apiError.js
class ApiError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);            // Sets this.message
    this.statusCode = statusCode;
    this.isOperational = isOperational;   // True = expected error (400, 404); False = bug (500)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
```

**`isOperational`:** Distinguishes between predictable errors (user sent wrong data) and unexpected bugs. In production monitoring, you alert on `isOperational = false` (true bugs) but not every `isOperational = true` (expected application flows).

#### The Error Middleware Chain

```js
// error.middleware.js

// Step 1: Convert any Error to ApiError if not already
const errorConverter = (err, req, res, next) => {
  if (!(err instanceof ApiError)) {
    error = new ApiError(err.message || 'Internal Server Error', err.statusCode || 500);
  }
  next(error);
};

// Step 2: Send the final response
const errorHandler = (err, req, res, next) => {
  const response = {
    status: 'error',
    statusCode: err.statusCode,
    message: err.message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };
  res.status(err.statusCode).json(response);
};
```

**Why two separate functions?**
`errorConverter` can run without sending anything. You can chain multiple converters if needed. `errorHandler` always sends the response. Separation of conversion from sending = more flexible pipeline.

**The four-argument signature `(err, req, res, next)` is how Express recognizes an error-handling middleware.** Regular middleware has three arguments `(req, res, next)`. If Express encounters an error handler, it skips all regular middleware and jumps to the error handler.

#### Common Mistakes
- Not calling `next(err)` in async controllers. Unhandled promise rejections crash Node silently in older versions.
- Putting error middleware before routes. It never catches route errors because they haven't happened yet.
- Stack trace in production responses. Attackers can learn your file structure from stack traces.

---

# PHASE 6 — FRONTEND FOUNDATION

## STEP 11 — Read: `frontend/src/pages/_app.js`

### Concept: Next.js App Shell, Context Providers, Global State Bootstrap

#### What `_app.js` Is
In Next.js, every page component is wrapped by `_app.js`. It is the outermost shell.

```js
// pages/_app.js
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>     {/* Global auth state available to ALL pages */}
      <Head>
        <title>Loan Application System</title>
        ...
      </Head>
      <Toaster position="top-right" />   {/* Global toast notification system */}
      <Component {...pageProps} />        {/* The actual page being rendered */}
    </AuthProvider>
  );
}
```

**Why wrap `AuthProvider` here?**
Every page in your app needs to know who is logged in. If you put `AuthProvider` inside individual pages, each page creates its own auth state. By wrapping at `_app.js`, there is exactly one auth state instance shared across all pages.

**`Component` is the current page.** When a user navigates from `/login` to `/dashboard`, Next.js replaces `Component` but keeps `_app.js` running. This is why your auth state persists across navigation — `AuthProvider` never unmounts.

---

## STEP 12 — Read: `frontend/src/contexts/AuthContext.js`

### Concept: React Context, State Persistence, Axios Interceptors

#### The Problem
After login, the user's identity must be available across hundreds of components without passing props through every layer. Context solves this.

#### What Context Is
Context is a global state container for React:
1. You create a context: `createContext({})`
2. You provide it: `<AuthContext.Provider value={...}>`
3. Any descendant component can read it: `const { user } = useContext(AuthContext)`

#### What This Looks Like In Your Code

**Bootstrap — Check if user is already logged in on page load:**
```js
// AuthContext.js
useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get('.../users/me');
      setUser(normalizeUserData(response.data.data));
    }
    setLoading(false);
  };
  fetchUser();
}, [router]);
```

On every page load, this effect runs. It checks `localStorage` for a saved token. If found, it fetches the current user profile. This is how "remember me" works — the token survives page refreshes.

**Axios Response Interceptor:**
```js
// AuthContext.js
const interceptor = axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && router.pathname !== '/login') {
      localStorage.removeItem("token");
      setUser(null);
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

return () => axios.interceptors.response.eject(interceptor);  // Cleanup on unmount
```

**This is the session expiry handler.** If any API call returns 401, it means the token expired. This interceptor automatically logs the user out and redirects to login — no matter which component made the API call. The cleanup `eject(interceptor)` prevents the handler from running after the provider unmounts (memory leak prevention).

**`normalizeUserData()` function:**
```js
const normalizeUserData = (userData) => {
  if (userData.user && typeof userData.user === 'object') return userData.user;
  if (userData._id && userData.role) return userData;
  if (userData.data?.user) return userData.data.user;
  return userData;
};
```
The API sometimes returns `{ user: {...} }`, sometimes `{ data: { user: {...} } }`, sometimes the user object directly. This normalizer handles all cases. This is a **defensive normalization** pattern — real APIs are inconsistent, especially when they evolve.

**The `login` function:**
```js
const login = async (email, password) => {
  const response = await axios.post('.../auth/login', { email, password });
  const token = response.data.data.token;
  localStorage.setItem("token", token);           // Persist token
  setUser(normalizedUser);                         // Set in state
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // Set header globally
  router.push('/borrower/dashboard');              // Navigate by role
};
```

**Why `localStorage` and not cookies?**
`localStorage` is simple to use from JavaScript. The trade-off: it is accessible to any JS on the page (XSS risk). An `httpOnly` cookie would be more secure, but requires changes to the backend to set cookies and CSRF protection. Your current choice is common for SPAs.

---

## STEP 13 — Read: `frontend/src/services/api.js`

### Concept: Axios Instance, Interceptors, Centralized API Layer

#### The Problem
If every component directly calls `axios.get('http://localhost:5000/api/v1/...')`, you have the URL hardcoded everywhere, the auth token attached manually every time, and error handling duplicated across every component.

#### The Axios Instance Pattern
```js
// services/api.js
const api = axios.create({
  baseURL: API_URL,                         // Set once, used everywhere
  headers: { 'Content-Type': 'application/json' }
});
```

**Request Interceptor — Auto-attach auth token:**
```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
Every API call automatically includes the token. No component needs to remember to add it.

**Response Interceptor — Auto-handle 401:**
```js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);
```

**Service Object Pattern:**
```js
// services/api.js
export const borrowerService = {
  getLoans: (params) => api.get('/borrower/loans', { params }),
  createLoan: (data) => api.post('/borrower/loans', data),
  uploadDocument: (formData) => api.post('/borrower/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
```
Components import `borrowerService.getLoans()`. They never know the URL structure or token logic. If the API URL changes, you change one file.

#### The `multipart/form-data` Content Type
Standard JSON requests send: `Content-Type: application/json`. File uploads require `multipart/form-data` because files are binary, not JSON-serializable. `axios` sets this automatically when you pass a `FormData` object, but your code sets it explicitly for clarity.

---

## STEP 14 — Read: `frontend/src/hooks/useLoanApplication.js`

### Concept: Custom Hooks, Complex State Management, Separation of Concerns

#### The Problem
A multi-step loan application form has:
- Active step tracking
- Form data for 10+ sections
- API calls to save drafts
- Consent state
- Role-based behavior (lender vs borrower filling the same form)

Without a custom hook, this all lives inside the page component, making it 800+ lines and untestable.

#### What Custom Hooks Are
A custom hook is a JavaScript function that:
- Starts with `use`
- Can call other hooks (`useState`, `useEffect`, etc.)
- Returns state and functions the component needs

It lets you **extract logic out of components without losing reactivity**.

#### What This Looks Like In Your Code

```js
// hooks/useLoanApplication.js
export const useLoanApplication = () => {
  const router = useRouter();
  const { user } = useAuth();               // Uses AuthContext
  const isLenderContext = router.pathname.includes('/lender/');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    borrowers: [{ firstName: '', ... }],
    propertyInfo: { ... },
    loanDetails: { ... },
    ...
  });

  // ... validation, auto-save, API calls

  return { currentStep, formData, handleNextStep, handleChange, ... };
};
```

**The page component then becomes:**
```js
const LoanApplicationPage = () => {
  const { currentStep, formData, handleNextStep } = useLoanApplication();
  return <MultiStepForm step={currentStep} data={formData} onNext={handleNextStep} />;
};
```
The page now only handles rendering. The logic is reusable and testable in isolation.

#### The Multi-Step Form Pattern
```js
const [currentStep, setCurrentStep] = useState(1);
const [currentSubStep, setCurrentSubStep] = useState('personalDetails');
```
Your form has steps (major sections) and sub-steps (sub-sections within a major section). This two-level state models the URLA (Uniform Residential Loan Application) structure.

---

# PHASE 7 — REAL-TIME FEATURES

## STEP 15 — Read: `backend/src/server.js` (Socket.IO section) and `frontend/src/services/socket.service.js`

### Concept: WebSockets, Socket.IO, Event-Driven Real-Time

#### The Problem
Polling: "Is there a new message? No. Is there a new message? No. Is there a new message? Yes."
This wastes bandwidth and creates delay. The browser has to wait until the next poll cycle to see the message.

WebSocket: "I'll tell you when something new happens."
The server pushes data to the client the moment it occurs.

#### How WebSockets Work
Regular HTTP:
```
Client → Request → Server
Client ← Response ← Server
Connection closed.
```

WebSocket:
```
Client → HTTP Upgrade Request → Server
Client ← 101 Switching Protocols ← Server
[Persistent bidirectional connection stays open]
Client ← Server pushes events any time
Client → Client sends events any time
```

#### What This Looks Like In Your Backend

```js
// server.js
io.on('connection', (socket) => {
  // A new client connected

  socket.on('join', (userId) => {
    socket.join(userId);               // Join a "room" named after user's ID
    socket.join(`borrower-${userId}`); // Also join a borrower-specific room
  });

  socket.on('new_message', (message) => {
    if (message.recipient) {
      io.to(message.recipient).emit('receive_message', message);
      // Emit to the recipient's room only
    }
  });

  socket.on('document_request', (data) => {
    if (data.borrowerId) {
      io.to(data.borrowerId).emit('document-request', data);
      io.to(`borrower-${data.borrowerId}`).emit('document-request', data);
    }
  });
});
```

**Rooms are the key concept.**
When a user logs in, the frontend calls `socket.emit('join', userId)`. The server runs `socket.join(userId)`. Now any time the server calls `io.to(userId).emit(...)`, only that specific user receives the event.

This is how you send targeted notifications. A lender requesting a document emits `document_request` with `borrowerId`. The server routes it only to the borrower's connected socket.

#### What This Looks Like In Your Frontend

```js
// services/socket.service.js
class SocketService {
  connect() {
    this.socket = io(this.baseURL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10
    });

    this.socket.on('document-request', (data) => {
      this.deduplicateAndNotifyDocumentRequest({ ...data, type: 'document-request' });
    });
  }

  // Register a component as a listener
  addMessageListener(id, callback) {
    this.messageListeners.push({ id, callback });
  }

  // Remove when component unmounts
  removeMessageListener(id) {
    this.messageListeners = this.messageListeners.filter(l => l.id !== id);
  }
}
```

**The Deduplication Pattern:**
Your `deduplicateAndNotifyDocumentRequest` prevents the same notification from appearing twice. This is needed because both `document_requested` and `document-request` events fire for the same action (the server emits to two different room names for redundancy). Without deduplication, the user sees double notifications.

**Why `reconnection: true` with `reconnectionAttempts: 10`:**
Mobile users switch networks. Server restarts happen. Without reconnection logic, users would lose real-time updates after any interruption. With it, Socket.IO automatically re-establishes the connection and rejoins rooms.

---

# PHASE 8 — FILE UPLOADS AND CLOUD STORAGE

## STEP 16 — Read: `backend/src/services/s3.service.js`

### Concept: File Uploads, Multer, AWS S3, Environment-Driven Storage

#### The Problem
Files uploaded to your server's disk are:
1. Lost when the server restarts (ephemeral file systems on cloud platforms).
2. Not scalable across multiple server instances.
3. Disk space limited.

S3 is permanent, scalable, reliable object storage.

#### The Storage Toggle Pattern

```js
// s3.service.js
const USE_S3 = process.env.USE_S3 === 'true' || false;
```
Your app supports **both local disk storage and S3**, switched by an environment variable. In development, `USE_S3 = false`, files go to `backend/uploads/`. In production, `USE_S3 = true`, files go to S3 bucket. This is an example of **environment-driven configuration** — no code change needed when deploying.

#### How Multer Works

```js
// s3.service.js
const storage = multer.memoryStorage();  // Hold file in memory, not on disk

const upload = multer({
  storage,
  fileFilter,        // Accept/reject based on MIME type
  limits: { fileSize: 50 * 1024 * 1024 }  // 50MB max
});
```

**Memory storage vs disk storage:**
- Disk storage: Multer saves the file temporarily to disk, then you read and upload it. Slower, needs cleanup.
- Memory storage: File lives in `req.file.buffer` as a Buffer object. Faster for cloud uploads because you stream directly from memory to S3.

**MIME Type Validation:**
```js
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', ...];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);   // Accept
  } else {
    cb(new ApiError('Unsupported file type', 400), false);  // Reject
  }
};
```
This is a security boundary. Without MIME validation, users could upload a `.js` file disguised with any extension and the server might execute it.

#### The S3 Upload Function

```js
// s3.service.js
const uploadToS3 = async (file, folder = 'uploads') => {
  const uniqueSuffix = crypto.randomBytes(16).toString('hex');  // Prevent collisions
  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${uniqueSuffix}${fileExtension}`;
  const key = `${folder}/${fileName}`;   // e.g., "uploads/1712340000-abc123def456.pdf"

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,    // From multer memoryStorage
    ContentType: file.mimetype
  };

  await s3.upload(params).promise();
  return { key, url: `https://${Bucket}.s3.amazonaws.com/${key}` };
};
```

**The unique filename pattern:**
`Date.now()` + `crypto.randomBytes(16)` ensures no two files ever have the same key, even uploaded simultaneously by different users with the same original filename.

---

# PHASE 9 — THE COMPLETE REQUEST LIFECYCLE (PUTTING IT ALL TOGETHER)

## STEP 17 — Trace A Complete Request End-To-End

### Scenario: Borrower Submits A Loan Application

#### Frontend Events (What happens on the user's device)

1. **Component renders the form.**
   - `useLoanApplication()` hook initializes `formData` with empty fields and `currentStep = 1`.

2. **User fills in personal details and clicks Next.**
   - `handleNextStep()` in the hook calls `validateStep(1, formData)`.
   - If valid: `setCurrentStep(2)`.

3. **User reaches the final step and clicks Submit.**
   - `handleSubmit()` calls `LoanService.createLoan(formData)`.
   - `LoanService` calls `api.post('/borrower/loans', formData)`.

4. **Axios request interceptor fires.**
   - Attaches `Authorization: Bearer <token>` header automatically.

5. **Request leaves the browser**, crosses the network to your backend.

#### Backend Events (What happens on your server)

6. **Express receives the request at `POST /api/v1/loans`.**
   - Passes through:
     - `helmet()` sets security headers on the response.
     - `cors()` checks origin.
     - `rateLimit()` checks this IP's request count.
     - `express.json()` parses the JSON body into `req.body`.
     - `mongoSanitize()` strips dangerous keys.
     - `xss()` sanitizes strings.

7. **Route file: `loan.routes.js`**
   - `router.use(authenticate)` fires first for every route.

8. **`authenticate` middleware:**
   - Extracts token from `Authorization: Bearer ...` header.
   - Calls `verifyToken(token)` — decodes and validates the JWT.
   - Calls `User.findById(decoded.id).select('-password')` — confirms user still exists and is active.
   - Attaches `req.user = user`.
   - Calls `next()`.

9. **`loanController.createLoan` executes:**
   - Reads `req.body` and `req.user`.
   - Creates a new `Loan` document.
   - Calls `createDefaultMilestonesForLoan(loan._id, lenderId)` — sets up processing milestones.
   - Calls `applyStatusDateToCompensation(loan._id, 'Application Submitted')` — logs the date.
   - Returns `res.status(201).json({ status: 'success', data: { loan } })`.

#### Frontend Events (After the response arrives)

10. **Axios response interceptor fires** — 201 means success, no interception needed.

11. **`LoanService.createLoan()` returns the resolved promise** with the new loan data.

12. **`handleSubmit()` in the hook receives the result.**
    - Updates state: `setDraftId(loan._id)`.
    - Calls `toast.success('Application submitted!')`.
    - Calls `router.push('/borrower/dashboard')`.

13. **Socket.IO event (optional, if wired):**
    - Backend emits `loan_submitted` event to the assigned lender's room.
    - Lender's dashboard receives it and shows a notification without refreshing.

14. **Browser navigates to dashboard.**
    - `_app.js` keeps `AuthProvider` alive — no re-authentication needed.
    - Dashboard component mounts, calls `borrowerService.getDashboard()`.
    - Shows the new loan in the list.

---

# PHASE 10 — CONCEPTS YOU WILL ENCOUNTER NEXT

## 18. Virtual DOM and React Reconciliation (Detailed)

### How It Fits Your Loan Form
Your loan form has 20+ fields, multiple borrower sections, and conditional sections. Every time a user types a character, React re-renders.

**Without Virtual DOM optimization:**
React would update every DOM node on every keystroke. Input feels laggy.

**With reconciliation:**
React builds a new virtual tree. Compares it to the previous. Only updates the one `<input>` element whose value actually changed.

**The `key` prop in your borrower arrays:**
```js
{borrowers.map((borrower, index) => (
  <BorrowerSection key={borrower.id || index} data={borrower} />
))}
```

If `key` is `index` and the user removes the first borrower, React sees:
- Old: keys 0, 1, 2
- New: keys 0, 1

It updates borrower 0 and 1 with wrong data and removes 2 — causing the second borrower's data to appear in the first field. Always use stable unique IDs as keys when order can change.

---

## 19. `useEffect` and Stale Closures (Your Codebase)

### The Stale Closure Problem
```js
// AuthContext.js
useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    ...
  };
  fetchUser();
}, [router]);  // Re-run when router changes
```

**Why `[router]` as a dependency?**
On initial render, `router.pathname` is undefined. On first navigation, it resolves. By including `router`, the effect re-runs after routing is ready, preventing a race condition where `fetchUser` fires before the router is initialized.

If you used `[]` (mount-only), the user on the login page would be redirected in a loop because `fetchUser` runs once and sees no user, even when the user just navigated to login intentionally.

---

## 20. Async/Await and Error Propagation

### The Pattern You See Everywhere
```js
// Any controller
exports.someAction = async (req, res, next) => {
  try {
    const result = await SomeModel.find();    // Await the promise
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);    // Pass to error middleware
  }
};
```

**Why not `.then().catch()`?**
`async/await` lets you write async code that looks synchronous, making the flow much easier to trace. `try/catch` wraps the entire async sequence, not just one step.

**A subtle gotcha:**
Without `await`, `mongoose.findById()` returns a Thenable object, not the actual data. Your code would have `result = Query { ... }` instead of the document. Always `await` database operations.

---

# QUICK REFERENCE: FILE-TO-CONCEPT MAP

| File | Concept Taught |
|---|---|
| `backend/src/server.js` | Entry point, HTTP server, Socket.IO setup, graceful shutdown |
| `backend/src/app.js` | Middleware stack, CORS, Helmet, rate limiting, sanitization, route mounting |
| `backend/src/config/database.js` | MongoDB connection, connection lifecycle events |
| `backend/src/config/auth.js` | JWT generation and verification, token expiry |
| `backend/src/middleware/auth.middleware.js` | Authentication vs authorization, `req.user`, role-based access |
| `backend/src/middleware/error.middleware.js` | Centralized error handling, `ApiError`, status code conventions |
| `backend/src/utils/apiError.js` | Custom error class, operational vs programming errors |
| `backend/src/models/user.model.js` | Mongoose schema, validation, pre-save hooks, instance methods, `select('-password')` |
| `backend/src/models/loan.model.js` | Nested schemas, enums, references, status lifecycle |
| `backend/src/routes/loan.routes.js` | Express router, HTTP method semantics, route ordering, middleware chaining |
| `backend/src/controllers/auth.controller.js` | Controller responsibility, generic error messages, separation of concerns |
| `backend/src/services/s3.service.js` | Multer, file validation, S3 upload, memory vs disk storage |
| `frontend/src/pages/_app.js` | Next.js app shell, global provider pattern |
| `frontend/src/contexts/AuthContext.js` | React Context, session persistence, Axios interceptors, normalized data |
| `frontend/src/services/api.js` | Axios instance, centralized API layer, request/response interceptors |
| `frontend/src/hooks/useLoanApplication.js` | Custom hook, complex state extraction, multi-step form logic |
| `backend/src/server.js` (Socket section) | Room-based targeted events, bidirectional comms |
| `frontend/src/services/socket.service.js` | Client-side Socket.IO, listener registration, deduplication |

---

# READING ORDER RECOMMENDATION

Read files in this exact order for maximum understanding:

**Day 1 — Infrastructure:**
1. `backend/src/server.js`
2. `backend/src/config/database.js`
3. `backend/src/app.js`

**Day 2 — Auth and Security:**
4. `backend/src/config/auth.js`
5. `backend/src/middleware/auth.middleware.js`
6. `backend/src/utils/apiError.js`
7. `backend/src/middleware/error.middleware.js`

**Day 3 — Data Shapes:**
8. `backend/src/models/user.model.js`
9. `backend/src/models/loan.model.js`
10. `backend/src/models/document.model.js`

**Day 4 — Backend Logic:**
11. `backend/src/routes/loan.routes.js`
12. `backend/src/controllers/auth.controller.js`
13. `backend/src/controllers/loan.controller.js`
14. `backend/src/services/s3.service.js`

**Day 5 — Frontend Foundation:**
15. `frontend/src/pages/_app.js`
16. `frontend/src/contexts/AuthContext.js`
17. `frontend/src/services/api.js`

**Day 6 — Frontend Logic:**
18. `frontend/src/hooks/useLoanApplication.js`
19. One borrower page (e.g., `frontend/src/pages/borrower/dashboard.js`)
20. One lender page (e.g., `frontend/src/pages/lender/dashboard.js`)

**Day 7 — Real-Time:**
21. Socket.IO section of `backend/src/server.js` (re-read carefully)
22. `frontend/src/services/socket.service.js`
23. A component that uses socket listeners (look in `frontend/src/hooks/`)

---

# EXERCISES TO BUILD REAL MASTERY

**Exercise 1 — Trace a Full Request:**
Pick `POST /api/v1/auth/login`. Write out every file it passes through, in order, with the exact function names at each step. Without running code. Then verify by adding a `console.log` at each step.

**Exercise 2 — Break Auth Intentionally:**
Remove `router.use(authenticate)` from `loan.routes.js`. Try to access a loan without a token. What happens? Then restore it.

**Exercise 3 — Understand the Pre-Save Hook:**
Add `console.log('PRE SAVE HOOK FIRED')` to the user model's pre-save hook. Register a new user. See when it fires. Then call `User.findByIdAndUpdate(...)` to update the user's name and see that the hook does NOT fire.

**Exercise 4 — Stale Closure Experiment:**
Add a `setInterval` inside a `useEffect` with an empty dependency array `[]`. Read a state variable inside it. Notice it always shows the initial value. Then fix it by using a `ref`. This is the stale closure problem in action.

**Exercise 5 — Socket Room Targeting:**
Add a `console.log` inside the `document_request` socket handler in `server.js`. Submit a document request as a lender. Verify the log fires on the server side. Then verify the notification appears on the borrower's side.

---

> Every concept in this guide is grounded in your actual codebase.
> When you read a file and see something confusing, look up the relevant section here.
> When you understand a section, find the corresponding file and trace it line by line.
> That back-and-forth between reading and doing is how mastery is built.
