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

## Wdrożenie (GitHub Pages)

Strona publikuje się automatycznie po pushu na gałąź `master` przez GitHub Actions.

**URL:** https://birex-stack.github.io/product-design-portfolio/

W ustawieniach repozytorium (**Settings → Pages → Build and deployment**) źródło musi być ustawione na **GitHub Actions** (nie „Deploy from branch”).

Po pushu status wdrożenia sprawdzisz w zakładce **Actions** repozytorium.

## Co dostosować

1. **Sekcja „O mnie"** — opis i statystyki w `index.html`
2. **Kontakt** — email, LinkedIn i link do CV
3. **Projekty** — zamień placeholderowe obrazki i teksty case studies na swoje
4. **Tytuł strony** — tag `<title>` w `<head>`

Miejsca oznaczone komentarzem `<!-- TODO: -->` w pliku `index.html`.
