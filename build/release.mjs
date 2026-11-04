import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packages = ['dls-icons-data', 'dls-icons-react', 'dls-icons-vue', 'dls-icons-vue-3']
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const registry = process.env.NPM_CONFIG_REGISTRY ?? 'https://registry.npmjs.org/'

function git (...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function compareVersions (left, right) {
  const leftParts = left.split('.').map(BigInt)
  const rightParts = right.split('.').map(BigInt)
  for (const [index, part] of leftParts.entries()) {
    if (part !== rightParts[index]) {
      return part > rightParts[index] ? 1 : -1
    }
  }
  return 0
}

function verifyTag (version) {
  const tag = `v${version}`
  if (git('tag', '--list', tag) && git('rev-parse', `refs/tags/${tag}^{commit}`) !== git('rev-parse', 'HEAD')) {
    throw new Error(`${tag} already points to a different commit.`)
  }
}

function plan (before) {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const name of packages) {
    const manifest = JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8'))
    if (manifest.name !== name || manifest.private || manifest.version !== version) {
      throw new Error(`Expected a public ${name}@${version} in the workspace.`)
    }
  }

  if (/^0+$/.test(before)) return
  const { version: previous } = JSON.parse(git('show', `${before}:package.json`))
  if (version === previous) return

  if (!versionPattern.test(version) || !versionPattern.test(previous) || compareVersions(version, previous) <= 0) {
    throw new Error(`Expected an increasing stable version, got ${previous} → ${version}.`)
  }

  verifyTag(version)
  console.log(`version=${version}`)
}

async function requestJson (url, { method = 'GET', headers, body, allowMissing = false } = {}) {
  const options = { method, headers, signal: AbortSignal.timeout(30_000) }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json', ...headers }
    options.body = JSON.stringify(body)
  }
  const response = await fetch(url, options)
  if (allowMissing && response.status === 404) return null
  if (!response.ok) {
    throw new Error(`${method} ${url} returned HTTP ${response.status}: ${await response.text()}`)
  }
  return response.json()
}

async function publish (version, directory) {
  verifyTag(version)
  const archives = packages.map(name => {
    const file = resolve(directory, `${name}-${version}.tgz`)
    const integrity = `sha512-${createHash('sha512').update(readFileSync(file)).digest('base64')}`
    return { name, file, integrity }
  })

  const pending = await Promise.all(archives.map(async ({ name, file, integrity }) => {
    const published = await requestJson(new URL(`${name}/${version}`, registry), { allowMissing: true })
    if (published) {
      if (published.dist?.integrity !== integrity) {
        throw new Error(`${name}@${version} is already published with different contents.`)
      }
      console.log(`${name}@${version} is already published.`)
      return null
    }

    const latest = await requestJson(new URL(`${name}/latest`, registry), { allowMissing: true })
    const latestVersion = latest?.version.split('-')[0]
    const distTag = latestVersion && compareVersions(version, latestVersion) < 0 ? `release-${version}` : 'latest'
    return { file, distTag }
  }))

  // Publish the shared data before the packages that depend on it.
  for (const entry of pending.filter(Boolean)) {
    execFileSync('npm', ['publish', entry.file, '--access', 'public', '--tag', entry.distTag, '--registry', registry, '--ignore-scripts'], {
      stdio: 'inherit'
    })
  }
}

function releaseNotes (version, sections) {
  // An interrupted publish can leave a tag without a changelog entry.
  const recordedTags = new Set(sections.map(section => `v${section[1]}`))
  const previous = git('tag', '--merged', 'HEAD', '--sort=-version:refname', '--list', 'v*')
    .split('\n')
    .find(tag => recordedTags.has(tag) && compareVersions(tag.slice(1), version) < 0)
  const commits = git('log', '--no-merges', '--invert-grep', '--grep=^docs: update changelog for v', '--format=- %s (%h)', previous ? `${previous}..HEAD` : 'HEAD')
  if (!previous) return commits
  const comparison = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/compare/${previous}...v${version}`
  return `${commits}\n\n[Full changelog](${comparison})`.trim()
}

async function finalize (version) {
  verifyTag(version)
  const { GITHUB_API_URL, GITHUB_REPOSITORY, GITHUB_REF_NAME, GH_TOKEN } = process.env
  const repoUrl = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}`
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${GH_TOKEN}` }
  const changelogUrl = `${repoUrl}/contents/CHANGELOG.md`
  const file = await requestJson(`${changelogUrl}?ref=${encodeURIComponent(GITHUB_REF_NAME)}`, { headers })
  const changelog = Buffer.from(file.content, 'base64').toString('utf8')
  const sections = [...changelog.matchAll(/^## (\d+\.\d+\.\d+)[ \t]*\r?$/gm)]
  const existing = sections.findIndex(section => section[1] === version)
  let notes

  if (existing >= 0) {
    const section = sections[existing]
    notes = changelog.slice(section.index + section[0].length, sections[existing + 1]?.index).trim()
  } else {
    notes = releaseNotes(version, sections)
    const index = sections.find(section => compareVersions(section[1], version) < 0)?.index ?? changelog.length
    const before = changelog.slice(0, index).trimEnd()
    const after = changelog.slice(index).trimStart()
    const updated = `${before}\n\n## ${version}\n\n${notes}\n\n${after}`.trimEnd() + '\n'
    await requestJson(changelogUrl, {
      method: 'PUT',
      headers,
      body: {
        branch: GITHUB_REF_NAME,
        sha: file.sha,
        message: `docs: update changelog for v${version}`,
        content: Buffer.from(updated).toString('base64')
      }
    })
  }

  const tag = `v${version}`
  const release = await requestJson(`${repoUrl}/releases/tags/${tag}`, { headers, allowMissing: true })
  if (!release) {
    await requestJson(`${repoUrl}/releases`, {
      method: 'POST',
      headers,
      body: { tag_name: tag, target_commitish: git('rev-parse', 'HEAD'), name: tag, body: notes, make_latest: 'legacy' }
    })
  }
}

const [command, arg, directory] = process.argv.slice(2)
switch (command) {
  case 'plan':
    plan(arg)
    break
  case 'publish':
    await publish(arg, directory)
    break
  case 'finalize':
    await finalize(arg)
    break
  default:
    throw new Error(`Unknown release command: ${command}`)
}
