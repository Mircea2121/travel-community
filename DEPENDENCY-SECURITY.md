# Actualizare de securitate a dependențelor — 22 octombrie 2026

Actualizare: dependențele corectate sunt acum live; vezi
[publicarea și verificările de pe VPS](DEPLOYMENT-2026-10-22.md).

Modificările sunt locale. Nu s-a publicat în producție și nu s-au schimbat
secretele, autorizarea, CSP sau verificarea TLS.

## Versiuni instalate

| Componentă | Înainte | După |
|---|---|---|
| Next.js | 16.3.0 | 16.4.2 |
| eslint-config-next | 16.2.9 | 16.4.2 |
| engine.io | 6.6.9 | 6.6.11 |
| sharp | 0.35.3 | 0.35.5 |
| source-map-js | 1.2.1 | 1.2.2 |
| baseline-browser-mapping (web) | 2.10.40 | 2.11.31 |
| Capacitor core / Android / CLI | 8.5.0 | 8.5.3 |
| Vite (mobil) | 7.3.6 | 7.3.7 |
| uuid, folosit de xcode în CLI mobil | 7.0.3 | 11.1.1 |
| brace-expansion (mobil) | 5.0.9 | 5.0.12 |

Next.js și configurația ESLint sunt fixate la aceeași versiune. Au fost
actualizate ambele lockfile-uri. Nu s-a folosit `npm audit fix --force` și
nu s-au introdus versiuni canary sau downgrade-uri de framework.

## Dependențe tranzitive care au necesitat ajustări

Auditul complet web a găsit și `braces`, prin fast-glob din pluginul Next ESLint.
[Advisory-ul GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
nu are o versiune corectată publicată. Lanțul vulnerabil a fost eliminat,
nu ignorat în raportul de audit.

`fast-glob` este rezolvat printr-un adaptor local din `tools/eslint-glob-adapter`,
bazat pe tinyglobby 0.2.15. Singurul său consumator din arbore este
@next/eslint-plugin-next 16.4.2, care folosește numai `globSync` pentru rootDir.
Adaptorul dezactivează `expandDirectories`, astfel încât o potrivire de director
nu se extinde implicit la toate subdirectoarele. Rămân active regulile Next.js.

În CLI-ul mobil, un override limitat la xcode fixează uuid la 11.1.1. xcode 3.0.1
folosește API-ul CommonJS `uuid.v4()`, păstrat de această versiune. Nu s-a făcut
downgrade la Capacitor CLI.

Aceste două ajustări trebuie păstrate împreună cu lockfile-urile și revizuite
la viitoarele actualizări ale pluginului ESLint sau Capacitor. Directorul
`tools/eslint-glob-adapter` trebuie inclus în checkout înainte de `npm ci`;
copierea exclusivă a celor două fișiere package din rădăcină nu este suficientă.
Directoarele node_modules ale adaptorului sunt ignorate de Git.

## Verificări după actualizare

- `npm ci` în rădăcină și separat în apps/mobile: trecut.
- `npm audit --omit=dev`: 0 vulnerabilități.
- `npm audit` în rădăcină, inclusiv dezvoltare: 0 vulnerabilități.
- `npm audit` în apps/mobile, inclusiv dezvoltare: 0 vulnerabilități.
- `npm run lint`: trecut, fără erori sau avertismente. Au fost documentate
  punctual reîncărcările complete intenționate după login/logout, semnalate de
  noua regulă de navigare Next; comportamentul autentificării a fost păstrat.
- `npm run test:dependencies`: 3 teste trecute. Acoperă globs rootDir și o regulă
  Next care continuă să raporteze linkuri interne HTML incorecte; parsare/scriere
  xcode și generare UUID; respingerea protocolului Engine.IO vechi, respingerea
  unui client Socket.IO neautorizat și confirmarea unui mesaj cu client de test.
  Testul Socket.IO este izolat, pe loopback, cu date fictive și fără MongoDB.
- `npm run build`: trecut cu Next.js 16.4.2 și inlineCss; 51 pagini statice.
- `npm run mobile:build`: trecut cu Vite 7.3.7. Nu s-a generat un APK și nu s-a
  rulat sincronizarea platformelor native.
- `npm run test:public-session`: trecut pe build-ul nou. Vizitatorul și tokenul
  invalid primesc user:null pe ruta opțională; API-urile protejate păstrează 401.
- Optimizatorul Next/sharp a generat AVIF și WebP pentru hero cu răspuns 200 și
  MIME corect; hero SSR, preload și CSP au trecut verificările de sesiune.
- `git diff --check`: trecut.
- `npm run test:smoke`: /, /login, /register, /verify-email și /api/auth/me trec;
  /api/posts/feed depășește din nou timeout-ul din cauza problemei TLS/Atlas
  existente în acest mediu. Nu s-a dezactivat verificarea certificatelor.
  Ulterior, TLS a fost remediat prin regula IP temporară aprobată; smoke are
  acum un 500 de autentificare pe feed. Vezi [diagnosticul actual](MONGODB-CONNECTION.md).

Testele izolate nu substituie testarea chatului cu două conturi reale și cu
MongoDB/Redis disponibile. Rezultatele Lighthouse consemnate anterior în
PAGESPEED-OPTIMIZATION.md provin din build-ul Next.js 16.3.0; nu au fost rerulate
după această actualizare și nu confirmă un scor nou.

## Înainte de publicarea aprobată

Include ambele manifesturi/lockfile-uri și adaptorul local în checkout. Rulează
instalarea din lockfile, auditul, testele și build-ul în mediul țintă; verifică
accesul Atlas/Redis și fluxurile autentificate. Actualizarea mobilă necesită
separat sincronizare și build nativ când va fi distribuită. Publicarea și
restarturile serviciilor de producție rămân neefectuate și necesită acordul
proprietarului. Repetă PageSpeed pe URL-ul public după publicarea aprobată.

Referințe: [Next.js 16.4.2](https://github.com/vercel/next.js/releases/tag/v16.4.2),
[advisory-urile Next.js](https://github.com/vercel/next.js/security/advisories).
