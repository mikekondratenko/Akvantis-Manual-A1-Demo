/* ─────────────────────────────────────────────────────────────────────────────
   MANUAL TEXTS — every word of the A1 manual, in every language it ships in.
   `window.MANUAL_TEXTS`. Edit this file; nothing else holds translations.

   English is the original and lives in manual.json (the constructor edits it).
   Here each English string has its translations beside it:
       { "en": "Drill hole", "de": "Loch bohren", "uk": "Просвердліть отвір" }
   The page finds a row by its "en" value — exactly as it is written in
   manual.json — and shows the reader's language. So:
     · change a translation    → edit "de" / "uk" here;
     · change the English text → change it in the constructor AND in "en" here
       (a string with no row here is shown in English);
     · the same English string is translated once, wherever it appears.
   "texts" is grouped by section for the translator's convenience only.
   "ui" — the page's own words (labels for screen readers, the tab title).

   Codes follow ui-kit/i18n: en · de · uk (`uk` = Ukrainian; shown as "Ua").
   Terms follow docs/localization/glossary.md (cartridge = Kartusche = картридж;
   the three cartridges: I 2-in-1 Sediment + Carbon Filter · II RO Membrane ·
   III Mineralizator — names fixed 2026-10-07;
   German formal "Sie"; Ukrainian imperative, 2nd person plural). Words printed
   on the machine itself (Flush, Power, Filter) are not translated.
   STATUS: de, uk — machine draft 2026-10-07, needs native review.
   ───────────────────────────────────────────────────────────────────────────── */
