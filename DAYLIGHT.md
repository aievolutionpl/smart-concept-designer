# Slonce i atmosfera

Panel w prawym inspektorze: godzina 06:00-22:00 co 15 minut, zachmurzenie,
obrot kierunku slonca, lampy auto/wlaczone/wylaczone, moc lamp, jakosc cieni.
Ustawienia sa zapisywane w projekcie JSON i localStorage; dziala historia zmian.

Niebo: oficjalny SkyMesh Three.js (TSL), kompatybilny z uzywanym WebGPURenderer
i jego fallbackiem WebGL. Chmury sa proceduralne i nieruchome: ich ciagla animacja
nie obciaza dodatkowo edytora. Bez ciezkich tekstur nieba ani postprocessingu.

Trajektoria slonca jest pogladowa: wschod 06:00, zachod 20:00, obrot reczny.
To NIE jest geolokowana analiza naslonecznienia ani narzedzie projektowania
oswietlenia wedlug norm. Dokladne cienie wymagaja lokalizacji, daty i orientacji
dzialki. Zachmurzenie oslabia swiatlo bezposrednie i zmienia wypelnienie otoczenia;
nie symuluje osobnych przesuwajacych sie cieni kazdej chmury.

Wydajnosc: limit 60 renderowanych klatek/s, tryb oszczedny 30; tylko slonce rzuca
cienie. Mapa cieni 1024 (telefon 512), wysoka 2048, oszczedna bez cieni.
Lampy punktowe nie maja kosztownych cieni. Roslinnosc CC0 nadal korzysta z instancji.
Na pierwszym otwarciu dotychczasowego Customer Garden dodawane jest 6 zestawow
paproci i 3 kamienie; zachowany limit 60 obiektow. Meble nie sa usuwane.
Znacznik landscapeVersion zapobiega ponownemu dodawaniu, takze po recznym usunieciu.
Jawnie otwarty plik projektu zachowuje swoj zestaw obiektow bez automatycznej migracji.

GLB eksportuje geometrie/materialy/lokalne lampy, nie shader proceduralnego nieba
ani interaktywne ustawienia slonca. Pelna edycja atmosfery wymaga projektu JSON.

Testy: tests/daylight-browser.js (WebGL, dzien, chmury, kierunek, noc, zapis, mobile),
tests/daylight-gpu.js (WebGPU, niebo, kamera i pelna scena), tests/customer-browser.js
(regresja edytora). Wyniki i zrzuty w test-results/realism-*.
