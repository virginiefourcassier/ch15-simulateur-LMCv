# Intégrer le simulateur dans Éléa (Moodle)

Prérequis : le simulateur est publié sur GitHub Pages (voir `README.md`), par exemple à l'adresse
`https://VOTRE-PSEUDO.github.io/banc-optique-3d/`.

## 1. Dans une page, une étiquette (zone texte et média) ou un énoncé de question

1. Ouvrez l'éditeur de texte (Atto ou TinyMCE).
2. Passez en mode **code HTML** : bouton `</>`, ou « Code source » dans le menu *Affichage / Outils*.
3. Collez ce code :

```html
<iframe src="https://VOTRE-PSEUDO.github.io/banc-optique-3d/?oa=20"
        width="100%" height="650" style="border:0; max-width:1200px;"
        allow="fullscreen" allowfullscreen
        title="Banc optique 3D – Mission AlexNova"></iframe>
```

4. Enregistrez. Une hauteur de **600 à 700 px** convient sur ordinateur. Sur un écran étroit (moins de 860 px de large), le panneau passe sous la scène 3D : prévoyez alors 900 px ou plus.

> Si l'iframe disparaît à l'enregistrement, c'est que le filtre de sécurité d'Éléa la supprime. Utilisez alors une activité **Page**, ou demandez au référent Éléa d'autoriser l'iframe.

## 2. Variantes utiles

| Usage | Adresse (`src`) |
|---|---|
| Mission complète avec position aléatoire | `…/banc-optique-3d/` |
| Mission avec un objet imposé à 30 cm | `…/banc-optique-3d/?oa=30` |
| Évaluation : la réponse est saisie **dans le test Éléa** | `…/?oa=30&validation=0&correction=0&nouvelle=0&libre=0` |
| Découverte libre | `…/?mode=libre` |

## 3. Avec une question aléatoire (piste, non testée)

Le simulateur **ne communique pas** avec Moodle, STACK ou SCORM : aucun envoi de note, aucune lecture de variable. On peut seulement lui **transmettre** la position de l'objet par l'URL.

- **Question à variantes (une question par valeur de OA)** : créez une question « Numérique » par position (15, 20, 30, 60 cm…). Chacune contient l'iframe avec le `?oa=` correspondant et la réponse attendue (30 ; 20 ; 15 ; 12 cm). Ajoutez une tolérance de ± 1 cm. Regroupez ensuite ces questions dans une catégorie et tirez‑les au hasard (« question aléatoire »).
- **STACK** : il est en principe possible d'écrire l'iframe dans l'énoncé avec une variable, par exemple `src="…/?oa={#oa#}&validation=0"`, en tirant `oa` parmi `[15,20,30,60,12.5,14,35,50]`, et de comparer la réponse à `10*oa/(oa-10)`. **Ce montage n'a pas été testé** dans votre Éléa. L'insertion d'iframes dans STACK dépend de la configuration de la plateforme.

Positions dont le résultat est « rond » (f' = 10 cm) :

| OA (cm) | 15 | 20 | 30 | 60 | 12,5 | 14 | 35 | 50 |
|---|---|---|---|---|---|---|---|---|
| OA' (cm) | 30 | 20 | 15 | 12 | 50 | 35 | 14 | 12,5 |

## 4. Points de vigilance

- Les postes du lycée doivent avoir un navigateur récent (Firefox, Chrome ou Edge) avec WebGL activé. C'est le cas par défaut.
- Rien n'est enregistré : un rechargement de la page relance une nouvelle mission.
- Le bouton ⛶ (plein écran) ne fonctionne dans l'iframe que si l'attribut `allowfullscreen` est présent.
