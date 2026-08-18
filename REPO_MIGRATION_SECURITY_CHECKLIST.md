# Repository Migration Security Checklist

Use this checklist before moving the project to a new GitHub repository.

## 1. Freeze the current state
- Stop making feature changes until the migration is complete.
- Make sure your local working tree is clean except for intentional edits.
- Confirm you know which branch will become the source of truth.

## 2. Identify sensitive data
- Scan the repository for environment files, API keys, secrets, private keys, certificates, service-account files, and credential JSON.
- Check both tracked files and ignored local files.
- Review build output and generated artifacts for embedded secrets.

## 3. Remove tracked secrets from git
- Untrack any secret-bearing file that is already in git history or the index.
- Keep only template files such as `.env.example` or `.env.*.template`.
- Ensure sensitive environment files like `.env.production` are not tracked.

## 4. Revoke or rotate exposed credentials
- Rotate any production API keys that were found in tracked files.
- Rotate OAuth client secrets, JWT secrets, service-account credentials, and any other exposed tokens.
- Assume any credential that was committed may be compromised.

## 5. Purge sensitive history if needed
- If a secret was ever committed, remove it from all reachable history before publishing the new repo.
- Delete backup refs and stale remote-tracking refs that still point to the old commits.
- Verify the secret-bearing file no longer appears in `git rev-list --all`.

## 6. Tighten ignore rules
- Keep `.env*` ignored except for explicit templates.
- Ignore keys, certificates, private files, and Terraform state.
- Confirm local-only files such as `.env.local` stay untracked.

## 7. Verify the cleaned state
- Run a final secret scan on the working tree.
- Confirm no tracked files contain live credentials.
- Confirm ignored local files are not staged for commit.
- Confirm build output and generated assets are not being committed.

## 8. Validate the application still works
- Run the production build.
- Test the app using the rotated or replacement credentials.
- Verify auth, API calls, and any secret-backed services still function.

## 9. Prepare the new GitHub repository
- Create the new repository.
- Set the new remote.
- Push only the cleaned history.
- Enable GitHub secret scanning and secret protection features.

## 10. Post-migration checks
- Reconfirm no secrets are reachable from the new repo history.
- Test deployment from the new repository.
- Monitor logs for failed auth or invalid-secret errors after rotation.

## Current repo-specific items to complete
- [x] Remove tracked production env file from git index.
- [x] Update `.gitignore` so `.env.production` stays ignored.
- [x] Purge `.env.production` from local reachable history.
- [x] Keep `.env.local`, `.env.development`, and `cloud-run-api/.env.*` as ignored local files.
- [ ] Rotate the production API key that was previously stored in `.env.production`.
- [ ] Confirm any other committed secrets or tokens are rotated if they were ever added.
- [ ] Run a final secret scan before pushing to the new repository.
