# Banc optique 3D – Mission AlexNova

Simulateur 3D d'un banc optique pour la classe de seconde. Il comprend une lentille mince convergente (f' = 10,0 cm), une lanterne avec un objet « F » (AB = 2,0 cm) et un écran mobile. L'image est calculée par tracé de rayons à travers l'ouverture de la lentille.

Application **100 % statique** : aucun serveur applicatif, aucun compte, aucune clé API.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | page du simulateur |
| `css/style.css` | mise en forme (Comic Sans MS, violet/parme, bulles Instagram) |
| `js/physique.js` | modèle physique (conjugaison, grandissement, tache de flou) |
| `js/app.js` | scène 3D Three.js, interactions, mission |
| `lib/three.module.min.js`, `lib/OrbitControls.js` | Three.js r160 (copie locale) |
| `lib/LICENSE-three.txt` | licence MIT de Three.js |
| `test-iframe.html` | page d'essai de l'intégration par iframe |
| `INTEGRATION-ELEA.md` | notice d'intégration dans Éléa |
| `VALIDATION.md` | fiche de validation scientifique et technique |

## Publier sur GitHub Pages (≈ 5 minutes)

1. Créez un compte gratuit sur <https://github.com> (si vous n'en avez pas déjà un).
2. Cliquez sur **New repository**. Nommez‑le par exemple `banc-optique-3d`, cochez **Public**, puis cliquez sur **Create repository**.
3. Sur la page du dépôt, cliquez sur **uploading an existing file**. Faites glisser **le contenu** du dossier dézippé : `index.html`, les dossiers `css`, `js`, `lib`, etc. Ne déposez pas le dossier lui‑même. Validez avec **Commit changes**.
   - `index.html` doit se trouver **à la racine** du dépôt.
4. Ouvrez **Settings → Pages**. Dans « Build and deployment », choisissez *Source : Deploy from a branch*, puis *Branch : `main`* et le dossier */ (root)*. Cliquez sur **Save**.
5. Attendez 1 à 2 minutes. L'adresse s'affiche en haut de la page Pages :
   `https://VOTRE-PSEUDO.github.io/banc-optique-3d/`

**Mise à jour :** déposez les fichiers modifiés de la même façon. Si le navigateur garde l'ancienne version, augmentez le numéro `?v=1.0` dans `index.html`.

## Essayer en local

Les modules JavaScript ne se chargent pas si l'on ouvre `index.html` par double‑clic (`file://`). Il faut donc un petit serveur local, par exemple :

```bash
python -m http.server 8000
```

puis ouvrir <http://localhost:8000>.

## Paramètres d'URL

| Paramètre | Effet | Exemple |
|---|---|---|
| `oa` | impose la position de l'objet (cm, de 11 à 65) | `?oa=30` |
| `ecran` | position de départ de l'écran (cm, de 5 à 75) | `?oa=30&ecran=40` |
| `mode=libre` | ouvre l'onglet « Exploration libre » | `?mode=libre` |
| `validation=0` | masque la saisie et la validation (la réponse est demandée dans Éléa) | `?oa=20&validation=0` |
| `aides=0` | masque les aides | |
| `correction=0` | ne propose jamais le bouton « Voir la correction » | |
| `nouvelle=0` | masque « Nouvelle mission » (position figée) | |
| `libre=0` | masque l'onglet « Exploration libre » | |

## Licences

- Three.js r160 : licence MIT (voir `lib/LICENSE-three.txt`).
- Tout le reste (code, textures dessinées par programme) a été écrit pour ce projet, sans ressource externe. Il n'y a ni police téléchargée ni modèle 3D tiers.
- Le simulateur s'inspire de l'ergonomie du « Rail optique virtuel » de W. Fortin (2021), crédité en pied de page. Aucun fichier de ce projet n'y a été repris.
