# ESPECIFICACIONES — Pitwall (reproducción idéntica)

> **Objetivo:** replicar **exactamente** este diseño en el codebase existente. Los datos ya existen en el proyecto; aquí solo se especifica la **capa visual y de interacción**. Donde se den valores (px, hex, pesos), úsalos **tal cual**. Los archivos `.html` del bundle son la fuente de verdad: ante cualquier duda, abrir el HTML y copiar el valor exacto.

---

## 0. Reglas globales
- **Fuentes**: `Archivo` (400–900) para display/UI; `Space Mono` (400/700) para etiquetas, números, tiempos, telemetría. Cargar de Google Fonts.
- **Box model**: `* { box-sizing:border-box; margin:0; padding:0 }`.
- **Body**: `font-family:'Archivo'; line-height:1.45; -webkit-font-smoothing:antialiased;` + textura de puntos: `background-image:radial-gradient(var(--grain) 1px,transparent 1px); background-size:4px 4px;`.
- **Temas**: atributo `data-theme="light|dark"` en la raíz. Transición `background-color/color .35s ease`.
- **Plataforma**: atributo `data-view="phone|web"` en la raíz.
- **Números**: `font-variant-numeric:tabular-nums` en puntos, tiempos, posiciones, cuenta regresiva.
- **Mayúsculas**: títulos de GP / nombres de piloto en `text-transform:uppercase` con `letter-spacing` negativo (-.01em a -.015em). Etiquetas mono en mayúsculas con `letter-spacing` positivo (.08em–.24em).
- **prefers-reduced-motion: reduce** → `animation:none; transition:none`.

---

## 1. Tokens (CSS variables) — copiar literal

```css
:root{
  --red:#E10600; --red-deep:#B00500; --gold:#C99A2E; --purple:#A855F7;
  --silver:#AEB4BC; --bronze:#C17C3F;
  --paper:#E7E5DE; --surface:#FAF9F4; --surface-2:#F1EFE7;
  --ink:#16161C; --ink-2:#46453E; --muted:#8C8A7F;
  --line:rgba(20,20,28,.12); --line-2:rgba(20,20,28,.07); --dim:#C9C7BD;
  --shadow:0 1px 0 rgba(255,255,255,.6) inset, 0 14px 34px -22px rgba(20,20,28,.5);
  --grain:rgba(20,20,28,.045);
}
[data-theme="dark"]{
  --paper:#0B0B0F; --surface:#16161D; --surface-2:#1D1D26;
  --ink:#F3F1EA; --ink-2:#C9C7BD; --muted:#76757F;
  --line:rgba(255,255,255,.11); --line-2:rgba(255,255,255,.055); --dim:#3A3A44;
  --red:#FF2118; --red-deep:#FF4438; --gold:#F2BE4B; --purple:#C084FC;
  --silver:#C2C8D0; --bronze:#D08C4F;
  --shadow:0 1px 0 rgba(255,255,255,.04) inset, 0 18px 46px -24px rgba(0,0,0,.9);
  --grain:rgba(255,255,255,.03);
}
```

### Colores de equipo (mapa id→{nombre,color})
```
mer Mercedes #00D7B6 · fer Ferrari #E8002D · mcl McLaren #FF8000
rbr Red Bull Racing #3671C6 · alp Alpine #0093CC · rb Racing Bulls #6692FF
haa Haas #9CA3AF · wil Williams #1868DB · aud Audi #BB0A30
ast Aston Martin #229971 · cad Cadillac #B99A5B
```
### Neumáticos: `S #E8002D` · `M #F2C94C` · `H #cfcfcf`
### Podio: `P1 var(--gold)` · `P2 var(--silver)` · `P3 var(--bronze)` (barras con degradado `linear-gradient(180deg,COLOR, color-mix(in srgb,COLOR 72%,#000))`).

---

## 2. Topbar (todas las vistas)
- `position:sticky; top:0; z-index:40; display:flex; align-items:center; justify-content:space-between; padding:16px clamp(16px,5vw,28px);`
- Fondo: `color-mix(in srgb,var(--paper) 86%,transparent)` + `backdrop-filter:blur(14px) saturate(1.2)`; borde inferior `1px solid var(--line)`.
- **Marca**: `<tab roja 6×24, radius 1, box-shadow:0 0 14px -2px var(--red)>` + `PITWALL` (Archivo 900, 22px, letter-spacing .04em). Gap 12px.
- **Derecha** (gap 14px): `SANTIAGO 2026` (Space Mono 12px, letter-spacing .2em, color --muted; "2026" en --gold) · **conmutador Móvil/Web** · **toggle tema** (botón redondo 40px, borde --line, fondo --surface; ícono 18px sol o luna según tema).

