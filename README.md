# ZL FMS

ZL Fund Monitoring System: a copy of the VGrat FMS dashboard that asks for a login ID and password,
with the Calculator page (PRUShield Premium, PruCredit$) removed.

## How it works
- **Data**: read live from the VGrat FMS site (`/vgrat-fmms/...` on
  xthera.github.io), so this copy has no data workflows of its own and is
  always as up to date as VGrat FMS. It must stay on `xthera.github.io`.
- **Login**: `js/auth.js` shows the login screen and only starts the
  dashboard after a correct ID and password. A sign-in lasts 12 hours on
  that device; "Log out" is in the footer.
- **Accounts**: `js/auth-users.js` — one line per person, holding a
  salted PBKDF2-SHA-256 hash, never the password itself.

## Add a person or change a password
1. Open `tools/make-login.html` (on the site: `.../tools/make-login.html`).
2. Enter the login ID and password, click **Make login line**, copy it.
3. In `js/auth-users.js`, paste it as a new line inside `USERS = { … }`,
   or replace that ID's existing line. Delete a line to remove a person.
4. Commit and push.

## Limits
This is a login screen on a public website. It keeps casual visitors out
of the dashboard, but the fund data itself is public on the VGrat FMS site
and repo, and this repo's files (including the password hashes) are public
on GitHub. Use passwords of 10+ characters that aren't used anywhere else.
