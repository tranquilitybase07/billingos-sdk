API Design

  Endpoint: POST /v1/session-tokens

  Request (from merchant's backend):
  {
    "external_user_id": "user_abc123",      // Merchant's user ID
    "external_organization_id"?: "org_xyz", // Optional (for B2B)
    "allowed_operations"?: [                // Optional scope
      "read_subscription",
      "update_payment_method",
      "cancel_subscription"
    ],
    "expires_in"?: 3600,                    // Seconds (default 1 hour, max 24 hours)
    "metadata"?: {                          // Optional merchant data
      "ip_address": "203.0.113.45",
      "user_agent": "Mozilla/5.0..."
    }
  }

  Response:
  {
    "session_token": "bos_session_1234567890abcdef",
    "expires_at": "2026-01-24T12:00:00Z",
    "allowed_operations": ["read_subscription", "update_payment_method"]
  }

  Token Format: bos_session_{base64_encoded_payload}.{signature}

  ---
  React SDK Usage

  // Step 1: Merchant's backend endpoint
  // GET /api/billingos-session
  app.get('/api/billingos-session', authenticateUser, async (req, res) => {
    const token = await createBillingOSSession(req.user.id);
    res.json({ sessionToken: token });
  });

  // Step 2: React app
  import { BillingOSProvider, useBilling } from '@billingos/react';

  function App() {
    const [sessionToken, setSessionToken] = useState(null);

    useEffect(() => {
      // Fetch session token from merchant's backend
      fetch('/api/billingos-session')
        .then(r => r.json())
        .then(data => setSessionToken(data.sessionToken));
    }, []);

    if (!sessionToken) return <div>Loading...</div>;

    return (
      <BillingOSProvider sessionToken={sessionToken}>
        <Dashboard />
      </BillingOSProvider>
    );
  }

  function Dashboard() {
    const { subscription, upgradeplan } = useBilling();

    return (
      <div>
        <h1>Current Plan: {subscription?.plan_name}</h1>
        <button onClick={() => upgradePlan('pro')}>Upgrade to Pro</button>
      </div>
    );
  }

  ---
  Security Improvements Over Your Proposal

  | Your Proposal                     | Recommended Approach                          |
  |-----------------------------------|-----------------------------------------------|
  | publicKey in frontend (exposed)   | publicKey + secret key (secret never exposed) |
  | userId sent directly              | external_user_id validated by backend first   |
  | No request verification           | Cryptographically signed tokens               |
  | No operation scoping              | Optional scope (read-only vs write)           |
  | No IP binding                     | Optional IP/user-agent binding                |
  | Token valid until expiry          | Can revoke tokens server-side                 |
  | Anyone with publicKey can request | Only merchant's backend can request           |

  ---
  Additional Security Layers

  1. Rate Limiting:
  // BillingOS API
  // Max 10 session token requests per minute per merchant
  // Max 100 API calls per session token
  2. Token Revocation:
  DELETE /v1/session-tokens/{token_id}
  Authorization: Bearer sk_live_secret_key_xyz
  3. Audit Logs:
  GET /v1/audit-logs?external_user_id=user_123
  // Returns: all actions taken with session tokens for this user
  4. CORS Restrictions:
  // Merchant configures allowed domains in BillingOS dashboard
  // BillingOS API only accepts requests from whitelisted origins
  5. Webhook Alerts:
  // Notify merchant of suspicious activity:
  // - Session token used from new country
  // - Unusually high number of API calls
  // - Failed authentication attempts

  ---
  Final Recommendation

  Use Option A (Backend-Issued Session Tokens) because:

  1. ✅ Works with ANY backend (Python, Go, Ruby, PHP, Node - just needs HTTP client)
  2. ✅ Simple merchant integration (1 backend endpoint, dead simple React provider)
  3. ✅ Secure (secret key never exposed, tokens are signed and scoped)
  4. ✅ Flexible (can add IP binding, operation scopes, revocation)
  5. ✅ Industry standard (Stripe, Plaid, Auth0 all use this pattern)

  Implementation priority:
  1. Build session token API (POST /v1/session-tokens)
  2. Build @billingos/react provider (takes sessionToken prop)
  3. Build backend SDK helpers for all languages:
    - @billingos/node (npm)
    - billingos-python (pip)
    - billingos-go (go get)
    - billingos-ruby (gem)
    - billingos-php (composer)

  Each SDK provides one helper function:
  token = billingos.create_session_token(
      external_user_id="user_123",
      expires_in=3600
  )

  This way merchants only need to add 1 backend endpoint (5-10 lines of code) and they're done