# Telugu Spoken Lab

Spoken-only Telugu in Roman script. Kannada is the transfer language. No Telugu script.

## What this is

A conversation trainer, not a dictionary dump.

- Learn natural spoken lines a local would actually say
- Drill verbs across present / past / future (and the spoken `-ēs-` completed feel)
- Connectors, special words, addressing (nuvvu vs mīru)
- Daily points + weekly heat vault rewards

Backend data lives in `/data`. The API only serves conversation pieces, not a full lexicon.

## Run

```bash
cd telugu-spoken-lab
npm install
npm start
```

Open http://localhost:3000

Progress and points store in the browser (`localStorage`). Weekly reset is Sunday-based.

## Categories

| Main | Sub |
| --- | --- |
| verbs | present, past, future, completed (`-ēs-`) |
| connectors | small glue words that hold a turn together |
| special words | discourse particles locals lean on |
| addressing | respect vs casual, kin, names |
| sentences | situation packs for real talk |

## Rewards

Daily tasks give points. Hit the weekly threshold to unlock **Heat Vault** packs: spoken flirting and after-dark Telugu, still in Roman, still with Kannada hooks.

Adult content is opt-in behind the vault door.
