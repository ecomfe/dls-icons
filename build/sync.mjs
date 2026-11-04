import { sync } from '@justineo/npmmirror-sync'

const PACKAGES = [
  'dls-icons-data',
  'dls-icons-react',
  'dls-icons-vue',
  'dls-icons-vue-3'
]

await Promise.all(PACKAGES.map(sync))
console.log('Sync request sent for all packages.')
