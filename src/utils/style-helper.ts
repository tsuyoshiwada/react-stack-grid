import {prefix} from 'inline-style-prefixer'
import { createCSSTransformBuilder, properties } from 'easy-css-transform-builder'
import {Styles, Units} from '../types'


const isTransformProp = (v: string) => properties.indexOf(v) > -1

export const transition = (props: Array<string>, duration: number, easing: string) =>
  props.map(prop => `${prop} ${duration}ms ${easing}`).join(',')

export const buildStyles = (
  styles: Styles,
  units: Units,
  vendorPrefix: boolean,
) => {
  const builder = createCSSTransformBuilder(units)
  const finalStyles: Styles = {}
  const transformStyles: Styles = {}
  Object.keys(styles).forEach((key) => {
    const value = styles[key]

    if (isTransformProp(key)) {
      transformStyles[key] = value

      if (key === 'perspective') {
        finalStyles[key] = value
      }
    } else {
      finalStyles[key] = value
    }
  })
  const transform = builder(transformStyles as Record<string, any>)

  if (transform !== '') {
    finalStyles.transform = transform
  }

  if (vendorPrefix) {
    return prefix(finalStyles)
  }

  return finalStyles
}
