# Snapshot GitHub — 23 octombrie 2026

Sursele locale au fost sincronizate cu versiunea live
`premium-posts-20261022`, după păstrarea unei copii a modificărilor locale.
Actualizările locale ale aplicației mobile și ale dependențelor au fost păstrate.

Snapshot-ul include optimizările PageSpeed, actualizările de securitate,
sesiunea anonimă, SEO cu randare pe server, sitemap și canonical, precum și
formularul și pagina postării cu designul premium. Include și progresul mobil
din commit-urile anterioare ale branch-ului `feature/mobile-app`.

## Documentație

- [Publicarea inițială și verificările](DEPLOYMENT-2026-10-22.md)
- [Securitatea dependențelor](DEPENDENCY-SECURITY.md)
- [Conexiunea MongoDB și TLS](MONGODB-CONNECTION.md)
- [Optimizările PageSpeed](PAGESPEED-OPTIMIZATION.md)
- [Rafinarea vizuală inițială](VISUAL-REFINEMENT-2026-10-22.md)
- [SEO și configurarea Search Console](SEO-DEPLOYMENT-2026-10-22.md)
- [Designul premium și limitele verificărilor](PREMIUM-POSTS-2026-10-22.md)
- [Aplicația mobilă](MOBILE-ROADMAP.md)

Documentele de publicare descriu starea la momentul operației respective.
Mențiunile istorice că sursele locale nu erau sincronizate sunt înlocuite de
acest snapshot: codul live este acum inclus în repository.

## Configurație și publicări viitoare

Secretele, fișierele reale `.env`, cheile SSH, dependențele instalate și
build-urile nu sunt incluse în Git. Configurația de producție rămâne pe server.
Acesta este un snapshot al codului, nu o copie a datelor MongoDB sau Cloudinary.

Păstrează fișierul public de verificare Google și folosește sursele din acest
snapshot la următoarea publicare. Construiește într-un release separat, rulează
verificările și păstrează versiunea anterioară pentru revenire. Salvarea în GitHub
nu necesită repornirea serviciilor sau rularea migrațiilor de date.

## Verificări

Sursele exportate de pe VPS au fost verificate prin SHA-256, iar pachetele și
lockfile-urile web/mobile coincid cu versiunile locale actualizate. Build-ul web,
testele SEO, cele șase teste smoke și verificările de sesiune au trecut la ultima
publicare a acestor surse; vezi documentul designului premium pentru rezultate.

După sincronizarea locală au trecut ESLint, toate cele trei teste de
compatibilitate a dependențelor (inclusiv Socket.IO pe localhost) și build-ul
aplicației mobile. Verificarea textelor pregătite pentru Git nu a identificat
chei private sau tokenuri în tiparele scanate; mediile reale sunt ignorate.

Un build web local necesită credențiale MongoDB valide: paginile publice sunt
generate folosind baza de date. Nu copia secretele de producție în repository.
Testele HTTP acceptă `SMOKE_BASE_URL`; pentru verificări pe site-ul public,
setează-l explicit la `https://www.comunitatea-calatorilor.ro`.
