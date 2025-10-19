// historymanager.js
// Public API is preserved for all NON-underscore methods.
// With the new semantics, coalescing/commutator logic lives in commands.
// HistoryManager is now a simple recorder + executor for undo/redo.

import {
  COALESCE,
  AttrSetCommand,
  CreateCommand,
  DeleteCommand,
  MoveCommand,
} from "./commands.js";

export class HistoryManager {
  undos = [];
  redos = [];

  constructor() {}

  // ---------- private structural helper used by convenience move* APIs ----------
  _movePostPop(ir, parent, toIndex) {
    if (!ir || !parent || !Number.isInteger(toIndex)) return false;
    if (ir.parent) {
      const curP = ir.parent;
      const i = curP.children.indexOf(ir);
      if (i >= 0) curP.children.splice(i, 1);
      curP.forceReRender?.();
    }
    ir.parent = parent;
    const clamped = Math.max(0, Math.min(toIndex, parent.children.length));
    parent.children.splice(clamped, 0, ir);
    parent.forceReRender?.();
    return true;
  }

  // ---------- generic coalescing push (scan backward with command semantics) ----------
  _coalescePushCommand(stack, incoming) {
    for (let i = stack.length - 1; i >= 0; i--) {
      const existing = stack[i];
      const decision = existing?.attemptCoalesce?.(incoming) || { action: COALESCE.STOP };

      if (decision.action === COALESCE.REPLACE) {
        // Replace the existing entry with the provided replacement (often itself after merging).
        if (decision.replacement) stack[i] = decision.replacement;
        // If no replacement provided, keep existing as-is (incoming is effectively dropped).
        return;
      } else if (decision.action === COALESCE.CONTINUE) {
        // Try older entries
        continue;
      } else {
        // STOP (barrier) — cannot go past this entry; push incoming at the end.
        stack.push(incoming);
        return;
      }
    }
    // No one absorbed it — push normally.
    stack.push(incoming);
  }

  _pushUndo(cmd) {
    this.redos.length = 0;
    this._coalescePushCommand(this.undos, cmd);
  }
  _pushRedo(cmd) {
    this._coalescePushCommand(this.redos, cmd);
  }

  // ---------- PUBLIC API: attribute history ----------
  pushUndo(ir, attr, value) {
    this._pushUndo(new AttrSetCommand({ ir, attr, value }));
  }
  pushRedo(ir, attr, value) {
    this._pushRedo(new AttrSetCommand({ ir, attr, value }));
  }

  // ---------- PUBLIC API: creation/deletion ----------
  // Forward delete happened; to UNDO we must CREATE it back.
  pushUndoDelete(ir, parent, index) {
    if (!ir || !parent || !Number.isInteger(index)) return;
    this._pushUndo(new CreateCommand({ ir, parent, index }));
  }
  // Forward create happened; to UNDO we must DELETE it.
  pushUndoCreate(ir, parent, index) {
    if (!ir || !parent || !Number.isInteger(index)) return;
    this._pushUndo(new DeleteCommand({ ir, parent, index }));
  }
  // Redo keeps forward ops (re-apply).
  pushRedoDelete(ir, parent, index) {
    this._pushRedo(new DeleteCommand({ ir, parent, index }));
  }
  pushRedoCreate(ir, parent, index) {
    this._pushRedo(new CreateCommand({ ir, parent, index }));
  }

  // ---------- PUBLIC API: MOVE (explicit payload, non-coalescing) ----------
  /**
   * payload = { parent, fromIndex, toIndex } where fromIndex is captured BEFORE the forward move.
   * For UNDO we push the inverse (to -> from).
   */
  pushUndoMove(ir, payload) {
    const { parent, fromIndex, toIndex } = payload || {};
    if (!ir || !parent || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
    this._pushUndo(new MoveCommand({ ir, parent, fromIndex: toIndex, toIndex: fromIndex }));
  }
  pushRedoMove(ir, payload) {
    const { parent, fromIndex, toIndex } = payload || {};
    if (!ir || !parent || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
    this._pushRedo(new MoveCommand({ ir, parent, fromIndex, toIndex }));
  }

  // ---------- PUBLIC API: undo/redo ----------
  undo() {
    if (this.undos.length === 0) return false;
    const cmd = this.undos.pop();
    const inverse = cmd.execute(); // command handles its own structural logic; returns inverse
    this.redos.push(inverse);
    return true;
  }

  redo() {
    if (this.redos.length === 0) return false;
    const cmd = this.redos.pop();
    const inverse = cmd.execute();
    this.undos.push(inverse);
    return true;
  }

  clear() {
    this.undos.length = 0;
    this.redos.length = 0;
  }

  // ---------- PUBLIC API: convenience move helpers (unchanged external API) ----------
  moveWithHistory(ir, parent, finalIndex) {
    if (!ir) return false;
    const currentParent = ir.parent;
    const targetParent = parent ?? currentParent;
    if (!targetParent || !Number.isInteger(finalIndex) || !currentParent) return false;

    const fromIndex = currentParent.children.indexOf(ir);
    if (fromIndex === -1) return false;

    const ok = this._movePostPop(ir, targetParent, finalIndex);
    if (ok) {
      // record inverse on undo reel
      this.pushUndoMove(ir, { parent: targetParent, fromIndex, toIndex: finalIndex });
    }
    return ok;
  }

  moveBefore(ir, sibling) {
    if (!ir || !sibling || !sibling.parent) return false;
    const parent = sibling.parent;
    const idx = parent.children.indexOf(sibling);
    return this.moveWithHistory(ir, parent, idx);
  }

  moveAfter(ir, sibling) {
    if (!ir || !sibling || !sibling.parent) return false;
    const parent = sibling.parent;
    const idx = parent.children.indexOf(sibling);
    return this.moveWithHistory(ir, parent, idx + 1);
  }

  moveToIndex(ir, parent, finalIndex) {
    return this.moveWithHistory(ir, parent, finalIndex);
  }
}

export default HistoryManager;
