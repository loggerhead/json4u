# Gemini Project Configuration: json4u

## Project Overview

json4u is a web-based application designed as a comprehensive toolkit for working with JSON data. It is built with Next.js and provides features for viewing, editing, formatting, validating, and converting JSON. The application leverages a modern tech stack including React, TypeScript, and Tailwind CSS for a responsive and efficient user experience.

## Requirements to Be Strictly Followed

- When executing the `pnpm test` command, it must complete within 5 seconds; otherwise, it will be considered a failure.
- Do not execute git commands that result in write operations.
- Unless necessary, do not modify the `package.json` and `pnpm-lock.yaml` files.

## Global Commands

Use these commands from the project root directory.

- **Install all dependencies:** `pnpm install`
- **Run tests:** `timeout 5s pnpm test` (unit/integration)
- **Run e2e tests:** `timeout 600s pnpm e2e` (Run end-to-end tests using MCP `playwright`)
- **Run linting and formatting check:** `pnpm lint`
- **Start the development server:** `pnpm dev`
- **Build for production:** `pnpm build`
- **Preview production build:** `pnpm preview`

## Project Structure

This project is a monolithic Next.js application. The core application logic is organized within the `src` directory. Below is a breakdown of the key directories and their purpose, designed to be easily understood by an AI agent.

- **`src/app`**: This is the heart of the application, following the Next.js App Router convention. It contains all the routes, pages, and layouts. Each folder inside `app` maps to a URL segment, and `page.tsx` files define the UI for those segments. This is the primary directory for understanding the application's UI and routing structure.

- **`src/components`**: Contains reusable, general-purpose UI components (e.g., buttons, inputs, dialogs) built with Radix UI and styled with Tailwind CSS. These are the fundamental building blocks of the user interface.

- **`src/containers`**: Holds larger, more complex components that often represent a specific feature or section of a page (e.g., the main JSON editor view, the file import/export panel). These components typically compose smaller components from `src/components` and manage feature-specific state and logic.

- **`src/lib`**: A crucial directory containing most of the application's core business logic, utility functions, and integrations with external services. This includes JSON parsing/formatting algorithms, data transformation logic, and client-side code for interacting with services like Supabase. When looking for how a specific data manipulation is performed, this is the place to start.

- **`src/stores`**: Implements global state management using Zustand. Each file defines a "store," which is a slice of the application's global state and the actions to modify it. This is key to understanding how different parts of the application share and react to data changes, such as the main JSON content or user settings.

- **`src/i18n`**: Manages internationalization (i18n). It contains the configuration for `next-intl` and the message files (e.g., `en.json`, `zh.json`) that store translations for the UI.

## Coding Conventions

- **Commit Messages:** Follow the Conventional Commits specification (e.g., `feat(editor): add new formatting option`).
- **Code Style:** Adhere to the rules defined in `.eslintrc.json` and `.prettierrc`. Use `pnpm lint` to check for compliance.
- **Detailed Project Rules:** For more specific guidelines on code style, directory structure, testing, and more, please refer to the detailed project conventions document: `/.trae/rules/project_rules.md`.
