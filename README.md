# dls-icons

Icon picker: https://dls-icons.vercel.app/

<table>
  <tr>
    <td><a href="https://github.com/ecomfe/dls-icons/tree/master/packages/dls-icons-data" target="_blank">dls-icons-data</a></td>
    <td><img src="https://img.shields.io/npm/v/dls-icons-data.svg" alt="dls-icons-data version" valign="bottom"></td>
  </tr>
  <tr>
    <td><a href="https://github.com/ecomfe/dls-icons/tree/master/packages/dls-icons-react" target="_blank">dls-icons-react</a></td>
    <td><img src="https://img.shields.io/npm/v/dls-icons-react.svg" alt="dls-icons-react version" valign="bottom"></td>
  </tr>
  <tr>
    <td><a href="https://github.com/ecomfe/dls-icons/tree/master/packages/dls-icons-vue" target="_blank">dls-icons-vue</a></td>
    <td><img src="https://img.shields.io/npm/v/dls-icons-vue.svg" alt="dls-icons-vue version" valign="bottom"></td>
  </tr>
  <tr>
    <td><a href="https://github.com/ecomfe/dls-icons/tree/master/packages/dls-icons-vue-3" target="_blank">dls-icons-vue-3</a></td>
    <td><img src="https://img.shields.io/npm/v/dls-icons-vue-3.svg" alt="dls-icons-vue-3 version" valign="bottom"></td>
  </tr>
</table>

## Development

Use Node.js 24.11 or newer within the 24.x line and the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter site dev
```

Run `pnpm lint` to check the workspace with Vite+ and `pnpm format` to format the picker source. The site build uses `vue-tsc` to type-check Vue templates.

The build reads the icon inventory in `build/catalog.json` and the SVG sources in `raw/`. It generates the packages and picker without contacting the icon API.

Run `pnpm generate` to refresh the checked-in SVG previews and icon tables. Set `DLS_ICONS_API` to import from the icon API, or place an API response in `build/icons.json` for a local import. With neither source, the command uses the checked-in inventory and SVG sources. Review the resulting catalog, SVG, and README changes together.

## Releases

Run `pnpm version:bump`, choose a patch, minor, or major bump, and include the version changes in your pull request. Keep the root and all four public packages on the same stable version.

When a version bump reaches `master`, the release workflow builds and packs the packages, publishes them to npm, updates `CHANGELOG.md`, and creates the matching `vX.Y.Z` tag and GitHub release. It uses the version's changelog entry if present and generates notes from commits since the last release recorded in the changelog otherwise. If publishing is interrupted, re-run the failed job to reuse the packed archives. [Release workflow](.github/workflows/release.yml)

Before merging the first bump, configure GitHub Actions as a trusted publisher for `dls-icons-data`, `dls-icons-react`, `dls-icons-vue`, and `dls-icons-vue-3` in npm. Use `ecomfe` as the owner, `dls-icons` as the repository, and `release.yml` as the workflow filename. Leave the environment field blank and enable **Allow npm publish**. Configure this once `release.yml` is on `master` and the first release is ready.

Run `pnpm sync` to request an npmmirror refresh after publishing.
