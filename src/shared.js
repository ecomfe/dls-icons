import { dlsColorBrand6, dlsColorBrand3, dlsColorGray4, dlsColorGray3 } from 'less-plugin-dls/variables'

const gradientIdActive = 'dls-icon-gradient-active'
const gradientIdInactive = 'dls-icon-gradient-inactive'

const primaryColorActive = dlsColorBrand6
const secondaryColorActive = dlsColorBrand3
const primaryColorInactive = dlsColorGray4
const secondaryColorInactive = dlsColorGray3

const activeGradient = `<radialGradient id="${gradientIdActive}" cx="0" cy="0" r="1" gradientTransform="matrix(23.2 32.9 -24.293 17.13 .8 -4.8)" gradientUnits="userSpaceOnUse"><stop stop-color="${secondaryColorActive}"/><stop offset="1" stop-color="${primaryColorActive}"/></radialGradient>`
const inactiveGradient = `<radialGradient id="${gradientIdInactive}" cx="0" cy="0" r="1" gradientTransform="rotate(59 5.785 .462) scale(29 23.634)" gradientUnits="userSpaceOnUse"><stop stop-color="${secondaryColorInactive}"/><stop offset="1" stop-color="${primaryColorInactive}"/></radialGradient>`

export const markup = `<defs>${activeGradient}${inactiveGradient}</defs>`
export const attributes = {
  viewBox: '0 0 24 24'
}
