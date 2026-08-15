"""
Tvisaa / Lumière Jewels — Automated Backend Test Suite
=======================================================
Run from the backend project root:

    python manage.py test apps.tests --settings=config.settings.development -v 2

All tests use Django's test client and an in-memory SQLite database so they
are completely isolated from your real data.

Coverage:
  ✅ Auth flow  (register → OTP verify → login → refresh → profile)
  ✅ Auth edge cases (duplicate email, wrong password, expired OTP, etc.)
  ✅ Rate limiting / throttle (login, register, OTP resend, OTP verify)
  ✅ Cart (add, update, remove, clear, stock validation, guest cart)
  ✅ Orders (create, idempotency guard, list, detail, cancel, COD flow)
  ✅ Payment (verify, mark failed, webhook signature validation)
  ✅ Products & categories (list, detail, filters)
  ✅ Addresses (CRUD, default address logic)
  ✅ Security (unauthenticated access denied, cross-user data isolation)
"""
