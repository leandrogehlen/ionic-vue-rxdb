export default {
  version: 0,
  description: "Tag schema",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100
    },
    description: {
      type: "string"
    }
  }
}
