# Smart Concept Designer

Pierwsza wersja przeglądarkowego edytora scen do projektowania ogrodów.

## Customer Garden i Environment Edit

Wariant premium: `/?project=customer-garden-premium`. Oryginalny ogrod: `/?project=customer-garden`.
Kazdy wariant ma osobny zapis lokalny. Przycisk **Environment Edit** pozwala zaznaczac elementy
otoczenia na scenie lub z listy, przesuwac je, obracac, skalowac, ukrywac i przywracac.
Zmiany obejmuja cofanie/ponawianie, zapis JSON i eksport GLB. Szczegoly: [ENVIRONMENT_EDIT.md](ENVIRONMENT_EDIT.md).

Test edytora: `node tests/environment-edit.mjs` (wymaga Chrome).
Materiały CC0 maja metadane w `public/assets.json`; modele odtworzone ze zdjec nie sa oznaczone jako CC0.
Publikacja repozytorium nie nadaje automatycznie licencji na wszystkie zdjecia i modele.

## Uruchomienie

`npm start` uruchamia lokalny serwer w tle i sprawdza jego gotowość. Ponowne
wywołanie korzysta z już uruchomionego serwera. Adres: http://127.0.0.1:5173.
Logi uruchomienia znajdują się w `test-results/dev-server*.log`.

Biblioteka zawiera też **Nomad Sofa** (200 × 95 × 67 cm, siedzisko 35 cm)
oraz **Nomad narożnik lewy** (głębokość szezlonga około 140 cm, oszacowana
ze zdjęcia). Edytowalne modele Blender i źródła: `../assets/nomad/`.

```sh
npm install
npm run dev
```

Podgląd: http://127.0.0.1:5173. Produkcja: `npm run build`, pliki w `dist/`.

## Funkcje

- Cube Plus i ławka ogrodowa w bibliotece. Sauna jest domyślnie w scenie.
- Zaznaczanie, przesuwanie po podłożu, obrót, jednolita skala, dokładne wartości liczbowe.
- Cofanie i ponawianie, duplikowanie, usuwanie, przyciąganie do siatki.
- Ogród, studio i pusta działka, zmiana wymiarów działki i światła.
- Widok perspektywiczny i z góry, mysz oraz gesty dotykowe.
- Import samowystarczalnych GLB do 30 MB; pliki pozostają w przeglądarce.
- Zapis lokalny w localStorage / IndexedDB oraz przenośny JSON z własnymi modelami.
- Eksport obrazu sceny PNG.

## Renderer i wydajność

Three.js WebGPURenderer, domyślnie WebGPU; automatyczny WebGL2 przy braku obsługi. Parametr `?webgl=1` służy do testu fallbacku. Silnik ładowany dynamicznie; GLB dopiero przy użyciu, z pamięcią podręczną i współdzieloną geometrią.

Modele: Meshopt (`EXT_meshopt_compression`) oraz tekstury WebP do 512 px, osadzone w GLB. Cube Plus: 7 380 224 → 1 335 676 bajtów. Ławka: 171 096 → 35 440 bajtów. Oryginalne projekty Blender pozostają poza aplikacją i nie są modyfikowane.

Mobilnie: limit DPR 1.25, szerszy kadr i wyłączone mapy cieni. Desktop: DPR do 1.75, jedna mapa cieni 2048 px, instancjonowane drzewa, brak postprocessingu. Adaptacyjne zmniejszanie DPR przy spadkach FPS. Renderowanie wstrzymuje się w ukrytej karcie. Szkło używa lekkiej przezroczystości zamiast kosztownego załamania światła. 60 FPS zależy od urządzenia i złożoności importowanych modeli.

Obrót i zoom mają tłumienie. Zadaszenie Cube Plus pozostaje statycznie otwarte; nie ma jeszcze animacji otwierania ani edycji architektury / rzeźby terenu. Scena ma limit 60 obiektów. To edytor koncepcji, nie program CAD.

## Weryfikacja

`npm test` uruchamia testy lokalne w izolowanej przeglądarce Chrome (wymaga Python + Playwright i uruchomionego serwera). Sprawdza WebGPU/WebGL, edycję, historię, import, zapis i odczyt, PNG, odtwarzanie po odświeżeniu oraz widok mobilny 390 px. Raport i zrzuty: `test-results/`.

## Sites — stan publikacji

**Nie opublikowano.** W sesji budowania nie były dostępne natywne narzędzia Sites: `create_site`, zapis wersji ani wdrożenie. Manifest wskazuje gotowy statyczny katalog `dist`, bez wymyślonego identyfikatora projektu. Po udostępnieniu połączenia Sites trzeba zarejestrować projekt, zapisać wersję i wdrożyć ją zgodnie z workflow wtyczki, a następnie potwierdzić status `succeeded`.

Projekt nie ma backendu ani synchronizacji między urządzeniami. Plik pobrany przez „Zapisz projekt” służy do przenoszenia kompozycji. Publikowana aplikacja powinna pozostać prywatna, dopóki właściciel nie wybierze innego odbiorcy.
