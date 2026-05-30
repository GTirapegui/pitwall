# Handoff: Pitwall — App de Fórmula 1 (rediseño completo)

## Overview
**Pitwall** es una app companion de Fórmula 1 (temporada 2026). Este paquete contiene el rediseño completo de 5 vistas, con tema claro/oscuro y dos layouts por vista (móvil y web/escritorio). El objetivo es seguir esta dirección visual y de interacción al implementarla en el codebase real.

Idioma de la interfaz: **español**. Contexto del usuario: zona horaria **Santiago (GMT-4)**.

## About the Design Files
Los archivos `.html` de este bundle son **referencias de diseño creadas en HTML/CSS/JS vanilla** — prototipos que muestran el aspecto y comportamiento deseados, **no** código de producción para copiar tal cual. La tarea es **recrear estos diseños en el entorno del codebase destino** (React, Vue, SwiftUI, Flutter, etc.) usando sus patrones y librerías establecidas. Si aún no existe entorno, elige el framework más apropiado e impleméntalo ahí.

Los **datos son de ejemplo** (pilotos, equipos, resultados, calendario). En la app real deben venir de la fuente de datos del usuario; el diseño asume estructuras tipo: carreras, sesiones, pilotos, equipos, clasificaciones y resultados por ronda.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado e interacciones son finales. Recrear la UI con precisión usando las librerías del codebase. Las banderas y varios íconos están dibujados con SVG/CSS inline; en producción pueden reemplazarse por un set de assets/íconos propio manteniendo el mismo resultado visual.

---

## Design Tokens

Definidos como CSS custom properties en `:root` y sobreescritos en `[data-theme="dark"]`.

### Colores — Tema Claro (papel cálido)
| Token | Valor | Uso |
|---|---|---|
| `--red` | `#E10600` | Acento principal F1 (próxima carrera, activo, alertas) |
| `--red-deep` | `#B00500` | Rojo presionado |
| `--gold` | `#C99A2E` | Líder de campeonato, P1, futuras/programadas |
| `--paper` | `#E7E5DE` | Fondo de página |
| `--surface` | `#FAF9F4` | Tarjetas |
| `--surface-2` | `#F1EFE7` | Tarjetas secundarias / chips |
| `--ink` | `#16161C` | Texto principal |
| `--ink-2` | `#46453E` | Texto secundario |
| `--muted` | `#8C8A7F` | Texto terciario / etiquetas |
| `--line` | `rgba(20,20,28,.12)` | Bordes |
| `--line-2` | `rgba(20,20,28,.07)` | Separadores sutiles |
| `--dim` | `#C9C7BD` | Días pasados / barras vacías |

### Colores — Tema Oscuro (noche de carrera)
| Token | Valor |
|---|---|
| `--paper` | `#0B0B0F` |
| `--surface` | `#16161D` |
| `--surface-2` | `#1D1D26` |
| `--ink` | `#F3F1EA` |
| `--ink-2` | `#C9C7BD` |
| `--muted` | `#76757F` |
| `--line` | `rgba(255,255,255,.11)` |
| `--line-2` | `rgba(255,255,255,.055)` |
| `--dim` | `#3A3A44` |
| `--red` | `#FF2118` |
| `--gold` | `#F2BE4B` |
| `--purple` (En Vivo) | `#C084FC` (claro: `#A855F7`) |

### Colores de equipos (para acentos / barras)
`Mercedes #00D7B6` · `Ferrari #E8002D` · `McLaren #FF8000` · `Red Bull Racing #3671C6` · `Alpine #0093CC` · `Racing Bulls #6692FF` · `Haas #9CA3AF` · `Williams #1868DB` · `Audi #BB0A30` · `Aston Martin #229971` · (`Cadillac #B99A5B`)

### Compuestos de neumáticos (En Vivo)
`Blando (S) #E8002D` · `Medio (M) #F2C94C` · `Duro (H) #cfcfcf`

### Podio (Resultados)
`P1 oro var(--gold)` · `P2 plata #AEB4BC` (dark `#C2C8D0`) · `P3 bronce #C17C3F` (dark `#D08C4F`)

### Tipografía
- **Display / UI**: `Archivo` (Google Fonts), pesos 400/500/600/700/800/900. Títulos en **900**, uppercase, `letter-spacing:-.01em a -.015em`.
- **Mono / telemetría / etiquetas / números**: `Space Mono` (400/700). Etiquetas en mayúsculas con `letter-spacing` de `.08em` a `.24em`.
- Escala típica: micro-etiquetas mono 8.5–11px; cuerpo 13–16px; nombres 16–26px; títulos hero 26–52px (`clamp`).
- Tabular numbers (`font-variant-numeric:tabular-nums`) en puntos, tiempos, posiciones y cuenta regresiva.

