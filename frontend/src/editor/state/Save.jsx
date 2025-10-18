import {NameRegistry, ComponentRegistry} from "./ComponentRegistry"
function Save(ir) {
    let name = ComponentRegistry.get(ir.constructor)
    let _data = structuredClone(ir._data)
    let children = ir.children.map(child => Save(child))

    return {name,_data,children}
}
function Load(obj, parent=null) {
    let {name,_data,children} = obj
    let Constructor = NameRegistry.get(name)
    let ir = new Constructor(parent,_data)
    ir.children = []
    children.map(child => Load(child, ir))
    return ir
}
export {Save,Load}

