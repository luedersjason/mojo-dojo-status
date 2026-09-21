# Mojo Dojo — shop content status board

**Mojo Dojo** = the shop / content brand. **Mojowerkin** = the maker (Jason). Ink edits & publishes.

Top ribbon: About · Discord · Channel (`@Mojowerkin`).  
Left: **Pipeline** (topics + idea repos) · **Published** underneath.

## Run locally

```bash
cd /workspace/mojo-dojo-status
python3 -m http.server 8787
```

Open http://127.0.0.1:8787

## Edit content

| File | Purpose |
|------|---------|
| `data/site.json` | Brand, maker, About, YouTube + Discord |
| `data/pipeline.json` | Pipeline topics + `published` list |
| `data/topics/<id>.json` | Idea repo per topic |

Statuses: `idea` | `capturing` | `ready` | `editing` | `published`
