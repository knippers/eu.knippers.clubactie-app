# Grote Clubactie - Loten Teller (Homey app)

Homey-app die inlogt op een persoonlijke Grote Clubactie verkooppagina en
laat zien hoeveel loten er verkocht zijn t.o.v. het doel. Ondersteunt
**meerdere clubs/verkopers tegelijk**: elk gepaird device heeft zijn eigen
clubcode + Mijn Clubactie code.

Werkt via een echte Homey-app (niet HomeyScript) omdat de Clubactie-API een
niet-standaard response header stuurt die Node's ingebouwde `fetch` afwijst;
de kale `https`-module met `insecureHTTPParser: true` (zie
`lib/clubactie.js`) lost dat op.

## Installeren / testen

```bash
npm install -g homey
homey login
cd clubactie-app
homey app run
```

Widgets vereisen Homey firmware **2023 of nieuwer**, en `homey app run` met
widget-development vereist Docker (zie "Bekende aandachtspunten" hieronder).

In de Homey-app zelf:

1. **Apparaat toevoegen → Loten Teller** — vul de **Clubcode** en **Mijn
   Clubactie code** in. Herhaal dit voor elke club/verkoper die je wilt
   volgen; elk device is volledig los van de andere.
2. Wil je de gegevens van een club later wijzigen? Ga naar dat device →
   Instellingen (het tandwiel-icoon op de apparaatpagina zelf) → pas
   Clubcode/Mijn Clubactie code aan.
3. **Widget toevoegen aan dashboard → Loten Meter** — kies bij het
   toevoegen welke club (welk device) deze widget-instantie moet tonen.
   Wil je meerdere clubs tegelijk op je dashboard, voeg de widget dan
   gewoon nog een keer toe en kies een andere club.

## Wat zit erin

- **Device per club**, elk met 3 capabilities: `loten_verkocht`,
  `loten_doel`, `loten_percentage`. Wordt per device elke 5 minuten
  ververst.
- **Flow trigger** "Verkocht aantal is gewijzigd" (per device te kiezen in
  de flow, via `getDeviceTriggerCard()`) met tokens `verkocht`, `doel`,
  `percentage`, `vorige_waarde` — vuurt zodra het aantal verkochte loten
  van dát device verandert.
- **Widget** "Loten Meter" voor het Homey-dashboard: een ring-gauge met het
  percentage, plus naam en `verkocht / doel` ernaast. Ververst elke minuut.
  Gebruikt de officiële `devices` (type `app`, `singular: true`) instelling
  uit de Homey Widget SDK, zodat je per widget-instantie een club kiest via
  `Homey.getDeviceIds()`.
- Volledig **tweetalig** (NL/EN) — teksten in `locales/en.json` en
  `locales/nl.json`, app-omschrijving in `app.json`.

## Bekende aandachtspunten

- **Logo/icoon**: `assets/icon.svg`, `assets/images/*.png`,
  `drivers/loten-teller/assets/*.png` én `widgets/loten-gauge/preview-*.png`
  zijn nu gegenereerde placeholders in Grote Clubactie-achtige kleuren
  (geel/rood). Wil je het echte logo van clubactie.nl gebruiken, download
  dat zelf van de site en vervang deze bestanden. Afmetingen: app small
  250×175, app large 500×350, driver small 75×75, driver large 500×500
  (alles PNG met transparantie), widget preview-light/dark 600×400 PNG.
- **Widget vereist recente Homey firmware**: widgets werken alleen op
  Homey 2023-modellen en nieuwer met firmware `>=12.3.0` (zie
  `compatibility` in `app.json`), en **niet** op Homey Cloud. Live
  herladen van de widget tijdens `homey app run` vereist bovendien Docker.
- **Meerdere devices, één widget-instantie**: de widget toont altijd
  precies één club (`singular: true`). Voor meerdere clubs tegelijk op je
  dashboard voeg je de widget simpelweg meerdere keren toe.
