import { createElement, render, Component } from './toy-react'

class MyComponent extends Component {
  render() {
    return (
      <div>
        <div>MyComponent</div>
        {this.children}
      </div>
    )
  }
}

render(<MyComponent>
  <div>aaa</div>
  <div style="color: pink">pink</div>
</MyComponent>, document.body)