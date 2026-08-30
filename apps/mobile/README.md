# Aplicația mobilă

Client React + Vite livrat ca bundle local prin Capacitor. Aplicația web și API-ul
Next.js rămân în rădăcina repository-ului.

## Dezvoltare

1. Pornește aplicația web cu `npm run dev` din rădăcină.
2. Copiază `.env.example` în `.env.local` numai dacă API-ul nu folosește domeniul implicit.
3. Rulează `npm run mobile:dev` din rădăcină.

## Build nativ

Din `apps/mobile`, rulează `npm run sync`, apoi `npm run android` sau `npm run ios`.
iOS necesită macOS și Xcode.

`server.url` nu se configurează în build-urile de producție. Interfața este inclusă
în aplicație, iar cererile de date merg către API-ul HTTPS configurat prin
`VITE_API_URL`.

## Arhitectură

- `src/` conține interfața mobilă, independentă de interfața Next.js;
- API-ul și baza de date rămân în aplicația Next.js din rădăcină;
- `android/` și `ios/` sunt proiecte generate și versionate pentru magazine;
- `dist/` este generat local și nu se salvează în Git;
- cererile native folosesc HTTPS prin Capacitor HTTP;
- pluginurile sunt limitate la capabilitățile folosite efectiv: App, Haptics,
  Network și Share.

Autentificarea mobilă, uploadul prin camera/galerie, deep links și notificările
push se implementează în etapele următoare. Nu se publică aplicația înainte ca
fluxurile de cont și moderarea conținutului să fie complete și testate pe
dispozitive reale.
