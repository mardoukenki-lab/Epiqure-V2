# Security Specification for EPICURE Dabou Firebase Integration

## 1. Data Invariants & Access Control Policy
- **Immutability of Ownership**: An Appointment or Subscription must belong strictly to the authenticated user who created it (`request.resource.data.userId == request.auth.uid`). Once created, ownership (`userId`) cannot be reassigned by a non-admin.
- **RBAC Role Protection**: User roles (`role: 'admin' | 'agent' | 'client'`) cannot be modified directly by client users. Only super-administrators or trusted server functions can elevate roles.
- **Server-Side Financial Integrity**: Online payments through Paystack must be validated by the server endpoint (`POST /api/payments/verify`) using the `PAYSTACK_SECRET_KEY` before marking any transaction as `paid`.
- **Schema & Size Restrictions**: All document IDs are bounded (`isValidId`: <= 128 characters, alphanumeric/dashes). Payload string sizes (names <= 150 chars, phones <= 50 chars) and pricing (`monthlyCost >= 0`) are validated.
- **Global Default-Deny**: Any unmatched document path is denied by default (`match /{document=**} { allow read, write: if false; }`).

## 2. The "Dirty Dozen" Threat Matrix & Mitigations

| # | Threat Scenario | Attack Vector | Security Rule / Backend Mitigation | Status |
|---|---|---|---|---|
| 1 | **Identity Theft User Create** | Creating a user profile document for a different `uid` | `match /users/{userId}` mandates `isOwner(userId)` (`request.auth.uid == userId`) | ✅ Mitigated |
| 2 | **Identity Theft Appointment Create** | Creating an appointment with another user's `userId` | `match /appointments` enforces `request.resource.data.userId == request.auth.uid` | ✅ Mitigated |
| 3 | **Identity Theft Subscription Create** | Creating a subscription with another user's `userId` | `match /subscriptions` enforces `request.resource.data.userId == request.auth.uid` | ✅ Mitigated |
| 4 | **Anonymity Appointment Write** | Creating an appointment without authentication | Enforces `isAuthenticated()` and `request.auth.uid` | ✅ Mitigated |
| 5 | **Anonymity Subscription Write** | Creating a subscription without authentication | Enforces `isAuthenticated()` and `request.auth.uid` | ✅ Mitigated |
| 6 | **Appointment Hijacking Read** | Reading another client's appointments | Enforces `resource.data.userId == request.auth.uid \|\| isAgentOrAdmin()` | ✅ Mitigated |
| 7 | **Subscription Hijacking Read** | Reading another client's subscriptions | Enforces `resource.data.userId == request.auth.uid \|\| isAgentOrAdmin()` | ✅ Mitigated |
| 8 | **User Profile Hijacking Read** | Reading other client profiles | Enforces `isOwner(userId) \|\| isAgentOrAdmin()` | ✅ Mitigated |
| 9 | **Invalid Status Injection** | Creating an appointment directly with invalid status | `request.resource.data.status in ['pending', 'confirmed', 'completed', 'cancelled']` | ✅ Mitigated |
| 10 | **Self-Privilege Escalation** | Client user setting `role: 'admin'` on `users/{userId}` | `!('role' in request.resource.data.diff(resource.data).affectedKeys()) \|\| isAdmin()` | ✅ Mitigated |
| 11 | **Negative Price Injection** | Creating a subscription with `monthlyCost < 0` | `request.resource.data.monthlyCost >= 0` enforced | ✅ Mitigated |
| 12 | **Denial of Wallet ID Exploitation** | Injecting 1KB+ junk strings as document IDs | `isValidId(id)` enforces `id.size() <= 128` and regex matching | ✅ Mitigated |
| 13 | **Paystack Fake Paid Status** | Client forging `paymentStatus: 'paid'` without payment | Server endpoint `POST /api/payments/verify` verifies with Paystack Secret Key | ✅ Mitigated |

