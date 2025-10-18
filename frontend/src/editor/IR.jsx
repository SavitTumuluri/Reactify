import { useState } from "react"


// ---------- IR Core ----------

export class IR {
  /**
   * @type {IRView[]}
   */
  children = []
  parent = null
  _data = {}
  _setters = new Map()

  constructor(parent, initial = {}) {
    this.parent = parent
    if (this.parent) this.parent.children.push(this)
    this._data = { ...initial }
  }

  /**
   * Mirror a React state slot into IR under `key`.
   * If IR already has a value for `key`, that value overrides the provided default.
   * If a prior setter existed for `key`, it is discarded (with a warning) and replaced.
   *
   * @param {string} key
   * @param {any|() => any} initialValue
   * @returns {[any, (next:any|((prev:any)=>any))=>void]}
   */
  useState(key, initialValue) {
    // 1) Decide initial once: prefer existing IR value if present.
    const hasExisting = Object.prototype.hasOwnProperty.call(this._data, key)
    const initial = hasExisting
      ? this._data[key]
      : (typeof initialValue === "function" ? initialValue() : initialValue)

    // 2) Create local React state with the chosen initial.
    const [value, reactSet] = useState(initial)

    // 3) If there was a previous setter for this key, warn and replace it.
    const prevSetter = this._setters.get(key)
    if (prevSetter && prevSetter !== reactSet) {
      // We are re-binding the state for this key: old setter becomes stale.
      // Keep it non-fatal; just notify.
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          `[IR.useState] Rebinding key "${key}": discarding previous setState and using new one.`
        )
      }
    }

    // 4) Keep IR mirror in sync with current React state and setter.
    this._data[key] = value
    this._setters.set(key, reactSet)

    // 5) Wrapped setter: keeps IR mirror in sync and triggers re-render.
    const set = (next) => {
      const resolved = (typeof next === "function") ? next(this._data[key]) : next
      this._data[key] = resolved
      // always use the *current* setter we have registered for this key
      const currentSetter = this._setters.get(key) || reactSet
      currentSetter(resolved)
    }

    return [value, set]
  }

  get(key) { return this._data[key] }

  set(key, value) {
    this._data[key] = value
    const setter = this._setters.get(key)
    if (setter) setter(value)
  }

  solidify() { return JSON.stringify(this._data) }
  toJSON() { return { ...this._data } }
  toEffects() { return [] }
  toImports() { return [] }
  toReact() { return "" }
}

export class IRRoot extends IR {
  //This is a IR that will compile to a react template
  /**${import1}
   * ${import2}
   * export function GeneralComponent(props) {
   *    ${Effect1}
   *    ${Effect2}
   *    return <div>${child1.getReact()}${child2.getReact()}</div>
   * }
   */
  
  toReact() {
    
    /**
     * @type {Set<String>}
     */
    let effects = new Set()
    /**
     * @type {Set<String>}
     */
    let imports = new Set()


    /**
     * 
     * @param {IR} ir 
     */
    let Explorer = (ir) => {
      let effectList = ir.toEffects()
      let importList = ir.toImports()
      for(let effect of effectList) {
        effects.add(effect)
      }
      for(let imp of importList) {
        imports.add(imp)
      }

      for(let child of ir.children) {
        Explorer(child)
      }
    }

    Explorer(this)

    let importString = ""
    for(let imp of imports) {
      importString += imp + "\n"
    }

    let effectString = ""
    for(let effect of effectString) {
      effectString += effect + "\n"
    }

    let divString = ""
    for(let child of this.children) {
      divString += child.toReact() + "\n"
    }
    return `
${importString}
export default function TestBaseIRComponent(props) {
  ${effectString}
  return <div>${divString}</div>
}
    `
  }

  toImports() {
    return [`import {useState,useRef,useEffect} from "react"`]
  }
  
}
export class IRView extends IR {
  constructor(inputs) {
    super(inputs)
  }
  toReact() {
    let code = ""
    for(let child of this.children) {
      code.push(child.toReact())
    }
    return `<div>${code}</div>\n`
  }

}

export class IRText extends IRView {
  toComponent() {
    return NewEditableText
  }
  constructor(parent,inputs) {
    super(parent,inputs)
  }
}
// ---------- Example usage in a component ----------

export function NewEditableText({ ir,initialText = "" }) {
  // Keep IR instance stable for this component’s lifetime.

  // Bind a React state slot to IR key "text".
  const [text, setText] = ir.useState("text", initialText)

  return (
    <div className="p-4 bg-white rounded shadow">
      <input
        className="border rounded px-2 py-1 w-full"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type…"
      />
      <div className="mt-3 text-sm text-gray-600">
        <button
          className="px-2 py-1 border rounded"
          onClick={() => {
            const snapshot = ir.solidify()
            setText(ir.get("text")+"whoa")
            console.log("Snapshot:", snapshot)
          }}
        >
          Solidify to console
        </button>
      </div>
    </div>
  )
}