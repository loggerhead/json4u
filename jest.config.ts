import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    ".(js|jsx)$": require.resolve("babel-jest"), // jest's default
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!json-map-ts)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: ["src/**/*.{ts,tsx,js,jsx}"],
  testMatch: ["<rootDir>/__tests__/**/*.(spec|test).{ts,tsx,js,jsx}"],
  globals: {
    __DEV__: true,
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
