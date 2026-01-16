FlashFiles – Detaljert systembeskrivelse
1. Overordnet beskrivelse
FlashFiles er en konto‑basert filoverføringstjeneste som lar brukere sende filer fra mobil (iOS/Android) til PC via et web‑dashboard.
Mobil og PC er innlogget på samme konto. Når en fil sendes fra mobilen, blir den tilgjengelig på PC etter få sekunder. Brukeren må manuelt laste ned filen. Filer lagres midlertidig og slettes automatisk etter én time.

2. Systemarkitektur
Klienter
Mobilapplikasjon (iOS og Android) bygget med Expo

Web‑dashboard for PC (nettleser)

Backend
Node.js‑server

REST‑API for opplasting og nedlasting

WebSocket for sanntidsvarsling

Database for metadata

Midlertidig fil‑lagring på server

Alle klienter kommuniserer kun med backend. Det finnes ingen direkte forbindelse mellom mobil og PC.

3. Brukerkonto og autentisering
Brukere må være logget inn for å bruke systemet.

Autentisering skjer via JWT‑token

Token sendes i Authorization‑header på alle forespørsler

Backend bruker token til å identifisere bruker

Alle filer knyttes til én bruker-ID

Kun filer som tilhører innlogget bruker kan vises eller lastes ned.

4. Mobilapplikasjon – Funksjonell flyt
4.1 Innlogging
Brukeren logger inn med eksisterende konto

Token lagres lokalt på enheten

Token brukes i alle videre forespørsler

4.2 Filvalg
Brukeren trykker “Legg til fil”

Mobilens filsystem åpnes

Brukeren velger én fil

Maks tillatt filstørrelse er 1 GB

4.3 Opplasting
Fil sendes til backend via HTTP POST

Forespørselen bruker multipart/form-data

Authorization‑header inneholder JWT‑token

4.4 Status
Mobilen viser enkel status:

Sender

Sendt

Ingen filhistorikk lagres i mobilappen

Når opplastingen er fullført, er mobilens jobb ferdig.

5. Backend – Opplastingsprosess
Når backend mottar en fil:

JWT‑token valideres

Filstørrelse kontrolleres (maks 1 GB)

Fil lagres midlertidig på serverens filsystem

Metadata lagres i databasen:

filnavn

størrelse

bruker‑ID

filsti

utløpstidspunkt (nå + 1 time)

Backend sender et WebSocket‑event til brukerens aktive PC‑klient

Backend lagrer aldri filer permanent.

6. Web‑dashboard (PC) – Funksjonell flyt
6.1 Innlogging
Brukeren logger inn i nettleseren

JWT‑token lagres i session eller memory

WebSocket‑tilkobling opprettes etter innlogging

6.2 Mottak av filer
WebSocket holder en aktiv forbindelse mot backend

Når backend mottar en fil, sendes et event til riktig bruker

Web‑dashboard mottar eventet i sanntid

6.3 Visning
Når en fil mottas, vises:

Filnavn

Filstørrelse

Én knapp: “Download”

Ingen historikk vises. Kun filer som fortsatt eksisterer vises.

7. Nedlasting
7.1 Nedlastingsforespørsel
Når brukeren trykker “Download”, sendes en HTTP GET‑forespørsel

Forespørselen inneholder fil‑ID og JWT‑token

7.2 Backend‑validering
Backend:

Verifiserer token

Sjekker at filen tilhører brukeren

Sjekker at filen ikke er utløpt

7.3 Nedlasting
Fil streames direkte til nettleseren

Backend oppretter ingen kopi

Etter nedlasting forblir filen tilgjengelig frem til utløpstid

8. Automatisk sletting
8.1 Tidsbegrensning
Hver fil får et utløpstidspunkt ved opplasting

Standard levetid er 1 time

8.2 Cleanup‑prosess
En bakgrunnsjobb kjører periodisk

Jobben:

finner filer som er utløpt

sletter filen fra disk

fjerner metadata fra databasen

Dette sikrer lav lagringsbruk og ingen langsiktig kostnad.

9. Database
Databasen brukes kun til metadata.

Files‑tabell
id

user_id

filename

size

path

expires_at

created_at

Ingen filer lagres i databasen.

10. Sikkerhet
Alle API‑endepunkter krever autentisering

Filer er alltid knyttet til én bruker

Ingen offentlige URL‑er

Ingen fil kan aksesseres uten gyldig token

Filer slettes automatisk etter kort tid

11. Begrensninger
Maks én fil per opplasting

Maks filstørrelse 1 GB

Ingen filhistorikk

Ingen deling mellom brukere

Ingen automatisk nedlasting

Disse begrensningene er bevisste for å holde systemet enkelt og kostnadsfritt.

12. Videreutviklingsmuligheter
Filhistorikk

Mapper

Kryptering ende‑til‑ende

Desktop‑app wrapper

Deling mellom brukere

Lengre lagringstid