#!/usr/bin/env bash
# GlamCart Git Workflow Script
# Usage: ./git-flow.sh
# Creates a branch, commits your changes, then merges into dev

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ${NC}  $1"; }
success() { echo -e "${GREEN}✓${NC}  $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
error()   { echo -e "${RED}✗${NC}  $1"; exit 1; }
section() { echo -e "\n${BOLD}$1${NC}"; echo "────────────────────────────────"; }

# ── Check git repo ─────────────────────────────────────────────────────────
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  error "Not inside a git repository."
fi

# ── Show naming guide ──────────────────────────────────────────────────────
section "📋 Branch Naming Guide"
echo -e "  ${YELLOW}feature/${NC}   → new functionality     e.g. ${CYAN}feature/admin_panel_implementation${NC}"
echo -e "  ${YELLOW}fix/${NC}       → bug fix               e.g. ${CYAN}fix/coupon_min_order_bug${NC}"
echo -e "  ${YELLOW}hotfix/${NC}    → urgent prod fix        e.g. ${CYAN}hotfix/login_redirect_loop${NC}"
echo -e "  ${YELLOW}refactor/${NC}  → code restructuring     e.g. ${CYAN}refactor/prisma_singleton${NC}"
echo -e "  ${YELLOW}docs/${NC}      → documentation only     e.g. ${CYAN}docs/setup_guide${NC}"
echo -e "  ${YELLOW}chore/${NC}     → config/build/deps      e.g. ${CYAN}chore/update_dependencies${NC}"
echo ""
warn "Use lowercase and underscores only. Always branch off from dev."

# ── Branch name input ──────────────────────────────────────────────────────
section "🌿 Create Branch"
read -rp "  Enter branch name (e.g. feature/admin_panel): " BRANCH_NAME

# Validate format
if [[ ! "$BRANCH_NAME" =~ ^(feature|fix|hotfix|refactor|docs|chore)\/[a-z0-9_]+$ ]]; then
  error "Invalid branch name. Use format: type/short_description (e.g. feature/admin_panel)"
fi

# ── Commit message ─────────────────────────────────────────────────────────
section "💬 Commit Message"
read -rp "  Enter commit message: " COMMIT_MSG

if [[ -z "$COMMIT_MSG" ]]; then
  error "Commit message cannot be empty."
fi

# ── Git user info ──────────────────────────────────────────────────────────
GIT_USER=$(git config user.name 2>/dev/null || echo "Unknown")
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
info "Committing as: ${BOLD}${GIT_USER}${NC} <${GIT_EMAIL}>"

# ── Confirm ────────────────────────────────────────────────────────────────
section "🔍 Summary"
echo -e "  Branch : ${CYAN}${BRANCH_NAME}${NC}"
echo -e "  Commit : ${CYAN}${COMMIT_MSG}${NC}"
echo -e "  Author : ${CYAN}${GIT_USER} <${GIT_EMAIL}>${NC}"
echo -e "  Merge  : ${CYAN}${BRANCH_NAME} → dev${NC}"
echo ""
read -rp "  Proceed? (y/N): " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { warn "Aborted."; exit 0; }

# ── Stash check ────────────────────────────────────────────────────────────
section "⚙️  Running Git Flow"

# Make sure we're on dev and it's up to date
CURRENT=$(git branch --show-current)
if [[ "$CURRENT" != "dev" ]]; then
  info "Switching to dev branch..."
  git checkout dev
fi

info "Pulling latest dev..."
git pull origin dev 2>/dev/null || warn "Could not pull from remote (working offline or no remote)."

# Create and switch to new branch
info "Creating branch: ${BRANCH_NAME}"
git checkout -b "$BRANCH_NAME"
success "Switched to ${BRANCH_NAME}"

# Stage all changes
info "Staging all changes..."
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
  warn "No changes to commit. Branch created but nothing staged."
  git checkout dev
  git branch -d "$BRANCH_NAME"
  exit 0
fi

# Show what's being committed
echo ""
git status --short
echo ""

# Commit
info "Committing..."
git commit -m "$COMMIT_MSG"
success "Committed: \"${COMMIT_MSG}\""

# ── Merge into dev ─────────────────────────────────────────────────────────
info "Switching back to dev..."
git checkout dev

info "Merging ${BRANCH_NAME} → dev..."
git merge --no-ff "$BRANCH_NAME" -m "Merge branch '${BRANCH_NAME}' into dev"
success "Merged into dev!"

# ── Push prompt ────────────────────────────────────────────────────────────
section "🚀 Push to Remote"
read -rp "  Push dev to remote origin? (y/N): " PUSH_CONFIRM
if [[ "$PUSH_CONFIRM" =~ ^[Yy]$ ]]; then
  git push origin dev
  success "Pushed dev to origin."
else
  warn "Skipped push. Run: git push origin dev"
fi

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✅ Done!${NC}"
echo -e "  Branch  ${CYAN}${BRANCH_NAME}${NC} → committed & merged into ${CYAN}dev${NC}"
echo -e "  Run ${CYAN}git log --oneline -5${NC} to verify."
echo ""
