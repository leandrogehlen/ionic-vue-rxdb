export default {
  version: 0,
  description: "Category schema",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100
    },
    name: {
      type: "string"
    }
  }
}
