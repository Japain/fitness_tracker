# Authentication Troubleshooting Log

**Date:** 2025-12-07
**Session:** Phase 3 Frontend Dashboard Implementation
**Status:** ✅ **RESOLVED** - Authentication flow working correctly

---

## Problem Summary

After implementing Phase 3 Frontend Dashboard, users cannot stay authenticated after completing Google OAuth login. The symptom is:

1. ✅ User completes Google OAuth successfully
2. ✅ Backend creates session and redirects to frontend
3. ❌ Frontend calls `/api/auth/me`
4. ❌ User is redirected back to `/login` page (appears to be unauthenticated)

---

## Evidence from Backend Logs

### ✅ What's Working

Backend logs show **authentication IS succeeding**:

```
=== OAuth Callback Success ===
Session ID: BaWkglQL3PVgchagVHpooikXO6Sp7xkj
Is authenticated: true
User: {
  id: '2c0dfd68-8e21-4e5d-90b0-961134aa71dc',
  googleId: '107510657591885038184',
  email: 'triplezero163@gmail.com',
  displayName: 'Jarred Payne',
  ...
}
Session cookie domain: undefined
Session cookie path: /
Session cookie sameSite: undefined  ← CORRECT (no sameSite in dev)
Redirecting to: http://localhost:5173/
```

### ⚠️ Inconsistent Cookie Behavior

Backend logs show **BOTH** successful and failed auth checks:

**Success (cookie present):**
```
=== /api/auth/me DEBUG ===
Session ID: BaWkglQL3PVgchagVHpooikXO6Sp7xkj
Is authenticated: true
Cookie header: _csrf=...; connect.sid=s%3ABaWkglQL3PVgchagVHpooikXO6Sp7xkj...
Referer: http://localhost:5173/login
```

**Failure (no cookie):**
```
=== /api/auth/me DEBUG ===
Session ID: TtIhzZb6kWp_s2a5yg6kh4KIymoqtx3p
Is authenticated: false
Cookie header: undefined  ← NO COOKIE SENT!
Referer: http://localhost:5173/login
```

### 🔍 Key Observation

Some requests from the frontend **include the session cookie** (and succeed), while other requests **don't include the cookie** (and fail). This suggests:

1. Cookie is being set correctly by backend
2. Browser may be receiving the cookie
3. But not all frontend requests are sending the cookie back

---

## Fixes Attempted

### Fix #1: OAuth Redirect URL ✅ APPLIED
**Problem:** Backend was redirecting to relative path `/login?error=auth_failed` on OAuth failure, causing 404.

**Fix Applied:**
- File: `packages/backend/src/routes/auth.ts` line 40
- Changed: `failureRedirect: '/login?error=auth_failed'`
- To: `failureRedirect: \`${config.cors.origin}/login?error=auth_failed\``

**Result:** OAuth redirect now correctly goes to frontend URL.

---

### Fix #2: Session Cookie sameSite Configuration ✅ APPLIED
**Problem:** `sameSite: 'lax'` prevents cookies from being sent in cross-origin requests between `localhost:3000` (backend) and `localhost:5173` (frontend).

**Fix Applied:**
- File: `packages/backend/src/index.ts` lines 36-50
- File: `packages/backend/src/middleware/csrf.ts`
- File: `packages/backend/src/routes/auth.ts`

**Changes:**
```typescript
// Before
cookie: {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',  // ← Blocked cross-origin cookies
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

// After
const cookieConfig: session.CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Only set sameSite in production
if (config.isProduction) {
  cookieConfig.sameSite = 'lax';
}
// In development: sameSite is undefined (allows cross-origin cookies)
```

**Result:** New sessions now created without `sameSite` attribute in development.

---

### Fix #3: Clear Old Sessions from Database ✅ APPLIED
**Problem:** Existing sessions in PostgreSQL still had old `sameSite: 'lax'` configuration even after code fix.

**Command Executed:**
```bash
docker exec fitness_tracker_postgres psql -U fitness_tracker -d fitness_tracker_dev -c "DELETE FROM session;"
# Deleted 4 old sessions
```

**Result:** All old sessions with incorrect cookie config removed.

---

### Fix #4: Frontend Auth Store Race Condition ✅ APPLIED (FINAL FIX)
**Problem:** The frontend `authStore` had initial state `isLoading: false`, causing `ProtectedRoute` to redirect to `/login` BEFORE `checkAuth()` had a chance to run.

**Root Cause Analysis:**
The React component lifecycle created a race condition:
1. `App` component renders → `RouterProvider` renders immediately
2. `ProtectedRoute` renders → checks state: `isLoading: false`, `isAuthenticated: false`
3. **Immediately redirects to `/login`** (before any auth check happens!)
4. THEN `useEffect` fires and calls `checkAuth()` — but user is already on `/login`

This explained the "intermittent" behavior: cookies were being sent correctly, but the frontend was redirecting before even checking authentication status.

**Fix Applied:**
- File: `packages/frontend/src/stores/authStore.ts` line 35
- Changed initial state from `isLoading: false` to `isLoading: true`

