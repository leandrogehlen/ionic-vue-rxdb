export default {
  title: "Contact schema",
  version: 0,
  description: "Describes a contact",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100
    },
    name: {
      type: "string"
    },
    companyName: {
      type: "string"
    }
  }
}
