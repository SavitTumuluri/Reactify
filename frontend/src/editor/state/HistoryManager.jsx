const deleteAbstract = "_DELETE_"
const createAbstract = "_CREATE_"
const moveAbstract   = "_MOVE_"      // NEW: post-pop move with final position

export class HistoryManager {
  undos = []
  redos = []
  commutator = [["sizeRel", "posRel"]]

  constructor() {
    this._attrToGroup = new Map()
    this._groups = this.commutator.map(arr => new Set(arr))
    this._groups.forEach((set, idx) => set.forEach(a => this._attrToGroup.set(a, idx)))
  }

  // ---------- helpers for node link/unlink (no tree walking) ----------
  _linkAt(ir, parent, index) {
    if (!ir || !parent) return false
    // If already at desired spot, no-op
    if (ir.parent === parent && parent.children[index] === ir) {
      parent.forceReRender?.()
      return true
    }
    // If currently attached anywhere, detach first
    if (ir.parent) {
      const p = ir.parent
      const i = p.children.indexOf(ir)
      if (i >= 0) p.children.splice(i, 1)
      p.forceReRender?.()
    }
    ir.parent = parent
    const clamped = Math.max(0, Math.min(index, parent.children.length))
    parent.children.splice(clamped, 0, ir)
    parent.forceReRender?.()
    return true
  }

  _unlink(ir) {
    if (!ir || !ir.parent) return null
    const parent = ir.parent
    const idx = parent.children.indexOf(ir)
    if (idx < 0) return null
    parent.children.splice(idx, 1)
    ir.parent = null
    parent.forceReRender?.()
    return { parent, index: idx }
  }

  // NEW: post-pop move helper — remove from current parent (if any), insert at toIndex in `parent`
  _movePostPop(ir, parent, toIndex) {
    if (!ir || !parent || !Number.isInteger(toIndex)) return false
    // Remove from current parent list, if attached
    if (ir.parent) {
      const curP = ir.parent
      const i = curP.children.indexOf(ir)
      if (i >= 0) curP.children.splice(i, 1)
      curP.forceReRender?.()
    }
    // Insert at final position in destination parent
    ir.parent = parent
    const clamped = Math.max(0, Math.min(toIndex, parent.children.length))
    parent.children.splice(clamped, 0, ir)
    parent.forceReRender?.()
    return true
  }

  _groupIdxFor(attr) {
    return this._attrToGroup.has(attr) ? this._attrToGroup.get(attr) : null
  }
  _isBundle(entry) {
    return entry && entry.length >= 4 && entry[1] && typeof entry[1] === "object" && entry[2] === null
  }
  _promoteToBundle(entry, groupIdx) {
    if (this._isBundle(entry)) return entry
    const [ir, attr, value] = entry
    entry[1] = { [attr]: value }
    entry[2] = null
    entry[3] = groupIdx
    return entry
  }
  _bundleAdd(entry, attr, value) {
    const attrs = entry[1]
    if (!(attr in attrs)) attrs[attr] = value
  }

  // --- MOVE ops are now NON-coalescing (each move is a discrete step)
  _coalescePushMove(stack, ir, payload) {
    stack.push([ir, moveAbstract, { ...payload }, null])
  }

  _coalescePush(stack, ir, attr, value) {
    // Creation/deletion/move ops should NOT coalesce with attr bundles
    if (attr === deleteAbstract || attr === createAbstract) {
      stack.push([ir, attr, value, null])
      return
    }
    if (attr === moveAbstract) {
      this._coalescePushMove(stack, ir, value)   // no coalescing
      return
    }

    const groupIdx = (attr && typeof attr === "string") ? this._groupIdxFor(attr) : null
    const len = stack.length
    if (len > 0) {
      const last = stack[len - 1]
      const lastIr = last[0]
      if (lastIr === ir) {
        if (this._isBundle(last)) {
          const lastGroup = last[3]
          if (groupIdx !== null && groupIdx === lastGroup) {
            this._bundleAdd(last, attr, value)
            return
          }
        } else {
          const lastAttr = last[1]
          const lastGroup = this._groupIdxFor(lastAttr)
          if (lastAttr === attr) return
          if (groupIdx !== null && lastGroup !== null && groupIdx === lastGroup) {
            this._promoteToBundle(last, groupIdx)
            this._bundleAdd(last, attr, value)
            return
          }
        }
      }
    }
    stack.push([ir, attr, value, groupIdx])
  }

  pushUndo(ir, attr, value) { this._coalescePush(this.undos, ir, attr, value) }
  pushRedo(ir, attr, value) { this._coalescePush(this.redos, ir, attr, value) }

  // ---------- creation/deletion history API ----------
  pushUndoDelete(ir, parent, index) {
    if (!ir || !parent || !Number.isInteger(index)) return
    this.redos.length = 0
    this._coalescePush(this.undos, ir, deleteAbstract, { parent, index })
  }
  pushUndoCreate(ir, parent, index) {
    if (!ir || !parent || !Number.isInteger(index)) return
    this.redos.length = 0
    this._coalescePush(this.undos, ir, createAbstract, { parent, index })
  }
  pushRedoDelete(ir, parent, index) {
    this._coalescePush(this.redos, ir, deleteAbstract, { parent, index })
  }
  pushRedoCreate(ir, parent, index) {
    this._coalescePush(this.redos, ir, createAbstract, { parent, index })
  }

