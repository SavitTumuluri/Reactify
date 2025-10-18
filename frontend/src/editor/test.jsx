import { useState } from "react"


// ---------- IR Core ----------

export class IR {
  /**
   * @type {IRView[]}
   */
  children
  /** @private */
  _data = {}
  /** @private */
  _setters = new Map()

  constructor(initial = {}) {
    // Shallow clone to avoid external mutations
    this._data = { ...initial }
  }

  /**
   * Mirror a React state slot into IR under `key`.
   * Always call this in a stable, unconditional order during render.
   * Safe because it's just calling React's useState inside render.
   *
   * @param {string} key
   * @param {any|() => any} initialValue
   * @returns {[any, (next:any|((prev:any)=>any))=>void]}
   */
  useState(key, initialValue) {
    // Determine initial value once (lazy init supported)
    const hasExisting = Object.prototype.hasOwnProperty.call(this._data, key)
    const initial = hasExisting
      ? this._data[key]
      : (typeof initialValue === "function" ? initialValue() : initialValue)

    const [value, reactSet] = useState(initial)

    // Keep IR mirror in sync with the React state
    this._data[key] = value
    this._setters.set(key, reactSet)

    const set = (next) => {
      const resolved = typeof next === "function" ? next(this._data[key]) : next
      this._data[key] = resolved
      reactSet(resolved) // triggers re-render
    }

    return [value, set]
  }

  /** Read a value directly from IR (does not trigger re-render). */
  get(key) {
    return this._data[key]
  }

  /**
   * Imperatively set and push to any active component bound to `key`.
   * This *will* re-render if that key was bound via useState.
   */
  set(key, value) {
    this._data[key] = value
    const setter = this._setters.get(key)
    if (setter) setter(value)
  }

  /** Capture the current IR as a string (disconnected snapshot). */
  solidify() {
    return JSON.stringify(this._data)
  }

  /** Optional: convenience export of plain data (not reactive). */
  toJSON() {
    return { ...this._data }
  }
  /**
   * 
   * @returns {String[]}
   */
  toEffects() {
    return []
  }
  /**
   * 
   * @returns {String[]}
   */
  toImports() {
    return []
  }
  
}

class IRRoot extends IR {
  componentName = "UnnamedComponent"
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
export default function ${UnnamedComponent}(props) {
  ${effectString}
  return <div>${divString}</div>
}
    `
  }

  toImports() {
    return [`import {useState,useRef,useEffect} from "react"`]
  }
  
}
class IRView extends IR {
  
  toReact() {
    let code = ""
    for(let child of this.children) {
      code.push(child.toReact())
    }
    return `<div>${code}</div>\n`
  }

}

// ---------- Example IR node types ----------

class IRText extends IR {
  constructor(init = {}) {
    super({ text: "", ...init })
  }
}

class IRNodeCanvas extends IR {
  constructor(init = {}) {
    super({ children: [], ...init })
  }
}

// ---------- Example usage in a component ----------

export function NewEditableText({ initialText = "" }) {
  // Keep IR instance stable for this component’s lifetime.
  const [ir] = useState(() => new IRText({ text: initialText }))

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