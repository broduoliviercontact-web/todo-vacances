# Todo Vacances

Une petite application web pour préparer une liste de choses à ne pas oublier avant de partir en vacances. Les données sont stockées dans le cloud via Cloudflare KV.

## Fonctionnalités

- Ajouter des items dans une catégorie
- Cocher les items déjà préparés
- Supprimer un item
- Créer/supprimer des catégories
- Voir la progression de chaque catégorie
- **Sauvegarder dans le cloud** avec un ID court (paramètre `?list=`)
- Partager le lien pour retrouver ou envoyer la liste

## Architecture

```text
.
├── src/index.js           # Worker (API + serveur HTML)
├── public/index.html      # Application front-end
├── wrangler.toml          # Config Cloudflare Workers
├── package.json
└── README.md
```

Le worker sert :
- **HTML** : lu depuis KV avec la clé `__index_html__`
- **API** : `GET /api/lists/{id}` et `POST /api/lists/{id}`

## Déploiement

```bash
npm install
npm exec wrangler deploy
```

Puis injecter `public/index.html` dans KV :
```bash
npm exec wrangler kv:key put --binding=TODO_KV __index_html__ --path ./public/index.html
```

## Stack technique
- **Cloudflare Workers** : backend / edge
- **Cloudflare KV** : stockage persistant des listes

---

**URL publique** : https://todo-vacances.pliskain.workers.dev
