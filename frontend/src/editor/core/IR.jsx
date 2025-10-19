import { useState, useEffect, useCallback } from "react";
import getStateman from "../state/GlobalStateManager";   // ← remove if unused

import {deepEqual} from "./deepequal.js"

const stateman = getStateman()
const history = stateman.history
// helper to avoid circular init issues: resolve history only when needed

// ---------- IR Core ----------

export class IR {
  /** @type {IR[]} */ children = []
  parent = null
  /** @type {Record<string, any>} */ _data = {}
  ///** @type {Map<string, React.Dispatch<any>>} */ _setters = new Map()
  /** @type {Map<string, React.Dispatch<any>>} */ _setters = new Map()
  /** @type {Map<string, React.Dispatch<any>>} */ _rawSetters = new Map()

  forceReRender= () =>{}
  constructor(parent, initial = {}) {
    this.parent = parent
    if (this.parent) this.parent.children.push(this)
    this._data = { ...initial }
  }

  /**
   * Mirror a React state slot into IR under `key`.
   * React is the source of truth; IR mirrors via effects.
   *
   * @param {string} key
   * @param {any|() => any} initialValue
   * @returns {[any, (next:any|((prev:any)=>any))=>void]}
   */
  useState(key, initialValue) {
    // lazy init from existing IR value (if present) else initialValue
    const [value, reactSet] = useState(() => {
      if (Object.prototype.hasOwnProperty.call(this._data, key)) {
        return this._data[key]
      }
      return typeof initialValue === "function" ? initialValue() : initialValue
    })

    

    // setter that records history and clears redo
    const set = useCallback((next) => {
      const computed = (typeof next === "function" ? next(prev) : next)
      const prev = this._data[key]
      if(computed == prev || deepEqual(computed,prev)) {
        //Return; don't even dispatch function
        //We control the this._data state
        return
      }
      this._data[key] = computed
      reactSet(prev => {        
        if (history) {
          history.pushUndo(this, key, prev)   // restore-to value
          history.redos.length = 0            // invalidate forward stack
        }
        return computed
      })
    }, [reactSet, key])
    this._setters.set(key,set)
    // raw setter used for history restore (no history writes)
    this._rawSetters.set(key, reactSet)

    return [value, set]
  }

  /**
   * Low-level restore primitive for undo/redo.
   * No history writes (prevents recursion).
   */
  undoStateSet(key, valueToRestore) {
    const raw = this._rawSetters.get(key);
    if (raw) {
      this._data[key] =valueToRestore
      raw(valueToRestore);
      
    } else {
      console.warn("Attempting to write to a unlinked value")
      // Component is detached/unmounted: update the IR snapshot directly.
      this._data[key] = valueToRestore;
    }
  }

  get(key) { return this._data[key] }

  /**
   * Imperative push from IR → React (no auto history).
   * If using this for edits, manually push history first if desired.
   */
  set(key, value) {
    
    
    const setter = this._setters.get(key)
    
    if (setter) setter(value)
    this._data[key] = value
  }

  toJSON() { return { ...this._data } }
  toEffects() { return [] }
  toImports() { return [] }
  toReact() { return "" }
  init() {
    const [id,setID] = useState(0)
    this.forceReRender = () => setID(prev => prev+1)
  }
  readStyle(key, fallback) {
    const s = this.get("styles");
    return (s && key in s) ? s[key] : fallback;
  }
  writeStyle(key, value) {
    const prev = this.get("styles") ?? {};
    // IMPORTANT: create a new object, don't mutate prev in place
    this.set("styles", { ...prev, [key]: value });
  }
  resetElementId() {
    this._data.elementId = `element-${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  toString() {
    if(this._data.elementId) {
      return this._data.elementId
    }
    return `element-${this.constructor.name}-{unnamed}`
  }

}


export class IRRoot extends IR {
  constructor(parent, inputs) {
    super(parent, inputs)
  }

  toReact() {
    /** @type {Set<string>} */ const effects = new Set()
    /** @type {Set<string>} */ const imports = new Set()

    const Explorer = (ir) => {
      for (const e of ir.toEffects()) effects.add(e)
      for (const im of ir.toImports()) imports.add(im)
      for (const child of ir.children) Explorer(child)
    }
    Explorer(this)

    let importString = ""
    for (const im of imports) importString += im + "\n"

    let effectString = ""
    for (const e of effects) effectString += e + "\n"

    let divString = ""
    for (const child of this.children) divString += child.toReact() + "\n"

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
  unlink(direction = "do") {
    const parent = abstractParent;
    history.pushUndoDelete(this,parent,0)
  }
}

export class IRView extends IR {
  constructor(parent, inputs) {
    super(parent, inputs)
    // Ensure each element has a stable ID for React key prop
    if (!this._data.elementId) {
      this.resetElementId()
    }
  }
  toReact() {
    const parts = []
    for (const child of this.children) {
      parts.push(child.toReact())
    }
    return `<div>${parts.join("")}</div>\n`
  }
  unlink(direction = "do") {
    const parent = this.parent;
    const idx = parent.children.indexOf(this);
    if (idx !== -1) {
      parent.children.splice(idx, 1);
      parent.forceReRender()
    }
    history.pushUndoDelete(this,parent,idx)
  }
  relink(parent, toIndex, direction = "do") {

  }
}
