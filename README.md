# Todo Vacances ☁️

Application web pour préparer sa valise avant les vacances.
Passe de catégorie en catégorie (César, Miu, Plage, etc.), coche ce qui est prêt, et partage ta liste avec un lien court.

## Deux modes de fonctionnement

### 1. Mode Cloud (par défaut) — `?list=abc123`

Clique **💾 Sauvegarder dans le cloud** pour générer un ID court.  
Les données sont stockées sur **Cloudflare KV** et synchronisées automatiquement toutes les 4 secondes.

- Le lien contient juste l'ID : `https://todo-vacances.pliskain.workers.dev/?list=abc123`
- Partage-le, modifie-le, les changements sont visibles partout en temps réel

### 2. Mode Local (legacy) — `?d=eyJ...`

Sans cloud save, toutes les données restent dans l'URL encodées en Base64 (ancien comportement).

## Fonctionnalités

- ✅ Ajouter/supprimer des catégories et items
- ✅ Cocher/décocher avec barre de progression
- ✅ 💾 Sauvegarde cloud avec un clic
- ☁️ Synchronisation auto toutes les 4s (mode cloud)
- 🔗 Lien de partage court (mode cloud) ou complet encodé (mode local)
- 📱 Responsive — conçu pour le téléphone

## Architecture

```text
.
├── src/index.js           # Cloudflare Worker (API + serve HTML)
├── public/index.html      # Application front-end (SPA vanilla JS)
├── wrangler.toml          # Config Cloudflare
├── package.json           # Scripts npm + wrangler
└── README.md              # Ce fichier
```

### Worker Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Sert `public/index.html` depuis KV (`__index_html__`) |
| GET | `/api/lists/:id` | Retourne la liste JSON pour cet ID |
| POST | `/api/lists/:id` | Sauvegarde la liste JSON pour cet ID |

## Développement local

```bash
npm install
npm run dev          # wrangler dev — Worker local
```

## Déploiement

```bash
npm run deploy       # wrangler deploy
npm run kv:put-index # injecte public/index.html dans KV
```

Ou en une ligne :
```bash
npm run setup        # deploy + kv:put-index
```

## Stack

- **Cloudflare Workers** — Edge computing
- **Cloudflare KV** — Stockage clé-valeur pour les listes
- **Vanilla JS + CSS** — Pas de framework front

## License

MIT — fait avec ❤️ par Corn
