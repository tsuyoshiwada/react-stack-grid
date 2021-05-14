import type {AngleUnit, LengthUnit} from 'easy-css-transform-builder'

export type Rect = {
  top: number
  left: number
  width: number
  height: number
}

export type Units = {
  length: LengthUnit
  angle: AngleUnit
}

export type Styles = Record<string, string | number>

export type TransitionCB = (rect: Rect, size: ContainerSize, index: number) => Styles

export type ContainerSize = {
  width: number
  height: number
  actualWidth: number
}