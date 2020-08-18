const RENDER_TO_DOM = Symbol('render to dom')

class ElementWrap {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(name, value) {
    // 如果以on开头说明是个方法，比如onclick
    // \s\S 匹配所有空和非空，也就是匹配所有字母
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      if (name === 'className') {
        this.root.setAttribute('class', value)
      } else {
        this.root.setAttribute(name, value)
      }
    }
  }
  appendChild(component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

class TextWrap {
  constructor(type) {
    this.root = document.createTextNode(type)
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this._root = null
    this.props = Object.create(null)
    this.children = []
    this._range = null
  }
  setAttribute(key, value) {
    this.props[key] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    this.render()[RENDER_TO_DOM](range)
  }
  rerender() {
    let oldRange = this._range
    let range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range)
    
    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents()
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.rerender()
      return
    }
    let merge = (oldState, newState) => {
      for (let k in newState) {
        if (oldState[k] === null || typeof oldState[k] !== 'object') {
          oldState[k] = newState[k]
        } else {
          merge(oldState[k], newState[k])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }
}

export function createElement (type, attrs, ...children) {
  let e
  if (typeof type === 'string') {
    e = new ElementWrap(type)
  } else {
    e = new type
  }
  for (let k in attrs) {
    e.setAttribute(k, attrs[k])
  }
  let insetChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrap(child)
      }
      if (child === null) {
        continue
      }
      if ((typeof child === 'object') && (child instanceof Array)) {
        insetChildren(child)
      } else {
        e.appendChild(child)
      }
    }
  }
  insetChildren(children)
  return e
}

export function renderDom(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}