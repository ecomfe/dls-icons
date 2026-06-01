import { sync } from '@justineo/npmmirror-sync'

const PACKAGES = [
  'dls-icons-data',
  'dls-icons-react',
  'dls-icons-vue',
  'dls-icons-vue-3'
]

Promise.all(PACKAGES.map(sync)).then(() => {
  console.log('Sync request sent for all packages.')
}).catch((e) => {
  console.error(e)
})
