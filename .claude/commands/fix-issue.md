# /project:fix-issue

Fix a bug or issue in the GlamCart project.

## Usage
/project:fix-issue <description of the issue>

## Steps

1. Understand the issue from the description
2. Identify whether it's frontend (Next.js) or backend (Express/Prisma)
3. Locate the relevant file(s):
   - Backend routes: `backend/src/routes/`
   - Frontend pages: `frontend/src/app/`
   - Components: `frontend/src/components/`
   - Context: `frontend/src/context/`
   - API client: `frontend/src/lib/api.js`
4. Reproduce the issue by reading the code carefully
5. Apply the minimal fix — do not refactor surrounding code
6. Verify the fix:
   - For backend: test with curl against `http://localhost:5001/api/`
   - For frontend: run `npm run build` in the frontend directory
7. Commit with a descriptive message prefixed with `fix:`

## Rules
- Never change unrelated code
- Always check if the fix affects other routes or components
- If the fix touches auth middleware, verify protected routes still work
