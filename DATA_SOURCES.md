# Data sources

Evacua is a safety tool, so every piece of geographic data and every safety-relevant number
must have a traceable source. This file lists them all, with license and verification status.

## Status labels

| Label in the app              | Meaning                                                                                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fuente oficial verificada** | Downloaded directly from the official publisher's own service, with source URL and retrieval date stamped on every feature. It means the _origin_ is verified; it is not a ground survey and does not replace on-site signs. |
| **DEMO / sin verificar**      | Simulated or unverified data. Shown with a warning badge. Must never be presented as official.                                                                                                                               |

These rules are enforced in code, not just documented:

- Every feature must carry `source`, `sourceUrl`, `retrievedAt`, `license` and `verified`
  ([`src/data/schema.ts`](src/data/schema.ts)). Missing fields fail validation.
- A feature can never claim more than its source: same `verified` flag, same license, and a
  `sourceUrl` under the source's URL ([`src/data/consistency.ts`](src/data/consistency.ts)).
- `npm run build` runs `npm run data:validate` first, so invalid or unlabeled data cannot ship.
- In the browser the same validation runs again. If anything fails, the app shows an explicit
  error and draws nothing.

## Layers shipped today: Coronel, Yobilo pilot sector

| Layer (app id)              | What it is                                              | Features | Source                | Status   | Retrieved  |
| --------------------------- | ------------------------------------------------------- | -------: | --------------------- | -------- | ---------- |
| `tsunami-evacuation-area`   | Tsunami evacuation area ("Área a Evacuar")              |        1 | SENAPRED, 2024 layers | Verified | 2026-10-01 |
| `tsunami-safe-line`         | Limit of the evacuation area ("Línea Segura")           |        2 | SENAPRED, 2024 layers | Verified | 2026-10-01 |
| `tsunami-evacuation-routes` | Official evacuation routes ("Vías de Evacuación")       |       18 | SENAPRED, 2024 layers | Verified | 2026-10-01 |
| `tsunami-meeting-points`    | Official tsunami meeting points ("Puntos de Encuentro") |       10 | SENAPRED, 2024 layers | Verified | 2026-10-01 |

Files: [`public/data/communes/coronel/`](public/data/communes/coronel/).

### SENAPRED: "Amenaza por Tsunami" (2024)

- **Publisher:** Servicio Nacional de Prevención y Respuesta ante Desastres (SENAPRED), Chile.
- **What it contains:** meeting points, evacuation routes, limit of the evacuation area,
  evacuation area and 30 m contour. SENAPRED compiled it from the tsunami evacuation plans of
  coastal municipalities.
- **Catalog record (IDE Chile):** https://geoportal.cl/geoportal/catalog/35413/Amenaza%20por%20Tsunami
- **Service:** https://services5.arcgis.com/i7S5PSnIJAUcWvSE/ArcGIS/rest/services/Amenaza_por_Tsunami_2024/FeatureServer
  (layers 0: meeting points, 1: evacuation routes, 2: safe line, 3: evacuation area).
