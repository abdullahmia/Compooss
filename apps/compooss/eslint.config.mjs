import nextConfig from "eslint-config-next";
import nextTypescriptConfig from "eslint-config-next/typescript";

const eslintConfig = [...nextConfig, ...nextTypescriptConfig, {
  ignores: ["public/monaco/**"],
}, {
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
  },
}];

export default eslintConfig;
