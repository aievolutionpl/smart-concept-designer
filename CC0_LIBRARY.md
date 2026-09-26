# Smart Concept Designer: biblioteka CC0

Stack pozostaje bez zmian: Vite, vanilla JavaScript, Three.js WebGPU/WebGL.

## Katalog

`public/assets.json` jest zrodlem danych biblioteki. Pola: id, name (nazwa), kind,
category, path, preview, dimensions (metry), source, license, triangles, bytes,
materials, textures/resolution i scale. Modele i materialy sa rozdzielone przez kind.
Materialy maja triangles=0 oraz jawne mapy color, normal (OpenGL), roughness.
Modele GLB zawieraja wszystkie swoje tekstury. Nic nie jest hotlinkowane w aplikacji.

Zestaw: Poly Haven fern_02 (cztery kepy paproci), planter_pot_clay, rock_07;
ambientCG PavingStones092 i WoodFloor051. Drewno jest materialem dekoracyjnym;
nie jest deklaracja przydatnosci konkretnego produktu na zewnatrz.

Skala modeli: zachowano metry z glTF i zmierzono bounding box. Donica jest mala
(ok. 27 cm), kamien ma ok. 32 cm. To nie sa wymiary potwierdzone niezaleznym pomiarem.
Wymiary tekstur pochodza od ambientCG (centymetry przeliczone na metry).

## Pozyskiwanie

Uruchom z katalogu aplikacji: `node --use-system-ca scripts/prepare-cc0.mjs`.
Skrypt korzysta z oficjalnych API, identyfikatora User-Agent SmartConceptDesigner/0.1,
sekwencyjnych zapytan z odstepami, timeoutow i lokalnego `.asset-cache/cc0`.
Sprawdza MD5 zaleznosci Poly Haven. Nie skanuje stron ani calej biblioteki.
Metadane i pobrane pliki sa ponownie uzywane z cache. Nie wylacza weryfikacji TLS.
Brak dostepu sieciowego lub blad weryfikacji przerywa budowanie katalogu.

Zasady sprawdzone 2026-09-26:
- https://polyhaven.com/llms.txt
- https://github.com/Poly-Haven/Public-API/blob/master/ToS.md
- https://polyhaven.com/license
- https://docs.ambientcg.com/api/v2/full_json/
- https://docs.ambientcg.com/license/

Obaj dostawcy publikuja te assety jako CC0 1.0 Universal.
Kod API Poly Haven (AGPL) nie jest kopiowany ani wlaczany do aplikacji.
API Poly Haven wymaga identyfikacji aplikacji; przy uzyciu live API rowniez widocznego
oznaczenia zrodla. Aplikacja uzywa lokalnych plikow, ale nadal pokazuje linki do zrodel.
Nie sugerujemy partnerstwa ani oficjalnego poparcia dostawcow.

## Budzet i weryfikacja

Modele: maks. 10000 trojkatow / 8 MB; tekstury 1K, limit walidatora 2K.
Rock 07 uproszczony z 14844 do 10000 trojkatow, tolerancja .002.
Pozostale modele nie wymagaly redukcji. Zachowane oryginalne mapy 1K i alpha.
`node scripts/verify-cc0.mjs` sprawdza rozmiary, osadzenie tekstur, skale, geometrie i katalog.

`tests/cc0-scene.html` to mala, odizolowana scena testowa. `tests/cc0-browser.js`
porownuje 1 i 36 zestawow paproci, liczbe draw calls oraz czasy klatek, a nastepnie
sprawdza dodawanie, duplikowanie, materialy, zapis i widok mobilny w edytorze.
Czasy klatek z automatycznej przegladarki nie sa gwarancja wydajnosci na GPU klienta.

Wynik lokalny: 1 i 36 zestawow paproci = 8 draw calls; 36 zestawow = 224377
trojkatow lacznie ze scena. WebGL, 1280x900, DPR 1, bez cieni: mediana 6.9 ms,
p95 7 ms. To lekka scena kontrolna, nie pomiar calego ogrodu. Pelny raport:
`test-results/cc0-performance.json`. Eksport z dwiema instancjami paproci i kostka
sprawdzony jako samodzielny GLB: 14 osadzonych obrazow, brak zewnetrznych URI.

Roslinnosc uzywa InstancedMesh, po jednej partii na mesh z szablonu. Niewidoczne
kopie wspoldzielace geometrie zachowuja wybor i manipulacje; eksport odtwarza
widoczne obiekty. Limit edytora pozostaje 60 obiektow. Materialy stosowane sa tylko
do nawierzchni terenu, nie do mebli. Zapis projektu przechowuje identyfikatory
materialow, a nie dowolne zewnetrzne adresy URL.
