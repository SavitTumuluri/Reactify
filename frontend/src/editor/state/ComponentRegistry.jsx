export const ComponentRegistry = new Map()
export const NameRegistry = new Map()
export function RegisterComponent(Constructor, Name = Constructor.name) {
    ComponentRegistry.set(Constructor,Name)
    NameRegistry.set(Name,Constructor)
}