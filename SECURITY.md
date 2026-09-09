# Security Policy

## Supported Versions

Security fixes are applied to the latest code on the active development branch (`dev`) and the release branch (`main` / `master`). Older commits, tags, and external forks are not actively supported.

## Reporting a Vulnerability

Please do not report suspected vulnerabilities through a public GitHub issue, discussion, or pull request.

Use one of these private channels:

1. Submit a [private GitHub security advisory](https://github.com/prakashinfotech/glam-cart/security/advisories/new), if private vulnerability reporting is enabled.
2. Otherwise, email [info@prakashinfotech.com](mailto:info@prakashinfotech.com) with the subject **GlamCart Security Report**.

Include as much of the following information as possible:

- Affected component, endpoint, or file (e.g., Auth middleware, Cart API, Razorpay verification)
- Steps required to reproduce the issue
- Expected and observed behavior
- Potential security impact
- Proof-of-concept details with sensitive values redacted
- Suggested mitigation or fix

The maintainers will review the report, validate its impact, and coordinate remediation and disclosure when appropriate.

## Handling Secrets & Payment Keys

Never include real API keys, JWT secrets, passwords, tokens, certificates, or database credentials in an issue or pull request. 

For payment gateway integration:
- Always use **Razorpay Test Mode credentials** for local development and testing.
- Never commit live merchant secrets (`RAZORPAY_KEY_SECRET`).
- If a credential may have been exposed, revoke or rotate it immediately in your Razorpay/Database dashboard; simply deleting it from the latest commit is not sufficient.

## Deployment Responsibility

This repository is provided as a project showcase and full-stack development codebase. Teams deploying it to production are responsible for configuring production secrets, HTTPS certificates, CORS origin whitelists, database access controls, rate limiting, monitoring, automated backups, and platform-specific security settings.
