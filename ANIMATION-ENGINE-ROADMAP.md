# Animation Engine Roadmap

The unified MASTER compositor is active. Decorative engines remain disabled until each engine's static isolation proof is approved.

1. BorderFrameEngine
2. DashboardEngine
3. TabletEngine
4. HolyAltarEngine
5. RainCloudEngine
6. RainEngine and RippleEngine
7. MusicIconEngine and SoundtrackEngine
8. GyroscopeEngine
9. LightningEngine and ThunderEngine
10. ScoreRevealEngine

## Governing implementation rule

One engine, one isolated patch, one live test, one approval, one Git checkpoint.

Every engine must implement:

- `id`
- `init(context)`
- `resize(geometry)`
- `update(deltaTime, elapsedTime)`
- `render()`
- `handleEvent(eventName, payload)`
- `destroy()`

## Unified rendering rule

Decorative engines do not own independently scaled visible canvases. They render through the shared MASTER compositor context so the MASTER texture, masks, and effects use one normalized UV plane.
