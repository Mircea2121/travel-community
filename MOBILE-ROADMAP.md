# Roadmap aplicație mobilă

## Etapa 1 — fundație

- client React + Vite separat în `apps/mobile`;
- bundle local Capacitor, fără `server.url` în producție;
- proiecte Android și iOS;
- feed public, navigare mobilă, stare offline, haptics și share nativ;
- build-uri web și mobile independente.

## Etapa 2 — conturi și securitate

- contract API documentat pentru clientul mobil;
- autentificare și înregistrare compatibile cu stocarea sigură a sesiunii;
- Turnstile adaptat fluxului mobil;
- logout, resetare parolă, verificare email și ștergere cont;
- teste pentru autorizare și expirarea sesiunii.

## Etapa 3 — funcționalități comunitare

- detaliu postare, aprecieri, salvări și comentarii;
- creare și editare experiență cu camera/galeria;
- profil, urmărire utilizatori și căutare;
- mesagerie realtime și raportarea conținutului.

## Etapa 4 — integrare nativă

- deep links și universal/app links;
- push notifications cu preferințe explicite;
- share sheet, conectivitate și feedback haptic;
- icon, splash screen și accesibilitate.

## Etapa 5 — lansare

- teste pe telefoane Android și iPhone reale;
- cont demo pentru review;
- privacy labels, Data Safety și content rating;
- capturi de ecran și materiale pentru magazine;
- Android App Bundle semnat și arhivă iOS prin Xcode/TestFlight.
