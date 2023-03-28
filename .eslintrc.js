module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
    },
    overrides: [],
    parserOptions: {
        ecmaVersion: "latest",
    },
    rules: {
        "prefer-const": "error",
    },
    extends: "eslint:recommended",
};
