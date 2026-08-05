# Changesets

This folder holds [changesets](https://github.com/changesets/changesets): one
Markdown file per change, declaring the semver bump and the release note.

Add one with `pnpm changeset` and commit it alongside your PR. Releases are
cut manually via the Release workflow, which applies pending changesets
(version bump + changelog) and publishes to npm.

As packages land, add them to the `fixed` group in `config.json` if they
should share one version and release together.