```typescript
// Before
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,  // ← PROBLEM: ProtectedRoute renders immediately
  error: null,
  ...
}));

// After
export const useAuthStore = create<AuthState>((set) => ({
  // isLoading starts TRUE to prevent ProtectedRoute from redirecting
  // before the initial auth check completes (race condition fix)
  user: null,
  isAuthenticated: false,
  isLoading: true,  // ← Now ProtectedRoute shows spinner until auth check completes
  error: null,
  ...
}));
```

**Result:** Users now see a loading spinner until `checkAuth()` completes, then are correctly routed to Dashboard (if authenticated) or Login (if not).

---

## Resolution Summary

The authentication issue was caused by **two separate problems** that both needed to be fixed:

1. **Backend Cookie Issue (Fixes #1-3):** The `sameSite: 'lax'` cookie attribute prevented cross-origin cookie transmission between `localhost:3000` and `localhost:5173` in development.

2. **Frontend Race Condition (Fix #4):** The `ProtectedRoute` component was redirecting to `/login` before `checkAuth()` had a chance to verify authentication status.

Both fixes were required for the authentication flow to work correctly.

---

## Current Frontend Configuration

### Auth Store (`packages/frontend/src/stores/authStore.ts`)

**checkAuth function (line 64-96):**
```typescript
checkAuth: async () => {
  set({ isLoading: true });

  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',  // ← Tells browser to send cookies
    });

    if (response.ok) {
      const user = await response.json();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // 401 or other error → mark as not authenticated
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  } catch (error) {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
},
```

### Vite Proxy Configuration (`packages/frontend/vite.config.ts`)

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,  // ← Should preserve cookies
    },
  },
}
```

**Expected behavior:** Requests to `http://localhost:5173/api/auth/me` should be proxied to `http://localhost:3000/api/auth/me` as **same-origin requests** from the browser's perspective.

---

## Possible Root Causes (Hypotheses)

### Hypothesis 1: OAuth Redirect Doesn't Go Through Proxy
**Theory:** The OAuth callback redirects from `localhost:3000` → `localhost:5173` (different origins). The session cookie is set on the `localhost:3000` domain during the redirect, but subsequent API calls go through the Vite proxy on `localhost:5173`, which the browser treats as a different origin.

**Evidence:**
- Backend logs show referer: `http://localhost:5173/login`
- Some requests have cookies (maybe direct `localhost:3000` requests?)
- Some requests don't have cookies (maybe proxied `localhost:5173/api` requests?)

**Potential Solution:**
- Set cookie domain to `.localhost` (not recommended)
- OR ensure all requests go through the same origin
- OR investigate Vite proxy cookie forwarding

---

### Hypothesis 2: Vite Proxy Not Forwarding Cookies
**Theory:** The Vite dev server proxy might not be correctly forwarding cookies between `localhost:5173` and `localhost:3000`.

**Evidence:**
- Backend shows some requests with `Cookie header: undefined`
- These are likely the proxied requests

**Potential Solution:**
- Add explicit cookie forwarding to Vite proxy config
- OR bypass proxy for auth endpoints
- OR investigate if Vite proxy requires additional configuration for cookies

---

### Hypothesis 3: CORS Preflight Issues
**Theory:** CORS preflight requests might be failing or not including credentials.

**Evidence:**
- Backend logs show `Origin: undefined` in some requests
- This could indicate CORS preflight or SSR requests

**Potential Solution:**
- Add explicit OPTIONS handler for `/api/auth/me`
- Verify CORS headers include `Access-Control-Allow-Credentials: true`

---

### Hypothesis 4: Browser Cookie Scope
**Theory:** Browser treats `localhost:3000` and `localhost:5173` as different sites and won't share cookies even without `sameSite`.

**Evidence:**
- Modern browsers have strict cookie partitioning
- Different ports = different origins

**Potential Solution:**
- Use same port for frontend and backend (backend serves frontend)
- OR use a reverse proxy (nginx) in development
- OR investigate browser cookie settings

---

## Diagnostic Information

### Environment
- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **Database:** PostgreSQL 15 in Docker (localhost:5432)
- **Node Version:** 22.18.0
- **OS:** Windows (WSL2)

### Session Configuration
```typescript
{
  cookie: {
    httpOnly: true,
    secure: false,  // Development
    sameSite: undefined,  // Omitted in dev
    maxAge: 604800000,  // 7 days
    path: '/',
    domain: undefined,  // Not set (defaults to request domain)
  }
}
```

### CORS Configuration
```typescript
{
  origin: 'http://localhost:5173',
  credentials: true,
}
```

---

## Next Steps for Investigation

### Immediate Actions

1. **Test Direct Backend Request (Bypass Proxy)**
   - After OAuth, open browser console
   - Run: `fetch('http://localhost:3000/api/auth/me', { credentials: 'include' }).then(r => r.json())`
   - Check if cookie is sent in direct request vs. proxied request

