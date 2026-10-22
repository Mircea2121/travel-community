# Comunitatea Călătorilor

Aplicația web și aplicația mobilă ale comunității de călători.

Sursele live, optimizările și documentația au fost reunite în
[snapshot-ul din 23 octombrie 2026](GITHUB-SNAPSHOT-2026-10-23.md).
Acesta este punctul de plecare pentru continuarea dezvoltării și publicările
viitoare. Fișierele reale de configurare și secretele rămân în afara Git.

## Documentația inițială de consolidare

Secțiunile următoare descriu pachetul inițial de consolidare, nu o procedură de
republicare a versiunii live actuale. Nu repeta migrațiile doar pentru un deploy.

Acest director conține numai fișiere noi sau fișiere care trebuie înlocuite în proiectul `travel-community`.

## Ordinea instalării

1. Copiază conținutul directorului peste rădăcina proiectului, păstrând structura directoarelor.
2. Adaugă variabilele descrise în `.env.production.example` în `.env.local` pentru testare și în mediul serverului pentru producție.
3. Rulează `npm install` numai dacă `package.json` s-a schimbat.
4. Rulează `npm run lint` și `npm run build` cu serverul de dezvoltare oprit.
5. De acasă rulează mai întâi `npm run security:migrate-existing-emails`, apoi `npm run security:indexes`.

Cheile și secretele reale nu se salvează în Git.

## Ce conține

- rate limiting MongoDB pentru login și înregistrare;
- Cloudflare Turnstile validat obligatoriu pe server în producție;
- verificarea originii pentru cererile sensibile;
- confirmarea emailului cu token hash-uit, expirare și retrimitere limitată;
- verificarea conținutului real al imaginilor JPEG/PNG/WebP;
- procesare Cloudinary cu eliminarea profilului de metadate;
- headere HTTP de securitate și CSP;
- eliminarea dependențelor nefolosite `db` și `mongo`;
- scripturi de indexare, migrare și smoke testing.

## Important

Conturile existente sunt marcate drept verificate numai de scriptul de migrare. Nu activa restricționarea acțiunilor după `emailVerifiedAt` înainte să rulezi migrarea.
