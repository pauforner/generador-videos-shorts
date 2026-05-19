<div align="center">
  <img src="src/renderer/assets/logo-inicia.png" alt="Inicia" height="80" />
</div>

# Generador de Vídeos Verticales 9:16

Herramienta de escritorio (Mac + Windows) para convertir guiones en vídeos verticales 9:16 listos para redes sociales (Reels, TikTok, Shorts). Creada por **Pau Forner** para **[metodoinicia.com](https://metodoinicia.com)** y **[metadigitales.com](https://metadigitales.com)**.

---

## Qué hace

Pegas un guion, eliges una voz de ElevenLabs, un estilo de subtítulos y, si quieres, una pista de música de fondo. La app:

1. **Analiza el guion** con Claude o GPT y lo divide en escenas con palabras clave visuales.
2. **Genera la voz en off** con ElevenLabs (con timestamps palabra-a-palabra).
3. **Descarga b-rolls** automáticamente de Pexels (y Pixabay como fallback).
4. **Compone el vídeo** 1080×1920 a 30fps con FFmpeg, mezcla voz + música con ducking automático.
5. **Quema los subtítulos** sincronizados al estilo que hayas elegido (Hormozi, Karaoke, Una palabra XXL, Word-by-word, Clásico).
6. **Exporta** un MP4 en tu carpeta de salida.

Tus API keys se guardan **cifradas en tu equipo** con `safeStorage` de Electron — nunca salen de aquí.

---

## Antes de empezar — instala Node.js

La app necesita **Node.js 20 o superior**.

- **Mac**: descarga el instalador `.pkg` desde https://nodejs.org/es (versión LTS) y ábrelo.
- **Windows**: descarga el instalador `.msi` desde https://nodejs.org/es (versión LTS) y ábrelo.

Para comprobar que está bien instalado, abre la Terminal (Mac) o PowerShell (Windows) y escribe:

```bash
node --version
```

Debe responder algo como `v20.x.x` o superior.

---

## Instalación

1. En GitHub, pulsa el botón verde **Code** → **Download ZIP**.
2. Descomprime el ZIP en una carpeta de tu elección (por ejemplo `~/Documentos/generador-videos`).
3. **Abre esa carpeta con Claude Code** (drag & drop o ejecutando `claude` dentro de la carpeta).
4. En la terminal de Claude Code, ejecuta:

   ```bash
   npm install
   ```

   La instalación tarda 1-3 minutos la primera vez.

5. Arranca la app:

   ```bash
   npm run dev
   ```

Se abrirá una ventana con la pantalla de **Configuración inicial**.

---

## Configuración inicial — dónde sacar las API keys

| Servicio | Para qué | Dónde |
|---|---|---|
| **ElevenLabs** (obligatoria) | Voz en off + timestamps | https://elevenlabs.io/app/settings/api-keys |
| **Pexels** (obligatoria) | B-rolls primarios | https://www.pexels.com/api/new/ |
| **Anthropic** *o* **OpenAI** (una de las dos) | Análisis del guion | https://console.anthropic.com/settings/keys · https://platform.openai.com/api-keys |
| **Pixabay** (opcional) | B-rolls fallback | https://pixabay.com/api/docs/ |

Pégalas en la pantalla de Configuración inicial, elige carpeta de salida y pulsa **Guardar y continuar**.

> No necesitas Whisper ni OpenAI para los subtítulos: usamos los timestamps nativos de ElevenLabs.

---

## Usar la app — 4 pasos

1. **Tab Guion**: pega tu guion completo. Idioma libre (funciona muy bien en español).
2. **Tab Voz**: elige una voz de tu cuenta de ElevenLabs en el desplegable "Mis voces" (o pega un Voice ID a mano). Ajusta velocidad y volumen. Pulsa **Probar voz** para escuchar una muestra antes de generar.
3. **Tab Música**: arrastra un MP3 si quieres fondo musical. El **ducking** baja la música automáticamente bajo la voz.
4. **Tab Subtítulos**: elige uno de los 5 estilos y los colores. **Tab Edición**: ajusta la duración mínima y máxima de cada b-roll (vídeos más dinámicos con max=3-4s, más relajados con max=6-8s).

Pulsa **Generar vídeo**. Tarda 1-3 minutos según la longitud del guion.

Cuando termine, podrás previsualizar el resultado, abrir el MP4 en Finder/Explorer, regenerar con otros ajustes o crear un vídeo nuevo desde cero.

---

## Personalizar con Claude Code

Como tienes el proyecto abierto en Claude Code, pídele lo que quieras: cambiar colores, añadir un sexto estilo de subtítulos, integrar otra API de stock video, cambiar la fuente de los subtítulos, añadir un outro con tu logo… Claude entiende el proyecto gracias al [`CLAUDE.md`](./CLAUDE.md) que viene incluido.

---

## Troubleshooting

| Problema | Solución |
|---|---|
| `npm: command not found` | No tienes Node.js instalado. Vuelve al paso "Antes de empezar". |
| `Error: ElevenLabs 401` | API key incorrecta. Ve a Ajustes y revísala. |
| `Pexels 429: too many requests` | Has superado el rate limit gratuito (200 req/h). Espera una hora o pasa al plan de pago de Pexels. |
| `Voice ID inválido` | Vuelve a la tab Voz y selecciona una voz del desplegable "Mis voces". |
| En Mac, ffmpeg pide permisos | Acepta el diálogo de la primera vez. Es normal en macOS. |

---

## Créditos

Creado por Pau Forner para [metodoinicia.com](https://metodoinicia.com) y [metadigitales.com](https://metadigitales.com).

Licencia: [MIT](./LICENSE)
