# The Path

A lay practitioner's day, pin potha and library of the Buddha's teachings to householders and kings. Built by Claude for C J Jayasooriya.

Installable web app (PWA). Open it in Chrome on Android and choose **Install app**.

## What lives where
- **This repository** holds code and public texts only. No personal data.
- **Your Google Drive** holds your ticks, notes, photos and schedule, in a folder named *The Path*. The app can see only files it created (`drive.file` scope).
- **Your Google Calendar** stays the source of reminders. Ticking a practice in the app greys the matching event.

## Texts and licences
- Buddha Jayanti Tipiṭaka Pali and Sinhala, and the modern Sinhala translation derived from A. P. de Zoysa, from [tipitaka.lk](https://tipitaka.lk) under CC BY-ND 4.0. Reproduced unaltered and refreshed monthly by `.github/workflows/sync-texts.yml`. Report errors to path.nirvana@gmail.com, not here.
- English translations by Bhikkhu Sujato and the Mahāsaṅgīti Pali, from [SuttaCentral](https://suttacentral.net), public domain (CC0).
- Study notes, essays and app code by Claude.

## Rebuilding the library
```
python tools/fetch_sc.py /tmp/sc
python tools/build_library.py /tmp/sc /path/to/tipitaka.lk/public/static tools/content library
```