2. **Inspect Browser Cookies**
   - DevTools → Application → Cookies
   - Check which domain has the `connect.sid` cookie: `localhost` or `localhost:3000`
   - Check if there are multiple cookies on different domains

3. **Add Frontend Logging**
   - Log in `checkAuth()` before fetch: `console.log('Checking auth...')`
   - Log response status: `console.log('Auth response:', response.status)`
   - Log if authenticated: `console.log('Authenticated:', response.ok)`

4. **Test Vite Proxy Cookie Forwarding**
   - Add to `vite.config.ts`:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true,
       cookieDomainRewrite: 'localhost',  // Try rewriting cookie domain
       cookiePathRewrite: '/',
     },
   }
   ```

5. **Try Alternative: Backend Serves Frontend**
   - Configure Express to serve Vite build
   - Both frontend and backend on same origin (localhost:3000)
   - Eliminates cross-origin cookie issues entirely

---

## Alternative Solutions to Consider

### Solution A: Single-Port Setup
Run both frontend and backend on the same port (e.g., 3000):
- Backend serves frontend static files
- No CORS needed
- No cookie cross-origin issues
- **Cons:** Slower dev experience (no HMR)

### Solution B: nginx Reverse Proxy
Use nginx in development to proxy both:
- `localhost/` → Frontend (5173)
- `localhost/api` → Backend (3000)
- Browser only sees one origin
- **Cons:** Additional setup complexity

### Solution C: Use Backend Proxy Instead of Vite
Configure backend to proxy frontend requests:
- Run frontend on port 5173 (as now)
- Configure Express to proxy non-API requests to Vite
- Access app via `localhost:3000`
- **Cons:** More backend config

### Solution D: Development-Only Session Token
Alternative to cookies for development:
- Use session token in localStorage/header
- Only for development (still use cookies in production)
- **Cons:** Different auth flow in dev vs. prod

---

## Files Modified During Troubleshooting

```
packages/backend/src/
├── index.ts                  # Session cookie config updated
├── middleware/csrf.ts        # CSRF cookie config updated
└── routes/auth.ts            # OAuth redirect URL fixed, logging added

packages/frontend/src/
└── pages/AuthPage.tsx        # Error alert for failed OAuth added

Documentation:
├── SESSION_COOKIE_FIX_SUMMARY.md      # Technical deep dive (created)
├── test-auth-flow.md                  # Testing guide (created)
├── QUICK_FIX_REFERENCE.md             # Quick reference (created)
└── AUTH_TROUBLESHOOTING_LOG.md        # This file
```

---

## Relevant Documentation References

- **Vite Proxy Docs:** https://vite.dev/config/server-options.html#server-proxy
- **Express Session:** https://github.com/expressjs/session#cookie
- **Cookie Attributes:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
- **CORS with Credentials:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend OAuth | ✅ Working | Successfully authenticates with Google |
| Session Creation | ✅ Working | Sessions created with correct config |
| Cookie Setting | ✅ Working | Cookies set without `sameSite` in dev |
| Cookie Receipt | ✅ Working | Cookies sent correctly after Fix #4 |
| Frontend Auth Check | ✅ Working | `checkAuth()` completes before routing |
| User Dashboard Access | ✅ Working | User lands on Dashboard after OAuth |

---

## Test Commands

```bash
# Check active sessions in database
docker exec fitness_tracker_postgres psql -U fitness_tracker -d fitness_tracker_dev -c "SELECT * FROM session;"

# Clear all sessions (force clean state)
docker exec fitness_tracker_postgres psql -U fitness_tracker -d fitness_tracker_dev -c "DELETE FROM session;"

# Check backend logs
# (Already running in background shell e85e03)

# Test OAuth initiation
curl -I http://localhost:3000/api/auth/google

# Test CSRF token
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token

# Test auth check (after manual OAuth in browser)
curl -b cookies.txt http://localhost:3000/api/auth/me
```

---

## Session End Notes

**Issue Resolved:** 2025-12-07

The authentication flow is now working correctly. The fix required addressing both backend cookie configuration AND frontend race condition.

**Key Learnings:**
1. **Cookie `sameSite` in development:** When using different ports for frontend (5173) and backend (3000), omit `sameSite` in development to allow cross-origin cookies.
2. **React auth race conditions:** Always initialize `isLoading: true` in auth stores when using `ProtectedRoute` patterns. The auth check must complete BEFORE the router decides to redirect.
3. **Debug systematically:** The "intermittent" cookie behavior was a red herring - cookies were working, but the frontend was redirecting before checking them.

**Files Modified:**
- `packages/backend/src/index.ts` - Session cookie config (sameSite conditional)
- `packages/backend/src/middleware/csrf.ts` - CSRF cookie config (sameSite conditional)
- `packages/backend/src/routes/auth.ts` - OAuth redirect URL, debug logging
- `packages/frontend/src/stores/authStore.ts` - Initial state `isLoading: true`

---

**Last Updated:** 2025-12-07 19:20:00 EST
**Status:** ✅ RESOLVED
