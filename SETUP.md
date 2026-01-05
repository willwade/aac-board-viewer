# Initial Setup Guide

This guide covers setting up the repository for the first time, including Git initialization, npm package setup, and trusted publishing configuration.

## Table of Contents

1. [Git Repository Setup](#git-repository-setup)
2. [npm Package Setup](#npm-package-setup)
3. [Trusted Publishing Configuration](#trusted-publishing-configuration)
4. [First Release](#first-release)
5. [Development Workflow](#development-workflow)

## Git Repository Setup

### 1. Initialize Git Repository

```bash
cd /Users/willwade/GitHub/aac-board-viewer
git init
git add .
git commit -m "Initial commit: AAC Board Viewer component"

# Create a meaningful initial commit
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `aac-board-viewer`
3. Description: `Universal AAC board viewer component for React`
4. Set as **Public** (required for npm publishing)
5. **DO NOT** initialize with README, .gitignore, or license (already exists)
6. Click "Create repository"

### 3. Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/willwade/aac-board-viewer.git

# Push main branch
git branch -M main
git push -u origin main
```

## npm Package Setup

### 1. Create npm Package (One-time Setup)

1. Go to https://www.npmjs.com/package
2. Click "Add Package" → "Add Organization Package" or "Add Scope Package"
3. Or visit: https://www.npmjs.com/org/willwade (if you have an org)
4. Click "Create new package"
5. Package name: `aac-board-viewer` (or scoped like `@willwade/aac-board-viewer`)
6. Set as **Public** (required for free publishing)
7. Click "Create package"

**Note**: The package must be created on npm first before you can configure trusted publishing.

### 2. Verify package.json

Ensure your `package.json` has correct fields:

```json
{
  "name": "aac-board-viewer",
  "version": "0.1.0",
  "description": "Universal AAC board viewer component for React",
  "author": "Will Wade",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/willwade/aac-board-viewer.git"
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  }
}
```

## Trusted Publishing Configuration

Trusted publishing uses OIDC (OpenID Connect) tokens instead of npm tokens, making it more secure.

### Step 1: Configure npm for Trusted Publishing

1. Go to https://www.npmjs.com/package/aac-board-viewer
2. Click "Publishing" tab
3. Click "Add GitHub Actions workflow"
4. Select GitHub repository: `willwade/aac-board-viewer`
5. Default workflow name: `Publish Package`
6. Workflow file path: `.github/workflows/release.yml`
7. Environment name: leave blank (or create one if needed)
8. **Ensure "Require workflow to be successful" is NOT checked** (for initial setup)
9. Click "Create GitHub Action"

This will configure npm to accept OIDC tokens from your GitHub Actions workflow.

### Step 2: Verify GitHub Actions Permissions

The workflow file already has the correct permissions:

```yaml
permissions:
  id-token: write # Required for OIDC
  contents: read
```

No `NPM_TOKEN` secret needed! 🎉

### Step 3: Update package.json Access

Ensure the publish script includes `--access public`:

```json
{
  "scripts": {
    "publish": "npm run build && npm publish --access public"
  }
}
```

The workflow file already includes this.

## First Release

### Option 1: Through GitHub UI (Recommended for first release)

1. Go to https://github.com/willwade/aac-board-viewer
2. Click "Releases" → "Create a new release"
3. Tag version: `v0.1.0`
4. Target: `main`
5. Title: `v0.1.0 - Initial Release`
6. Description: Copy from CHANGELOG.md or RELEASE_NOTES.md
7. **Set as prerelease**: No (unless this is a beta)
8. Click "Publish release"

This will:
- Create the git tag
- Trigger the `Publish Package` workflow
- Automatically publish to npm with provenance

### Option 2: Through Command Line

```bash
# Ensure you're on main branch
git checkout main

# Create and push tag
git tag -a v0.1.0 -m "v0.1.0 - Initial Release"
git push origin v0.1.0

# Then create release on GitHub UI
# Or use GitHub CLI:
gh release create v0.1.0 \
  --title "v0.1.0 - Initial Release" \
  --notes "See CHANGELOG.md for details"
```

### Verify Publishing

1. Check Actions tab: https://github.com/willwade/aac-board-viewer/actions
2. Wait for "Publish Package" workflow to complete
3. Verify on npm: https://www.npmjs.com/package/aac-board-viewer
4. Install locally to test:
```bash
cd /tmp
mkdir test-aac-viewer
cd test-aac-viewer
npm init -y
npm install aac-board-viewer
```

## Development Workflow

### Making Changes

1. Create a feature branch:
```bash
git checkout -b feature/add-new-feature
```

2. Make changes and test:
```bash
npm run build
npm run dev  # Test demo app
```

3. Commit and push:
```bash
git add .
git commit -m "Add: new feature description"
git push origin feature/add-new-feature
```

4. Create Pull Request on GitHub

### Releasing New Versions

1. Update version in package.json (or use `npm version`):
```bash
# Patch (0.1.0 → 0.1.1)
npm version patch

# Minor (0.1.0 → 0.2.0)
npm version minor

# Major (0.1.0 → 1.0.0)
npm version major
```

2. Update CHANGELOG.md with changes

3. Commit and push:
```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to 0.1.1"
git push origin main
```

4. Create GitHub release with new tag:
```bash
git tag -a v0.1.1 -m "v0.1.1"
git push origin v0.1.1
gh release create v0.1.1 --notes "Changes in this release"
```

### Pre-releases

For beta/alpha versions:

```bash
# Create prerelease tag
git tag -a v0.2.0-beta.1 -m "v0.2.0-beta.1"
git push origin v0.2.0-beta.1

# Create as prerelease on GitHub
gh release create v0.2.0-beta.1 --prerelease --notes "Beta release"
```

The workflow will **not** publish prereleases to npm (due to `if: ${{ github.event.release.prerelease == false }}`).

## Testing Locally Before Publishing

### Link Package Locally

```bash
# In the aac-board-viewer directory
npm link

# In your test project
npm link aac-board-viewer
```

### Test with npm pack

```bash
# Build and create tarball
npm run build
npm pack

# Install in test project
cd /tmp/my-test-project
npm install /path/to/aac-board-viewer/aac-board-viewer-0.1.0.tgz
```

## Troubleshooting

### "Unable to derive version from release tag"

**Cause**: Release tag doesn't start with 'v'
**Fix**: Ensure tags follow format `v{version}` (e.g., `v0.1.0`)

### "Workflow failed with OIDC error"

**Cause**: npm package not configured for trusted publishing
**Fix**:
1. Go to https://www.npmjs.com/package/aac-board-viewer/access
2. Click "Publishing" tab
3. Verify GitHub Actions workflow is added
4. Ensure repository is correct

### "Package name already exists"

**Cause**: Package name is taken on npm
**Fix**:
1. Use a scoped package: `@willwade/aac-board-viewer`
2. Or choose a different name
3. Update package.json and all imports

### "403 Forbidden" when publishing

**Cause**: Package is private or access denied
**Fix**:
1. Ensure package is **Public** on npm
2. Verify `--access public` flag is used
3. Check npm account has publishing permissions

### "Build errors in CI"

**Cause**: TypeScript or build errors
**Fix**:
```bash
# Run type check locally
npm run type-check

# Run lint
npm run lint

# Build
npm run build
```

## Security Notes

### No NPM_TOKEN Needed!

With trusted publishing, you **don't** need to:
- Store `NPM_TOKEN` in GitHub Secrets ❌
- Manually rotate tokens ❌
- Worry about token exposure ❌

GitHub Actions automatically gets a short-lived OIDC token from npm! ✅

### Package Access Verification

Users can verify package integrity:

```bash
npm audit signatures
```

This shows provenance information including who published and when.

## Next Steps

After successful first release:

1. ✅ Verify package installs: `npm install aac-board-viewer`
2. ✅ Test in a real project
3. ✅ Add documentation website (optional)
4. ✅ Set up automated dependency updates (Dependabot)
5. ✅ Add issue templates and PR templates
6. ✅ Consider adding badges to README

## Useful Commands

```bash
# Check package version
npm view aac-board-viewer version

# Check all versions
npm view aac-board-viewer versions

# See package info
npm view aac-board-viewer

# See who published
npm view aac-board-viewer

# Dry run publish (test without actually publishing)
npm publish --dry-run
```

## Related Documentation

- [npm Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
