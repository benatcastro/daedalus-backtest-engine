import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            // Enforce using @ alias for internal imports
            "no-restricted-imports": [
                "error",
                {
                    "patterns": [
                        {
                            "group": ["../../../*", "../../*", "../*"],
                            "message": "Use @ alias instead of relative imports for better maintainability"
                        },
                        {
                            "group": ["src/*"],
                            "message": "Use @ alias instead of 'src/'. Import from '@/' instead"
                        }
                    ]
                }
            ]
        }
    }
];

export default eslintConfig;
