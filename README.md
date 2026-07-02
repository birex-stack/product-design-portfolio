# Product Design Portfolio

Profesjonalna strona portfolio dla Product Designera — gotowa do wysłania rekruterom.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Strona będzie dostępna pod adresem `http://localhost:5173`.

## Build produkcyjny

```bash
npm run build
npm run preview
```

Pliki gotowe do wdrożenia znajdziesz w folderze `dist/`.

## Wdrożenie

Możesz wdrożyć na darmowych platformach:
- [Netlify](https://netlify.com) — przeciągnij folder `dist`
- [Vercel](https://vercel.com) — połącz repozytorium Git
- [GitHub Pages](https://pages.github.com) — ustaw folder `dist` jako źródło

## Co dostosować

1. **Sekcja „O mnie"** — opis i statystyki w `index.html`
2. **Kontakt** — email, LinkedIn i link do CV
3. **Projekty** — zamień placeholderowe obrazki i teksty case studies na swoje
4. **Tytuł strony** — tag `<title>` w `<head>`

Miejsca oznaczone komentarzem `<!-- TODO: -->` w pliku `index.html`.
