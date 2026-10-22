# Optimizări PageSpeed — 22 octombrie 2026

Actualizare: modificările au fost publicate ulterior cu acordul proprietarului.
Vezi [raportul publicării](DEPLOYMENT-2026-10-22.md). Rezultatele locale de mai jos
documentează etapa inițială.

Nu s-a publicat nimic în producție. Arborele Git era curat înaintea intervenției.
Au fost citite README.md și PRODUCTION-CHECKLIST.md; nu există AGENTS.md în proiect sau pe calea părinților verificată.

## Cauze confirmate

Raportul furnizat, citit în PageSpeed Insights, indică pe mobil 69/92/92/100,
LCP 5,7 s, CLS 0,157 și 2.763 KiB transferați. Hero era imagine CSS externă
la 2200 px, fără prioritate explicită. Template-ul elimina conținutul din HTML-ul
inițial și adăuga un loader de 1,5 s. Caruselul gol creștea după sosirea postărilor,
deplasând statisticile; raportul atribuie 0,137 acestei zone, 0,016 steagurilor și
0,004 acțiunilor din navbar. Pozițiile steagurilor depindeau de înălțimea întregii pagini.

Navbar, Hero și About cereau separat /api/auth/me. Presence și realtime porneau
pentru vizitatori. Raportul confirmă 401, fallback-ul randomuser blocat de CSP și
încercări WebSocket repetate către domeniul fără www. Cele trei etichete albastre
și punctele caruselului sunt elementele cu contrast/ținte tactile semnalate.

## Implementare

- Conținut vizibil din SSR, fără întârzierea artificială. Limita Suspense necesară
  pentru verificarea emailului, anterior mascată de loader, este explicită.
- Aceeași fotografie hero, salvată local în WebP; variante responsive Next Image,
  preload, fetchPriority high, calitate 60 și AVIF/WebP. Celelalte imagini editoriale
  folosesc variante responsive și lazy loading, inclusiv fundalurile About și CTA.
- CSS inclus în HTML prin opțiunea experimentală Next.js `inlineCss`, verificată
  prin build și Lighthouse: fără cereri CSS care blochează prima afișare.
  Această opțiune mărește HTML-ul și trebuie reverificată la actualizarea Next.js.
- Spațiu rezervat caruselului și numerelor; titlurile lungi sunt limitate vizual,
  iar postarea completă rămâne accesibilă. Steaguri de 80 px, dimensiuni explicite,
  poziții independente de creșterea conținutului. Contul din navbar ocupă spațiu
  și înainte de verificarea sesiunii.
- Contrast corectat, inclusiv sigla pe desktop și butonul de reîncercare; puncte
  cu suprafață tactilă 44×44 px; cardurile sunt linkuri, iar slide-urile inactive
  sunt inert. Fallback de avatar local, fără extinderea CSP.
- SessionProvider comun și GET /api/auth/session: vizitatorul sau tokenul invalid
  primește 200 cu user:null și no-store. /api/auth/me și toate API-urile protejate
  își păstrează autorizarea și 401. Noua rută reutilizează verificarea existentă,
  inclusiv suspendarea și revocarea tokenurilor. Erorile temporare nu șterg o
  sesiune deja cunoscută în interfață.
- Heartbeat și Socket.IO numai după autentificare; clientul Socket.IO se descarcă
  dinamic. Heartbeat oprește activitatea la 401; reconectarea și conversațiile
  utilizatorilor autentificați rămân implementate. Cererile vechi nu resetează
  o sesiune după demontarea heartbeat-ului.
- Exemplul de configurare lasă NEXT_PUBLIC_REALTIME_URL gol, pentru același origin
  și proxy-ul /socket.io. Codul păstrează suportul unui server realtime separat.
  O valoare existentă pe server NU este schimbată automat de această modificare.

## Verificări și limite

- `npm run lint`: trecut fără avertismente.
- `npm run build`: trecut; 51 de pagini statice generate.
- `npm run test:public-session`: trecut pentru vizitator și token invalid,
  no-store, 401 pe API-urile protejate, hero în HTML, preload și CSP păstrat.
