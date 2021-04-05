import React, { Component } from 'react'
import PropTypes from 'prop-types'
import shallowequal from 'shallowequal'

import {transition, buildStyles } from '../utils/style-helper'
import { raf } from '../animations/request-animation-frame'
import {Units, Rect, Styles, ContainerSize, TransitionCB} from '../types/'
import {Transitions} from '../animations/transitions'


type Props = {
  itemKey: string
  index: number
  component: string
  rect: Rect
  containerSize: ContainerSize
  duration: number
  easing: string
  appearDelay: number
  appear: TransitionCB
  appeared: TransitionCB
  enter: TransitionCB
  entered: TransitionCB
  leaved: TransitionCB
  units: Units
  vendorPrefix: boolean
  userAgent: string | undefined | null
  onMounted: (item: GridItem) => void
  onUnmount: (item: GridItem) => void
  rtl: boolean
}

type State = Record<string, any>

const getTransitionStyles = (type: Transitions, props: Props): Styles => {
  const {
    rect,
    containerSize,
    index,
  } = props
  return props[type](rect, containerSize, index)
}

const getPositionStyles = (rect: Rect, zIndex: number, rtl: boolean): Styles => ({
  translateX: `${rtl ? -Math.round(rect.left) : Math.round(rect.left)}px`,
  translateY: `${Math.round(rect.top)}px`,
  zIndex: zIndex.toString(),
})

export default class GridItem extends Component<Props, State> {
  node: Element | null = null
  mounted: boolean
  appearTimer: number | undefined

  static propTypes = {
    itemKey: PropTypes.string,
    index: PropTypes.number,
    component: PropTypes.string,
    rect: PropTypes.shape({
      top: PropTypes.number,
      left: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
    containerSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      actualWidth: PropTypes.number,
    }),
    duration: PropTypes.number,
    easing: PropTypes.string,
    appearDelay: PropTypes.number,
    appear: PropTypes.func,
    appeared: PropTypes.func,
    enter: PropTypes.func,
    entered: PropTypes.func,
    leaved: PropTypes.func,
    units: PropTypes.shape({
      length: PropTypes.string,
      angle: PropTypes.string,
    }),
    vendorPrefix: PropTypes.bool,
    userAgent: PropTypes.string,
    onMounted: PropTypes.func,
    onUnmount: PropTypes.func,
    rtl: PropTypes.bool,
  }

  constructor(props: Props) {
    super(props)
    this.mounted = false
    this.appearTimer = undefined
    this.node = null
    this.state = {
      ...getPositionStyles(props.rect, 1, props.rtl),
      ...getTransitionStyles('appear', props),
    }
  }

  componentDidMount() {
    this.mounted = true
    this.props.onMounted(this)
  }

  componentWillUnmount() {
    this.mounted = false
    clearTimeout(this.appearTimer)
    this.appearTimer = undefined
    this.props.onUnmount(this)
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const sameProps = shallowequal(nextProps, this.props)
    if (!sameProps) {
      raf(() => {
        this.setStateIfNeeded({ ...this.state,
          ...getPositionStyles(nextProps.rect, 2, nextProps.rtl),
        })
      })
    }
    return !sameProps || !shallowequal(nextState, this.state)
  }

  componentWillAppear(callback: () => void) {
    this.appearTimer = setTimeout(callback, this.props.appearDelay * this.props.index)
  }

  componentDidAppear() {
    this.setAppearedStyles()
  }

  componentWillEnter(callback: () => void) {
    this.setEnterStyles()
    this.forceUpdate(callback)
  }

  componentDidEnter() {
    this.setEnteredStyles()
  }

  componentWillLeave(callback: () => void) {
    this.setLeaveStyles()
    setTimeout(callback, this.props.duration)
  }

  setStateIfNeeded(state: Partial<State>) {
    if (this.mounted) {
      this.setState(state)
    }
  }

  setAppearedStyles() {
    this.setStateIfNeeded({
      ...this.state,
      ...getTransitionStyles('appeared', this.props),
      ...getPositionStyles(this.props.rect, 1, this.props.rtl),
    })
  }

  setEnterStyles() {
    this.setStateIfNeeded({
      ...this.state,
      ...getPositionStyles(this.props.rect, 2, this.props.rtl),
      ...getTransitionStyles('enter', this.props),
    })
  }

  setEnteredStyles() {
    this.setStateIfNeeded({
      ...this.state,
      ...getTransitionStyles('entered', this.props),
      ...getPositionStyles(this.props.rect, 1, this.props.rtl),
    })
  }

  setLeaveStyles() {
    this.setStateIfNeeded({
      ...this.state,
      ...getPositionStyles(this.props.rect, 2, this.props.rtl),
      ...getTransitionStyles('leaved', this.props),
    })
  }

  render() {
    const {
      index,
      component,
      containerSize,
      appearDelay,
      appear,
      appeared,
      enter,
      entered,
      leaved,
      onMounted,
      onUnmount,
      itemKey,
      rect,
      duration,
      easing,
      units,
      vendorPrefix,
      rtl,
      ...rest
    } = this.props
    const style = buildStyles({ ...this.state,
      display: 'block',
      position: 'absolute',
      top: '0',
      ...(rtl ? {
        right: '0',
      } : {
        left: '0',
      }),
      width: rect.width.toString(),
      transition: transition(['opacity', 'transform'], duration, easing),
    }, units, vendorPrefix)

    return React.createElement(component, {...rest, ref: node => this.node = node, style})
  }

}