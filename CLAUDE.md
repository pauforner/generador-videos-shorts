# CLAUDE.md — contexto del proyecto

App Electron + React + TypeScript que genera vídeos verticales 9:16 a partir de un guion. Pipeline: análisis con LLM → TTS ElevenLabs con timestamps → descarga de b-rolls Pexels/Pixabay → composición FFmpeg → quemado de subtítulos ASS.

## Estructura

```
src/
├── main/                          # Proceso principal de Electron (Node)
│   ├── index.ts                   # Boot + ventana + handlers IPC
│   ├── store.ts                   # Persistencia cifrada con safeStorage
│   ├── api/                       # Clientes de APIs externas
│   │   ├── elevenlabs.ts          # TTS con timestamps + listVoices + sample
│   │   ├── llm.ts                 # Wrapper Claude (Anthropic) y GPT (OpenAI)
│   │   ├── pexels.ts              # Búsqueda de b-rolls (devuelve candidatos)
│   │   └── pixabay.ts             # Fallback de b-rolls
│   ├── pipeline/                  # Pasos de generación
│   │   ├── orchestrator.ts        # Orquesta las 7 fases con progreso
│   │   ├── align-scenes.ts        # Cruza escenas LLM con timestamps EL
│   │   ├── split-merge.ts         # Aplica min/max de duración por clip
│   │   ├── fetch-broll.ts         # Descarga b-rolls (evita duplicados)
│   │   ├── compose.ts             # FFmpeg: corte + escalado + audio mix
│   │   ├── burn-subs.ts           # Quema el ASS con FFmpeg
│   │   └── ffmpeg-binary.ts       # Path al ffmpeg-static bundleado
│   └── subtitles/                 # Generación de subtítulos
│       ├── ass-builder.ts         # Helpers comunes (color, time, header)
│       └── styles/                # Cada estilo en su archivo
│           ├── index.ts           # Registro de estilos
│           ├── hormozi.ts
│           ├── karaoke.ts
│           ├── single-xxl.ts
│           ├── rolling.ts
│           └── classic.ts
├── preload/
│   └── index.ts                   # Bridge IPC seguro (contextBridge)
├── renderer/                      # App React
│   ├── App.tsx                    # Router de vistas + Footer global
│   ├── pages/
│   │   ├── Setup.tsx              # Configuración inicial de keys
│   │   ├── NewVideo.tsx           # Tabs Guion/Voz/Música/Subs/Edición
│   │   └── Result.tsx             # Preview del MP4 + acciones
│   └── components/
│       ├── Header.tsx             # Header con logo de Inicia
│       ├── Footer.tsx             # Footer con créditos
│       └── SubtitlePreview.tsx    # Preview visual del estilo de subs
└── shared/
    └── types.ts                   # Tipos compartidos main + renderer
```

## Convenciones

- **TypeScript estricto**. Nada de `any`.
- **IPC** siempre vía `contextBridge` en `preload/index.ts`. Renderer NUNCA accede directo a Node.
- **API keys** se manejan SIEMPRE en el main process. El renderer no las ve nunca.
- **No añadas comentarios redundantes**. El código bien nombrado se explica solo.
- **Errores en pipeline**: se relanzan al renderer; el orchestrator hace `finally` para limpiar `tempDir`.

## Cómo añadir un nuevo estilo de subtítulos

1. Crea `src/main/subtitles/styles/mi-estilo.ts` copiando el patrón de `hormozi.ts`.
2. Regístralo en `src/main/subtitles/styles/index.ts` (mapa `styles`).
3. Añade su `id` al tipo `SubtitleStyleId` en `src/shared/types.ts`.
4. Añade una entrada al array `STYLES` en `src/renderer/pages/NewVideo.tsx`.
5. Añade un branch al `switch (settings.styleId)` de `src/renderer/components/SubtitlePreview.tsx` para que se vea el preview.

## Cómo cambiar el modelo del LLM

Edita el `model` en `src/main/api/llm.ts`:
- Anthropic: `claude-haiku-4-5` (default) → `claude-sonnet-4-6` para mejor calidad.
- OpenAI: `gpt-4o-mini` (default) → `gpt-4o` o el modelo que prefieras.

## Cómo añadir otra API de stock video

1. Crea `src/main/api/mi-banco.ts` con `searchMiBancoVideos(apiKey, query, minDuration): Promise<BrollMatch[]>`.
2. En `src/main/pipeline/fetch-broll.ts`, encadénalo después de Pexels y Pixabay en `getCandidates()`.
3. Si necesita una nueva API key, añádela a `AppConfig` en `src/shared/types.ts` y a `SECRET_KEYS` en `src/main/store.ts`.
4. Añade un campo nuevo en la pantalla Setup (`src/renderer/pages/Setup.tsx`).

## Comandos útiles

```bash
npm run dev          # Modo desarrollo con hot reload
npm run build        # Build de los 3 procesos (main + preload + renderer)
npm run typecheck    # tsc --noEmit en ambos tsconfigs
npm run build:mac    # Genera .dmg (uso interno; la distribución oficial es el repo)
npm run build:win    # Genera .exe (uso interno)
```
