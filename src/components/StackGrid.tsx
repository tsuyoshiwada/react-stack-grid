import React, {Component, isValidElement} from 'react'
import ReactDOM from 'react-dom'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import sizeMe from 'react-sizeme'
import shallowequal from 'shallowequal'
import ExecutionEnvironment from 'exenv'
import invariant from 'invariant'

import GridItem, {TransitionsCBS} from './GridItem'
import {transition} from '../utils/style-helper'
//import { raf } from '../animations/request-animation-frame'
import * as easings from '../animations/easings'
import * as transitions from '../animations/transitions/'
import {Styles, Units} from '../types/'

//TODO: return images load
//const imagesLoaded = ExecutionEnvironment.canUseDOM ? require('imagesloaded') : null

const isNumber = (v: any): v is number => typeof v === 'number' && isFinite(v)

const isPercentageNumber = (v: any): boolean => typeof v === 'string' && /^\d+(\.\d+)?%$/.test(v)

const createArray = <T extends any>(v: T, l: number): T[] => {
  const array = []

  for (let i = 0; i < l; i += 1) array.push(v)

  return array
}

const getColumnLengthAndWidth = (width: number, value: number | string, gutter: number): [number, number] => {
  if (isNumber(value)) {
    return [Math.floor((width - (width / value - 1) * gutter) / value), value]
  } else if (isPercentageNumber(value)) {
    const columnPercentage = parseFloat(value) / 100
    const maxColumn = Math.floor(1 / columnPercentage)
    const columnWidth = (width - gutter * (maxColumn - 1)) / maxColumn
    return [maxColumn, columnWidth]
  }

  invariant(false, 'Should be columnWidth is a number or percentage string.')
}

type Props = {
  children: React.ReactNode
  className?: string
  style?: Styles
  gridRef?: (grid: StackGrid) => void
  component: string
  itemComponent: string
  columnWidth: number | string
  gutterWidth: number
  gutterHeight: number
  duration: number
  easing: string
  appearDelay: number
  units: Units
  vendorPrefix: boolean
  enableSSR: boolean
  onLayout: () => void
  horizontal: boolean
  rtl: boolean
  //monitorImagesLoaded: boolean
  //userAgent: string | undefined | null
}

type InlineState = {
  rects: Array<{
    top: number
    left: number
    width: number
    height: number
  }>
  actualWidth: number
  height: number
  columnWidth: number
}

type InlineProps = Props & TransitionsCBS & {
  refCallback: (grid: GridInline) => void
  size: {
    width: number
    height: number
  }
}

export class GridInline extends Component<InlineProps, InlineState> {
  items: {
    [key: string]: GridItem
  }
  //imgLoad: object
  mounted: boolean

  constructor(props: InlineProps) {
    super(props)
    this.items = {}
    //this.imgLoad = {}
    this.mounted = false
    this.state = this.doLayout(props)
  }

  componentDidMount() {
    this.mounted = true
    this.updateLayout(this.props)
  }

  shouldComponentUpdate(nextProps: InlineProps, nextState: InlineState) {
    const sameProps = shallowequal(nextProps, this.props)
    if (!sameProps)
      this.updateLayout(nextProps)
    return !sameProps || !shallowequal(nextState, this.state)
  }

  componentWillUnmount() {
    this.mounted = false
  }

  setStateIfNeeded(state: Partial<InlineState>) {
    if (this.mounted) {
      this.setState(state as any)
    }
  }

  getItemHeight(item: any): number {
    if (item.key && item.key in this.items) {
      const component = this.items[item.key]
      const el = (ReactDOM.findDOMNode(component) as any)
      const candidate = [el.scrollHeight, el.clientHeight, el.offsetHeight, 0].filter(isNumber)
      return Math.max(...candidate)
    }

    return 0
  }

  doLayout(props: InlineProps): InlineState {
    if (!ExecutionEnvironment.canUseDOM) {
      return this.doLayoutForSSR(props)
    }

    const results = this.doLayoutForClient(props)

    if (this.mounted && typeof this.props.onLayout === 'function') {
      this.props.onLayout()
    }

    return results
  }

  doLayoutForClient(props: InlineProps): InlineState {
    const {
      size: {
        width: containerWidth,
      },
      columnWidth: rawColumnWidth,
      gutterWidth,
      gutterHeight,
      horizontal,
    } = props
    const childArray = React.Children.toArray(props.children)
    const [maxColumn, columnWidth] = getColumnLengthAndWidth(containerWidth, rawColumnWidth, gutterWidth)
    const columnHeights = createArray(0, maxColumn)
    let rects

    if (!horizontal) {
      rects = childArray.map(child => {
        const column = columnHeights.indexOf(Math.min(...columnHeights))
        const height = this.getItemHeight(child)
        const left = column * columnWidth + column * gutterWidth
        const top = columnHeights[column]
        columnHeights[column] += Math.round(height) + gutterHeight
        return {
          top,
          left,
          width: columnWidth,
          height,
        }
      })
    } else {
      const sumHeights = childArray.reduce<number>(
        (sum, child) => sum + Math.round(this.getItemHeight(child)) + gutterHeight,
        0
      )
      const maxHeight = sumHeights / maxColumn
      let currentColumn = 0
      rects = childArray.map(child => {
        const column = currentColumn >= maxColumn - 1 ? maxColumn - 1 : currentColumn
        const height = this.getItemHeight(child)
        const left = column * columnWidth + column * gutterWidth
        const top = columnHeights[column]
        columnHeights[column] += Math.round(height) + gutterHeight

        if (columnHeights[column] >= maxHeight) {
          currentColumn += 1
        }

        return {
          top,
          left,
          width: columnWidth,
          height,
        }
      })
    }

    const width = maxColumn * columnWidth + (maxColumn - 1) * gutterWidth
    const height = Math.max(...columnHeights) - gutterHeight
    const finalRects = rects.map(o => ({
      ...o,
      left: o.left + (containerWidth - width) / 2,
    }))
    return {
      rects: finalRects,
      actualWidth: width,
      height,
      columnWidth,
    }
  }


