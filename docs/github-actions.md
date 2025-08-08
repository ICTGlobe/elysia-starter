# GitHub Actions Setup

This project includes comprehensive GitHub Actions workflows for continuous integration and code quality checks.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `develop`, or `master` branches
- Pull requests to `main`, `develop`, or `master` branches

**What it does:**
- Sets up Bun runtime environment
- Caches dependencies for faster builds
- Installs project dependencies
- Sets up environment variables for testing
- Runs database migrations
- Executes all tests (284 total tests)
- Runs unit tests separately (175 tests)
- Runs feature tests separately (109 tests)
- Performs TypeScript type checking
- Runs security audit
- Provides test summary with statistics

**Test Statistics:**
- **Total tests**: 284
- **Pass rate**: 99.3% (282 passing, 2 skipped)
- **Unit tests**: 175
- **Feature tests**: 109

### 2. Code Quality Workflow (`.github/workflows/code-quality.yml`)

**Triggers:**
- Push to `main`, `develop`, or `master` branches
- Pull requests to `main`, `develop`, or `master` branches

**What it does:**
- **Type Checking**: Validates TypeScript types across the codebase
- **Security Audit**: Checks for known vulnerabilities in dependencies

## Environment Setup

The workflows automatically set up the following environment variables:

```bash
JWT_SECRET=test-secret-key-for-github-actions
JWT_MAX_AGE=86400
DATABASE_URL=file:./test.db
```

## Cache Strategy

Dependencies are cached using the following strategy:
- **Cache key**: `${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}`
- **Cache paths**: 
  - `~/.bun/install/cache`
  - `node_modules`
- **Restore keys**: `${{ runner.os }}-bun-`

## Available Scripts

The workflows use the following npm scripts defined in `package.json`:

```json
{
  "test": "bun test",
  "test:unit": "bun test tests/unit/",
  "test:feature": "bun test tests/feature/",
  "type-check": "bun run --bun tsc --noEmit",
  "audit": "bun audit",
  "db:migrate": "drizzle-kit push"
}
```

## Workflow Status

You can monitor the workflow status in several ways:

1. **GitHub Repository**: Go to the "Actions" tab in your repository
2. **Pull Requests**: Status checks will appear on PRs
3. **Commit History**: Each commit will show workflow status

## Workflow Badges

You can add these badges to your README.md:

```markdown
![CI](https://github.com/{username}/{repo}/workflows/CI/badge.svg)
![Code Quality](https://github.com/{username}/{repo}/workflows/Code%20Quality/badge.svg)
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check environment variables are properly set
   - Ensure database migrations run successfully
   - Verify all dependencies are installed

2. **Type checking failures**
   - Run `bun run type-check` locally to reproduce
   - Check for missing type definitions
   - Verify TypeScript configuration

3. **Security audit warnings**
   - Review the audit output for actionable items
   - Update dependencies if necessary
   - Consider using `bun audit --audit-level moderate` for stricter checks

### Debugging

To debug workflow issues:

1. Check the workflow logs in the GitHub Actions tab
2. Look for specific error messages in the failing step
3. Test the failing command locally with the same environment
4. Use `continue-on-error: true` for non-critical steps

## Customization

### Adding New Workflows

To add new workflows:

1. Create a new `.yml` file in `.github/workflows/`
2. Define triggers and jobs
3. Use the existing workflow structure as a template

### Modifying Existing Workflows

Common modifications:

1. **Add new test commands**:
   ```yaml
   - name: Run custom tests
     run: bun test custom-tests/
   ```

2. **Add new quality checks**:
   ```yaml
   - name: Run custom linting
     run: bun run custom-lint
     continue-on-error: true
   ```

3. **Change triggers**:
   ```yaml
   on:
     push:
       branches: [ main, develop, feature/* ]
   ```

## Performance Optimization

### Faster Builds

1. **Use caching**: Already implemented for dependencies
2. **Parallel jobs**: Separate jobs run in parallel
3. **Matrix builds**: Test against multiple Node.js versions if needed

### Cost Optimization

1. **Use `continue-on-error: true`** for non-critical steps
2. **Limit concurrent jobs** if using GitHub-hosted runners
3. **Use self-hosted runners** for faster builds

## Security Considerations

1. **Environment Variables**: Never commit secrets to workflows
2. **Dependencies**: Regular security audits are performed
3. **Permissions**: Workflows use minimal required permissions
4. **Secrets**: Use GitHub Secrets for sensitive data

## Best Practices

1. **Keep workflows simple**: One workflow per concern
2. **Use descriptive names**: Clear step and job names
3. **Handle errors gracefully**: Use `continue-on-error` appropriately
4. **Cache dependencies**: Speed up builds
5. **Test locally first**: Ensure workflows work before pushing
6. **Document changes**: Update this documentation when modifying workflows