- `git diff --check`: trecut.
- Smoke pe build-ul real: /, /login, /register, /verify-email și /api/auth/me
  trec; /api/posts/feed depășește timeout-ul. API-urile de date întorc ulterior
  500: conexiunea MongoDB eșuează cu eroare TLS în acest mediu. Nu s-a dezactivat TLS.
- Auditul inițial `npm run audit:dependencies`: 5 vulnerabilități existente (1 moderată,
  3 ridicate, 1 critică), în baseline-browser-mapping, engine.io, Next.js,
  sharp și source-map-js. Sunt necesare actualizări controlate și retestare
  înainte de publicare; nu s-a folosit audit fix --force. Actualizarea ulterioară
  le-a remediat: auditurile web și mobil, inclusiv dezvoltare, raportează acum 0.
  Vezi [actualizarea dependențelor](DEPENDENCY-SECURITY.md).
- DNS verificat din rețeaua locală: ambele nume se rezolvă acum la 89.45.83.175.
  Aceasta nu infirmă eroarea DNS consemnată de testul Google.

Pentru a verifica interfața populată, `node scripts/pagespeedFixtureServer.mjs`
servește un proxy DOAR pe 127.0.0.1:3100, către build-ul local de la portul 3000.
Înlocuiește numai răspunsurile publice popular/overview cu date fictive întârziate
1,2 s. Nu înlocuiește autentificarea, nu scrie în MongoDB și nu se publică.
Nu reprezintă un test end-to-end al bazei de date sau al chatului autentificat.

Lighthouse 13.5.0, build production Next.js 16.3.0, profil standard mobil/desktop,
date fictive. Aceste scoruri preced actualizarea la Next.js 16.4.2 și nu au fost
rerulate după aceasta:

| Profil | Performanță | Accesibilitate | Bune practici | SEO | LCP | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mobil | 92 | 100 | 100 | 100 | 3,4 s | 0 | 386 KiB |
| Desktop | 99 | 100 | 100 | 100 | 1,0 s | 0 | 510 KiB |

Ambele teste: fără avertismente Lighthouse, fără erori în consolă, o singură
cerere /api/auth/session, fără /api/auth/me, heartbeat sau conexiuni Socket.IO
pentru vizitator. Descoperirea hero, prioritatea și încărcarea eager trec toate
cele trei verificări LCP. Imaginile nu mai au economii semnalate de auditul
image-delivery; mobilul încă are LCP peste țintă și JavaScript Next/React neutilizat.
Aceste scoruri și volume NU sunt comparabile direct cu producția: datele și
rețeaua diferă. Nu este confirmat 100 la performanță pe mobil sau desktop.

## Înainte de publicare și retestare

1. Rezolvă accesul TLS/Atlas al mediului de verificare, apoi repetă smoke și
   testează cu două conturi: login/logout, expirare/revocare/suspendare, chat,
   unread, typing, seen și reconnect. Verifică și navigarea pe pagini secundare
   după eliminarea loaderului și activarea CSS inline.
2. Actualizarea dependențelor și repetarea build-urilor/testelor au fost efectuate
   local; vezi DEPENDENCY-SECURITY.md. Repetă-le și în mediul țintă.
3. Confirmă DNS/TLS și reverse proxy WebSocket pentru originul public. Dacă
   Socket.IO este pe același server, elimină valoarea veche NEXT_PUBLIC_REALTIME_URL
   sau las-o goală. NEXT_PUBLIC_* se fixează la build: este necesar un rebuild,
   apoi restart Next.js și verificarea procesului realtime/Redis.
4. Publică numai după acordul proprietarului. Nu folosi proxy-ul cu fixture în
   producție. Nu sunt necesare migrații sau indexări pentru această intervenție.
5. Repetă PageSpeed Insights pe URL-ul public, mobil și desktop, în cel puțin
   trei rulări, cu date reale. Verifică și prima solicitare a imaginilor după
   deploy, consola unui vizitator și sesiunea autentificată. În funcție de trace-ul
   real rămas, optimizează în continuare LCP și JavaScript-ul inițial. Declară
   100 numai când raportul public îl confirmă.