### Forma / sombra / espaciado
- Radios: chips 6–11px; tarjetas 12–20px; barra inferior 20px; botones redondos 999px.
- Sombra tarjeta: `0 1px 0 rgba(255,255,255,.6) inset, 0 14px 34px -22px rgba(20,20,28,.5)` (claro).
- Fondo de página con textura de puntos sutil: `radial-gradient(var(--grain) 1px, transparent 1px); background-size:4px 4px`.
- Gap base entre secciones: 16–24px. Padding de contenido: `clamp(14px,5vw,40px)`.
- Layout móvil: columna centrada `max-width` 560–680px; padding inferior 124px para librar la barra de pestañas.

### Motion
- Pulso de alerta (`pulseRing`): box-shadow expansiva 2–2.2s, infinita (badges "EN VIVO" / "PRÓXIMA", puntos de carrera).
- Ping de punto (`ping`/`dotPing`): escala 0.5→1.7, fade. 2s.
- Barrido de luz en heros oscuros (`sweep`): translateX -35%→35%, 6.5s.
- Transición de tema: `background-color/color .35s ease`.
- Respetar `prefers-reduced-motion: reduce` → desactivar animaciones/transiciones.

---

## Estructura común a todas las vistas

1. **Topbar (sticky)**: marca `▌PITWALL` (tab roja 6×24 + wordmark Archivo 900 22px) · a la derecha `SANTIAGO 2026` (mono, "2026" en dorado) + **conmutador Móvil/Web** + **toggle de tema** (sol/luna, botón redondo 40px).
2. **Contenido** (varía por vista).
3. **Barra de navegación inferior** (móvil) — píldora flotante con blur, fija abajo, 5 pestañas: **INICIO · CALENDARIO · POSICIONES · RESULTADOS · EN VIVO**. Pestaña activa en rojo con indicador superior; EN VIVO lleva un punto rojo pulsante. En **web** se transforma en **barra lateral izquierda** (240px, vertical, marca arriba, activo con acento rojo a la izquierda).

### Tema (persistencia)
`localStorage['pitwall-theme'] = 'light' | 'dark'`. Atributo `data-theme` en `<html>`.

### Plataforma (persistencia)
`localStorage['pitwall-view'] = 'phone' | 'web'`. Atributo `data-view` en `<html>`. Default: `web` si `innerWidth>=1024`, si no `phone`. Lógica compartida en `pitwall-platform.css` + `pitwall-platform.js`.

### Piloto favorito (persistencia, cross-view)
`localStorage['pitwall-fav'] = <id piloto>` (ej. `'col'`). Elegido en Inicio; resalta al piloto en Inicio, En Vivo y Resultados.

---

## Screens / Views

### 1. INICIO — "Tu Temporada" (`Pitwall Home.html`)
Dashboard personalizado, NO duplica el calendario.
- **Hero "Tu Piloto"** (elegible): tarjeta con panel de color de equipo a la izquierda (número grande Archivo 900 + bandera), y a la derecha nombre, equipo, stats (Posición / Puntos / Última), **forma de las últimas 5 carreras** (chips: oro=victoria, borde dorado=podio, atenuado=abandono) y próxima cita. Botón **"⇄ CAMBIAR"** abre un **bottom-sheet** con los 20 pilotos (bandera, número, nombre, equipo, puntos); seleccionar persiste y re-renderiza el hero.
- **Último GP**: ganador (nombre + color equipo + gap), podio (P1/P2/P3 chips), **vuelta rápida** (piloto+tiempo) y **piloto del día**, titular de una línea.
- **Lucha por el título**: 2 tarjetas (Pilotos / Constructores) con líder, diferencia (`+43`) y barras proporcionales.
- **Top 5 del campeonato**: lista compacta con enlace "VER TABLA →" a Posiciones.
- **Próximo circuito**: bandera + nombre + `<image-slot>` para soltar el **mapa real del trazado** + stats (longitud, curvas, vueltas, zonas DRS) + compuestos + récord de vuelta.
- **Titulares**: lista de noticias con etiqueta de categoría coloreada + título + fuente·tiempo.

### 2. CALENDARIO (`Pitwall Calendario.html`)
- **Hero "Próxima carrera"** (oscuro, dramático, pulso): bandera, GP, circuito, **cuenta regresiva en vivo** (días/hrs/min/seg) y **horarios de sesiones** (chips scrollables, "Carrera" en rojo), nota de zona horaria.
- **Grilla mensual**: 7 columnas (LUN→DOM), navegación de mes ‹ ›. Estados: días pasados atenuados; **fin de semana de carrera pasado** = fondo gris + bandera en el domingo; **próxima** = fondo rojo + pulso + anillo; **futuras** = acento dorado. "HOY" marcado.
- **Agenda de temporada**: tarjetas por carrera. **Pasada** = atenuada + "FINALIZADO" + podio (chips con barra de color de equipo). **Próxima** = riel rojo + badge pulsante "PRÓXIMA". **Futura** = "PROGRAMADA" en dorado.
- **Web**: 2 columnas — izquierda (hero + grilla, sticky), derecha (agenda).

