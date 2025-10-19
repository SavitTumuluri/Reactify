import {NameRegistry, ComponentRegistry} from "./ComponentRegistry"
function Save(ir) {
    const name = ComponentRegistry.get(ir.constructor)
    const _data = structuredClone(ir._data)
    const children = (ir.children || []).map(child => Save(child))
    return { name, _data, children }
}
function Load(obj, parent=null) {
    if (!obj || typeof obj !== "object") return null
    const name = obj.name
    const _data = obj._data ?? {}
    const children = Array.isArray(obj.children) ? obj.children : []
    const Constructor = NameRegistry.get(name)
    if (!Constructor) return null
    const ir = new Constructor(parent, _data)
    ir.children = []
    for (const child of children) Load(child, ir)
    return ir
}
export {Save,Load}