- **Basis of the safe line:** the source attribute `fuente` of the safe line is `CITSU`, i.e.
  SHOA's tsunami inundation chart. A peer-reviewed case study of the CITSU for Coronel exists
  ([Revista Terra Australis](https://www.revistaterraaustralis.cl/index.php/rgch/article/view/131)).
- **License:** none is declared in the service or its metadata. IDE Chile asks users of
  geospatial data published on its platforms to cite the providing institution, which Evacua does
  in the app and here. **Open item:** written confirmation of reuse terms from SENAPRED has not
  been requested yet.
- **Transformations applied by Evacua**
  ([`scripts/import-senapred.ts`](scripts/import-senapred.ts)):
  1. Query only features intersecting the commune's data bounds.
  2. Keep only the fields the app needs (codes, sector, basis) and add the provenance fields.
  3. Clip the evacuation area polygon and the safe line to the data bounds. Edges created at the
     bounds are not real limits. Routes and meeting points are kept whole.
  4. Round coordinates to 6 decimals (about 0.1 m).

  Nothing is added, moved or invented.

- **Known source limitations:** meeting points have codes (for example `08102PE029`) but no
  names (`nombre_pe` is empty in the source). Requesting the Esri JSON format returns some
  mis-encoded accents; the GeoJSON format used by the script is correct.

### Pilot service area

The Yobilo service area (`sector.serviceArea` in the manifest) was **defined by the Evacua
project** around the Yobilo road (Villa Mora to Calabozo). It is not an official administrative
boundary. The data bounds extend beyond it so routes can reach nearby safe zones.

## Safety-relevant constants

All in [`src/domain/constants.ts`](src/domain/constants.ts).

| Constant                             | Value              | Source                                                                                                                                                                                                                                                                               |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Walking speed, average healthy adult | 4 mph (≈ 1.79 m/s) | FEMA P-646, _Guidelines for Design of Structures for Vertical Evacuation from Tsunamis_, 3rd ed. (Aug 2019), ch. 5, p. 5-2 ([PDF](https://www.fema.gov/sites/default/files/documents/fema_rsl_guidelines-for-design-of-structures-for-vertical-evacuation-from-tsunamis_050925.pdf)) |
| Walking speed, mobility-impaired     | 2 mph (≈ 0.89 m/s) | Same page                                                                                                                                                                                                                                                                            |

FEMA uses these speeds to space evacuation structures, not to promise arrival times, and
4 mph is an optimistic pace. Evacua will therefore show travel time as a range and never as
"you have time".

## Not available yet (no data is invented to fill these gaps)

| Need                           | Status                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wildfire layer                 | Decision pending ([docs/PLAN.md](docs/PLAN.md), D2). No official, licensed wildfire layer for Yobilo has been identified yet. Options: an approximate layer derived from OpenStreetMap vegetation, clearly labeled; an official CONAF/SENAPRED layer if one is found; or dropping wildfire from the pilot. |
| Earthquake meeting points      | No official open-space meeting points found for Yobilo. Earthquake guidance will rely on official SENAPRED/SHOA instructions and, near the coast, on the tsunami layers above.                                                                                                                             |
| Basemap                        | Phase 3: OpenStreetMap data (© OpenStreetMap contributors, ODbL), attribution visible on the map.                                                                                                                                                                                                          |
| Pedestrian network for routing | Phase 4: derived from OpenStreetMap (ODbL).                                                                                                                                                                                                                                                                |

## How to update the data

```bash
npm run data:import     # re-download SENAPRED layers for Coronel, stamp today's date, format
npm run data:validate   # same validation the app runs; also runs before every build
```

Review the diff before committing: a change in feature counts or geometry means the official
source changed.

## How to add another commune

1. Create `public/data/communes/<id>/manifest.json` (copy Coronel's and edit bounds, sector and
   layers).
2. Add `{ "id": "<id>", "manifest": "<id>/manifest.json" }` to
   [`public/data/communes/index.json`](public/data/communes/index.json).
3. If SENAPRED covers the commune, run `node scripts/import-senapred.ts <id>`. Otherwise add layer
   files by hand with full provenance on every feature.
4. Run `npm run data:validate`. No code changes are needed: a unit test loads a second
   fixture commune to prove it.

## How to replace DEMO data with official data

If a layer only exists as DEMO (for example while waiting for a municipality's file):

1. Get the official file from the publisher (for example SHOA's georeferenced CITSU, or the
   municipality's evacuation plan) and keep the link where it was published.
2. Convert it to GeoJSON in WGS84, for example with GDAL:
   `ogr2ogr -f GeoJSON -t_srs EPSG:4326 layer.geojson official-file.shp`.
3. Add the provenance fields to every feature. Set `verified: true` **only** if the file comes
   directly from the official publisher, and add or update the matching source in the manifest.
4. Run `npm run data:validate`. The app will then show the layer as "Fuente oficial verificada".
