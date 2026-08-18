# GlamCart — Git Branch Naming & Workflow

## Branch Naming Convention

```
<type>/<short_description>
```

| Type | Use When |
|------|----------|
| `feature/` | New feature or functionality |
| `fix/` | Bug fix |
| `hotfix/` | Urgent production fix |
| `refactor/` | Code restructuring (no new feature) |
| `docs/` | Documentation only |
| `chore/` | Config, build, dependencies |

### Examples
```
feature/admin_panel_implementation
feature/order_tracking
fix/coupon_min_order_bug
fix/cart_stock_validation
hotfix/login_redirect_loop
refactor/prisma_singleton
docs/setup_guide
chore/update_dependencies
```

### Rules
- Use lowercase only
- Use underscores `_` between words (not hyphens or spaces)
- Keep it short but descriptive
- Always branch off from `dev`, never from `main`

---

## Workflow

```
dev  →  feature/your_branch  →  (commit)  →  merge back to dev  →  main (release)
```

Use the script below to automate this entire flow.

---

## Quick Script

```bash
./git-flow.sh
```

Located at: `glamcart_clone/git-flow.sh`
