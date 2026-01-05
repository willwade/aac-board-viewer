# Quick Start: Publishing aac-board-viewer with Trusted Publishing

## What is Trusted Publishing?

Trusted publishing uses **OIDC (OpenID Connect)** tokens instead of npm secrets. This means:
- ✅ No `NPM_TOKEN` secret needed
- ✅ More secure (short-lived tokens)
- ✅ Automatic provenance statements
- ✅ No token rotation needed

## Prerequisites

1. npm account (https://www.npmjs.com)
2. GitHub account
3. Owner/admin access to both

## Step-by-Step Setup

### 1. Initialize Git & Push to GitHub (5 minutes)

```bash
cd /Users/willwade/GitHub/aac-board-viewer

# Initialize git
git init
git add .
git commit -m "Initial commit: AAC Board Viewer component"

# Create GitHub repo at https://github.com/new
# Name: aac-board-viewer
# Set as PUBLIC

# Add remote and push
git remote add origin https://github.com/willwade/aac-board-viewer.git
git branch -M main
git push -u origin main
```

### 2. Create npm Package (2 minutes)

1. Go to https://www.npmjs.com/package
2. Click "Add Package" → "Add unscoped package" or "Add scoped package"
3. Package name: `aac-board-viewer` or `@willwade/aac-board-viewer`
4. **IMPORTANT**: Set as **PUBLIC**
5. Click "Create package"

### 3. Configure Trusted Publishing (3 minutes)

1. Go to https://www.npmjs.com/package/aac-board-viewer
2. Click "Publishing" tab (you may need to click "Access" first)
3. Click "Add GitHub Actions workflow"
4. Fill in:
   - **GitHub Organization/Username**: `willwade`
   - **Repository**: `aac-board-viewer`
   - **Default workflow name**: `Publish Package`
   - **Workflow file path**: `.github/workflows/release.yml`
   - **Environment name**: Leave blank
5. **IMPORTANT**: Uncheck "Require workflow to be successful" (for first release)
6. Click "Create GitHub Action"

This tells npm: "Accept OIDC tokens from this repo's GitHub Actions"

### 4. Test Build Locally (2 minutes)

```bash
cd /Users/willwade/GitHub/aac-board-viewer

# Install dependencies
npm install

# Build library
npm run build

# Check dist folder was created
ls -la dist/

# Should see:
# - index.js
# - index.mjs
# - index.d.ts
# - styles.css
```

### 5. Create First Release (5 minutes)

**Option A: Via GitHub Web UI (Easiest)**

1. Go to https://github.com/willwade/aac-board-viewer/releases/new
2. Tag version: `v0.1.0`
3. Target: `main`
4. Release title: `v0.1.0 - Initial Release`
5. Description: Copy content from [RELEASE_NOTES.md](./RELEASE_NOTES.md)
6. **Set as prerelease**: ❌ No
7. Click "Publish release"

**Option B: Via GitHub CLI**

```bash
# Install GitHub CLI if needed: brew install gh
# Login first: gh auth login

gh release create v0.1.0 \
  --title "v0.1.0 - Initial Release" \
  --notes-file RELEASE_NOTES.md
```

### 6. Verify Publishing (2 minutes)

After creating the release:

1. Check GitHub Actions:
   - Go to https://github.com/willwade/aac-board-viewer/actions
   - Look for "Publish Package" workflow
   - Should see green ✅

2. Check npm:
   - Go to https://www.npmjs.com/package/aac-board-viewer
   - Should see version 0.1.0 published
   - Should see provenance badge

3. Test installation:
```bash
cd /tmp
mkdir test-aac-viewer && cd test-aac-viewer
npm init -y
npm install aac-board-viewer

# Check it worked
ls node_modules/aac-board-viewer/
```

## Troubleshooting

### ❌ "Package not found" on npm

**Cause**: Package hasn't been created on npm yet

**Fix**: Complete Step 2 first

### ❌ "403 Forbidden" when publishing

**Cause**: Package is private or access denied

**Fix**:
- Ensure package is **PUBLIC** on npm
- Check you're owner of the package
- Verify `--access public` is in publish command (already in workflow)

### ❌ "OIDC authentication failed"

**Cause**: Trusted publishing not configured

**Fix**:
- Complete Step 3
- Ensure workflow file path is exactly `.github/workflows/release.yml`
- Verify repo is correct (willwade/aac-board-viewer)

### ❌ "Unable to derive version from tag"

**Cause**: Tag doesn't start with 'v'

**Fix**: Tags must be `v{version}` format (e.g., `v0.1.0`, not `0.1.0`)

### ❌ Workflow didn't run

**Cause**: Release was marked as prerelease

**Fix**: Ensure "Set as prerelease" is **unchecked** when creating release

## What Happens Behind the Scenes

When you create a GitHub release:

```
1. GitHub creates tag v0.1.0
   ↓
2. GitHub triggers "release: published" event
   ↓
3. GitHub Actions starts "Publish Package" workflow
   ↓
4. Workflow requests OIDC token from npm
   ↓
5. npm validates token (is this repo allowed?)
   ↓
6. npm returns short-lived token (no NPM_TOKEN secret!)
   ↓
7. Workflow builds and publishes package
   ↓
8. npm adds provenance statement
   ↓
9. Package published with ✅ verified publisher badge
```

## Future Releases

After the first release, updating is simple:

```bash
# Update version
npm version patch  # or minor/major

# Or manually edit package.json

# Commit and push
git add package.json
git commit -m "chore: bump version to 0.1.1"
git push origin main

# Create release (via UI or CLI)
gh release create v0.1.1 --notes "Bug fixes and improvements"
```

That's it! GitHub Actions handles the rest automatically.

## Security Benefits

With trusted publishing:

- ✅ **No secrets to manage** - No NPM_TOKEN in GitHub Secrets
- ✅ **Auto-expiring tokens** - OIDC tokens last only minutes
- ✅ **Tamper-proof** - Provenance statements verify package integrity
- ✅ **Audit trail** - Clear record of who published what and when
- ✅ **Impossible to leak** - No long-lived tokens to steal

Users can verify:
```bash
npm audit signatures
```

## Next Steps

After successful first release:

1. ✅ Test in a real project
2. ✅ Add demo app to GitHub Pages (optional)
3. ✅ Set up Dependabot for dependency updates
4. ✅ Add issue/PR templates
5. ✅ Create documentation website (optional)
6. ✅ Announce on social media, AAC community

## Summary Checklist

- [ ] Git repo created and pushed to GitHub
- [ ] npm package created as **PUBLIC**
- [ ] Trusted publishing configured on npm
- [ ] Local build successful
- [ ] First release created (v0.1.0)
- [ ] Package published to npm
- [ ] Installation tested

Total time: **~20 minutes**

## Need Help?

- [npm Trusted Publishing Docs](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC Docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Troubleshooting](./SETUP.md#troubleshooting) - Common issues and fixes

---

**You're all set!** 🎉 The workflow will automatically publish future releases when you create them on GitHub.
