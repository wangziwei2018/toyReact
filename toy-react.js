const RENDER_TO_DOM = Symbol('render to dom')

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
  get vdom() {
    return this.render().vdom
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }
  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) return false
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) return false
      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) return false
      }
      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) return false
      }
      return true
    }
    let update = (oldNode, newNode) => {
      // 不一样直接替换
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range
      // 一样的继续比较子节点
      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren
      if (!newChildren || !newChildren.length) return
      let tailRange = oldChildren[oldChildren.length - 1]._range
      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild, newChild)
        } else {
          let range = document.createRange()
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange = range
        }
      }
    }
    let vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
  }
  // rerender() {
  //   let oldRange = this._range
  //   let range = document.createRange()
  //   range.setStart(oldRange.startContainer, oldRange.startOffset)
  //   range.setEnd(oldRange.startContainer, oldRange.startOffset)
  //   this[RENDER_TO_DOM](range)
    
  //   oldRange.setStart(range.endContainer, range.endOffset)
  //   oldRange.deleteContents()
  // }
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.update()
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
    this.update()
  }
}

class ElementWrap extends Component{
  constructor(type) {
    super(type);
    this.type = type;
  }
  // setAttribute(name, value) {
  //   // 如果以on开头说明是个方法，比如onclick
  //   // \s\S 匹配所有空和非空，也就是匹配所有字母
  //   if (name.match(/^on([\s\S]+)$/)) {
  //     this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
  //   } else {
  //     if (name === 'className') {
  //       this.root.setAttribute('class', value)
  //     } else {
  //       this.root.setAttribute(name, value)
  //     }
  //   }
  // }
  // appendChild(component) {
  //   let range = document.createRange()
  //   range.setStart(this.root, this.root.childNodes.length)
  //   range.setEnd(this.root, this.root.childNodes.length)
  //   component[RENDER_TO_DOM](range)
  // }
  get vdom() {
    this.vchildren = this.children.map(child => child.vdom)
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    let root = document.createElement(this.type)
    for (let name in this.props) {
      let value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else {
        if (name === 'className') {
          root.setAttribute('class', value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }
    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom)
    }
    for (let child of this.vchildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }
    replaceContent(range, root)
  }
}

class TextWrap extends Component {
  constructor(content) {
    super(content);
    this.type = '#text';
    this.content = content;
  }
  get vdom() {
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    let root = document.createTextNode(this.content)
    replaceContent(range, root)
  }
}

function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()
  range.setStartBefore(node)
  range.setEndAfter(node)
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