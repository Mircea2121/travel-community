# Checklist înainte de publicare

Stare actuală: [publicarea din 22 octombrie 2026 și verificările live](DEPLOYMENT-2026-10-22.md).

- Pentru intervenția PageSpeed din 22 octombrie 2026, vezi [rezultatele, limitele și pașii de retestare](PAGESPEED-OPTIMIZATION.md).
- Dependențele au fost actualizate: vezi [versiunile, verificările și cerința adaptorului local la instalare](DEPENDENCY-SECURITY.md).
- TLS MongoDB local a fost remediat printr-o regulă IP temporară; rămâne de corectat autentificarea locală: [diagnostic și retestare](MONGODB-CONNECTION.md).

## Obligatoriu

- Configurează `APP_URL`, cheile Turnstile, MongoDB, Cloudinary, Redis, JWT și Resend direct pe server.
- Nu salva `.env.local` în Git.
- Rulează o singură dată `npm run security:migrate-existing-emails`, apoi `npm run security:indexes`, după ce conexiunea Atlas este disponibilă.
- Oprește `npm run dev` înainte de `npm run build`.
- Rulează `npm run lint`, `npm run build` și `npm run audit:dependencies`.
- Verifică domeniul în Resend și schimbă expeditorul `onboarding@resend.dev` cu domeniul propriu.
- Configurează backupuri MongoDB Atlas și retenția lor din panoul Atlas.
- Configurează Redis și procesul Socket.IO separat de procesul Next.js.

## Monitorizare

- Creează proiect Sentry pentru browser și server.
- Configurează alerte pentru erori 5xx, latență, emailuri eșuate și indisponibilitatea Redis/MongoDB.
- Nu trimite parole, tokenuri, cookies sau conținut privat în loguri.

## Teste de acceptare

- Cont nou, verificare email, login, resetare parolă.
- Creare/editare/ștergere postare și comentarii.
- Upload invalid, fișier supradimensionat și fișier cu MIME fals.
- Chat între două conturi, seen, typing și reconnect.
- Suspendare utilizator și procesare raport din admin.
- Layout la 320 px, 375 px, tabletă și desktop.
