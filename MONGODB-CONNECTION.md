# Diagnostic MongoDB — 22 octombrie 2026

Actualizare: site-ul public folosește configurația validă proprie VPS-ului;
smoke trece integral după [publicarea autorizată](DEPLOYMENT-2026-10-22.md).
Eroarea de autentificare descrisă mai jos privește configurația locală.

## TLS: cauză confirmată și remediată

Atlas permitea doar IP-ul VPS-ului, 89.45.83.175/32. IP-ul public al calculatorului
local, 188.26.145.218, nu era în lista permisă. Clusterul travel-community era activ.
DNS-ul local, resolverele publice și DNS-over-HTTPS returnau aceleași noduri/adrese.
Înainte de remediere, toate cele trei noduri respingeau negocierea TLS înainte
de prezentarea certificatului, atât cu TLS 1.2, cât și cu TLS 1.3.

Cu aprobarea explicită a proprietarului, a fost adăugată regula temporară
188.26.145.218/32 în IP Access List, cu expirare automată pe **23 octombrie 2026,
04:32, Europe/Bucharest** (01:32 UTC). Regula este Active. Nu este un deployment
al aplicației; este o modificare aprobată a accesului de rețea Atlas.

După activare, toate cele șase handshake-uri TLS au trecut, cu verificarea
certificatului și a numelui serverului activă. Certificatele sunt emise de
Let's Encrypt și sunt valabile până la 3 ianuarie 2027. Nu au fost dezactivate
verificările TLS și nu au fost instalate certificate alternative.

## Blocaj separat rămas: autentificare

Acum conexiunea ajunge la autentificare, dar Atlas răspunde cu MongoServerError,
cod 8000, authentication failed, pentru utilizatorul configurat travelcommunity.
Acest utilizator există în proiect. TXT-ul SRV configurează authSource=admin,
corespunzător utilizatorilor Atlas. Nu au fost schimbate parole sau roluri.

Este necesară actualizarea MONGODB_URI din .env.local cu o conexiune validă.
Parola nu trebuie trimisă în chat sau salvată în Git. Caracterele rezervate din
credențiale trebuie codificate pentru URI. După actualizare, repornește procesul
local: aplicația încarcă mediul și cachează promisiunea conexiunii la pornire.

## Verificări după remedierea TLS

- `node --env-file=.env.local scripts/diagnoseMongoTls.mjs`: 6/6 handshake-uri
  trecute; ping autentificat respins cu cod 8000.
- `npm run test:smoke`: 5/6 trecute. /api/posts/feed?scope=all&limit=1 returnează
  acum 500 în aproximativ 450 ms, din cauza autentificării, în loc de timeout TLS.
- `npm run test:public-session`: trecut.
- `npm run lint` și `git diff --check`: trecute.

Scriptul de diagnostic execută doar DNS, handshake-uri TLS și ping, fără scrieri.
Nu afișează URI-ul, utilizatorul sau parola și refuză opțiunile care dezactivează
TLS ori validarea certificatelor/hostname-ului. Rulează-l din nou după corectarea
conexiunii, apoi repetă smoke testele pe un proces nou.

Accesul local va expira automat. Dacă IP-ul public se schimbă sau sunt necesare
teste după expirare, va trebui autorizată o nouă intrare punctuală. Publicarea
aplicației în producție nu a fost efectuată.
