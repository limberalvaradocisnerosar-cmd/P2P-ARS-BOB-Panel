# 🧾 P2P Panel v1.0

## 📌 Descripción

**P2P Panel** es una herramienta financiera profesional para **conversión ARS ⇄ BOB** utilizando **precios de referencia P2P de Binance**.

### ¿Qué hace?
- ✅ Convierte montos entre ARS y BOB usando precios de referencia de Binance P2P
- ✅ Muestra tabla de precios de referencia filtrable (ARS/BOB, BUY/SELL)
- ✅ Permite actualización manual de precios (botón "Actualizar precios")
- ✅ Sistema de temas claro/oscuro
- ✅ Panel de configuración con información del sistema

### ¿Qué NO hace?
- ❌ **NO realiza trading** - Solo muestra precios de referencia
- ❌ **NO hace fetch automático** - Solo cuando el usuario hace click
- ❌ **NO ejecuta lógica en segundo plano** - Todo es user-action driven
- ❌ **NO almacena datos de usuario** - Solo cache temporal de precios (60s)

---

## ✨ Features principales

### Conversión ARS ⇄ BOB
- Conversión bidireccional usando precios de referencia Binance P2P
- Cálculo basado en mediana de top 15 anuncios filtrados
- Filtrado automático (mínimo 50 órdenes/mes, 95% completion rate)

### Referencia Binance P2P
- Tabla de precios de referencia colapsable
- Filtros por mercado (ARS/BOB) y lado (BUY/SELL)
- Solo se muestra cuando el usuario lo solicita

### Manual refresh only
- Botón "Actualizar precios" para actualización manual
- Rate limit de 60 segundos entre actualizaciones
- Cache TTL de 60 segundos
- **NO hay fetch automático ni background polling**

### Cache TTL 60s
- Cache temporal de precios (60 segundos)
- Badge visual de estado de cache (🟢 válido, 🟡 próximo a vencer, 🔴 vencido)
- Cache read-only para UI

### Lazy loading
- Panel de configuración carga instantáneamente
- Secciones pesadas ("Precios usados", "Estado del sistema") solo cargan al hacer click
- Zero lag en apertura del panel

### Light / Dark themes
- Sistema de temas con tokens CSS
- Tema claro y oscuro completamente funcionales
- Cambio instantáneo sin lag

---

## 🧠 Principios clave del sistema

* **User-action driven**: nada ocurre sin interacción explícita
* **Read-only UI**: la interfaz nunca muta datos
* **Single source of truth**: estado centralizado
* **Lazy loading real**: módulos pesados solo al hacer click
* **Stateless UI**: render puro basado en estado

---

## 🗂️ Estructura del proyecto

```
/
├── index.html              # App shell (header, footer, router outlet)
├── api/
│   └── proxy.js           # Serverless proxy to Binance P2P API
├── assets/
│   ├── css/
│   │   ├── temasfondobarra.css    # Theme tokens & base styles
│   │   ├── animations.css          # Global animations
│   │   ├── buttons.css             # Unified button system
│   │   ├── convertidor.css          # Converter panel styles
│   │   ├── tabladereferencia.css   # Reference table styles
│   │   ├── menuconfi.css           # Settings panel styles
│   │   └── responsive.css          # Media queries
│   ├── js/
│   │   ├── main.js                # Core app logic
│   │   ├── router.js              # SPA routing
│   │   ├── view-loader.js         # Dynamic HTML loading
│   │   ├── api.js                 # API fetch logic
│   │   ├── cache.js               # Cache management
│   │   ├── ui.js                  # UI rendering
│   │   ├── ui-state.js            # UI state management
│   │   ├── settings.js             # Settings panel logic
│   │   ├── theme.js               # Theme switching
│   │   ├── config.js              # Configuration constants
│   │   ├── logger.js              # Development logger utility
│   │   └── icon-protection.js     # Icon protection script
│   ├── htmls/
│   │   ├── conversion-p2p.html    # Converter view
│   │   ├── preciosdereferencia.html  # Reference table view
│   │   └── panelconfi.html       # Settings panel view
│   └── icons/                     # SVG icons
├── vercel.json            # Vercel deployment config
├── package.json           # Project metadata
└── CHANGELOG.md          # Version history
```

---

## 🔄 Flujo de la aplicación

```
index.html
  → router.js
    → view-loader.js
      → HTML View
        → main.js / settings.js
          → state update
            → ui render
```

✔ Sin side-effects
✔ Sin imports circulares
✔ Sin listeners duplicados

---

## 🔐 Seguridad

### No background requests
- ❌ Sin fetch automático al cargar la página
- ❌ Sin polling o retry loops
- ❌ Sin background scripts
- ✅ Solo requests cuando el usuario hace click explícito

### CSP hardened
- Content Security Policy sin `unsafe-inline` ni `unsafe-eval`
- Scripts solo desde `'self'`
- Estilos solo desde `'self'` y Google Fonts
- Conexiones solo a `/api/` y Binance P2P

### Proxy API seguro
- Proxy serverless en Vercel (`/api/proxy`)
- Validación de parámetros (asset, fiat, tradeType)
- Rate limiting en frontend (60s cooldown)
- Manejo seguro de errores (no expone datos internos)

### No user data storage
- No almacenamiento de datos personales
- Solo cache temporal de precios (60s)
- No cookies ni tracking

---

## ⚡ Performance

* Lazy loading por interacción
* Sin operaciones bloqueantes
* Feedback UI < 100ms
* Animaciones con transform/opacity
* Sin reflows innecesarios

---

## ♿ Accesibilidad

* Contraste AA / AAA
* Navegación por teclado completa
* ARIA roles y estados
* Focus visible
* Hit targets ≥ 44px

---

## 🎨 UX/UI

* Panel de configuración desacoplado
* Secciones colapsadas por defecto
* Microinteracciones suaves
* Skeletons y loading states
* Tokens CSS y temas claros/oscuros

---

## 🛠️ Tech stack

- **Vanilla JavaScript** (ES6 modules, sin frameworks)
- **CSS Variables** (tokens semánticos para theming)
- **SPA Router** (hash-based routing)
- **Vercel deployment** (static site, serverless functions)

## 🚀 Deploy

### Hosted on Vercel
- Static SPA (Single Page Application)
- No build step required
- Serverless API proxy (`/api/proxy.js`)
- Headers de seguridad activos (CSP, X-Frame-Options, etc.)
- Cache agresivo para assets estáticos (1 año)

---

## 🏷️ Release v1.0.0

Para crear el tag de release v1.0.0, ver [RELEASE.md](./RELEASE.md).

**Comandos rápidos:**

```bash
git add .
git commit -m "release: v1.0.0 stable"
git tag -a v1.0.0 -m "P2P Panel v1.0.0 - Stable Release"
git push origin main --tags
```

**⚠️ Importante:** Verificar el checklist de regresión en [RELEASE.md](./RELEASE.md) antes de crear el tag.

---

## 🧪 Estado del sistema

✔ Producción estable
✔ Sin errores críticos
✔ Auditoría completa aprobada
✔ Listo para v1.0

---

## 📎 Notas finales

Este proyecto está diseñado para **escalar sin deuda técnica**.

Cualquier feature futura debe respetar:

* User-action only
* No background fetch
* No mutación directa de UI

---

**Versión:** v1.0
**Estado:** Production Ready