### 3. POSICIONES (`Pitwall Posiciones.html`)
- **Control segmentado** Pilotos / Constructores (la pestaña activa es una píldora roja sólida; el contenido cambia al instante).
- **Filas de clasificación**: posición (mono, con cero a la izquierda), bandera, nombre (nombre pequeño + apellido grande), equipo (con punto de color), **barra de puntos proporcional al líder coloreada por equipo**, puntos (grande, tabular).
- **Líder destacado**: banda con degradado dorado + riel dorado + posición/puntos en dorado + chip "LÍDER DEL MUNDIAL".
- Constructores: posición, barra gruesa de color de equipo, nombre, iniciales de pilotos (ANT · RUS), puntos.

### 4. RESULTADOS (`Pitwall Resultados.html`)
- **Selector de carreras**: chips horizontales scrollables (bandera + ronda + GP), seleccionado en oscuro. Permite ver **cualquier ronda anterior**, no solo la última.
- **Encabezado**: bandera + "RONDA 09 · RESULTADO · 66 VUELTAS" + GP + circuito.
- **Podio de barras**: 3 columnas alineadas abajo, orden visual [P2 izq · P1 centro (más alta) · P3 der], barras oro/plata/bronce con número grande, info arriba (bandera, piloto, equipo) y puntos abajo.
- **Clasificación** desde P4: posición, bandera, nombre + equipo, diferencia (`+12.3s` / `+1 VUELTA`, con barra de color de equipo) y puntos (0 atenuado).
- Resalta al piloto favorito.

### 5. EN VIVO (`Pitwall En Vivo.html`)
Hub de timing en tiempo real (el diferenciador).
- **Hero de estado** (oscuro): badge "EN VIVO" pulsante, estado de pista ("PISTA VERDE"), GP, **VUELTA 34/71** con barra de progreso, condiciones (pista/aire/seco/DRS/líder).
- **Banner de vuelta rápida** (morado): piloto + tiempo.
- **Timing tower**: filas con posición + flecha de cambio (▲▼), barra de color de equipo, código + nombre, **neumático (compuesto+vueltas)**, **DRS** (verde si activo) o **BOX** (en pits), intervalo al líder y última vuelta (morada si es la vuelta rápida).
- **Simulación**: los tiempos de vuelta y el contador de vueltas se actualizan cada ~2.2s (`setInterval`). En producción, reemplazar por feed/WS en vivo.
- Resalta al piloto favorito con riel rojo.

---

## Interactions & Behavior
- **Navegación**: las 5 pestañas enlazan entre las 5 vistas (mismo set, `data-view` y `data-theme` persisten entre páginas vía localStorage).
- **Toggle de tema**: click → alterna `data-theme`, persiste.
- **Toggle Móvil/Web**: click → alterna `data-view`, persiste, reflowea el layout (barra inferior ↔ barra lateral; columna ↔ tablero).
- **Selector de piloto (Inicio)**: bottom-sheet con backdrop; click en piloto → persiste + re-render del hero; cierra con backdrop o ✕.
- **Selector de carrera (Resultados)**: click en chip → re-render de encabezado + podio + clasificación.
- **Segmento Pilotos/Constructores (Posiciones)**: click → re-render del board (técnica: reconstruir innerHTML para evitar problemas de re-cálculo de estilos).
- **Cuenta regresiva (Calendario)**: tick cada 1s hacia la fecha objetivo.
- **Simulación en vivo**: tick cada ~2.2s.

## State Management
- `theme` (light/dark) — persistido.
- `view` (phone/web) — persistido.
- `favoriteDriverId` — persistido; afecta Inicio/En Vivo/Resultados.
- Inicio: `currentDriver` (derivado de favorite).
- Posiciones: `tab` (drivers/constructors).
- Resultados: `selectedRound`.
- Calendario: `currentMonth`, `countdownTarget`.
- En Vivo: `lap`, datos de tower (posición, gap, neumático, último tiempo) — desde feed en producción.

## Assets
- Fuentes: **Archivo** y **Space Mono** (Google Fonts).
- **Banderas**: SVG/CSS inline (Italia, GB/Union Jack, Mónaco, Países Bajos, España, Francia, Australia, Nueva Zelanda, Argentina, Brasil, Alemania, Canadá, Tailandia, Japón). Reemplazables por un set de banderas propio.
- **Íconos**: SVG inline de línea (nav, sol/luna, conmutador). Reemplazables por la librería de íconos del codebase.
- **Mapa de circuito**: `<image-slot>` (placeholder donde el usuario suelta la imagen real). En producción, usar las imágenes de trazados propias.
- No se usan emojis ni imágenes de marca de terceros.

## Files
- `Pitwall Home.html` — Inicio (Tu Temporada)
- `Pitwall Calendario.html` — Calendario
- `Pitwall Posiciones.html` — Posiciones (Pilotos/Constructores)
- `Pitwall Resultados.html` — Resultados (multironda)
- `Pitwall En Vivo.html` — Timing en vivo
- `pitwall-platform.css` + `pitwall-platform.js` — sistema compartido del conmutador Móvil/Web (barra lateral en web)
- `image-slot.js` — componente del placeholder de imagen (mapa de circuito)

> Cada `.html` es autocontenido (CSS + JS inline) salvo los archivos compartidos arriba. Tokens, tipografía y componentes se repiten entre archivos — al portar, centralizarlos en el sistema de diseño del codebase.