  // ---------- MOVE API (explicit payload) ----------
  /**
   * Record a move as a payload { parent, fromIndex, toIndex }.
   * Callers must compute fromIndex BEFORE mutating the tree.
   */
  pushUndoMove(ir, payload) {
    const { parent, fromIndex, toIndex } = payload || {}
    if (!ir || !parent || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return
    this.redos.length = 0
    this._coalescePushMove(this.undos, ir, { parent, fromIndex, toIndex })
  }
  pushRedoMove(ir, payload) {
    const { parent, fromIndex, toIndex } = payload || {}
    if (!ir || !parent || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return
    this._coalescePushMove(this.redos, ir, { parent, fromIndex, toIndex })
  }

  /** Apply entry (attr/bundle/create/delete/move) and return inverse entry. */
  _applyEntryAndBuildInverse(entry, direction /* 'undo' | 'redo' */) {
    const ir = entry[0]

    // --- Handle node creation/deletion ops ---
    if (entry[1] === deleteAbstract) {
      const { parent, index } = entry[2] || {}
      this._linkAt(ir, parent, index)
      return [ir, createAbstract, { parent, index }, null]
    }
    if (entry[1] === createAbstract) {
      const payload = entry[2] || {}
      const where = this._unlink(ir) || payload
      const parent = (where && where.parent) || payload.parent
      const index  = (where && where.index)  || payload.index
      return [ir, deleteAbstract, { parent, index }, null]
    }

    // --- MOVE ---
    if (entry[1] === moveAbstract) {
      const { parent, fromIndex, toIndex } = entry[2] || {}
      if (direction === "undo") {
        // Undo = move back to fromIndex (after pop)
        this._movePostPop(ir, parent, fromIndex)
        // inverse allows redo to re-apply the move to toIndex
        return [ir, moveAbstract, { parent, fromIndex: toIndex, toIndex: fromIndex }, null]
      } else {
        // Redo = move to toIndex (after pop)
        this._movePostPop(ir, parent, toIndex)
        // inverse allows undo to send it back to fromIndex
        return [ir, moveAbstract, { parent, fromIndex: toIndex, toIndex: fromIndex }, null]
      }
    }

    // --- Bundle of attribute restores ---
    if (this._isBundle(entry)) {
      const attrs = entry[1]
      const groupIdx = entry[3]
      const inverseAttrs = {}
      for (const k of Object.keys(attrs)) inverseAttrs[k] = ir.get(k)
      for (const k of Object.keys(attrs)) ir.undoStateSet(k, attrs[k])
      return [ir, inverseAttrs, null, groupIdx]
    }

    // --- Single attribute restore ---
    const attr = entry[1]
    const value = entry[2]
    const groupIdx = entry[3]
    const current = ir.get(attr)
    ir.undoStateSet(attr, value)
    return [ir, attr, current, groupIdx]
  }

  undo() {
    if (this.undos.length === 0) return false
    const entry = this.undos.pop()
    const inverse = this._applyEntryAndBuildInverse(entry, "undo")
    this.redos.push(inverse)
    return true
  }

  redo() {
    if (this.redos.length === 0) return false
    const entry = this.redos.pop()
    const inverse = this._applyEntryAndBuildInverse(entry, "redo")
    this.undos.push(inverse)
    return true
  }

  checkpoint() {}

  clear() { this.undos.length = 0; this.redos.length = 0 }

  // ---------- convenience helpers (updated to new API) ----------
  moveWithHistory(ir, parent, finalIndex) {
    if (!ir) return false
    const currentParent = ir.parent
    const targetParent = parent ?? currentParent
    if (!targetParent || !Number.isInteger(finalIndex) || !currentParent) return false

    // Capture fromIndex BEFORE mutation
    const fromIndex = currentParent.children.indexOf(ir)
    if (fromIndex === -1) return false

    const ok = this._movePostPop(ir, targetParent, finalIndex)
    if (ok) {
      // Use the captured fromIndex (pre-move) when recording history
      this.pushUndoMove(ir, { parent: targetParent, fromIndex, toIndex: finalIndex })
    }
    return ok
  }

  moveBefore(ir, sibling) {
    if (!ir || !sibling || !sibling.parent) return false
    const parent = sibling.parent
    const idx = parent.children.indexOf(sibling)
    return this.moveWithHistory(ir, parent, idx)
  }

  moveAfter(ir, sibling) {
    if (!ir || !sibling || !sibling.parent) return false
    const parent = sibling.parent
    const idx = parent.children.indexOf(sibling)
    return this.moveWithHistory(ir, parent, idx + 1)
  }

  moveToIndex(ir, parent, finalIndex) {
    return this.moveWithHistory(ir, parent, finalIndex)
  }
}
