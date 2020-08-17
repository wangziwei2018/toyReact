class ElementWrap {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(key, value) {
    this.root.setAttribute(key, value)
  }
  appendChild(component) {
    this.root.appendChild(component.root)
  }
}

class TextWrap {
  constructor(type) {
    this.root = document.createTextNode(type)
  }
}

export class Component {
  constructor() {
    this._root = null
    this.props = Object.create(null)
    this.children = []
  }
  setAttribute(key, value) {
    this.props[key] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get root() {
    if (!this._root) {
      this._root = this.render().root
    }
    return this._root
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

export function render(component, parentElement) {
  parentElement.appendChild(component.root)
}