---

## 3. Barra de navegación (5 pestañas)
Orden: **INICIO · CALENDARIO · POSICIONES · RESULTADOS · EN VIVO**.

### Modo móvil (píldora flotante inferior)
- `.nav`: `position:fixed; left/right:0; bottom:0; z-index:50; display:flex; justify-content:center; padding:0 10px calc(12px + env(safe-area-inset-bottom)) 10px; pointer-events:none`.
- `.nav-inner`: `pointer-events:auto; width:100%; max-width:520px; display:grid; grid-template-columns:repeat(5,1fr);` fondo `color-mix(in srgb,var(--surface) 92%,transparent)` + blur(18px); borde `1px solid var(--line)`; `border-radius:20px`; sombra `0 18px 40px -18px rgba(0,0,0,.45)`.
- `.nav-item`: columna, `gap:6px; padding:13px 2px 12px; color:var(--muted)`. Ícono línea 22px (`stroke:currentColor; stroke-width:1.7`). Label Space Mono 8.5px, letter-spacing .08em, 700.
- **Activo**: `color:var(--red)` + indicador superior `::before` (24×3px, rojo, radius 0 0 3px 3px, glow). 
- **EN VIVO**: punto rojo pulsante `.live-pip` (6px, `top:9px; left:calc(50% + 8px)`, animación `pipPulse` 1.8s).

### Modo web (barra lateral izquierda) — ver `pitwall-platform.css`
- `.nav` → `position:fixed; left:0; top:0; bottom:0; width:240px; z-index:60`. `.nav-inner` → flex columna, `border-right:1px solid var(--line)`, fondo `--surface`, `padding:20px 14px 18px`, gap 5px.
- Marca `PITWALL` arriba (`.side-brand`, solo web), separador inferior.
- `.nav-item` → fila (icono+label horizontal), `padding:13px 14px; border-radius:11px`. Activo: fondo `color-mix(in srgb,var(--red) 11%,transparent)` + `box-shadow:inset 3px 0 0 var(--red)` (sin indicador superior).

### Íconos (SVG línea, viewBox 0 0 24 24)
- Inicio = velocímetro (arco + aguja). Calendario = calendario con puntos. Posiciones = barras de ranking. Resultados = trofeo. En Vivo = ondas de transmisión (círculo + arcos).

---

## 4. Conmutador de plataforma
- `.plat-toggle`: inline-flex, fondo --surface-2, borde --line, radius 11, padding 3, gap 2. Dos botones 34×30, radius 8; ícono móvil (rect 11×19) / web (monitor). Activo: `background:var(--ink); color:var(--paper)`.
- JS: lee/persiste `localStorage['pitwall-view']`; default `innerWidth>=1024?'web':'phone'`; al click setea `data-view`.
- **Móvil forzado**: `.app/.wrap{max-width:440px}`, `.nav-inner{max-width:440px}`, calendario `.app-grid{grid-template-columns:1fr}`.
- **Web**: contenido desplazado por la sidebar — `.app{padding-left:288px; align-items:center}` con hijos `max-width:780px`; `.wrap{max-width:1360px; margin:0 auto; padding-left:288px}`; calendario `.app-grid{grid-template-columns:minmax(340px,420px) 1fr}` con `.col-left{position:sticky; top:88px}`; topbar `justify-content:flex-end; padding-left:264px` y marca de topbar oculta.

---

