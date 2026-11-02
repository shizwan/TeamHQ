# Security policy

TeamHQ is currently a development-stage application without a published vulnerability-response SLA.

Please do **not** disclose exploitable vulnerabilities, credentials, or potentially confidential project/employee data in public GitHub issues. Use GitHub's private vulnerability reporting feature if enabled, or contact the repository maintainer privately through GitHub.

## Operational checklist

- Set a unique `AUTH_SECRET` (at least 32 random characters) in production.
- Rotate `AUTH_SECRET` immediately if a known fallback signing key was ever used in a deployed environment.
- Ensure `ADMIN_PASSWORD` is explicitly set to a strong password for any supported bootstrap operation.
- Never run demo seeding or a database schema push against production data. Backup and test migrations before applying them.
- Review repository history for credentials and confidential team/customer information before publicly distributing the project.
- Review permissions and third-party licenses before adding a project-level open-source license.
