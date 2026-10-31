# Auth module (owner: P1)

Handles signup, login, forgot/reset password, roles, and the access/deny lists
that every other module uses to protect its endpoints.

## Files in this folder

| File | What it does |
|---|---|
| `__init__.py` | Public exports other modules import from |
| `config.py` | Settings read from environment variables |
| `constants.py` | Password rules, pagination limits, error codes |
| `exceptions.py` | `AuthError` plus handlers that give one JSON error shape |
| `models.py` | Tables: `customers`, `users`, `password_reset_tokens` |
| `password.py` | Password rule check and hashing (PBKDF2) |
| `tokens.py` | Login JWT and one-time reset tokens |
| `permissions.py` | **Access list, deny list**, `is_allowed`, `permissions_for` |
| `dependencies.py` | `get_current_principal`, `require_permission`, customer scoping |
| `service.py` | Business logic: signup, login, add staff, reset password |
| `router.py` | The HTTP endpoints |
| `mailer.py` | Sends the reset email (mock mode prints the link) |
| `seed.py` | Creates the first admin account |

## Rules from the challenge document, and where they live

| Rule | Where it is enforced |
|---|---|
| One account per email | `users.email` UNIQUE index, plus a friendly 409 in `service.py` |
| Password more than 8 characters, with uppercase, lowercase and special character | `password.validate_password_strength` |
| Reset link sent to the registered email | `service.request_password_reset` and `mailer.py` |
| Three roles: admin, staff, customer | `app/enums.py` (`Role`) |
| Only the admin can add staff | `Permission.STAFF_MANAGE` is admin-only, checked in the router and again in `service.create_staff` |
| Customers see only their own data | `customer_id` comes from the user's DB row, via `apply_customer_scope` |

## Access list and deny list

Decision order in `permissions.is_allowed(role, permission)`:

1. On the role's **deny list** -> refused, always.
2. On the role's **access list** -> allowed.
3. Not on either -> refused (default deny).

The app refuses to start if one permission is on both lists for the same role.

| Permission group | ADMIN | STAFF | CUSTOMER |
|---|---|---|---|
| Staff, products, plans, taxes, discounts, templates (manage) | Allow | **Deny** | **Deny** |
| View products and plans | Allow | Allow | Allow |
| Customers, subscriptions, invoices, payments, billing, dashboard (all records) | Allow | Allow | **Deny** |
| Own subscriptions and invoices (view, print, close own subscription) | Allow | not needed | Allow |

## Endpoints (`/api/v1/auth`)

| Method and path | Who | Purpose |
|---|---|---|
| `POST /signup` | Public | Create a customer account |
| `POST /login` | Public | Email + password, returns a Bearer token |
| `GET /me` | Logged in | Current user plus their permission list |
| `POST /forgot-password` | Public | Email a reset link (same answer for unknown emails) |
| `POST /reset-password` | Public | Set a new password with the emailed token |
| `POST /staff` | Admin | Add a staff member |
| `GET /staff` | Admin | List staff, paginated |

Responses: `{"data": ...}` on success, `{"error": {"code", "message"}}` on failure.
Error codes are listed in `constants.py` and are part of the API contract.

## How other modules use it

```python
from sqlalchemy import select
from app.auth import Permission, require_permission, get_current_principal, apply_customer_scope

# Admin-only endpoint
@router.post("/plans")
def create_plan(principal = Depends(require_permission(Permission.PLAN_MANAGE)), db = Depends(get_db)):
    ...

# Endpoint both staff and customers call: customers are filtered automatically
@router.get("/invoices")
def list_invoices(principal = Depends(get_current_principal), db = Depends(get_db)):
    stmt = apply_customer_scope(select(Invoice), Invoice.customer_id, principal)
    ...

# Loading one record by id: customers asking for someone else's get 404
invoice = db.get(Invoice, invoice_id)
assert_can_access_customer(principal, invoice.customer_id)
```

To add a new permission: add it to `Permission`, then to the right access list
(and the deny list of roles that must never have it). Until then it is closed to everyone but the admin.

## Run it

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env            # then export the variables, or use your own loader
uvicorn app.main:app --reload   # docs at http://localhost:8000/docs
pytest -v                       # 36 tests
```

## Decisions and additions

- **Password reset email is mocked** by default: the link prints in the server console.
  With `EXPOSE_RESET_LINK=true` it is also returned in the API response (dev only).
  Set `SMTP_HOST` to send real emails.
- **Single access token** (60 minutes), no refresh token, to keep it simple for the deadline.
- **Password max length 128** is not in the document; it only guards against abuse.
- **Password change logs out all sessions** (`users.token_version`).
- **The first admin is seeded** (`seed.py`); the API can never create an admin.
- **Overdue** is not an auth concern; it stays a computed value in billing.
