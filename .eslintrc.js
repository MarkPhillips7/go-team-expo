module.exports = {
  "env": {
      "browser": true,
      "es6": true
  },
  "extends": "eslint:recommended",
  "globals": {
      "Atomics": "readonly",
      "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
      "ecmaFeatures": {
          "jsx": true
      },
      "ecmaVersion": 2018,
      "sourceType": "module"
  },
  parser: "babel-eslint",
  rules: {
    "graphql/template-strings": ['error', {
      // Import default settings for your GraphQL client. Supported values:
      // 'apollo', 'relay', 'lokka', 'fraql', 'literal'
      env: 'apollo',

      // No schema info needed here because specified in .graphqlconfig

      // Import your schema JSON here
      // schemaJson: require('./instrospectionSchema.json'),

      // OR provide absolute path to your schema JSON (but not if using `eslint --cache`!)
      // schemaJsonFilepath: path.resolve(__dirname, './schema.json'),

      // OR provide the schema in the Schema Language format
      //schemaString: printSchema(schema),

      // tagName is gql by default
    }]
  },
  plugins: [
    'graphql',
    "react"
  ]
}
