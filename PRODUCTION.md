# 🚀 Guía de Despliegue a Producción

## Checklist Pre-Despliegue

- [x] Todos los comentarios eliminados del código
- [x] Console.log protegidos con IS_DEV (no se ejecutan en producción)
- [x] Proxy configurado para producción
- [x] Headers de seguridad configurados en vercel.json
- [x] CSP (Content Security Policy) configurado
- [x] Cache headers configurados para assets estáticos
- [x] .gitignore configurado correctamente

## Despliegue en Vercel

### Opción 1: Desde GitHub

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente la configuración
3. El despliegue se realizará automáticamente
4. La función serverless `/api/proxy` se desplegará automáticamente

### Opción 2: Desde CLI

```bash
npm i -g vercel
vercel --prod
```

## Verificación Post-Despliegue

1. **Verificar que la aplicación carga correctamente**
   - Abrir la URL de producción
   - Verificar que no hay errores en consola

2. **Verificar el proxy**
   - Hacer clic en "Actualizar precios"
   - Verificar que los precios se cargan correctamente
   - Revisar Network tab para confirmar que `/api/proxy` responde

3. **Verificar temas**
   - Cambiar entre tema claro y oscuro
   - Verificar que persiste después de recargar

4. **Verificar responsive**
   - Probar en diferentes tamaños de pantalla
   - Verificar que el panel de configuración funciona en móvil

5. **Verificar seguridad**
   - Confirmar que no hay fetch automático al cargar
   - Verificar rate limiting (60 segundos entre requests)
   - Confirmar que el cooldown funciona

## Configuración de Dominio Personalizado

1. En Vercel Dashboard, ve a Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Vercel

## Variables de Entorno

No se requieren variables de entorno para este proyecto.

## Monitoreo

- Los errores se registran en Vercel Functions logs
- Revisar logs en Vercel Dashboard > Functions

## Actualizaciones

Para actualizar la aplicación:
1. Hacer push a la rama principal
2. Vercel desplegará automáticamente
3. La función serverless se actualizará automáticamente

