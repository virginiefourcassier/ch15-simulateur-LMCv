/* ==========================================================================
   Modèle physique — lentille mince convergente (programme de seconde)
   Toutes les distances sont en MÈTRES dans ce module.
   Convention du cours : OA, OA', AB, A'B' sont des distances POSITIVES
   (objet réel, image réelle).
   ========================================================================== */

/** Distance focale imposée f' = 10,0 cm (non modifiable par l'élève). */
export const F_PRIME = 0.100;

/** Taille de l'objet lumineux AB (lettre « F » de la lanterne). */
export const AB = 0.020;

/** Diamètre utile (ouverture) de la lentille : 4,0 cm. */
export const OUVERTURE = 0.040;

/**
 * Relation de conjugaison (distances positives, objet réel au-delà de F) :
 *   1/f' = 1/OA + 1/OA'   =>   OA' = f' × OA / (OA − f')
 * Renvoie Infinity si l'objet est au foyer ou en deçà (pas d'image réelle).
 */
export function distanceImage(oa, f = F_PRIME) {
  if (oa <= f) return Infinity;
  return (f * oa) / (oa - f);
}

/** Valeur absolue du grandissement |γ| = A'B'/AB = OA'/OA. */
export function grandissement(oa, f = F_PRIME) {
  return distanceImage(oa, f) / oa;
}

/** Taille de l'image nette A'B' = |γ| × AB. */
export function tailleImage(oa, ab = AB, f = F_PRIME) {
  return grandissement(oa, f) * ab;
}

/**
 * Diamètre de la tache lumineuse produite SUR L'ÉCRAN par un point objet.
 *
 * Les rayons issus d'un point de l'objet traversent toute l'ouverture
 * (diamètre D) de la lentille puis convergent vers le point image situé à
 * OA'. Ils forment un cône. L'écran, placé à la distance d de la lentille,
 * coupe ce cône selon un disque de diamètre :
 *        δ = D × | 1 − d / OA' |       (théorème de Thalès)
 * Écrit sous la forme D × | 1 − d (1/f' − 1/OA) |, la formule reste valable
 * même si OA ≤ f' (faisceau parallèle ou divergent après la lentille).
 *   - d = OA'  → δ = 0 : image nette ;
 *   - plus l'écran s'éloigne de OA', plus δ grandit : image floue.
 */
export function diametreTache(oa, d, D = OUVERTURE, f = F_PRIME) {
  return D * Math.abs(1 - d * (1 / f - 1 / oa));
}

/**
 * Facteur d'échelle de l'image SUR L'ÉCRAN (centre des taches lumineuses).
 * Le rayon qui passe par le centre optique O n'est pas dévié : le centre de
 * la tache correspondant au point B se trouve donc à une distance
 * AB × d / OA de l'axe, de l'autre côté (image renversée).
 * Quand d = OA', on retrouve |γ| = OA'/OA.
 */
export function echelleSurEcran(oa, d) {
  return d / oa;
}

/**
 * Positions imposées pour la mission (en cm), choisies pour que OA' soit
 * simple à exploiter avec f' = 10,0 cm. Vérification :
 *   OA = 15   → OA' = 10×15/5    = 30,0 cm
 *   OA = 20   → OA' = 10×20/10   = 20,0 cm
 *   OA = 30   → OA' = 10×30/20   = 15,0 cm
 *   OA = 60   → OA' = 10×60/50   = 12,0 cm
 *   OA = 12,5 → OA' = 10×12,5/2,5 = 50,0 cm
 *   OA = 14   → OA' = 10×14/4    = 35,0 cm
 *   OA = 35   → OA' = 10×35/25   = 14,0 cm
 *   OA = 50   → OA' = 10×50/40   = 12,5 cm
 */
export const POSITIONS_MISSION_CM = [15, 20, 30, 60, 12.5, 14, 35, 50];

/** Bornes de déplacement (cm). */
export const OA_MIN_CM = 11;
export const OA_MAX_CM = 65;
export const ECRAN_MIN_CM = 5;
export const ECRAN_MAX_CM = 75;
