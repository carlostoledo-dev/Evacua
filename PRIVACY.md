# Privacy

**Short version: Evacua collects nothing.** No accounts, no names, no analytics, no trackers,
no telemetry, no third-party error reporting, no backend. Your location never leaves your phone
and is never stored.

## Your location

- Used **only in memory**, to plan the route on your phone. It is never written to storage,
  never sent anywhere and never put in a URL. Closing or reloading the app forgets it.
- It is read only when you ask: "Buscar mi ruta" (one GPS reading), the map's "find me" button,
  or while you navigate (continuous reading that stops when you leave the route).
- You can use the app without GPS: tap the map or try a labeled DEMO point.
- The browser asks for permission first; the server allows geolocation only for this site
  (`Permissions-Policy: geolocation=(self)`).

## What is stored on your phone (and only there)

| Key (localStorage) | Content                                                          | Why                    |
| ------------------ | ---------------------------------------------------------------- | ---------------------- |
| `evacua:user`      | Profile type (Persona / Adulto mayor / Niño) and "tutorial seen" | Remember your profile  |
| `evacua:locale`    | `es-CL` or `en`                                                  | Remember your language |
| `evacua:theme`     | Light, dark or automatic                                         | Remember your theme    |
| `evacua:kit`       | Which items of SENAPRED's emergency-kit list you ticked          | Your own checklist     |

There is no name field (removed on purpose, 2026-10-04). **Ajustes → "Borrar mis datos"** deletes
every key above. If storage is blocked (private mode), the app still works with defaults.

The service worker also keeps a copy of the app and the map data so it works offline; that copy
contains no personal data.

## Network

The app only talks to its own origin (`connect-src 'self'` in the Content Security Policy): no
third-party scripts, fonts, maps or APIs. The hosting provider (Vercel) serves the files and may
keep standard technical access logs (IP address, time, file requested), as any web server does;
Evacua adds nothing to them and reads nothing from them.

## Voice

Instructions are read aloud with the device's **own** voices (Web Speech API). Some browsers
also offer cloud voices that send the text to a server (for example "Google español" in desktop
Chrome); Evacua never uses those, because the text can name the streets around you. If only
cloud voices exist for your language, nothing is read aloud and the same text stays on screen.

## Children

The child profile stores the same four keys as everyone else and nothing more.

## Questions

Open an issue in the repository: https://github.com/carlostoledo-dev/Evacua/issues

---

**Resumen en español:** Evacua no recolecta nada. Tu ubicación se usa solo en la memoria del
teléfono para calcular la ruta, nunca se guarda ni se envía. En el teléfono solo quedan tu tipo
de perfil, idioma, tema y tu lista de mochila de emergencia; "Borrar mis datos" (Ajustes) lo
elimina todo. La app solo se comunica con su propio sitio, y la voz usa únicamente las voces del
propio dispositivo.
