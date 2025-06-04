---
applyTo: 'frontend/src/app/strategy/[id]/backtests/[bt_id]/**'
---
# Backtest Visualization Page - GitHub Copilot Instructions

## Page Overview
This is a sophisticated trading backtest analysis interface with 4 main sections: toolbar, main chart, timeline navigator, and info panel. The page should feel like a professional trading platform with Photoshop-like annotation tools.

## Architecture Principles
- **Component-based**: Break functionality into reusable, testable components
- **Hook-driven**: Use custom hooks for data management, state, and complex logic
- **Responsive-first**: Mobile-friendly design with progressive enhancement
- **Performance-focused**: Implement virtualization and pagination for large datasets
- **Accessibility**: Full keyboard navigation and screen reader support

## Data Management
- **Pagination**: Load candlestick data in chunks (1000 candles per request)
- **Caching**: Keep 3 chunks in memory (current + adjacent for smooth scrolling)
- **Real-time**: Support WebSocket updates for live backtests
- **State**: Use React Context or Zustand for complex state management

## Component Guidelines

### Chart Components
- Use lightweight-charts library for candlestick visualization
- Implement custom overlay for bot operations (buy/sell markers)
- Support multiple chart types: candlestick, line, area
- Add technical indicators: MA, RSI, MACD, Bollinger Bands
- Implement crosshair with price/time information
- Support chart export (PNG, SVG)

### Toolbar Components
- Create tool palette similar to Photoshop/design tools
- Tools: select, pan, zoom, line, rectangle, text, arrow, color picker
- Each tool should have its own React component with specific behavior
- Use Context for tool state management
- Implement tool shortcuts (keyboard hotkeys)
- Add undo/redo functionality with command pattern

### Timeline Components
- Show bot operations as timeline events (buy, sell, strategy changes)
- Implement event filtering and categorization
- Support click-to-navigate functionality
- Add mini-chart overview of entire backtest period
- Display key metrics: total trades, win rate, max drawdown

### Responsive Design
- **Desktop**: Full 4-section layout with sidebars
- **Tablet**: Collapsible sidebars, floating toolbars
- **Mobile**: Stacked layout, swipeable timeline, gesture support
- Use CSS Grid for main layout, Flexbox for components
- Implement touch gestures: pinch-to-zoom, pan, tap-to-select

## Performance Requirements
- Chart should render 10,000+ candles smoothly
- Implement canvas-based rendering for annotations
- Use React.memo and useMemo for expensive calculations
- Debounce user interactions (zoom, pan, drawing)
- Lazy load data outside viewport

## Styling Guidelines
- Use Shadcn UI components as base building blocks
- Dark theme optimized for financial data visualization
- High contrast colors for accessibility
- Consistent spacing using Tailwind design tokens
- Smooth animations for UI transitions (framer-motion)

## TypeScript Standards
- Define comprehensive interfaces for all data types
- Use discriminated unions for tool states and chart modes
- Implement proper error boundaries and loading states
- Type all event handlers and callback functions
- Use generic types for reusable components

## Testing Requirements
- Unit tests for all hooks using React Testing Library
- Integration tests for chart interactions
- Visual regression tests for chart rendering
- Performance tests for large datasets
- Accessibility tests with axe-core

## API Integration
- Implement SWR for data fetching with revalidation
- Support real-time updates via WebSocket
- Handle offline scenarios with cached data
- Implement optimistic updates for annotations
- Add retry logic for failed requests

## Security Considerations
- Sanitize all user-generated annotations
- Validate chart data before rendering
- Implement rate limiting for API calls
- Secure WebSocket connections
- Prevent XSS in text annotations

## Code Organization
```
hooks/          # Custom hooks for data and state management
components/     # Reusable UI components
types/          # TypeScript interfaces and types
utils/          # Helper functions and constants
contexts/       # React Context providers
constants/      # Chart colors, tool configurations
__tests__/      # Component and hook tests
```

## Key Features to Implement
1. **Chart Visualization**: High-performance candlestick charts with bot overlays
2. **Annotation Tools**: Line drawing, shapes, text, arrows with styling
3. **Timeline Navigation**: Event-based navigation with filtering
4. **Data Pagination**: Smooth loading of large datasets
5. **Mobile Support**: Touch-friendly interface with gestures
6. **Export Functionality**: Chart export and annotation sharing
7. **Real-time Updates**: Live backtest monitoring
8. **Performance Metrics**: Trade analysis and statistics

## Browser Support
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers
- Canvas fallback for advanced features

## Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation for all tools
- Screen reader announcements for chart updates
- High contrast mode support
- Focus management for modal dialogs
- Alternative text for visual elements

Remember: This is a professional trading analysis tool. Prioritize performance, accuracy, and user experience. Every interaction should feel responsive and purposeful.
