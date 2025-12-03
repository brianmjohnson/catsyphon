# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in CatSyphon, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email: **security@kulesh.dev**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity (see below)

### Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| Critical | 24-48 hours | Remote code execution, SQL injection |
| High | 1 week | Authentication bypass, data exposure |
| Medium | 2 weeks | XSS, CSRF, privilege escalation |
| Low | 1 month | Information disclosure, minor issues |

## Security Considerations

CatSyphon processes AI coding assistant conversation logs, which may contain sensitive information.

### Data Privacy

**Conversation logs may contain:**
- Source code snippets
- File paths and project structure
- Error messages and stack traces
- API keys or credentials (if accidentally logged)
- Internal project details

**Recommendations:**
- Run CatSyphon on a private network
- Restrict database access
- Review logs before ingesting if concerned about sensitive content
- Use the `--dry-run` flag to preview what would be ingested

### OpenAI API Usage

When AI tagging is enabled:
- Conversation metadata is sent to OpenAI for analysis
- Full source code is **NOT** sent (only summaries and message excerpts)
- Consider your organization's data policies before enabling

**To disable AI tagging:**
```bash
# Ingest without AI enrichment
uv run catsyphon ingest /path/to/logs --project "Project"
# (omit --enable-tagging flag)
```

### Database Security

**Default credentials are for development only:**
```
POSTGRES_USER=catsyphon
POSTGRES_PASSWORD=catsyphon_dev_password
```

**For production:**
- Use strong, unique passwords
- Enable SSL/TLS connections
- Restrict network access
- Regular backups with encryption

### API Security

The REST API currently does not include authentication.

**Recommendations:**
- Run behind a reverse proxy (nginx, Traefik)
- Add authentication at the proxy level
- Restrict to localhost or private networks
- Authentication is planned for v1.0

### File System Security

**Watch daemon considerations:**
- Only monitors directories you configure
- Processes files as the running user
- Does not follow symlinks by default

**Recommendations:**
- Use dedicated user with minimal permissions
- Restrict watched directories to log locations only
- Monitor daemon logs for unexpected activity

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x.x | Yes (current) |

Security updates will be released as patch versions.

## Security Best Practices

### For Deployment

1. **Network isolation**: Run in a private network or VPN
2. **Access control**: Limit who can access the web UI and API
3. **Audit logging**: Monitor access to sensitive data
4. **Regular updates**: Keep dependencies updated

### For Development

1. **Never commit secrets**: Use `.env` files (gitignored)
2. **Review dependencies**: Check for known vulnerabilities
3. **Code review**: Security-focused review for PRs
4. **Testing**: Include security tests in CI

### Dependency Security

We recommend running periodic security audits:

```bash
# Python dependencies
cd backend
uv run pip-audit

# JavaScript dependencies
cd frontend
pnpm audit
```

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report valid vulnerabilities (with permission).

## Contact

- **Security Issues**: security@kulesh.dev
- **General Questions**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
