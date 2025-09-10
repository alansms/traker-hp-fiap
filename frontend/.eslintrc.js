module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react'],
  rules: {
    'no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',  // Desativa a necessidade de importar React explicitamente
    'react/jsx-uses-react': 'off'       // Complemento para a regra anterior
  },
  settings: {
    react: {
      version: 'detect'  // Detecta automaticamente a versão do React
    }
  }
}
