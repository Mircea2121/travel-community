# Publicare — 22 octombrie 2026

Modificările PageSpeed și actualizările de securitate au fost publicate cu
autorizarea explicită a proprietarului. Serviciile web și realtime au fost
repornite cu succes la 22:45, ora României (19:45 UTC). Corecția finală a
fotografiei Egipt a fost comutată la 22:50 (19:50 UTC).

## Versiunea activă și revenirea

- URL: https://www.comunitatea-calatorilor.ro/
- Release final: `/var/www/travel-community/releases/pagespeed-20261022-3652fe2-r2`.
- `/var/www/travel-community/current` este acum un symlink către release.
- Instalarea anterioară completă, inclusiv build și dependențe, este păstrată
  la `/var/www/travel-community/releases/previous-20261022-before-pagespeed`.
- Configurația anterioară este păstrată în fișierul protejat
  `/var/www/travel-community/shared/.env.production.before-pagespeed-20261022`.

Sursele au fost transferate fără `.env.local`, secrete, node_modules sau build-uri
locale. Serverul folosește propria configurație de producție, cu autentificare
MongoDB funcțională. Problema credențialelor locale nu a fost transferată pe VPS.
Nu au fost resetate parole și nu au fost rulate migrații sau indexări.

NEXT_PUBLIC_REALTIME_URL este gol în build și în configurația serverului:
browserul folosește acum originul paginii și proxy-ul existent /socket.io.
Astfel, pagina www nu depinde de o conexiune separată către domeniul fără www,
iar cookie-ul de sesiune al paginii poate fi folosit la autentificarea socketului.

## Verificări

Versiunea nouă a fost construită separat și verificată pe 127.0.0.1:3002 înainte
de comutare. A existat revenire automată la instalarea anterioară în caz de eșec
al verificărilor de după comutare; aceasta nu a fost necesară. Procesul temporar
de verificare este oprit.

- Next.js 16.4.2, build web și build mobil: trecute pe VPS.
- Auditurile complete web și mobil: 0 vulnerabilități raportate.
- ESLint și cele trei teste de compatibilitate: trecute pe VPS.
- MongoDB ping, cu validarea TLS activă: trecut pe VPS.
- Redis PING și health realtime: trecute.
- Toate cele 6 teste smoke: trecute înainte și după comutare, apoi din exterior,
  prin URL-ul HTTPS public, inclusiv feedul cu date reale.
- Testele de sesiune anonimă și token invalid: trecute pe URL-ul public.
- API-urile popular/overview și optimizarea hero în AVIF/WebP: trecute.
- WebSocket prin domeniul www: accesibil; un client fără token este respins cu
  AUTH_TOKEN_MISSING, conform autorizării existente.
- Pagina live a fost verificată vizual, cu postările reale încărcate.
- Prima măsurătoare live a identificat un URL Unsplash 404 pentru Egipt;
  acesta a fost înlocuit cu o fotografie validă, optimizată local în WebP.
  Corecția a fost construită și verificată separat, apoi publicată cu aceeași
  protecție de revenire. Imaginea publică răspunde 200.

## Lighthouse pe URL-ul public, după ultima corecție

| Profil | Performanță | Accesibilitate | Bune practici | SEO | LCP | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mobil | 97 | 100 | 100 | 100 | 2,5 s | 0 | 522 KiB |
| Desktop | 96 | 100 | 100 | 100 | 1,3 s | 0 | 740 KiB |

Lighthouse 13.5.0 a fost rulat din Chrome headless pe site-ul public cu date reale,
folosind profilurile standard mobil și desktop. Nu este o rulare găzduită de
pagespeed.web.dev; scorurile pot varia în funcție de rețea, încărcare și cache.
Ambele rapoarte sunt fără avertismente și fără erori în consolă. Vizitatorul
produce o singură cerere /api/auth/session și nu produce cereri de heartbeat
sau conexiuni Socket.IO. 100 la performanță nu este confirmat pe niciun profil.

Nu a fost efectuat un schimb de mesaje între două conturi reale în cadrul
acestei publicări; verificarea transportului și testele Socket.IO nu îl substituie.
Actualizările mobile sunt incluse în surse și build-ul a fost verificat, dar
nu a fost distribuit un APK sau un pachet nativ.

## Dacă este necesară revenirea

Folosește instalarea și configurația de backup de mai sus, apoi repornește
travel-community-web și travel-community-realtime și repetă smoke testele.
Revenirea ar readuce și versiunile vechi ale dependențelor, inclusiv Next.js
16.3.0; este o măsură de urgență, nu o rezolvare permanentă.
