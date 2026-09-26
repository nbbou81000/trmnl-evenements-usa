# Concerts & événements USA — TRMNL

Plugin TRMNL affichant les concerts, matchs et événements à proximité d'une ville US choisie, avec date, tarif et type — filtrable par type d'événement. Données Ticketmaster Discovery API, actualisées chaque jour via GitHub Actions.

Tout se fait depuis le navigateur, aucune commande à taper.

## 1. Créer le dépôt GitHub

1. Sur github.com, bouton vert **New** (nouveau dépôt).
2. Nom : `trmnl-evenements-usa`, visibilité **Public**, ne rien cocher d'autre. **Create repository**.

Deux façons de mettre les fichiers dedans — choisir l'une des deux :

### Option A — GitHub Desktop

1. Installer GitHub Desktop (desktop.github.com), se connecter avec le compte GitHub.
2. Créer un dossier vide sur l'ordinateur, y placer les 10 fichiers/dossiers téléchargés depuis la conversation, en gardant l'arborescence telle quelle (`.github/workflows/`, `scripts/`, `data/`, `cities.json`, les 4 `.liquid`, `custom_fields.yml`).
3. Dans GitHub Desktop : **File** → **Add local repository** → sélectionner ce dossier → proposer **create a repository** → choisir le nom `trmnl-evenements-usa`.
4. Bouton **Publish repository** en haut de la fenêtre (décocher "Keep this code private" si tu veux du public). Tout est envoyé d'un coup, dossiers cachés (`.github`) inclus.

### Option B — entièrement depuis le site, sans rien installer

Le dossier `.github/workflows/` commence par un point, souvent invisible dans l'explorateur de fichiers de l'ordinateur, ce qui rend le glisser-déposer peu fiable pour ce fichier précis. La méthode la plus sûre est donc de créer les fichiers un par un directement sur GitHub, en tapant leur chemin :

1. Sur la page du dépôt : bouton **Add file** (en haut à droite) → **Create new file**.
2. Dans le champ **Name your file...**, taper le chemin exact du fichier (taper un `/` crée automatiquement le dossier) — par exemple `scripts/fetch-events.js` ou `.github/workflows/update-events.yml`.
3. Ouvrir le fichier correspondant téléchargé depuis la conversation avec un éditeur de texte (Bloc-notes, TextEdit...), tout sélectionner, copier.
4. Coller le contenu dans la grande zone de texte de GitHub.
5. Descendre en bas de page, laisser **Commit directly to the main branch** coché, bouton vert **Commit new file**.
6. Répéter pour chacun des 10 fichiers, avec leur chemin exact :
   `README.md`, `cities.json`, `custom_fields.yml`, `full.liquid`, `half_horizontal.liquid`, `half_vertical.liquid`, `quadrant.liquid`, `scripts/fetch-events.js`, `.github/workflows/update-events.yml`, `data/austin-tx.example.json`.

## 2. Obtenir une clé Ticketmaster (gratuite)

1. Aller sur developer.ticketmaster.com, créer un compte.
2. Menu **My Apps** → **Add New App**, donner un nom.
3. Copier le **Consumer Key** généré : c'est la clé API.

## 3. Ajouter la clé comme secret GitHub

1. Dans le dépôt : **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**. Nom : `TICKETMASTER_API_KEY`. Valeur : la clé copiée à l'étape 2. **Add secret**.

## 4. Lancer le workflow une première fois

1. Onglet **Actions** du dépôt → workflow **Update events** dans la liste de gauche.
2. Bouton **Run workflow** (à droite) → **Run workflow**.
3. Attendre ~1-2 minutes, rafraîchir : un dossier `data/` rempli de fichiers `<ville>.json` doit apparaître (ex. `data/austin-tx.json`).

Pas besoin d'activer GitHub Pages : les fichiers sont servis directement via `raw.githubusercontent.com`.

## 5. Créer le plugin privé sur TRMNL

1. Sur trmnl.com : **Plugins** → **Private Plugin** → **Add New**.
2. Dans l'onglet **Markup**, coller le contenu de chaque fichier `.liquid` dans la vue correspondante : `full.liquid` → *Full*, `half_horizontal.liquid` → *Half horizontal*, `half_vertical.liquid` → *Half vertical*, `quadrant.liquid` → *Quadrant*.
3. Dans **Custom Fields**, passer en édition YAML et coller le contenu de `custom_fields.yml`.
4. Dans **Polling URL**, mettre :
   `https://raw.githubusercontent.com/<ton-compte-github>/trmnl-evenements-usa/main/data/{{ ville }}.json`
5. Pour prévisualiser avant que le vrai pipeline ait tourné pour toutes les villes, pointer temporairement l'URL sur le fichier d'exemple :
   `https://raw.githubusercontent.com/<ton-compte-github>/trmnl-evenements-usa/main/data/austin-tx.example.json`

## Entretien

Le workflow tourne seul chaque jour à 9h UTC. Pour relancer une mise à jour à la main : **Actions** → **Update events** → **Run workflow**, comme à l'étape 4.

Pour ajouter ou retirer des villes : éditer `cities.json` (slug, libellé, lat/lon) et le bloc `options` du champ `ville` dans `custom_fields.yml` — les deux doivent rester alignés.