## 5. Heros oscuros (Calendario "Próxima carrera" y En Vivo "Estado")
- Fondo `linear-gradient(160–165deg,#1a1a22 0%,#0c0c12 70–75%)`, borde `1px solid rgba(255,255,255,.08)`, `border-radius:18–20px`, texto `#F3F1EA`, sombra con tinte rojo `0 22–26px 54–60px -30px rgba(225,6,0,.5)`.
- Textura de puntos `::after` enmascarada en diagonal; barrido de luz `::before` animación `sweep` (solo Calendario).
- **Badge pulsante** ("PRÓXIMA CARRERA" / "EN VIVO"): Space Mono 11px 700, letter-spacing .2em, fondo --red, `padding:6–7px 11–12px`, radius 999, animación `pulseRing` 2–2.2s; con punto blanco + ping.
- **Cuenta regresiva** (Calendario): 4 cajas iguales (días/hrs/min/seg), fondo `rgba(255,255,255,.04)`, número Archivo 900 `clamp(26px,7vw,38px)`, etiqueta mono 9px. Tick 1s hacia fecha objetivo.

---

## 6. INICIO — Tu Piloto (tarjeta hero)
- `.driver-card`: grid `118px 1fr`, radius 18, borde --line, overflow hidden, fondo --surface.
- **Badge** (col izq): `background:linear-gradient(155deg, TEAMCOLOR 0%, color-mix(in srgb,TEAMCOLOR 62%,#0c0c12) 100%)`, texto blanco, textura de puntos. Número Archivo 900 54px; bandera 40×27. Botón "⇄ CAMBIAR" absoluto arriba-derecha (mono 9px, fondo `rgba(0,0,0,.28)`, blur, borde claro, radius 999).
- **Body**: nombre pequeño (mono 12px --muted) + apellido (Archivo 900 26px); equipo (mono 11px + punto 8px color equipo); fila stats (Posición/Puntos/Última: número 21px 900 + label mono 8.5px); **forma**: 5 chips 23×23 radius 6 (oro=victoria `background:--gold`; podio=borde dorado + texto dorado; abandono="AB" atenuado); fila "PRÓXIMA … en N días".
- **Bottom-sheet selector**: overlay `rgba(8,8,12,.55)` + blur; hoja `border-radius:22px 22px 0 0`, grip 38×4, header con título 18px 900 + botón ✕ redondo; lista de filas `grid 30px 30px 1fr auto` (número, bandera, nombre+equipo, puntos), seleccionado con outline rojo. Persistir `pitwall-fav` y re-render hero.

---

## 7. CALENDARIO — específicos
- **Grilla**: `display:grid; grid-template-columns:repeat(7,1fr); gap:4px`. Celdas `aspect-ratio:1/1; radius:9px`. 
  - Día pasado: `color:var(--dim)`. HOY: borde --ink + label "HOY" mono 6.5px.
  - Fin de semana pasado: `background:var(--surface-2)` + punto --muted; bandera mini 15×10 arriba-derecha del domingo.
  - Próxima: `background:color-mix(in srgb,var(--red) 14%,var(--surface))`, borde rojo, punto rojo pulsante; domingo con `box-shadow:0 0 0 1.5px var(--red)`.
  - Futura: `background:color-mix(in srgb,var(--gold) 16%,var(--surface))` + punto dorado.
- **Tarjeta de carrera (agenda)**: grid `auto 1fr auto`, radius 14. Pasada: fondo --surface-2, bandera desaturada, "FINALIZADO" + podio (chips con barra de color de equipo 3×13). Próxima: borde rojo + riel rojo `::before` 4px + badge "PRÓXIMA" pulsante. Futura: "PROGRAMADA" en dorado.

---

## 8. POSICIONES — específicos
- **Segmento**: grid 2 col, fondo --surface-2, borde --line, radius 13, padding 4. Botón activo = píldora roja sólida (`background:var(--red); color:#fff; box-shadow:0 6px 16px -8px var(--red)`); inactivo mono --muted. **Importante**: al cambiar de tab, **reconstruir el innerHTML** del segmento y del board (no solo togglear clases) para que el estilo activo se aplique con fiabilidad.
- **Fila piloto**: grid `30px 30px 1fr auto`, gap 13, padding 14. Posición mono 14px; bandera 30×20 radius 3; nombre = mono 11px (nombre) + Archivo 800 21px (apellido) uppercase; equipo con punto 8px; **barra de puntos** (`height:4px; max-width:240px`, relleno = `pts/maxPts*100%` con color de equipo); puntos Archivo 900 26px con "PTS" mono 9px.
- **Líder**: `background:linear-gradient(90deg, color-mix(in srgb,var(--gold) 20%,var(--surface)), transparent 75%)` + riel dorado `::before` 3px + posición/puntos dorados + chip "LÍDER DEL MUNDIAL".
- **Constructores**: grid `30px 7px 1fr auto`, barra de color de equipo 7×30, nombre 21px, iniciales de pilotos mono.