  doLayoutForSSR(props: InlineProps): InlineState {
    return {
      rects: React.Children.toArray(props.children).map(() => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      })),
      actualWidth: 0,
      height: 0,
      columnWidth: 0,
    }
  }

  updateLayout(props?: InlineProps | null): void {
    if (!props) {
      this.setStateIfNeeded(this.doLayout(this.props))
    } else {
      this.setStateIfNeeded(this.doLayout(props))
    }
  }

  handleItemMounted = (item: GridItem) => {
    const {
      itemKey: key,
    } = item.props
    this.items[key] = item

    /*if (this.props.monitorImagesLoaded && typeof imagesLoaded === 'function') {
      const node = ReactDOM.findDOMNode(item)
      const imgLoad = imagesLoaded(node)
      imgLoad.once('always', () => raf(() => {
        this.updateLayout(this.props)
      }))
      this.imgLoad[key] = imgLoad
    }*/

    this.updateLayout(this.props)
  }

  handleItemUnmount = (item: GridItem) => {
    const {
      itemKey: key,
    } = item.props

    if (key in this.items) {
      delete this.items[key]
    }

    /*if (key in this.imgLoad) {
      this.imgLoad[key].off('always')
      delete this.imgLoad[key]
    }*/
  }

  handleRef = () => {
    this.props.refCallback(this)
  }

  render() {
    const {
      gutterWidth,
      gutterHeight,
      columnWidth: rawColumnWidth,
      //monitorImagesLoaded,
      enableSSR,
      onLayout,
      horizontal,
      rtl,
      refCallback,

      className,
      style,
      size,
      component,
      itemComponent,
      children,
      ...rest
    } = this.props
    const {
      rects,
      actualWidth,
      height,
    } = this.state
    const containerSize = {
      actualWidth,
      width: size.width == null ? 0 : size.width,
      height,
    }
    const validChildren = React.Children.toArray(children)
      .flatMap((child, i) => (rects[i] && isValidElement(child)) ? [child] : [])

    return (
      <TransitionGroup
        component={component as any}
        className={className}
        style={{
          ...(style || {}),
          position: 'relative',
          transition: transition(['height'], rest.duration, easings.easeOut),
          height,
        }}
        ref={this.handleRef}
      >
        {validChildren.map((child, i) => {
          const key = (typeof child === 'object' && 'key' in child) ? child.key ?? undefined : undefined
          return (
            // @ts-ignore
            <GridItem
              {...rest}
              index={i}
              key={key}
              component={itemComponent}
              itemKey={typeof key === 'string' ? key : '1'}
              rect={rects[i]}
              rtl={rtl}
              containerSize={containerSize}
              onMounted={this.handleItemMounted}
              onUnmount={this.handleItemUnmount}
            >
              {child}
            </GridItem>
          )
        })}
      </TransitionGroup>
    )
  }
}

const SizeAwareGridInline = sizeMe({
  monitorWidth: true,
  monitorHeight: false,
})(GridInline)

export default class StackGrid extends Component<Props & Partial<TransitionsCBS>> {
  static defaultProps = {
    style: {},
    gridRef: null,
    component: 'div',
    itemComponent: 'span',
    columnWidth: 150,
    gutterWidth: 5,
    gutterHeight: 5,
    duration: 480,
    easing: easings.quartOut,
    appearDelay: 30,
    transitions: {
      appear: transitions.fadeUp.appear,
      appeared: transitions.fadeUp.appeared,
      enter: transitions.fadeUp.enter,
      entered: transitions.fadeUp.entered,
      leaved: transitions.fadeUp.leaved,
    },
    units: {
      length: 'px',
      angle: 'deg',
    },
    vendorPrefix: true,
    enableSSR: false,
    onLayout: null,
    horizontal: false,
    rtl: false,
    //monitorImagesLoaded: false,
    //userAgent: null,
  }
  grid!: GridInline

  updateLayout() {
    this.grid.updateLayout()
  }

  handleRef = (grid: GridInline) => {
    this.grid = grid

    if (typeof this.props.gridRef === 'function') {
      this.props.gridRef(this)
    }
  }

  render() {
    const {gridRef, transitions, ...rest} = this.props
    return <SizeAwareGridInline {...rest} transitions={transitions!} refCallback={this.handleRef}/>
  }

}
