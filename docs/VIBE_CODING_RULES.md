# Vibe Coding Rules

## 1. Follow the Project Documents
- Always follow `PRD.md`, `ARCHITECTURE.md`, and `DATABASE.md`.
- Do not introduce features that are outside the approved MVP.
- If a major assumption is required, ask before implementing it.

## 2. No Fake Functionality
- Never create fake payments, fake bids, fake deals, fake delivery updates, or fake market prices.
- Every important action shown as successful must actually be processed by the system.
- Do not use mock data in production functionality.

## 3. AI Safety and Reliability
- AI price recommendation is advisory only.
- Never invent market prices or market data.
- Use verified external market data where available.
- Clearly label AI-generated recommendations.
- AI must never make binding commercial decisions.
- If AI or market data is unavailable, the rest of the application must continue working.

## 4. Security
- Never expose API keys, passwords, database credentials, payment secrets, or other sensitive values.
- Never commit `.env` files.
- Keep secrets on the server side.
- Validate all user input on the server.
- Enforce authentication and authorization on protected operations.

## 5. Database Safety
- Follow the approved database design in `DATABASE.md`.
- Do not modify important data without proper validation.
- Use database transactions for critical operations.
- Prevent duplicate or conflicting deals.
- Preserve data integrity.

## 6. Payments
- Never store card details, UPI credentials, or other payment credentials.
- Payment status must be confirmed by the payment provider.
- Verify payment webhooks on the backend.
- Do not mark a payment as successful based only on frontend information.
- Handle pending and failed payments safely.

## 7. Authorization
- Farmers can manage only their own listings.
- Buyers can manage only their own offers.
- Users must not access another user's private information or actions.
- Administrative operations must require appropriate authorization.

## 8. External Services
- External service failures must not break the entire application.
- Payment, AI, market-data, storage, and future logistics integrations must be isolated.
- Always handle timeout, failure, unavailable-service, and invalid-response cases.

## 9. Preserve Existing Functionality
- Before changing code, inspect the existing implementation.
- Do not unnecessarily rewrite working features.
- New changes must not break previously working functionality.

## 10. Testing
- Test every major feature after implementation.
- Test both successful and failed scenarios.
- Test authorization and validation.
- Test payment and webhook failure cases.
- Test important database operations.

## 11. Code Quality
- Keep the code modular and maintainable.
- Use clear naming.
- Avoid unnecessary complexity.
- Do not duplicate large sections of code.
- Keep frontend, backend, database, AI, payment, and logistics responsibilities separated.

## 12. GitHub and Commits
- GitHub is the source of truth for the project.
- Make focused commits.
- Use clear commit messages.
- Never commit secrets or unnecessary generated files.

## 13. Before Implementing Any Feature
1. Read the relevant project documentation.
2. Inspect the existing code.
3. Identify frontend, backend, database, and API changes required.
4. Implement the smallest reliable solution.
5. Test the feature.
6. Check that existing functionality still works.
7. Update documentation if required.

## 14. MVP Boundaries
Do not add these features to the MVP unless explicitly approved:
- AI crop-quality detection
- AI disease diagnosis
- Automatic crop grading
- Government-scheme recommendations
- Wallet or lending
- Credit scoring
- Live GPS vehicle tracking
- Advanced route optimization
- Fleet management
- Automatic transporter allocation
- Complex dispute-resolution system
- Public exact-address display
- Binding AI negotiation

## Core Principle

> Build less, but make every core action real.

The MVP should never simulate a payment, bid, deal, delivery event, market price, or verification just to make the interface look complete.