---

## 9. RESULTADOS — específicos
- **Selector**: chips horizontales scroll (sin scrollbar), `padding:9px 13px; radius:11; border:1px solid var(--line)`; bandera 22×15 + ronda mono 10px + GP 13px 700. Seleccionado: `background:var(--ink)` con texto --paper.
- **Encabezado**: grid flex, bandera 52×35; meta mono 10px ("RONDA 09 · RESULTADO · 66 VUELTAS") + GP 26px 900 + circuito mono 11px.
- **Podio de barras**: `grid-template-columns:1fr 1.15fr 1fr; align-items:end`. Orden visual **[P2, P1, P3]**. Alturas: P1 118px, P2 92px, P3 74px. Barra con degradado del color de metal + número 30px 900 blanco arriba + "+N PTS" abajo. Info arriba: bandera 34×23, nombre 15px 800, equipo mono 9px + punto.
- **Clasificación** (desde P4): filas grid `30px 26px 1fr auto auto`; posición, bandera 26×17, nombre+equipo, diferencia mono 12px (con barra de color de equipo 3×15) y puntos mono 13px 700 (cero atenuado). Resaltar favorito (riel rojo).
- **Puntos**: `[25,18,15,12,10,8,6,4,2,1]` para top 10, 0 después.

---

## 10. EN VIVO — específicos
- **Hero estado**: badge "EN VIVO" pulsante + estado de pista (`.flag-status.green` verde #36D07B); GP 26px 900; "VUELTA 34/71" (número 20px 900) + barra de progreso 5px (`linear-gradient(90deg,var(--red),#ff7a32)`, width = lap/total); fila de condiciones (chips mono 10px).
- **Banner vuelta rápida**: tag morado (`background:var(--purple)`, mono 9px) + piloto 15px 800 + tiempo morado mono 15px.
- **Timing tower**: filas grid `34px 5px 1fr auto`, padding `11px 14px 11px 10px`.
  - Pos: número mono 15px + flecha cambio (▲ verde #36D07B / ▼ rojo / – muted, mono 8px).
  - Barra de color de equipo 5×34.
  - Piloto: código 17px 800 + nombre mono 11px; meta: **neumático** (círculo 15px borde de color del compuesto con letra + "Nv") + **DRS** (badge; verde si activo) o **BOX** (badge dorado en pits).
  - Derecha: intervalo al líder mono 14px 700 ("LÍDER" en rojo para P1) + última vuelta mono 11px (morada si es la vuelta rápida).
  - Favorito: fondo `color-mix(in srgb,var(--red) 7%,var(--surface))` + riel rojo.
- **Simulación**: `setInterval ~2200ms` jitterea tiempos y avanza la vuelta. En producción, reemplazar por el feed en vivo real.

---

## 11. Persistencia (localStorage)
| Clave | Valores | Efecto |
|---|---|---|
| `pitwall-theme` | light/dark | atributo `data-theme` |
| `pitwall-view` | phone/web | atributo `data-view` |
| `pitwall-fav` | id de piloto | resalta en Inicio/En Vivo/Resultados |

## 12. Checklist de paridad
- [ ] Tokens claro/oscuro exactos.
- [ ] Archivo + Space Mono con los pesos/tracking indicados.
- [ ] Topbar + nav 5 pestañas (móvil flotante / web sidebar) con activos correctos y pip de EN VIVO.
- [ ] Conmutador Móvil/Web y toggle de tema, ambos persistentes.
- [ ] Inicio: tarjeta de piloto + selector + módulos (último GP, lucha por título, top 5, circuito con mapa, titulares).
- [ ] Calendario: hero con cuenta regresiva + grilla con estados + agenda; 2 columnas en web.
- [ ] Posiciones: segmento, barras de puntos, líder dorado.
- [ ] Resultados: selector multironda + podio de barras + clasificación.
- [ ] En Vivo: hero de estado + tower con neumáticos/DRS/gaps + simulación.
- [ ] Animaciones (pulso, ping, sweep) + reduced-motion.
- [ ] Piloto favorito compartido entre vistas.
