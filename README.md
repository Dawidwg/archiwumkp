# Archiwum Konkursu Piosenki ESCFORUM

Nowoczesna, w pełni statyczna aplikacja internetowa prezentująca historię Konkursu Piosenki ESCFORUM (100 edycji, 2526 utworów, 53 państwa, 108 uczestników).

Przepisana z PHP/MySQL na bezserwerowy stos **HTML5 + CSS3 + Vanilla JavaScript**.

---

## 🚀 Jak uruchomić

Aplikacja nie wymaga **żadnego serwera**, **żadnego PHP** ani **żadnego procesu budowania** (build step).

### Opcja 1: Bezpośrednio w przeglądarce (offline)
Wystarczy dwukrotnie kliknąć plik **`index.html`** w Eksploratorze Windows.

### Opcja 2: Na dowolnym hostingu statycznym
Wrzuć zawartość folderu na:
- **GitHub Pages**
- **Cloudflare Pages**
- **Netlify**
- **Vercel**
- lub dowolny klasyczny hosting WWW (Apache, Nginx itp.)

### Opcja 3: Lokalny serwer deweloperski
```bash
# Node.js
npx serve .

# lub Python 3
python -m http.server 8000
```

---

## ✨ Funkcje i usprawnienia

1. **Nowoczesny, responsywny design**:
   - Odświeżony, minimalistyczny wygląd zachowujący klasyczną fioletowo-różową kolorystykę (`#d84def`).
   - Tytułowe logo **Archiwum KP ESCFORUM** zapisane jedną, spójną czcionką.
   - Wymiana flag na nowoczesny, ostry pakiet wektorowy SVG (z obsługą m.in. Kosowa i Wysp Owczych).
   - Przełącznik trybu ciemnego / jasnego (Dark/Light mode) z zapamiętywaniem wyboru.

2. **Strona główna**:
   - Kafelki ze statystykami (100 edycji, 2526 utworów, 53 państwa, 108 uczestników).
   - Globalna wyszukiwarka na żywo (przeszukuje piosenki, edycje, kraje i uczestników).
   - **Losowanie utworu** z bezpośrednim linkiem do odsłuchu na YouTube.
   - **Losowanie uczestnika** z liczbą jego unikalnych edycji, wszystkich piosenek i zwycięstw 🏆.
   - **Rekordziści konkursu (Hall of Fame)**: Top 5 uczestników oraz Top 5 najbardziej utytułowanych państw.

3. **Sekcje**:
   - **Edycje**: Tabela 100 edycji (sortowanie malejąco/rosnąco), zwycięskie piosenki, kraje z flagami, uczestnicy, linki YT.
   - **Szczegóły edycji**: Pełna lista startowa, wyróżnienie zwycięzcy 🏆, czytelne przyciski Scorewiz i Fandom Wiki, nawigacja Poprzednia/Następna (skróty klawiszowe: strzałki `←` / `→`).
   - **Piosenki**: Pełna lista 2526 utworów od A do Z, wyszukiwarka na żywo, bezpośrednie linki YouTube i etykiety edycji.
   - **Państwa**: 53 państwa z flagami SVG, liczba startów, zwycięstw oraz lista reprezentantów wraz z liczbą startów `(count)`.
   - **Uczestnicy**: 108 graczy z podziałem na liczbę unikalnych edycji, łączną liczbę piosenek oraz zwycięstw 🏆, wraz z reprezentowanymi krajami `(count)`.

---

## 📁 Czysta struktura plików

```
archiwumkp/
├── index.html              # Główna strona aplikacji (SPA)
├── css/
│   └── app.css             # Nowoczesne style (CSS Variables, Dark mode, Flex/Grid)
├── js/
│   └── app.js              # Główna logika aplikacji (Routing, Wyszukiwarki, Widoki)
├── data/
│   ├── data.js             # Baza danych w formacie JS (zapewnia działanie bez CORS w file://)
│   └── data.json           # Czysty plik JSON z całą bazą danych
├── img/
│   └── yt.png              # Ikona YouTube
├── scripts/
│   └── build_data.js       # Skrypt do ponownego wygenerowania data/ z pliku JSON
├── vrlracinzqvrl.json      # Oryginalny eksport bazy phpMyAdmin (JSON)
├── vrlracinzqvrl.sql       # Oryginalny eksport bazy (SQL)
└── vrlracinzqvrl.csv       # Oryginalny eksport bazy (CSV)
```
