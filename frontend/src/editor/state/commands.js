// commands.js
// One-shot commands with built-in coalescing protocol.
// - execute(): performs the action and returns its inverse command; invalidates self.
// - attemptCoalesce(prevOrBarrier?): returns one of COALESCE.REPLACE | CONTINUE | STOP
//   * REPLACE: "I merged (or decided to drop) the incoming; replace the stack entry with my returned replacement"
//   * CONTINUE: "I can't coalesce with me; keep walking backward to older entries"
//   * STOP: "Barrier — do not scan further; push the incoming command to the end"
// No external ctx required: structural helpers are implemented here and used by structural commands.

export const COALESCE = Object.freeze({
  REPLACE: "REPLACE",
  CONTINUE: "CONTINUE",
  STOP: "STOP",
});

// ---------- pretty printing helpers ----------
function irRepr(x) {
  if (!x) return "∅";
  try {
    if (typeof x.toString === "function") return x.toString();
  } catch {}
  return "[IR]";
}

function truncate(str, n = 140) {
  if (typeof str !== "string") return String(str);
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function valRepr(v) {
  try {
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return truncate("[" + v.map(valRepr).join(", ") + "]");
    // object/function/etc — safe-ish stringify
    return truncate(JSON.stringify(v, (_k, val) => {
      if (typeof val === "function") return "[Function]";
      if (val && typeof val === "object") {
        // avoid dumping massive IRs or cyclic refs
        if (typeof val.toString === "function" && val.toString !== Object.prototype.toString) {
          const s = val.toString();
          // if it looks like an IR, use that
          if (s && s !== "[object Object]") return s;
        }
      }
      return val;
    }));
  } catch {
    return "[Unprintable]";
  }
}

function kvRepr(obj) {
  if (!obj || typeof obj !== "object") return "{}";
  const parts = [];
  for (const k of Object.keys(obj)) parts.push(`${k}: ${valRepr(obj[k])}`);
  return "{ " + parts.join(", ") + " }";
}

// ---------- structural helpers (local to this module) ----------
function linkAt(ir, parent, index) {
  if (!ir || !parent) return false;
  // If already at desired spot, no-op
  if (ir.parent === parent && parent.children[index] === ir) {
    parent.forceReRender?.();
    return true;
  }
  // If currently attached anywhere, detach first
  if (ir.parent) {
    const p = ir.parent;
    const i = p.children.indexOf(ir);
    if (i >= 0) p.children.splice(i, 1);
    p.forceReRender?.();
  }
  ir.parent = parent;
  const clamped = Math.max(0, Math.min(index, parent.children.length));
  parent.children.splice(clamped, 0, ir);
  parent.forceReRender?.();
  return true;
}

function unlink(ir) {
  if (!ir || !ir.parent) return null;
  const parent = ir.parent;
  const idx = parent.children.indexOf(ir);
  if (idx < 0) return null;
  parent.children.splice(idx, 1);
  ir.parent = null;
  parent.forceReRender?.();
  return { parent, index: idx };
}

// Remove from current parent (if any), then insert at toIndex in `parent`
function movePostPop(ir, parent, toIndex) {
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

// ---------- command base ----------
class BaseCommand {
  constructor() { this._active = true; }
  _assertActive() {
    if (!this._active) throw new Error("Command has already been executed and is invalid.");
  }
  // Default: barrier for others? No — default is transparent.
  attemptCoalesce(_incoming) { return { action: COALESCE.CONTINUE }; }
  get type() { return this.constructor.name; }

  // Pretty repr fallback
  toString() {
    return `${this.type}()`;
  }
}

// ---------- commutator (grouping) logic is IN commands now ----------
const DEFAULT_COMMUTATOR = [["sizeRel", "posRel"]];

function buildAttrToGroup(commutator = DEFAULT_COMMUTATOR) {
  const m = new Map();
  commutator.forEach((arr, idx) => {
    for (const a of arr) m.set(a, idx);
  });
  return m;
}
const ATTR_TO_GROUP = buildAttrToGroup();

function groupForKeys(keys) {
  let g = null;
  for (const k of keys) {
    const kg = ATTR_TO_GROUP.has(k) ? ATTR_TO_GROUP.get(k) : null;
    if (kg == null) return null; // ungrouped key -> treat as ungrouped set
    if (g == null) g = kg;
    else if (g !== kg) return null; // mixed groups -> not coalescible via group rule
  }
  return g;
}

/** Attribute set for a single attr or a bundle {attr:value,...}. */
export class AttrSetCommand extends BaseCommand {
  /**
   * @param {object} params
   *  - ir: IR node
   *  - attr: string | null      (if single)
   *  - value: any               (if single)
   *  - attrs: object | null     (if bundle)
   */
  constructor({ ir, attr = null, value = null, attrs = null }) {
    super();
    this.ir = ir;

    if (attrs && attr) throw new Error("Provide either {attr,value} or {attrs}, not both.");
    if (attrs) {
      this._bundle = { ...attrs }; // {k:v}
      this._single = null;
    } else {
      this._single = { attr, value };
      this._bundle = null;
    }

    // compute coalesce-group for the set of keys
    const ks = this._keys();
    this._groupIdx = groupForKeys(ks); // may be null
  }

  // --- helpers for form and keys
  _keys() {
    if (this._single) return [this._single.attr];
    return Object.keys(this._bundle);
  }
  _promoteToBundle() {
    if (this._bundle) return;
    const { attr, value } = this._single;
    this._bundle = { [attr]: value };
    this._single = null;
  }
  _mergeFrom(other) {
    // "first write wins": do NOT overwrite existing keys
    if (other._single) {
      const { attr, value } = other._single;
      if (!(attr in this._bundle)) this._bundle[attr] = value;
    } else if (other._bundle) {
      for (const k of Object.keys(other._bundle)) {
        if (!(k in this._bundle)) this._bundle[k] = other._bundle[k];
      }
    }
  }

  /**
   * Coalescing protocol (executed on the EXISTING stack entry; `incoming` is the new command):
   * 1) If not same IR -> CONTINUE (look past me).
   * 2) If `incoming` is not AttrSetCommand -> STOP (structural/other ops are barriers).
   * 3) If both have SAME non-null groupIdx -> merge (REPLACE with my modified self).
   * 4) Else if key-overlap -> treat as duplicate writes; drop incoming (REPLACE with my unmodified self).
   * 5) Else -> CONTINUE (let older entries try).
   */
  attemptCoalesce(incoming) {
    if (!(incoming instanceof AttrSetCommand)) {
      // Structural commands (or other kinds) are a boundary.
      return { action: COALESCE.STOP };
    }
    if (this.ir !== incoming.ir) {
      return { action: COALESCE.STOP };
    }

    // Group-based coalescing
    if (this._groupIdx != null && incoming._groupIdx != null && this._groupIdx === incoming._groupIdx) {
      if (!this._bundle) this._promoteToBundle();
      this._mergeFrom(incoming);
      return { action: COALESCE.REPLACE, replacement: this };
    }

    // Duplicate-key coalescing (no groups).
    const s1 = new Set(this._keys());
    const s2 = new Set(incoming._keys());
    let overlap = false;
    for (const k of s2) { if (s1.has(k)) { overlap = true; break; } }
    if (overlap) {
      // First write wins; keep me, drop incoming
      return { action: COALESCE.REPLACE, replacement: this };
    }

    // Not coalescible with me — try older entries
    return { action: COALESCE.STOP };
  }

  execute() {
    this._assertActive();
    const ir = this.ir;

    if (this._bundle) {
      const prev = {};
      for (const k of Object.keys(this._bundle)) prev[k] = ir.get(k);
      for (const k of Object.keys(this._bundle)) ir.undoStateSet(k, this._bundle[k]);

      this._active = false;
      return new AttrSetCommand({ ir, attrs: prev });
    } else {
      const { attr, value } = this._single;
      const current = ir.get(attr);
      ir.undoStateSet(attr, value);

      this._active = false;
      return new AttrSetCommand({ ir, attr, value: current });
    }
  }

  toString() {
    const tgt = irRepr(this.ir);
    if (this._bundle) {
      return `AttrSet(${tgt} :: ${kvRepr(this._bundle)})`;
    } else {
      const { attr, value } = this._single || {};
      return `AttrSet(${tgt} :: ${attr} = ${valRepr(value)})`;
    }
  }
}

/** Create node at parent/index (i.e., link at). Inverse is DeleteCommand. */
export class CreateCommand extends BaseCommand {
  constructor({ ir, parent, index }) {
    super();
    this.ir = ir;
    this.parent = parent;
    this.index = index;
  }
  // Structural ops are barriers for attr coalescing across them
  attemptCoalesce(_incoming) { return { action: COALESCE.STOP }; }
  execute() {
    this._assertActive();
    linkAt(this.ir, this.parent, this.index); // idempotent link
    this._active = false;
    return new DeleteCommand({ ir: this.ir, parent: this.parent, index: this.index });
  }
  toString() {
    return `Create(${irRepr(this.ir)} → parent=${irRepr(this.parent)} @ ${this.index})`;
  }
}

/** Delete node from its parent/index (i.e., unlink). Inverse is CreateCommand. */
export class DeleteCommand extends BaseCommand {
  constructor({ ir, parent, index }) {
    super();
    this.ir = ir;
    this.parent = parent;
    this.index = index;
  }
  attemptCoalesce(_incoming) { return { action: COALESCE.STOP }; }
  execute() {
    this._assertActive();
    const where = unlink(this.ir) || { parent: this.parent, index: this.index };
    const parent = where?.parent ?? this.parent;
    const index = Number.isInteger(where?.index) ? where.index : this.index;

    this._active = false;
    return new CreateCommand({ ir: this.ir, parent, index });
  }
  toString() {
    return `Delete(${irRepr(this.ir)} from parent=${irRepr(this.parent)} @ ${this.index})`;
  }
}

/** Move node within a parent fromIndex -> toIndex (post-pop semantics). */
export class MoveCommand extends BaseCommand {
  constructor({ ir, parent, fromIndex, toIndex }) {
    super();
    this.ir = ir;
    this.parent = parent;
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  }
  // Moves are discrete and also act as a barrier.
  attemptCoalesce(_incoming) { return { action: COALESCE.STOP }; }
  execute() {
    this._assertActive();
    movePostPop(this.ir, this.parent, this.toIndex);
    this._active = false;
    return new MoveCommand({
      ir: this.ir,
      parent: this.parent,
      fromIndex: this.toIndex,
      toIndex: this.fromIndex
    });
  }
  toString() {
    return `Move(${irRepr(this.ir)} in parent=${irRepr(this.parent)} : ${this.fromIndex} → ${this.toIndex})`;
  }
}

export { BaseCommand };
