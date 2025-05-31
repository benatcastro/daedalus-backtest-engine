---
applyTo: 'frontend/**'
---
# Frontend Coding Standards and Preferences

- Use React with functional components and hooks.
- Prefer TypeScript for type safety.
- Follow a modular component structure.
- Use descriptive prop and variable names.
- Prioritize accessibility (a11y) and responsive design.
- Use Shadcdn UI components as the first choice for UI elements; prefer Shadcdn over custom CSS or other component libraries.
- Use CSS modules or styled-components only when Shadcdn components are insufficient.
- Integrate with backend APIs using async/await and handle errors gracefully.
- Write unit tests for components using Jest and React Testing Library.
- Keep UI/UX clean and intuitive for visualizing backtest results.
- Prioritize caching and frontend performance (e.g., use Next.js data fetching strategies, memoization, and CDN for static assets).
- Ensure all HTML is SEO-friendly: use semantic tags, set meta tags, and optimize for search engines.

## Next.js Server (API) REST Best Practices
- Use resource-oriented API routes under `/api` (e.g., `/api/backtests/[id]`).
- Use standard HTTP methods: GET, POST, PUT/PATCH, DELETE.
- Return appropriate HTTP status codes and JSON responses.
- Validate and sanitize all incoming data.
- Document API endpoints and expected request/response formats.

## Tech Stack Explanation
- **Next.js**: React framework for SSR, SSG, and API routes.
- **TypeScript**: Type safety and better developer experience.
- **Shadcdn**: Preferred UI component library for consistent and rapid UI development.
- **Tailwind CSS**: Utility-first CSS framework, used when Shadcdn components are not sufficient.
- **Jest/React Testing Library**: Testing tools for frontend components.
- **React**: Component-based UI library.
