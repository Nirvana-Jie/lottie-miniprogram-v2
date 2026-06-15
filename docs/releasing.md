# Releasing

This package is published from GitHub Actions.

## Release Flow

1. Update `version` in `package.json` and commit the change.
2. Push the commit to `main`.
3. Create a GitHub Release with a tag that matches the package version, for example `v0.1.0`.
4. The `Publish` workflow verifies the package, checks that the version is not already on npm, and runs `npm publish --access public`.

The workflow can also be started manually from the GitHub Actions page.

## npm Authentication

Trusted Publishing is the recommended long-term setup. Configure it on npm with:

- Publisher: GitHub Actions
- Organization or user: `Nirvana-Jie`
- Repository: `lottie-miniprogram-v2`
- Workflow filename: `publish.yml`
- Allowed action: `npm publish`

The package `repository.url` must keep pointing to `git+https://github.com/Nirvana-Jie/lottie-miniprogram-v2.git`.

For the first publish, the npm package does not exist yet, so trusted publishing cannot be configured with `npm trust` until after the package exists. Use one of these paths:

- Publish once with an npm granular access token stored as the repository secret `NPM_TOKEN`, then configure trusted publishing and remove the secret.
- Publish once locally with `npm publish --access public`, then configure trusted publishing.

If this GitHub repository stays private, npm can still publish the package, but npm provenance will not be generated for the public package. Make the repository public before publishing if provenance is required.
