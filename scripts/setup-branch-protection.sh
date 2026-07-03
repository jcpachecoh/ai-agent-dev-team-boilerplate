#!/usr/bin/env bash
# =============================================================================
# Branch Protection Setup
# =============================================================================
# Configures GitHub branch protection rules for `main` and `develop` using
# the GitHub CLI (gh). Run this ONCE after setting up the repository.
#
# Prerequisites:
#   gh auth login   (must be a repo admin)
#
# Usage:
#   chmod +x scripts/setup-branch-protection.sh
#   ./scripts/setup-branch-protection.sh
# =============================================================================

set -euo pipefail

REPO="${GITHUB_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "🔐 Configuring branch protection for: $REPO"

# ── Required status checks (must match job names in quality-gates.yml) ────────
REQUIRED_CHECKS=(
  "TypeScript (strict)"
  "ESLint (zero warnings)"
  "Prettier (format check)"
  "Stylelint (SCSS rules)"
  "NestJS Facade Pattern"
  "Unit Tests — API (≥80% coverage)"
  "Unit Tests — Web (≥80% coverage)"
  "Integration Tests — API"
  "Build all apps"
  "✅ All Quality Gates Passed"
)

# Build the JSON array of required checks
CHECKS_JSON=$(printf '%s\n' "${REQUIRED_CHECKS[@]}" | jq -R . | jq -cs '{
  contexts: .,
  strict: true
}')

protect_branch() {
  local BRANCH=$1
  echo ""
  echo "🌿 Protecting branch: $BRANCH"

  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/$REPO/branches/$BRANCH/protection" \
    --input - <<EOF
{
  "required_status_checks": $CHECKS_JSON,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "required_linear_history": false
}
EOF

  echo "  ✅ $BRANCH protected"
}

# Create develop branch if it doesn't exist
if ! gh api "/repos/$REPO/branches/develop" --silent 2>/dev/null; then
  echo ""
  echo "📌 Creating develop branch from main..."
  DEFAULT_BRANCH=$(gh api "/repos/$REPO" -q '.default_branch')
  MAIN_SHA=$(gh api "/repos/$REPO/git/refs/heads/$DEFAULT_BRANCH" -q '.object.sha')
  gh api --method POST "/repos/$REPO/git/refs" \
    -f "ref=refs/heads/develop" \
    -f "sha=$MAIN_SHA"
  echo "  ✅ develop branch created"
fi

# Protect both branches
protect_branch "main"
protect_branch "develop"

# ── Enable Copilot code review (if available for the org) ────────────────────
echo ""
echo "🤖 Enabling GitHub Copilot code review..."
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/copilot-code-review-settings" \
  -f "enabled=true" \
  2>/dev/null && echo "  ✅ Copilot code review enabled" \
  || echo "  ⚠  Copilot code review API not available — enable manually in Settings → Code Review → Copilot"

echo ""
echo "🎉 Branch protection configured!"
echo ""
echo "Summary:"
echo "  ✅ main   — protected, requires: all quality gates + 1 CODEOWNER review + resolved conversations"
echo "  ✅ develop — protected, requires: all quality gates + 1 CODEOWNER review + resolved conversations"
echo ""
echo "To verify:"
echo "  gh api /repos/$REPO/branches/main/protection | jq '.required_status_checks.contexts'"
