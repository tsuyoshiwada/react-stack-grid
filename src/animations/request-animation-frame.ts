import ExecutionEnvironment from 'exenv'

const vendors = ['ms', 'moz', 'webkit']

let tmpRaf: (callback: () => void) => number
let tmpCaf: (id: number) => void

if (ExecutionEnvironment.canUseDOM) {
  tmpRaf = window.requestAnimationFrame
  tmpCaf = window.cancelAnimationFrame // eslint-disable-next-line no-plusplus

  for (let x = 0; x < vendors.length && !tmpRaf; ++x) {
    tmpRaf = window[`${vendors[x]}RequestAnimationFrame` as any] as any
    tmpCaf = window[`${vendors[x]}CancelAnimationFrame` as any] as any
      || window[`${vendors[x]}CancelRequestAnimationFrame` as any] as any
  }
} else {
  tmpRaf = (callback: () => void): number => {
    callback()
    return 1
  }

  tmpCaf = () => {/*ok*/}
}

export const raf = tmpRaf
export const caf = tmpCaf
