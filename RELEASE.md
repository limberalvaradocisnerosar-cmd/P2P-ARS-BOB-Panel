# 🚀 Release v1.0.0

## Instrucciones para crear el tag v1.0.0

### Pre-requisitos

1. Verificar que todos los cambios estén commiteados:
   ```bash
   git status
   ```

2. Verificar que el código esté en `main`:
   ```bash
   git branch
   ```

### Crear el tag v1.0.0

Ejecutar los siguientes comandos en orden:

```bash
# Asegurar que todo está commiteado
git add .
git commit -m "release: v1.0.0 stable"

# Crear el tag anotado
git tag -a v1.0.0 -m "P2P Panel v1.0.0 - Stable Release"

# Subir el tag al repositorio remoto
git push origin main --tags
```

### Verificar el tag

```bash
# Ver tags locales
git tag -l

# Ver información del tag
git show v1.0.0
```

### Notas importantes

- ⚠️ **NO crear tags intermedios** - Solo v1.0.0
- ⚠️ **Un solo tag limpio y estable**
- ⚠️ **El tag debe crearse desde `main` branch**
- ⚠️ **No hacer cambios después del tag sin crear nueva versión**

---

## Checklist de regresión v1.0

Antes de crear el tag, verificar manualmente:

### Persistencia y Estado

- [ ] **Reload mantiene precios** - Al recargar la página, los precios siguen visibles
- [ ] **Reload mantiene inputs** - El monto y dirección se restauran correctamente
- [ ] **Cooldown no se reinicia** - El cooldown de 60s continúa después de recargar
- [ ] **Tabla referencia persiste** - Si estaba abierta, se mantiene abierta al recargar

### Botón "Actualizar precios"

- [ ] **Botón refleja estado real** - Muestra "Actualizado" durante cooldown, "Actualizar precios" cuando está listo
- [ ] **No hay doble contador** - Solo un contador visible (en el badge de cache)
- [ ] **Estados claros** - Idle → Fetching → Cooldown → Ready

### Funcionalidad

- [ ] **No hay fetch automático** - Solo se ejecuta al hacer click en "Actualizar precios"
- [ ] **Tabla referencia abre/cierra suave** - Animación fluida sin saltos
- [ ] **No hay overlays azules en botones** - Focus-visible funciona correctamente
- [ ] **Consentimiento funciona** - Modal aparece solo una vez, no bloquea UI

### UX/UI

- [ ] **Cache badge visible** - Muestra estado correcto (🟢/🟡/🔴)
- [ ] **Conversión funciona** - Calcula correctamente ARS ↔ BOB
- [ ] **Tema claro/oscuro funciona** - Cambio instantáneo sin lag
- [ ] **Panel configuración abre rápido** - Sin lag perceptible

### Seguridad

- [ ] **Cooldown bloquea correctamente** - No permite fetch antes de 60s
- [ ] **Cookies persisten** - Cooldown sobrevive a recargas
- [ ] **No hay errores en consola** - Console limpia en producción

---

## Post-release

Después de crear el tag v1.0.0:

1. Verificar que Vercel despliegue correctamente
2. Probar en producción (dominio principal)
3. Verificar que el cache de Vercel no interfiera
4. Documentar cualquier issue conocido para v1.0.1

---

## Próximas versiones

Para futuras versiones, seguir Semantic Versioning:

- **v1.0.x** - Patch releases (bug fixes)
- **v1.x.0** - Minor releases (nuevas features)
- **v2.0.0** - Major releases (breaking changes)

