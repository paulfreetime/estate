Det her projekt er en lille “ejendoms-CRM + investeringsberegner” til udlejningsejendomme: du kan oprette ejendomme, gemme alle nøgletal/omkostninger, uploade dokumenter – og så sammenligne flere ejendomme side-om-side med KPI’er og eksportere hele analysen til Excel.

Hvad det er (set med menneske-øjne)

Et samlet overblik over dine investeringsejendomme: navn, adresse, m², antal lejemål, købpris, lejeindtægter og alle driftsomkostninger.

En simpel “driftsøkonomi + finansiering” analyse hvor du kan se hvad ejendommen tjener før/efter renter, afkast, omkostningsprocent osv.

Et dokument-arkiv pr. ejendom (lejekontrakter, energimærke, billeder, tilbud, budgetter osv.)

Excel-eksport så du kan dele eller arbejde videre i regneark.

Hvad det kan (funktionelt)

1. Opret og gem ejendomme

Formularen (“Ny ejendom”) tager alle felterne: anskaffelse, lejeindtægter og en lang liste af omkostningsposter.

Den beregner automatisk “omkostninger i alt” som summen af alle omkostningslinjer.

2. Liste + detaljevisning + redigering

Du får en tabel med dine ejendomme og hurtige kolonner (kvm, lejemål, anskaffelse, lejeindtægter, omkostninger i alt, overskud).

Klik på en ejendom → modal med alle detaljer.

Du kan redigere værdierne og gemme (og omkostninger-i-alt bliver genberegnet ved gem).

3. Upload og håndtér dokumenter pr. ejendom

Upload flere filer ad gangen.

Se filer som links.

Slet filer igen.

Filer ligger i en mappe pr. building_id på serveren.

4. Sammenlign ejendomme (Analyse-siden)

Du vælger flere ejendomme i en dropdown, og får en side-by-side sammenligning i en stor tabel.

Den viser både rå tal og KPI’er, bl.a.:

Overskud før renter = lejeindtægter − omkostninger_i_alt

Lånebeløb = anskaffelse × belåning%

Udbetaling = anskaffelse − lån

Årlig renteudgift = lån × rente%

Overskud efter renter / cash flow = overskud − renter

Cash-on-cash = (cash flow / udbetaling) × 100

Nettoafkast % = overskud / anskaffelse

Bruttoafkast % = lejeindtægter / anskaffelse

Omkostningsprocent = omkostninger_i_alt / lejeindtægter

Leje pr. m², omkostning pr. m², leje pr. lejemål

Den farver typisk “god/dårlig” (fx positivt cash flow grønt, negativt rødt, omkostningsprocent under en grænse som “positiv”).

5. Finansieringsstyring med globalt niveau + overrides

Du har en global rente og global belåning.

For hver ejendom kan du overstyre rente/belåning individuelt (override) og “reset” tilbage.

De settings gemmes i localStorage så de huskes i browseren.

6. Eksporter analysen til Excel

Analyse-tabellen bliver pakket til et datasæt og sendt til backend.

Backend genererer en pæn Excel med:

header styling

highlight på vigtige rækker (omkostninger i alt / overskud før/efter renter)

kolonnebredder

Filen downloades som analyse.xlsx.

Den inkluderer også kommentar og dokumentliste pr. ejendom.

Teknisk set (kort)

Frontend: React/TypeScript (BuildingForm, BuildingList, BuildingAnalyse)

Backend: FastAPI + SQLAlchemy + Postgresql/DB (ud fra database.py)

Filer: gemmes lokalt i uploads/<building_id>/...

Excel: openpyxl generering på serveren

Hvis du vil, kan jeg også skrive en ultra-kort “pitch”-tekst til forsiden (2-3 linjer) eller en lidt mere “investor”-agtig beskrivelse til README.
