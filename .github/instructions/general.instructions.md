---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.
The project consists of a web application for analyzing and visualizing algorithmic trading strategy backtests.

## General Context
- The application is designed for quantitative traders, researchers, and developers to upload, process, and review backtest results from various trading engines (with Lean engine as the initial focus).
- Users can visualize performance metrics, trade statistics, and data usage, and compare different strategies or parameter sets.
- The backend architecture consists of two services:
  - A Python backend (FastAPI) responsible for ingesting, parsing, and analyzing backtest results, exposing RESTful APIs for backtest data and analytics.
  - A Next.js backend (API routes) responsible for handling user information, authentication, and user-related workflows.
- The database is containerized and managed via Docker, ensuring portability and consistency across environments.
- The frontend provides interactive dashboards, charts, and tables for exploring backtest data, with a focus on usability, performance, and SEO.
- Security and privacy are important: sensitive data (API keys, URLs, credentials) must be managed via environment variables and never exposed in the UI or codebase.
- The system is extensible to support additional backtest engines and new types of analytics in the future.
- Collaboration and reproducibility are encouraged: users should be able to share results and re-run backtests with the same configuration.
- The application is focused on fostering a cooperative environment between quantitative traders and developers, enabling them to collaborate, share insights, and improve strategies together.

The application should be able to handle backtests from different engines, but the priority is to make it work with Lean engine.
- All API keys, URLs, and other sensitive or delicate information must be stored in a `.env` file and never hardcoded in the source code.
