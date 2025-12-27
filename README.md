# P2P ARS ↔ BOB Panel

Panel web informativo para conversión de monedas entre ARS (Pesos Argentinos) y BOB (Bolivianos) usando precios de referencia de Binance P2P.

## 🎯 Características

- **Conversión bidireccional**: ARS → BOB y BOB → ARS
- **Precios de referencia**: Basados en la mediana de los top 15 anuncios filtrados de Binance P2P
- **Filtrado inteligente**: Elimina outliers y anuncios promocionados para mayor precisión
- **Cache inteligente**: Reduce requests innecesarios (TTL: 60 segundos)
- **Panel de precios detallado**: Visualiza precios individuales filtrados por mercado y tipo
- **Interfaz premium fintech**: Diseño profesional tipo Bloomberg/Stripe con dark theme
- **Formateo monetario en tiempo real**: Input con separadores de miles y decimales
- **Control de concurrencia**: Previene múltiples requests simultáneos
- **Vanilla JavaScript**: Sin frameworks, código limpio y modular (ES2023)

## 📋 Requisitos

- Navegador moderno con soporte para ES2023 modules
- Conexión a internet (para acceder a la API de Binance P2P)

## 🚀 Uso

1. Abre `index.html` en tu navegador
2. Ingresa el monto a convertir
3. Selecciona la dirección de conversión (ARS → BOB o BOB → ARS)
4. El resultado se calcula automáticamente

## 🏗️ Estructura del Proyecto

```
├── index.html              # Estructura HTML semántica
├── assets/
│   ├── css/
│   │   ├── base.css        # Reset, variables, tipografía
│   │   ├── layout.css      # Grid, contenedores, responsive
│   │   ├── components.css  # Cards, inputs, botones
│   │   └── theme.css       # Dark theme
│   ├── js/
│   │   ├── config.js       # Constantes globales
│   │   ├── api.js          # Llamadas a Binance P2P
│   │   ├── calc.js         # Lógica de cálculos
│   │   ├── ui.js           # Manipulación DOM
│   │   ├── cache.js        # Sistema de cache
│   │   └── main.js         # Punto de entrada
│   └── icons/
│       └── logo.svg
└── README.md
```

## ⚙️ Configuración

Las constantes se pueden modificar en `assets/js/config.js`:

- `ASSET`: Moneda base (por defecto: "USDT")
- `ROWS`: Cantidad de anuncios a obtener (por defecto: 15)
- `CACHE_TTL`: Tiempo de vida del cache en ms (por defecto: 60000)
- `MIN_MONTH_ORDERS`: Mínimo de órdenes mensuales del anunciante (por defecto: 50)
- `MIN_FINISH_RATE`: Tasa de finalización mínima del anunciante (por defecto: 95%)

## 🚀 Despliegue

### GitHub
1. Crea un nuevo repositorio en GitHub
2. Sube todos los archivos del proyecto
3. El proyecto está listo para ser clonado

### Vercel
1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente que es un proyecto estático
3. El despliegue se realizará automáticamente
4. Tu sitio estará disponible en `https://tu-proyecto.vercel.app`

**Nota**: No se requiere configuración adicional. Vercel detecta automáticamente proyectos estáticos.

## ⚠️ Disclaimer

Este panel es únicamente para fines informativos. Los precios mostrados son referenciales basados en la mediana de los top 15 anuncios filtrados de Binance P2P y pueden no reflejar precios exactos de mercado. No se realiza trading ni automatización de órdenes.

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso educativo e informativo.

