# Security Specification for EPICURE Dabou Firebase Integration

## 1. Data Invariants
- An Appointment must belong to the logged-in user who created it (`userId == request.auth.uid`).
- A Subscription must belong to the logged-in user who created it (`userId == request.auth.uid`).
- User profile documents can only be read or written by the authenticated user with the matching `uid` (`request.auth.uid == userId`).
- All critical fields like dates, pricing, and phone numbers must be formatted correctly.

## 2. Dirty Dozen Payloads (Targeting Security Bypass)
1. **Identity Theft User Create**: Creating a user profile document with a different UID.
2. **Identity Theft Appointment Create**: Creating an appointment with a `userId` belonging to another user.
3. **Identity Theft Subscription Create**: Creating a subscription with a `userId` belonging to another user.
4. **Anonymity Appointment Write**: Creating an appointment without authentication.
5. **Anonymity Subscription Write**: Creating a subscription without authentication.
6. **Appointment Hijacking Read**: Querying or reading appointments of another user.
7. **Subscription Hijacking Read**: Querying or reading subscriptions of another user.
8. **User Profile Hijacking Read**: Reading the profile of another user.
9. **Invalid Appointment Status Injection**: Attempting to create an appointment directly in terminal state (e.g. `status: 'finished'`) without admin authorization.
10. **Shadow Key User Profile Write**: Adding arbitrary unknown shadow fields to user profiles.
11. **Negative Price Subscription Injection**: Creating a custom simulation with a negative monthly cost.
12. **Denial of Wallet ID Exploitation**: Creating documents with IDs exceeding 1000 characters to consume storage.
