export function variableIsObject(obj: any) {
    return obj !== null && obj !== undefined && obj.constructor.name === "Object";
}
