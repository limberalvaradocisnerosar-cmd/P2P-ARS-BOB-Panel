# 💱 P2P ARS ↔ BOB Panel

Panel web para conversión de monedas entre **ARS** (Pesos Argentinos) y **BOB** (Bolivianos) usando precios de referencia de Binance P2P.

## 🎯 Características

- Conversión bidireccional: ARS → BOB y BOB → ARS
- Precios de referencia basados en la mediana de los top 15 anuncios filtrados de Binance P2P
- Filtrado inteligente que elimina outliers y anuncios promocionados
- Cache inteligente con TTL de 60 segundos
- Panel de precios detallado con visualización de precios individuales
- Interfaz fintech con tema claro/oscuro
- Formateo monetario en tiempo real con separadores de miles
- Control de seguridad con rate limiting y cooldown
- SPA con navegación fluida sin recargar página
- Vanilla JavaScript ES2023 sin frameworks

## 🚀 Instalación

### Desarrollo Local

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd p2p-panel
```

2. Instala Vercel CLI (opcional):
```bash
npm install -g vercel
```

3. Ejecuta el servidor:
```bash
vercel dev
```

4. Abre `http://localhost:3000` en tu navegador

### Uso Básico

1. Abre `index.html` en tu navegador o usa Vercel dev
2. Ingresa el monto a convertir
3. Selecciona la dirección de conversión con el botón de intercambio
4. El resultado se calcula automáticamente usando precios en cache
5. Presiona "Actualizar precios" para obtener datos frescos de Binance P2P

## 🏗️ Estructura del Proyecto

```
p2p-panel/
├── index.html                    # Punto de entrada
├── assets/
│   ├── css/                      # Estilos
│   │   ├── temasfondobarra.css   # Variables, temas, header, footer
│   │   ├── convertidor.css       # Panel de conversión
│   │   ├── menuconfi.css         # Panel de configuración
│   │   ├── tabladereferencia.css # Tabla de precios
│   │   └── responsive.css        # Media queries
│   ├── js/                       # Lógica de la aplicación
│   │   ├── config.js             # Constantes
│   │   ├── api.js                # Llamadas a Binance P2P API
│   │   ├── calc.js               # Cálculos y formateo
│   │   ├── cache.js               # Sistema de cache
│   │   ├── ui.js                 # Manipulación DOM
│   │   ├── main.js               # Lógica principal
│   │   ├── router.js             # Router SPA
│   │   ├── settings.js           # Panel de configuración
│   │   ├── theme.js              # Gestión de temas
│   │   ├── ui-state.js           # Estado UI
│   │   └── view-loader.js        # Cargador de vistas
│   ├── htmls/                    # Vistas HTML parciales
│   │   ├── conversion-p2p.html
│   │   ├── panelconfi.html
│   │   └── preciosdereferencia.html
│   └── icons/                    # Iconos SVG
├── api/
│   └── proxy.js                  # Proxy para evitar CORS
└── vercel.json                   # Configuración Vercel
```

## 🔒 Seguridad

- No realiza fetch automático al cargar la página
- Fetch solo se activa con acción explícita del usuario
- Rate limiting de 60 segundos entre requests
- Cooldown visual después de cada actualización
- Sanitización de todos los inputs
- Filtrado de anuncios por calidad (mesOrderCount, monthFinishRate)
- Eliminación de outliers para mayor precisión

## 🎨 Temas

La aplicación soporta dos temas:
- **Light**: Tema claro por defecto
- **Dark**: Tema oscuro

El tema se guarda en localStorage y persiste entre sesiones.

## 📱 Responsive

Diseño responsive optimizado para:
- Móviles pequeños (360x800)
- Tablets
- Desktop

## 🛠️ Tecnologías

- HTML5
- CSS3 (Variables CSS, Flexbox, Grid)
- Vanilla JavaScript (ES2023 Modules)
- Binance P2P API
- Vercel (Hosting y proxy)

## 📄 Licencia

MIT

## ⚠️ Disclaimer

Este panel es únicamente para fines informativos. Los precios mostrados son referenciales basados en la mediana de los top 15 anuncios filtrados de Binance P2P y pueden no reflejar precios exactos de mercado. No se realiza trading ni automatización de órdenes.
