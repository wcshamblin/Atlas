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
            'no-unreachable': 'off',
            'react/prop-types': 'off',
            'react/jsx-key': 'off',
            'react/no-unknown-property': 'off',

            '@typescript-eslint/no-unused-vars': 'off',
            'no-var': 'off',
            'prefer-const': 'off',
            'no-useless-escape': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-constant-binary-expression': 'off',
            'no-dupe-else-if': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'react/no-unescaped-entities': 'off',
            'no-empty': 'off',
            'no-extra-boolean-cast': 'off',
            'no-constant-condition': 'off',
            'no-empty-pattern': 'off',
            'no-prototype-builtins': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            'no-redeclare': 'off',
            'no-sparse-arrays': 'off',
            'no-fallthrough': 'off',
            '@typescript-eslint/no-array-constructor': 'off',
            'no-case-declarations': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-unnecessary-type-constraint': 'off',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
            'no-self-assign': 'off',

            // when verbatimModuleSyntax is on in tsconfig this should be on
            '@typescript-eslint/consistent-type-imports': 'warn',

            "unused-imports/no-unused-imports": "off",
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