window.MANUAL_TEXTS = {
  "languages": [
    { "code": "en", "short": "En", "name": "English" },
    { "code": "de", "short": "De", "name": "Deutsch" },
    { "code": "uk", "short": "Ua", "name": "Українська" }
  ],
  "default": "en",
  "ui": {
    "doc.title": { "en": "Akvantis A1 — Installation guide", "de": "Akvantis A1 — Installationsanleitung", "uk": "Akvantis A1 — Інструкція з встановлення" },
    "lang.label": { "en": "Language", "de": "Sprache", "uk": "Мова" },
    "nav.sections": { "en": "Sections", "de": "Abschnitte", "uk": "Розділи" },
    "nav.top": { "en": "Back to the top", "de": "Nach oben", "uk": "Нагору" },
    "pop.close": { "en": "Close", "de": "Schließen", "uk": "Закрити" },
    "scroll.right": { "en": "Scroll right", "de": "Nach rechts scrollen", "uk": "Прокрутити праворуч" }
  },
  "texts": {
    "sections": [
      { "en": "In the box", "de": "Lieferumfang", "uk": "Комплектація" },
      { "en": "Tools required", "de": "Benötigtes Werkzeug", "uk": "Потрібні інструменти" },
      { "en": "Tools", "de": "Werkzeug", "uk": "Інструменти" },
      { "en": "Overview", "de": "Übersicht", "uk": "Огляд" },
      { "en": "Installation", "de": "Installation", "uk": "Встановлення" },
      { "en": "Installation / Faucet K1", "de": "Installation / Wasserhahn K1", "uk": "Встановлення / Кран K1" },
      { "en": "Faucet K1", "de": "Wasserhahn K1", "uk": "Кран K1" },
      { "en": "Installation / Faucet K3", "de": "Installation / Wasserhahn K3", "uk": "Встановлення / Кран K3" },
      { "en": "Faucet K3", "de": "Wasserhahn K3", "uk": "Кран K3" },
      { "en": "Installation / Valve", "de": "Installation / Ventil", "uk": "Встановлення / Клапан" },
      { "en": "Valve", "de": "Ventil", "uk": "Клапан" },
      { "en": "Installation / Drain", "de": "Installation / Abfluss", "uk": "Встановлення / Дренаж" },
      { "en": "Drain", "de": "Abfluss", "uk": "Дренаж" },
      { "en": "Installation / Tubes", "de": "Installation / Schläuche", "uk": "Встановлення / Трубки" },
      { "en": "Tubes", "de": "Schläuche", "uk": "Трубки" },
      { "en": "Installation / Mineralizator", "de": "Installation / Mineralisator", "uk": "Встановлення / Мінералізатор" },
      { "en": "Mineralizator", "de": "Mineralisator", "uk": "Мінералізатор" },
      { "en": "First Start", "de": "Erste Inbetriebnahme", "uk": "Перший запуск" },
      { "en": "Service", "de": "Service", "uk": "Сервіс" },
      { "en": "Troubleshooting", "de": "Fehlerbehebung", "uk": "Усунення несправностей" },
      { "en": "Indicators", "de": "Anzeigen", "uk": "Індикатори" },
      { "en": "Safety & warranty", "de": "Sicherheit & Garantie", "uk": "Безпека та гарантія" }
    ],
    "in-the-box": [
      { "en": "Main", "de": "Hauptteile", "uk": "Основне" },
      { "en": "A1 Unit", "de": "A1 Gerät", "uk": "Блок A1" },
      { "en": "Filtration module", "de": "Filtermodul", "uk": "Модуль фільтрації" },
      { "en": "2-in-1 Sediment + Carbon Filter", "de": "2-in-1-Sediment- und Aktivkohlefilter", "uk": "Фільтр 2-в-1: осад + вугілля" },
      { "en": "Cartridge I", "de": "Kartusche I", "uk": "Картридж I" },
      { "en": "RO Membrane", "de": "RO-Membran", "uk": "Мембрана RO" },
      { "en": "Cartridge II", "de": "Kartusche II", "uk": "Картридж II" },
      { "en": "Power Adapter", "de": "Netzteil", "uk": "Блок живлення" },
      { "en": "230 V~ to module", "de": "230 V~ zum Modul", "uk": "230 В~ до модуля" },
      { "en": "Cartridge III", "de": "Kartusche III", "uk": "Картридж III" },
      { "en": "Fittings and drain", "de": "Anschlüsse und Abfluss", "uk": "Фітинги та дренаж" },
      { "en": "3/8\" L-Type Connector", "de": "3/8\"-Winkelverbinder", "uk": "Кутовий фітинг 3/8\"" },
      { "en": "1/4\" L-Type Connector", "de": "1/4\"-Winkelverbinder", "uk": "Кутовий фітинг 1/4\"" },
      { "en": "Inlet 3-Way Ball Valve", "de": "3-Wege-Kugelhahn (Zulauf)", "uk": "Вхідний триходовий кульовий клапан" },
      { "en": "3/8\" Straight Connector", "de": "3/8\"-Geradverbinder", "uk": "Прямий фітинг 3/8\"" },
      { "en": "3/8\" × 3/8\" Connector", "de": "3/8\" × 3/8\"-Verbinder", "uk": "Фітинг 3/8\" × 3/8\"" },
      { "en": "Optional · tube 3/8\" × thread 3/8\"", "de": "Optional · Schlauch 3/8\" × Gewinde 3/8\"", "uk": "Опція · трубка 3/8\" × різьба 3/8\"" },
      { "en": "3/8\" × 1/4\" Connector", "de": "3/8\" × 1/4\"-Verbinder", "uk": "Фітинг 3/8\" × 1/4\"" },
      { "en": "Optional · tube 3/8\" × thread 1/4\"", "de": "Optional · Schlauch 3/8\" × Gewinde 1/4\"", "uk": "Опція · трубка 3/8\" × різьба 1/4\"" },
      { "en": "Thread Adapter 1/2\" → 3/8\"", "de": "Gewindeadapter 1/2\" → 3/8\"", "uk": "Різьбовий перехідник 1/2\" → 3/8\"" },
      { "en": "Thread Adapter 3/8\" → 1/2\"", "de": "Gewindeadapter 3/8\" → 1/2\"", "uk": "Різьбовий перехідник 3/8\" → 1/2\"" },
      { "en": "Optional", "de": "Optional", "uk": "Опція" },
      { "en": "Lock clips", "de": "Sicherungsclips", "uk": "Фіксувальні кліпси" },
      { "en": "Clip 3/8\"", "de": "Clip 3/8\"", "uk": "Кліпса 3/8\"" },
      { "en": "Clip 1/4\"", "de": "Clip 1/4\"", "uk": "Кліпса 1/4\"" },
      { "en": "Blue", "de": "Blau", "uk": "Синя" },
      { "en": "Red", "de": "Rot", "uk": "Червона" },
      { "en": "Grey", "de": "Grau", "uk": "Сіра" },
      { "en": "Tubes and key", "de": "Schläuche und Schlüssel", "uk": "Трубки та ключ" },
      { "en": "3/8\" PE Tubing", "de": "3/8\"-PE-Schlauch", "uk": "PE-трубка 3/8\"" },
      { "en": "1/4\" PE Tubing", "de": "1/4\"-PE-Schlauch", "uk": "PE-трубка 1/4\"" },
      { "en": "Tube Key", "de": "Schlauchschlüssel", "uk": "Ключ для трубок" },
      { "en": "Drain Saddle", "de": "Abflussschelle", "uk": "Дренажний хомут" }
    ],
    "overview": [
      { "en": "Red · water inlet, from the valve to the unit", "de": "Rot · Wasserzulauf, vom Ventil zum Gerät", "uk": "Червона · подача води, від клапана до блока" },
      { "en": "Blue · pure water, from the unit to the faucet", "de": "Blau · Reinwasser, vom Gerät zum Wasserhahn", "uk": "Синя · чиста вода, від блока до крана" },
      { "en": "Grey · drain, from the unit to the drain saddle", "de": "Grau · Abwasser, vom Gerät zur Abflussschelle", "uk": "Сіра · дренаж, від блока до дренажного хомута" },
      { "en": "Two, on both ends of the mineralizator", "de": "Zwei Stück, an beiden Enden des Mineralisators", "uk": "Два, на обох кінцях мінералізатора" },
      { "en": "On the Inlet and Pure ports; a 1/4\" one on Drain", "de": "An den Anschlüssen Inlet und Pure; ein 1/4\"-Verbinder an Drain", "uk": "На портах Inlet і Pure; фітинг 1/4\" — на Drain" }
    ],
    "tools": [
      { "en": "Drill Driver", "de": "Akkuschrauber", "uk": "Шурупокрут" },
      { "en": "Drill Bit", "de": "Bohrer", "uk": "Свердло" },
      { "en": "Drill bit", "de": "Bohrer", "uk": "Свердло" },
      { "en": "Wrench", "de": "Schraubenschlüssel", "uk": "Гайковий ключ" },
      { "en": "Screwdriver", "de": "Schraubendreher", "uk": "Викрутка" }
    ],
    "faucet-k1": [
      { "en": "Drill hole", "de": "Loch bohren", "uk": "Просвердліть отвір" },
      { "en": "Insert K1 faucet", "de": "Wasserhahn K1 einsetzen", "uk": "Вставте кран K1" },
      { "en": "Tighten nut", "de": "Mutter anziehen", "uk": "Затягніть гайку" },
      { "en": "Hand-tighten, no tools", "de": "Handfest anziehen, ohne Werkzeug", "uk": "Затягніть рукою, без інструментів" },
      { "en": "Drinking Water Faucet", "de": "Trinkwasserhahn", "uk": "Кран для питної води" },
      { "en": "Buy K1", "de": "K1 kaufen", "uk": "Купити K1" },
      { "en": "Overview with K1 Faucet", "de": "Übersicht mit Wasserhahn K1", "uk": "Огляд із краном K1" }
    ],
    "faucet-k3": [
      { "en": "Insert K3 faucet", "de": "Wasserhahn K3 einsetzen", "uk": "Вставте кран K3" },
      { "en": "Connect blue tube", "de": "Blauen Schlauch anschließen", "uk": "Під’єднайте синю трубку" },
      { "en": "Attach connector", "de": "Verbinder anbringen", "uk": "Встановіть фітинг" },
      { "en": "Connect to mineralizator", "de": "Mit Mineralisator verbinden", "uk": "Під’єднайте до мінералізатора" },
      { "en": "Buy K3", "de": "K3 kaufen", "uk": "Купити K3" },
      { "en": "Overview with K3 Faucet", "de": "Übersicht mit Wasserhahn K3", "uk": "Огляд із краном K3" }
    ],
    "valve": [
      { "en": "Unscrew cold hose", "de": "Kaltwasserschlauch abschrauben", "uk": "Відкрутіть шланг холодної води" },
      { "en": "Insert 3-way valve", "de": "3-Wege-Ventil einsetzen", "uk": "Встановіть триходовий клапан" },
      { "en": "Tighten connections", "de": "Verbindungen festziehen", "uk": "Затягніть з’єднання" },
      { "en": "Insert red tube", "de": "Roten Schlauch einstecken", "uk": "Вставте червону трубку" },
      { "en": "Lock with clip", "de": "Mit Clip sichern", "uk": "Зафіксуйте кліпсою" }
    ],
    "drain": [
      { "en": "Drill hole in pipe", "de": "Loch ins Rohr bohren", "uk": "Просвердліть отвір у трубі" },
      { "en": "Fit drain clamp", "de": "Abflussschelle montieren", "uk": "Встановіть дренажний хомут" },
      { "en": "Insert gray tube", "de": "Grauen Schlauch einstecken", "uk": "Вставте сіру трубку" }
    ],
    "tubes": [
      { "en": "Find the ports", "de": "Anschlüsse finden", "uk": "Знайдіть порти" },
      { "en": "Remove plugs", "de": "Stopfen entfernen", "uk": "Вийміть заглушки" },
      { "en": "Insert L-connectors", "de": "Winkelverbinder einstecken", "uk": "Вставте кутові фітинги" },
      { "en": "Insert tubes", "de": "Schläuche einstecken", "uk": "Вставте трубки" },
      { "en": "20 mm inside the fitting", "de": "20 mm tief in den Verbinder", "uk": "20 мм усередину фітинга" }
    ],
    "mineralizator": [
      { "en": "Attach 2× straight connector", "de": "2× Geradverbinder anbringen", "uk": "Встановіть 2 прямі фітинги" },
      { "en": "Lock with clips", "de": "Mit Clips sichern", "uk": "Зафіксуйте кліпсами" },
      { "en": "Mineralizator installed", "de": "Mineralisator montiert", "uk": "Мінералізатор встановлено" }
    ],
    "first-start": [
      { "en": "Check both filters are locked in", "de": "Beide Kartuschen eingerastet?", "uk": "Перевірте фіксацію обох картриджів" },
      { "en": "Check tubes and clips", "de": "Schläuche und Clips prüfen", "uk": "Перевірте трубки та кліпси" },
      { "en": "Check drain tube", "de": "Abflussschlauch prüfen", "uk": "Перевірте дренажну трубку" },
      { "en": "Open inlet valve", "de": "Zulaufventil öffnen", "uk": "Відкрийте вхідний клапан" },
      { "en": "Open faucet", "de": "Wasserhahn öffnen", "uk": "Відкрийте кран" },
      { "en": "Plug in", "de": "Netzstecker einstecken", "uk": "Увімкніть у розетку" },
      { "en": "Ready to drink", "de": "Trinkbereit", "uk": "Можна пити" }
    ],
    "service": [
      { "en": "Close inlet valve", "de": "Zulaufventil schließen", "uk": "Закрийте вхідний клапан" },
      { "en": "Open faucet until water stops", "de": "Hahn öffnen, bis kein Wasser mehr fließt", "uk": "Відкрийте кран, доки не стече вода" },
      { "en": "Release old filter", "de": "Alte Kartusche entriegeln", "uk": "Вивільніть старий картридж" },
      { "en": "Insert new filter until click", "de": "Neue Kartusche einsetzen, bis sie einrastet", "uk": "Вставте новий картридж до клацання" },
      { "en": "Open valve & faucet", "de": "Ventil & Wasserhahn öffnen", "uk": "Відкрийте клапан і кран" },
      { "en": "Hold 3 s to reset", "de": "Zum Zurücksetzen 3 s halten", "uk": "Утримуйте 3 с для скидання" }
    ],
    "troubleshooting": [
      { "en": "Issue", "de": "Problem", "uk": "Проблема" },
      { "en": "Possible cause", "de": "Mögliche Ursache", "uk": "Можлива причина" },
      { "en": "Solution", "de": "Lösung", "uk": "Рішення" },
      { "en": "Unit fails to turn on", "de": "Gerät schaltet sich nicht ein", "uk": "Пристрій не вмикається" },
      { "en": "The power supply is not connected or the switch is not turned on.", "de": "Die Stromversorgung ist nicht angeschlossen oder der Schalter ist nicht eingeschaltet.", "uk": "Живлення не під’єднано або вимикач не ввімкнено." },
      { "en": "Check whether the power plug is loose or not plugged in, and whether the power switch is turned on.", "de": "Prüfen Sie, ob der Netzstecker locker oder nicht eingesteckt ist und ob der Netzschalter eingeschaltet ist.", "uk": "Перевірте, чи вилка надійно вставлена в розетку і чи ввімкнено вимикач живлення." },
      { "en": "Adapter failure.", "de": "Netzteil defekt.", "uk": "Несправність блока живлення." },
      { "en": "Check whether the adapter indicator is off.", "de": "Prüfen Sie, ob die Anzeige am Netzteil aus ist.", "uk": "Перевірте, чи не згас індикатор блока живлення." },
      { "en": "Water leakage", "de": "Wasseraustritt", "uk": "Протікання води" },
      { "en": "Component damage.", "de": "Bauteil beschädigt.", "uk": "Пошкодження компонента." },
      { "en": "Turn off the power and close the inlet valve. Contact after-sales support.", "de": "Schalten Sie den Strom ab und schließen Sie das Zulaufventil. Kontaktieren Sie den Service.", "uk": "Вимкніть живлення і закрийте вхідний клапан. Зверніться до сервісу." },
      { "en": "The filter cartridge or water pipe is not connected properly.", "de": "Die Kartusche oder der Wasserschlauch ist nicht richtig angeschlossen.", "uk": "Картридж або трубку під’єднано неправильно." },
      { "en": "Check whether the filter cartridge is installed properly and whether the water pipe connection is loose.", "de": "Prüfen Sie, ob die Kartusche richtig eingesetzt ist und ob die Schlauchverbindung locker ist.", "uk": "Перевірте, чи правильно встановлено картридж і чи не ослабло з’єднання трубки." },
      { "en": "No water", "de": "Kein Wasser", "uk": "Немає води" },
      { "en": "Cold water valve or 3-way ball valve is off.", "de": "Das Kaltwasserventil oder der 3-Wege-Kugelhahn ist geschlossen.", "uk": "Закрито вентиль холодної води або триходовий клапан." },
      { "en": "Please open the corresponding valve.", "de": "Öffnen Sie das entsprechende Ventil.", "uk": "Відкрийте відповідний клапан." },
      { "en": "Low water flow", "de": "Geringer Wasserdurchfluss", "uk": "Слабкий потік води" },
      { "en": "Pipe bending.", "de": "Schlauch geknickt.", "uk": "Трубку перегнуто." },
      { "en": "Check inlet, waste, and pure water pipes.", "de": "Prüfen Sie Zulauf-, Abwasser- und Reinwasserschlauch.", "uk": "Перевірте трубки подачі, дренажу та чистої води." },
      { "en": "3-way ball valve is not fully opened.", "de": "Der 3-Wege-Kugelhahn ist nicht vollständig geöffnet.", "uk": "Триходовий клапан відкрито не повністю." },
      { "en": "Ensure the inlet 3-way ball valve is completely open.", "de": "Stellen Sie sicher, dass der 3-Wege-Kugelhahn am Zulauf vollständig geöffnet ist.", "uk": "Переконайтеся, що вхідний триходовий клапан повністю відкритий." },
      { "en": "Filter cartridge clogging.", "de": "Kartusche verstopft.", "uk": "Картридж забився." },
      { "en": "Replace or contact after-sales personnel.", "de": "Ersetzen Sie die Kartusche oder kontaktieren Sie den Service.", "uk": "Замініть картридж або зверніться до сервісу." },
      { "en": "Poor water quality", "de": "Schlechte Wasserqualität", "uk": "Погана якість води" },
      { "en": "Filter cartridge failure.", "de": "Kartusche defekt.", "uk": "Картридж несправний." },
      { "en": "Poor inlet quality.", "de": "Schlechte Qualität des Zulaufwassers.", "uk": "Погана якість вхідної води." },
      { "en": "Please confirm the water quality of tap water and consider installing a pretreatment device.", "de": "Prüfen Sie die Qualität des Leitungswassers und erwägen Sie den Einbau eines Vorfilters.", "uk": "Перевірте якість водопровідної води та розгляньте встановлення попереднього фільтра." },
      { "en": "Unit keeps restarting", "de": "Gerät startet immer wieder neu", "uk": "Пристрій постійно перезапускається" },
      { "en": "The faucet is not fully turned off.", "de": "Der Wasserhahn ist nicht vollständig geschlossen.", "uk": "Кран закрито не повністю." },
      { "en": "Please turn off the faucet.", "de": "Schließen Sie den Wasserhahn.", "uk": "Закрийте кран." },
      { "en": "Leakage in the pure water outlet pipeline or faucet of the machine.", "de": "Undichtigkeit in der Reinwasserleitung oder am Wasserhahn.", "uk": "Протікання в лінії чистої води або в крані." },
      { "en": "Please replace the leaking parts.", "de": "Ersetzen Sie die undichten Teile.", "uk": "Замініть деталі, що протікають." }
    ],
    "indicators": [
      { "en": "Indicator", "de": "Anzeige", "uk": "Індикатор" },
      { "en": "on", "de": "leuchtet", "uk": "світиться" },
      { "en": "flashing", "de": "blinkt", "uk": "блимає" },
      { "en": "breathing", "de": "pulsiert", "uk": "пульсує" },
      { "en": "I · II  Filter", "de": "I · II  Filter", "uk": "I · II  Filter" },
      { "en": "Filter OK", "de": "Kartusche OK", "uk": "Картридж у нормі" },
      { "en": "Replace soon", "de": "Bald wechseln", "uk": "Скоро заміна" },
      { "en": "Replace now", "de": "Jetzt wechseln", "uk": "Замініть зараз" },
      { "en": "Flush", "de": "Flush", "uk": "Flush" },
      { "en": "Ready", "de": "Bereit", "uk": "Готово" },
      { "en": "Flushing", "de": "Spülung läuft", "uk": "Промивання" },
      { "en": "Fault", "de": "Störung", "uk": "Несправність" },
      { "en": "Power", "de": "Power", "uk": "Power" },
      { "en": "Standby", "de": "Standby", "uk": "Очікування" },
      { "en": "Working", "de": "In Betrieb", "uk": "Працює" },
      { "en": "All flashing + beep", "de": "Alle blinken + Signalton", "uk": "Усі блимають + сигнал" },
      { "en": "Water ran 30 min non-stop — restart the unit", "de": "Wasser lief 30 Min. ohne Pause — Gerät neu starten", "uk": "Вода текла 30 хв без зупинки — перезапустіть пристрій" },
      { "en": "Leak detected — close inlet valve, restart", "de": "Leck erkannt — Zulaufventil schließen, neu starten", "uk": "Виявлено протікання — закрийте вхідний клапан, перезапустіть" }
    ],
    "safety": [
      { "en": "230 V~ 50 Hz", "de": "230 V~ 50 Hz", "uk": "230 В~ 50 Гц" },
      { "en": "supply", "de": "Stromversorgung", "uk": "живлення" },
      { "en": "1–4 bar", "de": "1–4 bar", "uk": "1–4 бар" },
      { "en": "inlet pressure", "de": "Eingangsdruck", "uk": "тиск на вході" },
      { "en": "4–9 bar", "de": "4–9 bar", "uk": "4–9 бар" },
      { "en": "working pressure", "de": "Betriebsdruck", "uk": "робочий тиск" },
      { "en": "feed water", "de": "Zulaufwasser", "uk": "вхідна вода" },
      { "en": "ambient", "de": "Umgebung", "uk": "довкілля" },
      { "en": "5 years", "de": "5 Jahre", "uk": "5 років" },
      { "en": "warranty", "de": "Garantie", "uk": "гарантія" }
    ]
  }
};
