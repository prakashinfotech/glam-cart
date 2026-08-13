# /project:review

Review the current Git branch changes for the GlamCart project.

## Steps

1. Run `git diff main...HEAD` to see all changes since branching from main
2. Run `git log main...HEAD --oneline` to see commits
3. Review each changed file for:
   - Code quality and consistency with existing patterns
   - Security issues (SQL injection, XSS, unprotected routes)
   - Missing authentication middleware on protected API routes
   - Proper error handling in Express routes
   - React component best practices (use client directive, hooks rules)
   - Prisma query efficiency (N+1 queries, missing includes)
4. Check frontend build passes: `cd frontend && npm run build`
5. Verify API health: `curl -s http://localhost:5001/api/health`

## Output Format

Provide a summary with:
- ✅ What looks good
- ⚠️ Issues to fix before merging
- 🔒 Any security concerns
