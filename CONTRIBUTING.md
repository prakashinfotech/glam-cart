# Contributing to GlamCart

Thank you for helping improve GlamCart. This guide explains the expected development and pull-request workflow for all parts of the multi-platform application (Next.js Web, Node.js Backend, and Flutter Mobile).

## Before You Start

- Read the project setup instructions in [README.md](README.md).
- Search existing issues and pull requests before starting duplicate work.
- For security vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Development Setup

Clone your fork and install dependencies for the respective project layers:

```bash
git clone https://github.com/YOUR_USERNAME/glamcart_clone.git
cd glamcart_clone

# 1. Backend Setup
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed

# 2. Web Frontend Setup
cd ../frontend
npm install
cp .env.example .env.local

# 3. Mobile App Setup
cd ../glamcart_flutter
flutter pub get
```

Configure local environment values using `.env` and `.env.local`. **Never commit real credentials or payment secrets.**

## Contribution Workflow

1. Create a feature branch from the latest `dev` branch:

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/short-description
   ```

2. Make focused changes that match the existing architecture and style:
   - Backend: Keep routes modular in `backend/src/routes/` and database singleton via `src/db.js`.
   - Frontend: Use Tailwind CSS tokens, React Context, and keep components reusable.
   - Flutter: Follow Provider state management patterns and maintain `api_service.dart` interceptors.
3. Run the relevant quality checks.
4. Commit with a concise, imperative conventional commit message (`feat: ...`, `fix: ...`, `docs: ...`).
5. Push your branch and open a pull request against `dev`.

## Quality Checks

### Web Frontend Checks (`cd frontend`)

```bash
npm run lint
npm run build
npm audit
```

### Backend Checks (`cd backend`)

```bash
node --check src/index.js
npm audit
```

### Flutter Mobile Checks (`cd glamcart_flutter`)

```bash
flutter analyze
flutter test
```

## Security and Sensitive Data

Do not commit:

- API keys, JWT secrets, passwords, or database connection strings
- Razorpay live credentials (use test keys only for local development)
- `.env` or `.env.local` files containing real production configurations
- Private SSL certificates or SSH keys
- Personal customer data or real transaction logs

Use the tracked `.env.example` files only with safe placeholders. If a secret is committed accidentally, revoke and rotate it immediately before requesting repository history cleanup.

## Pull Request Checklist

- [ ] The change is focused, clean, and well-documented.
- [ ] Builds and lint checks for the modified components pass locally.
- [ ] No real secret, API key, credential, or private customer data is included.
- [ ] New configuration environment variables are documented with safe placeholders in `.env.example`.
- [ ] The pull request description clearly explains what changed and how it was verified.

By contributing, you agree that your contribution may be used under the repository's applicable license and company policies.
