import createDOMNode from './createDOMNode'
import mapProps from './mapProps'
import { DOMCONTAINER_ATTR_NAME, TEXT_TAG_NAME } from './const'

const { keys } = Object

function isDOMContainer (el) {
  return !!el.getAttribute(DOMCONTAINER_ATTR_NAME.toLowerCase())
}

export default function patchDOM (el, vdom) {
  if (vdom.tag === TEXT_TAG_NAME) {
    return patchDOMText(el, vdom)
  }

  return patchDOMElement(el, vdom)
}

function patchDOMText (el, vdom) {
  const text = el.nodeValue
  const newText = vdom.props.text

  if (text !== newText) {
    el.nodeValue = newText
  }
}

function patchDOMElement (el, vdom) {
  const attrs = Array.prototype.slice.call(el.attributes)
  const { props: inputProps } = vdom
  const props = mapProps(inputProps)

  attrs.forEach(attr => {
    // 注意, DOM属性是不分大小写的
    const { name } = attr

    if (typeof props[name] === 'undefined') {
      dealWithRemovableAttr(el, name)
      el.removeAttribute(name)
    }
  })

  keys(props).forEach(key => {
    const value = props[key]
    const currentDOMValue = el.getAttribute(key)

    if (value !== currentDOMValue) {
      dealWithDifferentAttr(el, key, value, currentDOMValue)
    }
  })

  if (isDOMContainer(el)) {
    return
  }

  const newDOMChildren = []
  const domChildren = Array.prototype.slice.call(el.childNodes)
  const domChildrenBackup = Array.prototype.slice.call(el.childNodes)
  const vdomChildren = vdom.children.filter(child => !!child)

  vdomChildren.forEach(vdomChild => {
    const domChild = domChildren.shift()

    if (!domChild || vdomChild.tag !== getDOMNodeTagName(domChild)) {
      const newNode = createDOMNode(vdomChild)
      if (newNode.nodeType !== 3) {
        newDOMChildren.push(newNode)
      }
    } else {
      patchDOM(domChild, vdomChild)
      newDOMChildren.push(domChild)
    }
  })

  domChildrenBackup.forEach(child => el.removeChild(child))
  newDOMChildren.forEach(child => el.appendChild(child))
}

function dealWithRemovableAttr (el, name) {
  el.removeAttribute(name)
}

function dealWithDifferentAttr (el, name, newValue, currentValue) {
  el.setAttribute(name, newValue)
}

function getDOMNodeTagName (node) {
  if (node.nodeType === 3) {
    return TEXT_TAG_NAME
  }

  return node.tagName
}