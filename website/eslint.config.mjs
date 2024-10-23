import tsParser from "@typescript-eslint/parser";
import reactRefresh from "eslint-plugin-react-refresh";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import unusedImports from "eslint-plugin-unused-imports";
import globals from 'globals';

export default [
    pluginJs.configs.recommended,
    pluginReact.configs.flat.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,ts,mts,jsx,tsx}"],
        plugins: {
            "typescript-eslint": tseslint,
            "react-refresh": reactRefresh,
            "@eslint/js": pluginJs,
            "eslint-plugin-react": pluginReact,
            "unused-imports": unusedImports,
        },
        languageOptions: {
            globals: globals.browser,
            parser: tsParser,
            sourceType: "module",
        },
        rules: {
            'no-unreachable': 'warn',
            'react/prop-types': 'warn',
            'react/jsx-key': 'warn',
            'react/no-unknown-property': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-var': 'warn',
            'prefer-const': 'warn',
            'no-useless-escape': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
            '@typescript-eslint/no-unused-expressions': 'warn',
            'no-constant-binary-expression': 'warn',
            'no-dupe-else-if': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            'react/no-unescaped-entities': 'warn',
            'no-empty': 'warn',
            'no-extra-boolean-cast': 'warn',
            'no-constant-condition': 'warn',
            'no-empty-pattern': 'warn',
            'no-prototype-builtins': 'warn',
            '@typescript-eslint/no-wrapper-object-types': 'warn',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            'no-redeclare': 'warn',
            'no-sparse-arrays': 'warn',
            'no-fallthrough': 'warn',
            '@typescript-eslint/no-array-constructor': 'warn',
            'no-case-declarations': 'warn',
            '@typescript-eslint/no-this-alias': 'warn',
            '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
            'no-self-assign': 'warn',
            "unused-imports/no-unused-imports": "warn",

            // when verbatimModuleSyntax is on in tsconfig this should be on
            '@typescript-eslint/consistent-type-imports': 'warn',
        },
    },
    {
        ignores: ["public/assets/*.js", "dist/assets/*.js"],
    },
    {
        settings: {
            react: {
                version: "detect"
            }
        }
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        rules: {
            'no-undef': 'off',
        },
    },
]