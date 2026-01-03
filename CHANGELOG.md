# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- ARS ⇄ BOB P2P converter using Binance reference prices
- Manual price refresh functionality (no background fetch)
- Configuration panel with lazy-loaded sections
- Light / Dark theme system with CSS token-based theming
- Rate-limited API requests (60s cooldown)
- Reference prices table with filtering (ARS/BOB, BUY/SELL)
- Cache status badge with visual feedback
- Success toast notifications
- Icon protection (right-click, drag, download prevention)
- **Persistencia completa de estado por dispositivo (cookies + localStorage)**
- **Cooldown persistente que sobrevive a recargas de página**
- **Restauración automática de precios, inputs y estado UI al recargar**
- **Sistema de consentimiento explícito para cache local**
- **Estado canónico centralizado (appState)**
- **Sincronización completa post-reload sin pérdida de datos**

### Fixed
- **Cooldown roto al recargar página** - Ahora persiste correctamente usando cookies
- **Botón de actualización bloqueado incorrectamente** - Estados claros basados en appState
- **Doble contador de cooldown** - Unificado en un solo timer y contador visual
- **Pérdida de datos al reload** - Precios, inputs y estado UI se restauran automáticamente
- **Animaciones bruscas en tabla de referencia** - Transiciones suaves con will-change
- **Estados visuales inconsistentes** - Botón refleja estado real del sistema
- **Focus azul por defecto en botones** - Reemplazado por focus-visible accesible

### Security
- Hardened Content Security Policy (CSP) without unsafe-inline
- No automatic fetch or background polling
- No secrets in frontend code
- Read-only cache for UI layer
- Protected icons and assets
- Secure API proxy with validation
- **Rate limiting y cooldown persistente por dispositivo (cookies)**
- **Protección real contra refresh spam a la API**
- **Consentimiento explícito para uso de cache local**

### Performance
- True lazy loading for heavy panels (only on user interaction)
- No blocking operations on main thread
- UI feedback < 100ms
- Optimized animations (transform, opacity only)
- Efficient cache management

### Accessibility
- WCAG AA/AAA contrast compliance
- Complete keyboard navigation
- ARIA attributes on all interactive elements
- Focus-visible states
- Screen reader compatibility
- Hit targets ≥ 44px

### UX/UI
- Professional fintech-grade design
- Micro-interactions and subtle animations
- Loading states and skeletons
- Clear error messages (human-readable)
- Visual cache status indicators
- Responsive design (1:1 square layout)
- Unified button system

### Technical
- Vanilla JavaScript (no frameworks)
- ES6 modules
- SPA routing (hash-based)
- CSS custom properties (tokens)
- Static site deployment (Vercel)
- No build step required

### Notes
- First stable release
- Production-ready
- Fully audited and approved

