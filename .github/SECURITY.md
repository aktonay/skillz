# Security Policy

## Supported Versions

Only the latest release on the `main` branch is actively supported with security updates.

| Branch | Supported          |
| ------ | ------------------ |
| `main` | :white_check_mark: |

## Reporting a Vulnerability

We take the security of `skillz` and all agent skills seriously. If you believe you have discovered a vulnerability, security flaw, or malicious package injection:

1. **Do not create a public GitHub issue.**
2. Report the vulnerability privately via **[GitHub Private Vulnerability Reporting](https://github.com/aktonay/skillz/security/advisories/new)**.
3. You can also contact the maintainers directly with full reproduction details.

Please include:
- A description of the issue and potential impact
- Detailed steps to reproduce or proof-of-concept
- Proposed remediation if available

## Automated Protections

This repository enforces:
- **Dependabot Security & Malware Alerts**: Scans dependencies daily against the GitHub Advisory Database and OpenSSF Malicious Packages repository.
- **Secret Scanning & Push Protection**: Automatically rejects any commit containing secrets, tokens, or private keys before they enter the repository.
- **CodeQL Semantic Static Analysis**: Continuous security scanning on PRs and pushes to identify vulnerabilities.
- **Dependency Review**: Blocks merging any PR that introduces malicious, revoked, or high-risk dependencies.
- **Integrity Verification**: Automatic verification of all skill manifests and scripts.
