# Fiche de validation – Banc optique 3D (v1.0)

Tests réalisés le 11/11/2026 :
- dans le navigateur intégré de l'application Claude (moteur Chromium), servi en local (`http://127.0.0.1`) ;
- calculs vérifiés avec Node.js ;
- mesures faites sur l'**image réellement calculée** par la carte graphique, avec la fonction de test `__banc.mesurerImage()`.

Légende : ✅ vérifié · ⚠️ vérifié partiellement · ⬜ non testé

## 1. Modèle physique

| Élément | Choix | Statut |
|---|---|---|
| Lentille | mince, convergente, f' = 10,0 cm, **non modifiable** | ✅ |
| Objet | « F » lumineux, pied A sur l'axe, sommet B, AB = 2,0 cm | ✅ |
| Conjugaison | 1/f' = 1/OA + 1/OA' ⇒ OA' = f'·OA/(OA − f') | ✅ |
| Grandissement | \|γ\| = OA'/OA = A'B'/AB | ✅ |
| Représentation 3D de la lentille | biconvexe (épaisseur ≈ 1 cm) **pour l'aspect seulement** ; le calcul utilise une lentille mince placée en O | ✅ |
| Ouverture utile | D = 4,0 cm | ✅ |

## 2. Calcul de OA' et du grandissement (Node.js, `js/physique.js`)

| OA (cm) | OA' calculé (cm) | \|γ\| | A'B' (cm) | Résidu 1/f' − (1/OA + 1/OA') |
|---|---|---|---|---|
| 15 | 30,000 | 2,000 | 4,000 | 1·10⁻¹⁷ |
| 20 | 20,000 | 1,000 | 2,000 | 1·10⁻¹⁷ |
| 30 | 15,000 | 0,500 | 1,000 | 0 |
| 60 | 12,000 | 0,200 | 0,400 | 1·10⁻¹⁷ |
| 12,5 | 50,000 | 4,000 | 8,000 | 1·10⁻¹⁷ |
| 14 | 35,000 | 2,500 | 5,000 | 1·10⁻¹⁷ |
| 35 | 14,000 | 0,400 | 0,800 | 1·10⁻¹⁷ |
| 50 | 12,500 | 0,250 | 0,500 | 0 |

Les quatre couples demandés (15→30, 20→20, 30→15, 60→12) sont confirmés. ✅

## 3. Formation de l'image et netteté

**Méthode.** Pour chaque point de l'écran, on prend 96 points répartis sur l'ouverture de la lentille et on remonte chaque rayon jusqu'à l'objet. On utilise le fait que tous les rayons issus d'un point objet passent par son point image. La lumière reçue en ce point de l'écran est la moyenne de ces 96 rayons.

**Conséquence.** Un point objet donne sur l'écran une tache de diamètre δ = D·|1 − d/OA'|, où d est la distance lentille–écran. **Aucune fonction de flou arbitraire n'est utilisée.**

Petit effet de rendu ajouté : une rotation aléatoire de l'échantillonnage d'un pixel à l'autre. Elle transforme les « images fantômes » en un léger grain.

### 3.1 Position de netteté : mesure sur l'image rendue

On a balayé la position de l'écran de OA' − 3 cm à OA' + 3 cm, par pas de 1 mm. Pour chaque position, on a calculé un indice de netteté (énergie des gradients divisée par le flux) et repéré la position où il est maximal.

| OA (cm) | OA' théorique | Écran le plus net mesuré | Indice à OA' | Indice à OA' ± 1 cm |
|---|---|---|---|---|
| 15 | 30,0 | 30,0 | 2,44 | 0,70 / 0,65 |
| 20 | 20,0 | 20,0 | 23,2 | 3,13 / 2,58 |
| 30 | 15,0 | 15,0 | 47,0 | 3,22 / 3,27 |
| 60 | 12,0 | 12,0 | 133 | 2,44 / 2,47 |
| 12,5 | 50,0 | 49,9 * | 0,62 | 0,44 / 0,41 |
| 14 | 35,0 | 34,9 * | 1,44 | 0,62 / 0,58 |
| 35 | 14,0 | 14,0 | 66,7 | 2,51 / 2,69 |
| 50 | 12,5 | 12,5 | 117 | 2,44 / 2,30 |

\* Pour une image lointaine, un écart de 1 mm donne une tache de 0,08 mm, plus petite qu'un pixel de la texture (0,2 mm). La « profondeur de champ » couvre donc ± 1 mm. ✅

### 3.2 Taille, sens et position de l'image (écran à OA')

| OA (cm) | A'B' théorique | Hauteur mesurée de la zone éclairée | Sommet de l'image |
|---|---|---|---|
| 15 | 4,00 cm | 4,00 cm | sur l'axe (A' sur l'axe) |
| 20 | 2,00 | 2,01 | sur l'axe |
| 30 | 1,00 | 1,00 | sur l'axe |
| 60 | 0,40 | 0,41 | sur l'axe |
| 12,5 | 8,00 | 8,01 | sur l'axe |
| 14 | 5,00 | 5,00 | sur l'axe |
| 35 | 0,80 | 0,80 | sur l'axe |
| 50 | 0,50 | 0,51 | sur l'axe |

- **Sens** : l'objet est au‑dessus de l'axe, l'image se forme au‑dessous. Vue depuis la lentille, l'image apparaît « tête en bas ». Elle est donc **renversée** (rotation de 180° autour de l'axe optique). ✅ Vérifié aussi sur captures d'écran.
- **Variation de taille** : l'image est agrandie si OA < 20 cm, de même taille si OA = 20 cm, réduite si OA > 20 cm. ✅
- **Taille hors netteté** : le centre de chaque tache suit le rayon qui passe par O sans être dévié. La taille de l'image sur l'écran vaut donc AB × d/OA. Elle grandit quand on recule l'écran, ce qui est cohérent avec l'expérience. ✅
- **Luminosité** : l'éclairement est proportionnel à 1/k², où k = d/OA, car le flux se répartit sur une surface plus grande. Il est borné entre 0,3 et 1 pour que l'image reste visible. Ce choix de rendu **ne modifie ni la position ni la netteté**. ⚠️ C'est volontairement une approximation.

### 3.3 Comportement quand on déplace l'écran

- OA = 20 cm : écran à 20,0 cm → image nette ; écran à 23,0 cm → image floue (tache de 6,0 mm calculée, flou bien visible). ✅ (captures)
- OA = 60 cm : écran à 12,0 cm → nette ; écran à 13,0 cm → floue (tache de 3,3 mm). ✅ (captures)
- Le flou augmente des deux côtés de la position de netteté. ✅ (tableau 3.1)

## 4. Scène 3D et commandes

| Fonction | Statut | Remarque |
|---|---|---|
| Rail gradué (0 en O, graduations en mm, cm et tous les 10 cm), lanterne, lentille sur support, écran blanc quadrillé sur cavalier, index rouges | ✅ | captures |
| Éclairage et ombres permettant de voir les volumes | ✅ | |
| Rotation au clic gauche | ✅ | glisser à la souris testé |
| Zoom à la molette (vers le curseur) | ✅ | |
| Déplacement latéral au clic droit | ⚠️ | réglage standard d'OrbitControls, non testé à la souris |
| Tablette : 1 doigt = rotation, 2 doigts = zoom et déplacement | ⬜ | réglage standard d'OrbitControls ; **pas testé sur une vraie tablette** |
| Vues Perspective, De face, De côté, Dessus, Face à l'écran, Réinitialiser | ✅ | transitions animées, recul automatique si la fenêtre est étroite |
| Glisser l'écran directement dans la scène 3D | ✅ | 40,0 → 19,1 cm |
| Glisser la lanterne (mode libre) / blocage avec message (mission) | ✅ | |
| Curseurs, boutons ±1 mm et ±1 cm, flèches du clavier (± 1 mm, Maj : ± 1 cm) | ✅ | 40,0 → 39,7 → 38,7 cm au clavier |
| Affichage de OA et de OA' (position de l'écran) en cm, avec virgule | ✅ | |

## 5. Mission AlexNova

| Point | Statut |
|---|---|
| Objet imposé et affiché (« x = OA = 20,0 cm 🔒 »), lanterne impossible à déplacer (curseur et glisser) | ✅ |
| Écran placé au départ à au moins 8 cm de la position de netteté | ✅ |
| Mesure fausse → message d'encouragement **sans valeur**, puis « Voir la correction » après 3 essais | ✅ |
| Mesure juste (tolérance : le plus grand de 0,5 cm et 4 % de OA') → correction complète (formule, calcul, \|γ\|, A'B', sens) | ✅ |
| Alerte si la mesure saisie ne correspond pas à la position de l'écran | ✅ |
| Faisceau lumineux masqué pendant la recherche, proposé après validation | ✅ |
| Aides 1 à 3 masquées au départ, sans formule ni valeur | ✅ |
| Nouvelle mission : tirage sans répétition, d'abord la série 15/20/30/60 puis 12,5/14/35/50 | ✅ |
| Paramètres d'URL `oa`, `ecran`, `mode`, `validation`, `aides`, `nouvelle`, `libre` | ✅ |
| Paramètre `correction=0` (aucun bouton de correction, même après 4 essais) | ✅ |
| Communication avec STACK / SCORM / Moodle | ❌ **non développée** (seulement le passage de paramètres par URL) |

## 6. Intégration et compatibilité

| Point | Statut |
|---|---|
| Fonctionne dans une iframe (`test-iframe.html`) | ✅ |
| Affichage étroit 375 × 812 (smartphone) : scène en haut, panneau en dessous | ✅ (émulation) |
| Aucune erreur dans la console | ✅ |
| Aucune ressource distante : Three.js copié dans `lib/` | ✅ |
| Firefox, Edge, postes du lycée | ⬜ non testés (WebGL 2 standard) |
| Publication réelle sur GitHub Pages et intégration dans Éléa | ⬜ à faire par l'enseignant·e (voir les notices) |

## 7. Limites connues

- Domaine du modèle : objet réel situé au‑delà de F, avec OA de 11 à 65 cm. Pour OA = 11 cm, OA' = 110 cm, hors du rail : aucune position de l'écran ne donne d'image nette, ce qui est le comportement attendu.
- Les aberrations de la lentille ne sont pas modélisées : c'est une lentille mince idéale.
- La résolution de l'écran est de 0,2 mm par pixel. Les plus petites images (0,4 cm pour OA = 60 cm) restent nettes et mesurables, mais il faut zoomer.
