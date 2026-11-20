// ============================================================
// LOGIN ACCOUNTS
//
// One line per person: "login id": { salt, hash, iterations }.
// Passwords are never stored - only a salted PBKDF2-SHA-256 hash.
//
// To add a person or change a password:
//   1. Open tools/make-login.html (on the site, or double-click
//      the file on your computer).
//   2. Type the login ID and password, click "Make login line".
//   3. Paste the line below (replace the old line for that ID),
//      then commit and push.
// To remove a person, delete their line.
// Login IDs are not case-sensitive and are stored in lower case.
// ============================================================

export const USERS = {
       "admin": { salt: "sy+qJIP7FUVoRdLPg9zFbg==", hash: "VYS9TpynKkK84cgMTyepdWz+vdDyqqrj4I3HFMdC0o4=", iterations: 210000 },
