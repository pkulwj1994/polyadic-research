#!/usr/bin/env bash
# First-time publication to a NEW repository; subsequent updates use git push.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
for site_command in gh git node npm; do
  command -v "$site_command" >/dev/null 2>&1 || { echo "Required command missing: $site_command"; exit 1; }
done
gh auth status >/dev/null 2>&1 || { echo 'Sign in first: gh auth login'; exit 1; }
[[ ! -e .git ]] || { echo 'Git metadata already exists. Use git push for updates; this script creates new repositories only.'; exit 1; }
site_login=$(gh api user --jq .login)
site_user_id=$(gh api user --jq .id)
site_owner=${1:-$site_login}
site_repo=${2:-polyadic-research-group}
[[ $site_owner =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]] || { echo 'Invalid owner name.'; exit 1; }
[[ $site_repo =~ ^[A-Za-z0-9_.-]+$ && $site_repo != . && $site_repo != .. ]] || { echo 'Invalid repository name.'; exit 1; }
site_full_name="$site_owner/$site_repo"
if gh repo view "$site_full_name" >/dev/null 2>&1; then
  echo "Repository already exists: $site_full_name. No changes made."
  exit 1
fi
npm run check
npm test
npm run build
git init -b main
git add -- content src scripts assets docs examples tests .github .gitignore .nvmrc .nojekyll package.json package-lock.json README.md deploy-github.sh
git -c user.name="$site_login" -c user.email="${site_user_id}+${site_login}@users.noreply.github.com" commit -m 'Create content-driven Polyadic Research Group website'
gh repo create "$site_full_name" --public --description 'Polyadic Research Group: open research in continuous and parallel intelligence' --source=. --remote=origin --push
if ! gh api --method POST "repos/$site_full_name/pages" --input - --jq .html_url <<'JSON'
{"build_type":"workflow"}
JSON
then
  echo 'Source was pushed. Enable GitHub Actions in Settings → Pages, then run the Pages workflow from the Actions tab.'
  exit 1
fi
if ! gh workflow run pages.yml --repo "$site_full_name" --ref main; then
  echo 'Pages is configured. Open Actions and manually run Build and deploy Polyadic website if the initial run has not succeeded.'
fi
echo "Source is in $site_full_name. Check Actions for the actual deployment result and URL."
