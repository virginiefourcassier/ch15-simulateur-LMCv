/* ==========================================================================
   Banc optique 3D – Mission AlexNova
   Scène Three.js + formation de l'image par tracé de rayons à travers
   l'ouverture finie de la lentille (voir physique.js).
   Unités de la scène : MÈTRES. Axe optique = axe x, lentille en x = 0.
   ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from '../lib/OrbitControls.js';
import * as P from './physique.js';

/* ---------------------------------------------------------------- réglages */
const Y_AXE = 0.22;          // hauteur de l'axe optique au-dessus de la table
const RAIL_TOP = 0.05;       // dessus du rail
const RAIL_L = 1.70;         // longueur du rail (de −0,85 m à +0,85 m)
const RAIL_W = 0.07;         // largeur du rail
const ECRAN_T = 0.20;        // côté de l'écran (20 cm)
const OBJ_T = 0.06;          // côté de la zone « objet » (plaque de la lanterne)
const RES_ECRAN = 1024;      // résolution de la texture image sur l'écran
const N_RAYONS = 96;         // nombre de points de la lentille échantillonnés

/* ------------------------------------------------------------ paramètres URL */
const url = new URLSearchParams(location.search);
const num = (k) => { const v = url.get(k); if (v === null) return null; const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) ? n : null; };
const off = (k) => url.get(k) === '0' || url.get(k) === 'non';
const PARAM = {
  mode: url.get('mode') === 'libre' ? 'libre' : 'mission',
  oa: num('oa'),
  ecran: num('ecran'),
  aides: !off('aides'),
  validation: !off('validation'),
  correction: !off('correction'),
  nouvelle: !off('nouvelle'),
  libre: !off('libre'),
};

/* -------------------------------------------------------------------- état */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',');
const etat = {
  mode: PARAM.mode,
  oa: 20,          // cm
  ecran: 40,       // cm
  reperes: true,
  rayons: false,
  theorie: false,
  mission: { oa: 20, essais: 0, terminee: false, premiere: true },
};

/* ================================================================ RENDU 3D */
const conteneur = document.getElementById('viewport');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (e) {
  document.getElementById('erreur-webgl').hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
conteneur.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1922);
scene.fog = new THREE.Fog(0x1b1922, 2.6, 6);

const camera = new THREE.PerspectiveCamera(42, 1, 0.005, 20);

/* ------------------------------------------------------------ éclairage */
scene.add(new THREE.HemisphereLight(0xe8ecff, 0x3b2b1c, 0.55));
const soleil = new THREE.DirectionalLight(0xffffff, 1.5);
soleil.position.set(0.7, 1.6, 1.1);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
Object.assign(soleil.shadow.camera, { left: -1.1, right: 1.1, top: 0.8, bottom: -0.8, near: 0.5, far: 4 });
soleil.shadow.bias = -0.0004;
scene.add(soleil);
const contre = new THREE.DirectionalLight(0xb8c4ff, 0.35);
contre.position.set(-1, 0.8, -1.2);
scene.add(contre);

/* ------------------------------------------------------------ matériaux */
const M = {
  noir: new THREE.MeshStandardMaterial({ color: 0x1c1c20, metalness: 0.35, roughness: 0.42 }),
  noirMat: new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.1, roughness: 0.8 }),
  rail: new THREE.MeshStandardMaterial({ color: 0x4a4e55, metalness: 0.55, roughness: 0.38 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.9, roughness: 0.25 }),
  rouge: new THREE.MeshStandardMaterial({ color: 0xe0242b, emissive: 0x500000, roughness: 0.5 }),
  gris: new THREE.MeshStandardMaterial({ color: 0x5b5d63, metalness: 0.2, roughness: 0.6 }),
  verre: new THREE.MeshPhysicalMaterial({ color: 0xcfeaff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.38, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false }),
};
const ombre = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

/* ------------------------------------------------------- textures canvas */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texture(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// Bois de la paillasse
function textureBois() {
  const c = canvas(1024, 512), g = c.getContext('2d');
  g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * 512, a = 0.04 + Math.random() * 0.08;
    g.strokeStyle = Math.random() < 0.5 ? `rgba(60,32,14,${a})` : `rgba(190,140,90,${a})`;
    g.lineWidth = 1 + Math.random() * 3;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x / 140 + i) * 4);
    g.stroke();
  }
  const t = texture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1);
  return t;
}

// Réglette graduée du rail : 0 au centre optique O, distances positives de part et d'autre
function textureRegle() {
  const W = 8192, H = 160, c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#e7e6e1'; g.fillRect(0, 0, W, H);
  const pxm = W / RAIL_L; // pixels par mètre
  const X = (mm) => (mm / 1000 + RAIL_L / 2) * pxm;
  g.fillStyle = '#111';
  for (let mm = -850; mm <= 850; mm++) {
    const x = X(mm);
    let h = 16, w = 1.6;
    if (mm % 10 === 0) { h = 34; w = 2.4; }
    if (mm % 50 === 0) { h = 48; w = 3; }
    if (mm % 100 === 0) { h = 62; w = 3.6; }
    g.fillRect(x - w / 2, 0, w, h);
  }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = 'bold 64px Arial, sans-serif';
  for (let cm = -80; cm <= 80; cm += 10) {
    g.fillStyle = cm === 0 ? '#c4161c' : '#111';
    g.fillText(String(Math.abs(cm)), X(cm * 10), 140);
  }
  g.font = 'bold 38px Arial'; g.fillStyle = '#c4161c';
  g.fillText('O', X(0) + 34, 100);
  g.font = '28px Arial'; g.fillStyle = '#555';
  for (let cm = -75; cm <= 75; cm += 10) g.fillText(String(Math.abs(cm)), X(cm * 10), 92);
  g.fillText('cm', X(-830), 140); g.fillText('cm', X(830), 140);
  return texture(c);
}

// Quadrillage millimétré de l'écran (couleur de base, éclairée par la salle)
function textureQuadrillage() {
  const R = RES_ECRAN, c = canvas(R, R), g = c.getContext('2d');
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, R, R);
  const pxmm = R / (ECRAN_T * 1000);
  for (let i = -100; i <= 100; i++) {
    const p = R / 2 + i * pxmm;
    if (i % 10 === 0) { g.fillStyle = i === 0 ? '#9a9a9a' : '#c9c9c4'; g.fillRect(p - 1, 0, 2, R); g.fillRect(0, p - 1, R, 2); }
    else { g.fillStyle = '#e6e6e1'; g.fillRect(p - 0.5, 0, 1, R); g.fillRect(0, p - 0.5, R, 1); }
  }
  return texture(c);
}

// Objet lumineux : lettre « F » lumineuse, pied A sur l'axe, sommet B à AB = 2 cm
const OBJ_RES = 512;
const objCanvas = canvas(OBJ_RES, OBJ_RES);
(function dessinerF() {
  const g = objCanvas.getContext('2d'), s = OBJ_RES / OBJ_T, c = OBJ_RES / 2;
  g.fillStyle = '#000'; g.fillRect(0, 0, OBJ_RES, OBJ_RES);
  const H = P.AB, t = 0.18 * H;
  const rect = (u0, v0, u1, v1) => g.fillRect(c + u0 * s, c - v1 * s, (u1 - u0) * s, (v1 - v0) * s);
  g.fillStyle = '#fff2c6';
  rect(-t / 2, 0, t / 2, H);                 // barre verticale (de A à B)
  rect(-t / 2, H - t, 0.62 * H, H);          // barre du haut
  rect(-t / 2, 0.52 * H - t / 2, 0.46 * H, 0.52 * H + t / 2); // barre du milieu
})();
const objTex = texture(objCanvas);
objTex.generateMipmaps = false;
objTex.minFilter = THREE.LinearFilter;

/* ---------------------------------------------- formation de l'image (GPU) */
/* Pour chaque point Q de l'écran et chaque point p de l'ouverture de la
   lentille, on remonte le rayon (p → Q) jusqu'à l'objet :
     – tous les rayons issus d'un point objet passent par son image I ;
     – avec g = 1/OA' = 1/f' − 1/OA (vergence) :  I·g = p·g + (Q − p)/d
     – le point objet correspondant est  −OA × (I·g)   (image renversée).
   La luminance reçue en Q est la moyenne sur l'ouverture : c'est l'image
   nette si d = OA', et une image floue (taches de diamètre D|1 − d/OA'|)
   sinon. Aucune fonction de flou arbitraire n'est utilisée. */
const ouverture = [];
for (let i = 0; i < N_RAYONS; i++) {           // spirale de Vogel = échantillonnage uniforme du disque
  const r = Math.sqrt((i + 0.5) / N_RAYONS) * (P.OUVERTURE / 2), th = i * 2.399963229728653;
  ouverture.push(new THREE.Vector2(r * Math.cos(th), r * Math.sin(th)));
}
const imageRT = new THREE.WebGLRenderTarget(RES_ECRAN, RES_ECRAN, { depthBuffer: false });
const passeMat = new THREE.ShaderMaterial({
  uniforms: {
    objTex: { value: objTex }, ap: { value: ouverture },
    OA: { value: 0.2 }, d: { value: 0.2 }, g: { value: 5 }, lum: { value: 1 },
    ecranT: { value: ECRAN_T }, objT: { value: OBJ_T },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D objTex; uniform vec2 ap[${N_RAYONS}];
    uniform float OA, d, g, lum, ecranT, objT;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      // Q : point de l'écran, coordonnées (z monde, y − y_axe) en mètres
      vec2 Q = (vUv - 0.5) * ecranT;
      float a = hash(vUv * 977.0) * 6.2831853; // rotation aléatoire de l'échantillonnage (anti-crénelage)
      mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
      vec3 somme = vec3(0.0);
      for (int i = 0; i < ${N_RAYONS}; i++) {
        vec2 p = R * ap[i];
        vec2 Ig = p * g + (Q - p) / d;      // I × (1/OA')
        vec2 O = -OA * Ig;                   // point objet émetteur (z, y)
        vec2 uvo = vec2(0.5 - O.x / objT, 0.5 + O.y / objT); // u objet = −z (vu depuis l'écran)
        if (all(greaterThanEqual(uvo, vec2(0.0))) && all(lessThanEqual(uvo, vec2(1.0))))
          somme += texture2D(objTex, uvo).rgb;
      }
      gl_FragColor = vec4(somme / float(${N_RAYONS}) * lum, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const passeScene = new THREE.Scene();
passeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), passeMat));
const passeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ------------------------------------------------------------ décor */
const table = mesh(new THREE.BoxGeometry(2.3, 0.05, 0.85), new THREE.MeshStandardMaterial({ map: textureBois(), roughness: 0.75 }), 0, -0.025, 0);
table.receiveShadow = true;
scene.add(table);
const mur = mesh(new THREE.PlaneGeometry(8, 3), new THREE.MeshStandardMaterial({ color: 0x2a2733, roughness: 1 }), 0, 1, -1.4);
scene.add(mur);
const sol = mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0x24212b, roughness: 1 }), 0, -0.85, 0);
sol.rotation.x = -Math.PI / 2; scene.add(sol);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) scene.add(ombre(mesh(new THREE.BoxGeometry(0.05, 0.8, 0.05), M.gris, sx * 1.08, -0.45, sz * 0.36)));

/* ------------------------------------------------------------ rail */
const rail = new THREE.Group();
{
  const h = 0.035, y0 = RAIL_TOP - h;
  rail.add(mesh(new THREE.BoxGeometry(RAIL_L, h, RAIL_W), M.rail, 0, y0 + h / 2, 0));
  // glissières supérieures
  for (const z of [-RAIL_W / 2 + 0.006, RAIL_W / 2 - 0.006]) rail.add(mesh(new THREE.BoxGeometry(RAIL_L, 0.004, 0.012), M.chrome, 0, RAIL_TOP + 0.002, z));
  // pieds
  for (const x of [-RAIL_L / 2 + 0.06, RAIL_L / 2 - 0.06]) {
    rail.add(mesh(new THREE.BoxGeometry(0.05, y0, 0.22), M.noirMat, x, y0 / 2, 0));
    for (const z of [-0.1, 0.1]) rail.add(mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.006, 20), M.gris, x, 0.003, z));
  }
  // embouts
  for (const x of [-RAIL_L / 2 - 0.004, RAIL_L / 2 + 0.004]) rail.add(mesh(new THREE.BoxGeometry(0.008, h + 0.006, RAIL_W + 0.004), M.noirMat, x, y0 + h / 2, 0));
  ombre(rail);
  // réglette graduée sur la face avant
  const regle = mesh(new THREE.PlaneGeometry(RAIL_L, 0.028), new THREE.MeshStandardMaterial({ map: textureRegle(), roughness: 0.6 }), 0, RAIL_TOP - 0.016, RAIL_W / 2 + 0.0006);
  regle.receiveShadow = true;
  rail.add(regle);
}
scene.add(rail);

/* ---------------------------------------------- cavalier (support sur rail) */
function cavalier() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.03, RAIL_W + 0.02), M.noir, 0, RAIL_TOP + 0.015, 0));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.012, 0.006), M.noir, 0, RAIL_TOP - 0.004, -RAIL_W / 2 - 0.007)); // joue arrière
  const vis = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.018, 16), M.chrome, 0, RAIL_TOP + 0.015, -RAIL_W / 2 - 0.018);
  vis.rotation.x = Math.PI / 2; g.add(vis);
  const bouton = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 20), M.noirMat, 0, RAIL_TOP + 0.015, -RAIL_W / 2 - 0.03);
  bouton.rotation.x = Math.PI / 2; g.add(bouton);
  // index rouge (repère de position lu sur la réglette)
  const idx = mesh(new THREE.ConeGeometry(0.0045, 0.009, 3), M.rouge, 0, RAIL_TOP + 0.0045, RAIL_W / 2 + 0.006);
  idx.rotation.x = Math.PI; g.add(idx);
  g.add(mesh(new THREE.BoxGeometry(0.0012, 0.026, 0.001), M.rouge, 0, RAIL_TOP + 0.017, RAIL_W / 2 + 0.0103));
  return g;
}
function tige(x, y0, y1, r = 0.0055) {
  return mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 20), M.chrome, x, (y0 + y1) / 2, 0);
}

/* ------------------------------------------------------------ lanterne */
const lanterne = new THREE.Group();
{
  const ax = (geo) => { geo.rotateZ(Math.PI / 2); return geo; }; // cylindre orienté selon x
  lanterne.add(cavalier());
  lanterne.add(tige(-0.03, RAIL_TOP + 0.03, Y_AXE - 0.033));
  lanterne.add(mesh(ax(new THREE.CylinderGeometry(0.034, 0.034, 0.16, 40)), M.noir, -0.095, Y_AXE, 0));      // corps
  for (let i = 0; i < 5; i++) lanterne.add(mesh(ax(new THREE.CylinderGeometry(0.039, 0.039, 0.004, 40)), M.noirMat, -0.06 - i * 0.022, Y_AXE, 0)); // ailettes
  lanterne.add(mesh(ax(new THREE.CylinderGeometry(0.026, 0.03, 0.02, 32)), M.noirMat, -0.185, Y_AXE, 0));   // culot
  const bague = mesh(ax(new THREE.CylinderGeometry(0.041, 0.041, 0.016, 48, 1, true)), M.noir, -0.007, Y_AXE, 0);
  bague.material = M.noir.clone(); bague.material.side = THREE.DoubleSide; lanterne.add(bague);
  const face = mesh(new THREE.RingGeometry(0.031, 0.041, 48), M.noir, 0.001, Y_AXE, 0);
  face.rotation.y = Math.PI / 2; lanterne.add(face);
  // plaque portant l'objet lumineux (F), dans le plan x = 0 du groupe (= point A)
  const plaque = mesh(new THREE.CircleGeometry(OBJ_T / 2, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0b, emissive: 0xffffff, emissiveMap: objTex, emissiveIntensity: 2.2, roughness: 0.6 }), -0.002, Y_AXE, 0);
  plaque.rotation.y = Math.PI / 2; lanterne.add(plaque);
  // câble d'alimentation
  const cable = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.195, Y_AXE, 0), new THREE.Vector3(-0.25, Y_AXE - 0.02, -0.02),
    new THREE.Vector3(-0.28, 0.08, -0.12), new THREE.Vector3(-0.3, 0.006, -0.3), new THREE.Vector3(-0.35, 0.006, -0.42)]);
  lanterne.add(mesh(new THREE.TubeGeometry(cable, 40, 0.004, 8), M.noirMat));
  ombre(lanterne);
  lanterne.traverse((c) => { if (c.isMesh) c.userData.drag = 'lanterne'; });
}
scene.add(lanterne);
const lumLanterne = new THREE.PointLight(0xffe6b0, 0.05, 0.6, 2);
lumLanterne.position.set(0.02, Y_AXE, 0);
lanterne.add(lumLanterne);

/* ------------------------------------------------------------ lentille */
const lentille = new THREE.Group();
{
  lentille.add(cavalier());
  lentille.add(tige(0, RAIL_TOP + 0.03, Y_AXE - 0.036));
  const anneau = mesh(new THREE.TorusGeometry(0.032, 0.0045, 16, 64), M.noir, 0, Y_AXE, 0);
  anneau.rotation.y = Math.PI / 2; lentille.add(anneau);
  lentille.add(mesh(new THREE.BoxGeometry(0.012, 0.01, 0.012), M.noir, 0, Y_AXE - 0.036, 0));
  // Lentille biconvexe (REPRÉSENTATION graphique : le modèle physique reste une lentille mince en x = 0)
  const R = 0.029, pts = [];
  for (let i = 0; i <= 24; i++) { const r = (R * i) / 24; pts.push(new THREE.Vector2(r, 0.0007 + 0.0042 * (1 - (r / R) ** 2))); }
  for (let i = 24; i >= 0; i--) { const r = (R * i) / 24; pts.push(new THREE.Vector2(r, -(0.0007 + 0.0042 * (1 - (r / R) ** 2)))); }
  const verre = mesh(new THREE.LatheGeometry(pts, 64), M.verre, 0, Y_AXE, 0);
  verre.rotation.z = Math.PI / 2; verre.renderOrder = 2; lentille.add(verre);
  ombre(lentille);
  verre.castShadow = false;
}
scene.add(lentille);

/* ------------------------------------------------------------ écran */
const imageEcranMat = new THREE.MeshStandardMaterial({
  map: textureQuadrillage(), emissive: 0xffffff, emissiveMap: imageRT.texture, emissiveIntensity: 1.7, roughness: 0.92,
});
const ecran = new THREE.Group();
{
  ecran.add(cavalier());
  ecran.add(tige(0.008, RAIL_TOP + 0.03, Y_AXE - ECRAN_T / 2 - 0.008));
  ecran.add(mesh(new THREE.BoxGeometry(0.03, 0.012, 0.03), M.noir, 0.008, Y_AXE - ECRAN_T / 2 - 0.006, 0));
  const surface = mesh(new THREE.PlaneGeometry(ECRAN_T, ECRAN_T), imageEcranMat, 0, Y_AXE, 0);
  surface.rotation.y = -Math.PI / 2; // face tournée vers la lentille (−x)
  ecran.add(surface);
  ecran.add(mesh(new THREE.BoxGeometry(0.006, ECRAN_T + 0.012, ECRAN_T + 0.012), M.gris, 0.0035, Y_AXE, 0)); // dos
  const e = 0.008, L = ECRAN_T + 2 * e;
  ecran.add(mesh(new THREE.BoxGeometry(0.01, e, L), M.noir, 0.002, Y_AXE + ECRAN_T / 2 + e / 2, 0));
  ecran.add(mesh(new THREE.BoxGeometry(0.01, e, L), M.noir, 0.002, Y_AXE - ECRAN_T / 2 - e / 2, 0));
  ecran.add(mesh(new THREE.BoxGeometry(0.01, ECRAN_T, e), M.noir, 0.002, Y_AXE, ECRAN_T / 2 + e / 2));
  ecran.add(mesh(new THREE.BoxGeometry(0.01, ECRAN_T, e), M.noir, 0.002, Y_AXE, -ECRAN_T / 2 - e / 2));
  ombre(ecran);
  surface.castShadow = false;
  ecran.traverse((c) => { if (c.isMesh) c.userData.drag = 'ecran'; });
}
scene.add(ecran);

/* ------------------------------------------------------------ repères */
function etiquette(texte, couleur = '#ffffff', taille = 0.022) {
  const c = canvas(256, 128), g = c.getContext('2d');
  g.font = 'bold 84px "Comic Sans MS", "Comic Neue", Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 12; g.strokeStyle = 'rgba(20,10,30,.85)'; g.strokeText(texte, 128, 66);
  g.fillStyle = couleur; g.fillText(texte, 128, 66);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(c), depthTest: false, transparent: true }));
  s.scale.set(taille * 2, taille, 1); s.renderOrder = 10;
  return s;
}
const reperes = new THREE.Group();
{
  const axe = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.85, Y_AXE, 0), new THREE.Vector3(0.85, Y_AXE, 0)]),
    new THREE.LineDashedMaterial({ color: 0xd9c2ea, dashSize: 0.01, gapSize: 0.007, transparent: true, opacity: 0.7 }));
  axe.computeLineDistances(); reperes.add(axe);
  const point = (x, txt, col) => {
    reperes.add(mesh(new THREE.SphereGeometry(0.0025, 12, 8), new THREE.MeshBasicMaterial({ color: col }), x, Y_AXE, 0));
    const e = etiquette(txt, col); e.position.set(x, Y_AXE - 0.02, 0.0); reperes.add(e);
  };
  point(0, 'O', '#ffffff');
  point(-P.F_PRIME, 'F', '#f5d0ff');
  point(P.F_PRIME, "F'", '#f5d0ff');
  const L = etiquette("f' = 10 cm", '#cfeaff', 0.016); L.position.set(0, Y_AXE + 0.05, 0); reperes.add(L);
}
scene.add(reperes);
const etiqA = etiquette('A', '#ffe7a3'), etiqB = etiquette('B', '#ffe7a3');
reperes.add(etiqA, etiqB);

/* ------------------------------------------------------- faisceau issu de B */
const rayonsMat = new THREE.LineBasicMaterial({ color: 0xffd45a, transparent: true, opacity: 0.55, depthWrite: false });
const rayons = new THREE.LineSegments(new THREE.BufferGeometry(), rayonsMat);
rayons.renderOrder = 5;
scene.add(rayons);
function majRayons() {
  const oa = etat.oa / 100, d = etat.ecran / 100;
  const B = new THREE.Vector3(-oa, Y_AXE + P.AB, 0);
  const g = 1 / P.F_PRIME - 1 / oa;
  const pts = [];
  const lentillePts = [new THREE.Vector2(0, 0)];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; lentillePts.push(new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(P.OUVERTURE / 2)); }
  for (const p of lentillePts) {
    // p.x → z, p.y → y relatif. Direction après la lentille : I·g = p·g + (Q − p)/d avec I = image de B
    const Bp = { z: 0, y: P.AB };                       // B relatif à l'axe
    const Ig = { z: -Bp.z / oa, y: -Bp.y / oa };          // I·g = −B/OA
    const Q = { z: p.x + d * (Ig.z - p.x * g), y: p.y + d * (Ig.y - p.y * g) };
    const L = new THREE.Vector3(0, Y_AXE + p.y, p.x);
    pts.push(B, L, L, new THREE.Vector3(d, Y_AXE + Q.y, Q.z));
  }
  rayons.geometry.setFromPoints(pts);
}

/* ================================================================ CONTRÔLES */
/* ---------------------------------------------- zoom progressif (molette) */
// Le zoom de la molette d'OrbitControls est remplacé : pas fixe de 8 % par cran,
// quel que soit le navigateur, la souris ou le pavé tactile, avec un mouvement adouci,
// dirigé vers le point visé par le curseur. (Le pincement à deux doigts reste géré par OrbitControls.)
const ZOOM_PAS = 1.08;         // facteur par cran de molette (plus proche de 1 = plus fin)
const ZOOM_DOUCEUR = 0.22;     // fraction du chemin parcourue à chaque image (animation)
let zoomAnim = null;           // { dist, cible } visés
const _v = new THREE.Vector3();
function zoomer(crans, clientX = null, clientY = null) {
  anim = null;
  const cibleAct = zoomAnim ? zoomAnim.cible.clone() : controls.target.clone();
  const distAct = zoomAnim ? zoomAnim.dist : camera.position.distanceTo(controls.target);
  const facteur = Math.pow(ZOOM_PAS, crans);  // > 1 : on s'éloigne, < 1 : on s'approche
  const dist = clamp(distAct * facteur, controls.minDistance, controls.maxDistance);
  const k = 1 - dist / distAct;                // part du déplacement vers le point visé
  const cible = cibleAct.clone();
  if (clientX !== null && k > 0) {
    // point visé : intersection du rayon souris avec le plan perpendiculaire à la vue passant par la cible
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    camera.getWorldDirection(_v);
    const plan = new THREE.Plane().setFromNormalAndCoplanarPoint(_v.clone(), cibleAct);
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(plan, p)) cible.lerp(p, k);
  }
  zoomAnim = { dist, cible };
}
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  e.stopImmediatePropagation();       // empêche le zoom d'origine d'OrbitControls
  if (drag) return;
  // conversion en « crans » : 1 cran ≈ 100 px (souris), 3 lignes (Firefox) ; pavé tactile = fractions de cran
  let crans = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY : e.deltaY / 100;
  crans = clamp(crans, -2, 2);
  if (crans) zoomer(crans, e.clientX, e.clientY);
}, { capture: true, passive: false });

const controls = new OrbitControls(camera, renderer.domElement);
// (les écouteurs de glisser-déposer sont ajoutés plus bas en phase de capture)
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.screenSpacePanning = true;
controls.minDistance = 0.04;
controls.maxDistance = 3.5;
controls.maxPolarAngle = Math.PI * 0.53;
controls.zoomToCursor = false;

const VUES = {
  perspective: () => ({ pos: [0.7, 0.62, 1.15], cible: [-0.04, 0.13, 0], recul: true }),
  face: () => ({ pos: [0, Y_AXE + 0.08, 1.35], cible: [0, Y_AXE - 0.04, 0], recul: true }),
  cote: () => ({ pos: [-1.3, Y_AXE + 0.16, 0.18], cible: [0.05, Y_AXE - 0.02, 0] }),
  dessus: () => ({ pos: [0, 1.75, 0.02], cible: [0, Y_AXE - 0.05, 0], recul: true }),
  ecran: () => {
    // on vise la zone où arrive la lumière (taille ≈ AB × d/OA, connue de l'élève par l'observation) ;
    // cela n'indique pas la position de netteté.
    const d = etat.ecran / 100, h = clamp(P.AB * P.echelleSurEcran(etat.oa / 100, d), 0.006, 0.09);
    const T = new THREE.Vector3(d, Y_AXE - h / 2, 0);
    const dist = clamp(0.05 + 1.6 * h, 0.07, 0.24);
    const p = T.clone().add(new THREE.Vector3(-0.82, 0.12, 0.56).normalize().multiplyScalar(dist));
    return { pos: p.toArray(), cible: T.toArray() };
  },
};
let anim = null;
function allerVue(nom, instant = false) {
  const v = VUES[nom === 'reset' ? 'perspective' : nom]();
  document.querySelectorAll('#vues button').forEach((b) => b.classList.toggle('actif', b.dataset.vue === nom));
  const p1 = new THREE.Vector3(...v.pos), c1 = new THREE.Vector3(...v.cible);
  // fenêtre étroite (iframe, tablette en portrait) : on recule pour voir tout le banc
  if (v.recul) p1.sub(c1).multiplyScalar(clamp(1.5 / camera.aspect, 1, 1.9)).add(c1);
  if (instant) { camera.position.copy(p1); controls.target.copy(c1); controls.update(); return; }
  zoomAnim = null;
  anim = { t0: performance.now(), dur: 750, p0: camera.position.clone(), c0: controls.target.clone(), p1, c1 };
}
document.querySelectorAll('#vues button').forEach((b) => b.addEventListener('click', () => allerVue(b.dataset.vue)));
controls.addEventListener('start', () => { anim = null; zoomAnim = null;document.querySelectorAll('#vues button').forEach((b) => b.classList.remove('actif')); });

/* ----------------------------------------- glisser la lanterne ou l'écran */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickables = [];
lanterne.traverse((c) => c.isMesh && pickables.push(c));
ecran.traverse((c) => c.isMesh && pickables.push(c));
let drag = null;
function pointeur(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function cibleSous(e) {
  pointeur(e);
  const h = ray.intersectObjects(pickables, false)[0];
  return h ? { quoi: h.object.userData.drag, point: h.point } : null;
}
function planGlisse(point) {
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const n = new THREE.Vector3(0, dir.y, dir.z);
  if (n.length() < 0.15) n.set(0, 1, 0);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(n.normalize(), point);
}
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !e.isPrimary) return;
  const c = cibleSous(e);
  if (!c) return;
  if (c.quoi === 'lanterne' && lanterneBloquee()) { toast('🔒 La lanterne est bloquée pendant la mission : déplace l\'écran !'); return; }
  e.stopImmediatePropagation();
  controls.enabled = false;
  renderer.domElement.setPointerCapture(e.pointerId);
  drag = { quoi: c.quoi, plan: planGlisse(c.point), x0: c.point.x, v0: c.quoi === 'lanterne' ? etat.oa : etat.ecran, id: e.pointerId };
  renderer.domElement.style.cursor = 'grabbing';
}, { capture: true });
renderer.domElement.addEventListener('pointermove', (e) => {
  if (drag) {
    pointeur(e);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectPlane(drag.plan, p)) return;
    const dx = (p.x - drag.x0) * 100; // cm
    if (drag.quoi === 'lanterne') setOA(drag.v0 - dx); else setEcran(drag.v0 + dx);
    return;
  }
  if (e.pointerType === 'mouse' && e.buttons === 0) {
    const c = cibleSous(e);
    renderer.domElement.style.cursor = c ? (c.quoi === 'lanterne' && lanterneBloquee() ? 'not-allowed' : 'grab') : '';
  }
});
const finDrag = (e) => {
  if (!drag) return;
  try { renderer.domElement.releasePointerCapture(drag.id); } catch (_) { /* rien */ }
  drag = null; controls.enabled = true; renderer.domElement.style.cursor = '';
};
renderer.domElement.addEventListener('pointerup', finDrag);
renderer.domElement.addEventListener('pointercancel', finDrag);

// Clavier (scène sélectionnée) : flèches = écran ±1 mm, Maj + flèches = ±1 cm
conteneur.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  const pas = (e.shiftKey ? 1 : 0.1) * (e.key === 'ArrowRight' ? 1 : -1);
  setEcran(etat.ecran + pas);
});

/* ================================================================ LOGIQUE */
const $ = (id) => document.getElementById(id);
const lanterneBloquee = () => etat.mode === 'mission';

function setOA(v, force = false) {
  if (lanterneBloquee() && !force) return;
  etat.oa = Math.round(clamp(v, P.OA_MIN_CM, P.OA_MAX_CM) * 10) / 10;
  maj();
}
function setEcran(v) {
  etat.ecran = Math.round(clamp(v, P.ECRAN_MIN_CM, P.ECRAN_MAX_CM) * 10) / 10;
  maj();
}

let imageAJour = false;
function maj() {
  lanterne.position.x = -etat.oa / 100;
  ecran.position.x = etat.ecran / 100;
  etiqA.position.set(-etat.oa / 100 + 0.012, Y_AXE - 0.012, 0);
  etiqB.position.set(-etat.oa / 100 + 0.012, Y_AXE + P.AB + 0.008, 0);

  $('m-oa').textContent = fr(etat.oa) + ' cm';
  $('m-ecran').textContent = fr(etat.ecran) + ' cm';
  $('m-oa-lock').hidden = !lanterneBloquee();
  for (const id of ['sl-ecran-m', 'sl-ecran-l']) $(id).value = etat.ecran;
  $('sl-oa').value = etat.oa;

  reperes.visible = etat.reperes;
  const rayonsAutorises = etat.mode === 'libre' || etat.mission.terminee;
  rayons.visible = etat.rayons && rayonsAutorises;
  if (rayons.visible) majRayons();
  majTheorie();
  imageAJour = false;
}

function calculerImage() {
  const oa = etat.oa / 100, d = etat.ecran / 100;
  const k = P.echelleSurEcran(oa, d);
  const u = passeMat.uniforms;
  u.OA.value = oa; u.d.value = d; u.g.value = 1 / P.F_PRIME - 1 / oa;
  // éclairement ∝ 1/k² (le flux se répartit sur une surface k² fois plus grande), borné pour rester visible
  u.lum.value = clamp(1 / (k * k), 0.3, 1);
  renderer.setRenderTarget(imageRT);
  renderer.render(passeScene, passeCam);
  renderer.setRenderTarget(null);
  imageAJour = true;
}

function majTheorie() {
  const bloc = $('theorie');
  bloc.hidden = !(etat.mode === 'libre' && etat.theorie);
  if (bloc.hidden) return;
  const oa = etat.oa / 100, d = etat.ecran / 100;
  const oap = P.distanceImage(oa), gam = P.grandissement(oa), tache = P.diametreTache(oa, d) * 1000;
  bloc.innerHTML =
    `Image nette attendue à <b>OA' = ${fr(oap * 100)} cm</b><br>` +
    `|γ| = OA'/OA = <b>${fr(gam, 2)}</b> · A'B' = <b>${fr(gam * P.AB * 100, 2)} cm</b><br>` +
    `Image ${gam > 1.005 ? 'agrandie' : gam < 0.995 ? 'réduite' : 'de même taille'}, renversée.<br>` +
    `<span style="color:#6b6175">Tache de flou actuelle sur l'écran : ${fr(tache, 1)} mm</span>`;
}

/* ------------------------------------------------------------ mission */
function texteBulle(html) { $('bulle-texte').innerHTML = html; }
function retour(classe, html) { const r = $('retour'); r.className = classe; r.innerHTML = html; }

function nouvelleMission(oaImpose = null) {
  const m = etat.mission;
  let oa = oaImpose;
  if (oa === null) {
    // tirage « sans remise » : la série simple (15, 20, 30, 60 cm) d'abord, puis les autres, sans répétition
    if (!m.sac || m.sac.length === 0) {
      const melange = (t) => t.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      m.sac = m.premiere ? [...melange(P.POSITIONS_MISSION_CM.slice(0, 4)), ...melange(P.POSITIONS_MISSION_CM.slice(4))]
        : melange(P.POSITIONS_MISSION_CM.filter((v) => v !== m.oa));
    }
    oa = m.sac.shift();
  }
  m.oa = clamp(oa, P.OA_MIN_CM, P.OA_MAX_CM);
  m.premiere = false; m.essais = 0; m.terminee = false;
  etat.oa = m.oa;
  // position de départ de l'écran : loin de la position de netteté
  const cible = P.distanceImage(m.oa / 100) * 100;
  let s;
  if (PARAM.ecran !== null && oaImpose !== null) s = PARAM.ecran;
  else { do { s = 8 + Math.random() * 62; } while (Math.abs(s - cible) < 8); }
  $('mi-oa').textContent = fr(m.oa);
  $('in-mesure').value = '';
  $('btn-correction').hidden = true;
  retour('', '');
  texteBulle('Salut ! 👋 Pour photographier la voiture, je dois savoir où se forme une image <b>nette</b>. La lanterne est bloquée à <b>' + fr(m.oa) + ' cm</b> de la lentille : à toi de trouver la bonne place pour l\'écran !');
  setEcran(s);
}

function explication(mesure) {
  const oa = etat.mission.oa, oap = P.distanceImage(oa / 100) * 100, gam = oap / oa;
  const taille = gam > 1.005 ? 'plus grande que l\'objet' : gam < 0.995 ? 'plus petite que l\'objet' : 'de même taille que l\'objet';
  return `<div class="calc">1/f' = 1/OA + 1/OA'
OA' = f' × OA / (OA − f')
OA' = 10,0 × ${fr(oa)} / (${fr(oa)} − 10,0) = ${fr(oap)} cm

|γ| = OA'/OA = ${fr(oap)} / ${fr(oa)} = ${fr(gam, 2)}
A'B' = |γ| × AB = ${fr(gam, 2)} × 2,0 = ${fr(gam * 2, 2)} cm</div>
L'image est <b>réelle</b>, <b>renversée</b> et ${taille}.` +
    (mesure !== null ? `<br>Ta mesure : ${fr(mesure)} cm → écart de ${fr(Math.abs(mesure - oap))} cm.` : '') +
    `<br><button id="btn-faisceau" class="primaire" style="margin-top:6px">✨ Voir le faisceau lumineux</button>`;
}

function valider() {
  const m = etat.mission;
  const brut = $('in-mesure').value.trim().replace(',', '.');
  const v = parseFloat(brut);
  if (!/^\d+(\.\d+)?$/.test(brut) || !Number.isFinite(v)) { retour('info', 'Écris ta mesure en centimètres, par exemple <b>18,5</b>.'); return; }
  const oap = P.distanceImage(m.oa / 100) * 100;
  const tol = Math.max(0.5, 0.04 * oap);
  const ecart = Math.abs(v - etat.ecran) > 1 ? `<br><i>Attention : ta mesure ne correspond pas à la position actuelle de l'écran (${fr(etat.ecran)} cm).</i>` : '';
  m.essais++;
  if (Math.abs(v - oap) <= tol) {
    m.terminee = true;
    retour('ok', `<h3>Bravo ! 🎉 L'image est nette pour OA' ≈ ${fr(v)} cm.</h3>` + explication(v));
    texteBulle(`Génial ! 🤩 Avec l'objet à ${fr(m.oa)} cm, l'image nette se forme à ${fr(oap)} cm de la lentille. Mon capteur photo devra être placé comme ton écran ! 📸 <span style="color:#3897f0">#netteté #optique</span>`);
    $('btn-correction').hidden = true;
    lierFaisceau();
  } else {
    const msgs = [
      'Pas encore 🙂. Ton image est-elle vraiment nette ? Déplace l\'écran de part et d\'autre, millimètre par millimètre.',
      'Toujours pas… Place-toi « Face à l\'écran » et observe les contours du F. Ouvre l\'aide 2 si besoin.',
      'Courage ! Cherche la position où les bords du F sont les plus fins, puis relis bien la distance lentille–écran.',
    ];
    retour('ko', msgs[Math.min(m.essais - 1, msgs.length - 1)] + ecart);
    if (m.essais >= 3 && PARAM.correction) $('btn-correction').hidden = false;
  }
  maj();
}

function lierFaisceau() {
  const b = $('btn-faisceau');
  if (b) b.addEventListener('click', () => { etat.rayons = true; $('cb-rayons').checked = true; maj(); allerVue('perspective'); });
}

/* ------------------------------------------------------------ onglets */
function changerMode(mode) {
  etat.mode = mode;
  $('tab-mission').setAttribute('aria-selected', mode === 'mission');
  $('tab-libre').setAttribute('aria-selected', mode === 'libre');
  $('pane-mission').hidden = mode !== 'mission';
  $('pane-libre').hidden = mode !== 'libre';
  if (mode === 'mission') { etat.oa = etat.mission.oa; if (!etat.mission.terminee) etat.rayons = false; $('cb-rayons').checked = etat.rayons; }
  maj();
}
$('tab-mission').addEventListener('click', () => changerMode('mission'));
$('tab-libre').addEventListener('click', () => changerMode('libre'));

/* ------------------------------------------------------------ widgets */
$('sl-oa').addEventListener('input', (e) => setOA(parseFloat(e.target.value)));
for (const id of ['sl-ecran-m', 'sl-ecran-l']) $(id).addEventListener('input', (e) => setEcran(parseFloat(e.target.value)));
document.querySelectorAll('.fins button').forEach((b) => b.addEventListener('click', () => setEcran(etat.ecran + parseFloat(b.dataset.dx))));
$('cb-reperes').addEventListener('change', (e) => { etat.reperes = e.target.checked; maj(); });
$('cb-rayons').addEventListener('change', (e) => { etat.rayons = e.target.checked; maj(); });
$('cb-theorie').addEventListener('change', (e) => { etat.theorie = e.target.checked; maj(); });
$('btn-valider').addEventListener('click', valider);
$('in-mesure').addEventListener('keydown', (e) => { if (e.key === 'Enter') valider(); });
$('btn-nouvelle').addEventListener('click', () => nouvelleMission());
$('btn-correction').addEventListener('click', () => {
  etat.mission.terminee = true;
  retour('info', '<h3>Correction</h3>' + explication(null));
  $('btn-correction').hidden = true;
  lierFaisceau(); maj();
});
// boutons + / − : un cran à chaque clic, répétition si on maintient le bouton appuyé
for (const [id, crans] of [['btn-zoom-plus', -1], ['btn-zoom-moins', 1]]) {
  let rep = null;
  const stop = () => { clearInterval(rep); rep = null; };
  $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); zoomer(crans); stop(); rep = setInterval(() => zoomer(crans * 0.5), 90); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) $(id).addEventListener(ev, stop);
  $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomer(crans); } });
}
$('btn-plein-ecran').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.getElementById('app').requestFullscreen?.().catch(() => toast('Plein écran indisponible ici.'));
});

let toastTimer;
function toast(txt) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    Object.assign(t.style, { position: 'absolute', left: '50%', top: '56px', transform: 'translateX(-50%)', background: '#6a1b9a', color: '#fff', padding: '8px 14px', borderRadius: '12px', fontSize: '14px', zIndex: 5, boxShadow: '0 3px 12px rgba(0,0,0,.4)', maxWidth: '90%', textAlign: 'center' });
    document.getElementById('scene-zone').appendChild(t);
  }
  t.textContent = txt; t.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.style.display = 'none'), 2600);
}

/* ------------------------------------------------- options URL / démarrage */
if (!PARAM.aides) document.querySelector('.aides').hidden = true;
if (!PARAM.validation) { document.querySelector('.saisie').hidden = true; document.querySelector('.consigne ol li:last-child').hidden = true; }
if (!PARAM.nouvelle) $('btn-nouvelle').hidden = true;
if (!PARAM.libre) $('tab-libre').hidden = true;

/* ------------------------------------------------------------ boucle */
function redimensionner() {
  const w = conteneur.clientWidth, h = conteneur.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(redimensionner).observe(conteneur);
redimensionner();

function boucle(t) {
  if (zoomAnim) {
    const dir = _v.subVectors(camera.position, controls.target).normalize();
    controls.target.lerp(zoomAnim.cible, ZOOM_DOUCEUR);
    const d0 = camera.position.distanceTo(controls.target);
    const d = d0 + (zoomAnim.dist - d0) * ZOOM_DOUCEUR;
    camera.position.copy(controls.target).addScaledVector(dir, d);
    if (Math.abs(d - zoomAnim.dist) < 1e-4 && controls.target.distanceTo(zoomAnim.cible) < 1e-4) zoomAnim = null;
  }
  if (anim) {
    const k = clamp((t - anim.t0) / anim.dur, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    camera.position.lerpVectors(anim.p0, anim.p1, e);
    controls.target.lerpVectors(anim.c0, anim.c1, e);
    if (k >= 1) anim = null;
  }
  controls.update();
  // les repères trop proches de la caméra (vue rapprochée) sont masqués pour ne pas gêner l'observation
  if (reperes.visible) for (const c of reperes.children) if (!c.isLine) c.visible = c.position.distanceTo(camera.position) > 0.09;
  if (!imageAJour) calculerImage();
  renderer.render(scene, camera);
  requestAnimationFrame(boucle);
}

// démarrage
if (PARAM.oa !== null) etat.mission.premiere = false;
nouvelleMission(PARAM.oa !== null ? PARAM.oa : null);
if (PARAM.mode === 'libre') {
  if (PARAM.oa !== null) etat.oa = clamp(PARAM.oa, P.OA_MIN_CM, P.OA_MAX_CM);
  changerMode('libre');
  if (PARAM.ecran !== null) setEcran(PARAM.ecran);
} else changerMode('mission');
allerVue('perspective', true);
requestAnimationFrame(boucle);

// Accès de test (console) — n'expose aucune réponse à l'élève dans l'interface
// mesurerImage() analyse l'image réellement calculée sur l'écran (texture GPU) :
//   hauteur = étendue verticale de la zone éclairée (cm), bord = largeur de la transition 10 %–90 % (mm)
function mesurerImage() {
  calculerImage();
  const R = RES_ECRAN, px = new Uint8Array(R * R * 4);
  renderer.readRenderTargetPixels(imageRT, 0, 0, R, R, px);
  const lum = (x, y) => px[(y * R + x) * 4];
  let max = 0; for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i]);
  const seuil = max * 0.5; let yMin = R, yMax = -1;
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) if (lum(x, y) > seuil) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); }
  // profil vertical moyen le long de la barre du F (colonne centrale ± 2 px), bord côté axe (haut de l'image renversée)
  const col = R / 2; let prof = [];
  for (let y = 0; y < R; y++) { let s = 0; for (let dx = -2; dx <= 2; dx++) s += lum(col + dx, y); prof.push(s / 5); }
  const pm = Math.max(...prof); let y10 = -1, y90 = -1;
  for (let y = R - 1; y >= 0; y--) { if (y10 < 0 && prof[y] > 0.1 * pm) y10 = y; if (y90 < 0 && prof[y] > 0.9 * pm) { y90 = y; break; } }
  const mmpx = ECRAN_T * 1000 / R;
  // indice de netteté : énergie des gradients / flux total (maximal quand l'image est nette)
  let G = 0, S = 0;
  for (let y = 0; y < R - 1; y++) for (let x = 0; x < R - 1; x++) {
    const v = lum(x, y), a = lum(x + 1, y) - v, b = lum(x, y + 1) - v; G += a * a + b * b; S += v;
  }
  return { nettete: S ? +(G / S).toFixed(3) : 0, hauteur_cm: +(((yMax - yMin + 1) * mmpx) / 10).toFixed(2), bord_mm: +((y10 - y90) * mmpx).toFixed(2), haut_image_px: yMax, axe_px: R / 2 };
}
window.__banc = { etat, setOA: (v) => setOA(v, true), setEcran, allerVue, mesurerImage, P, dist: () => camera.position.distanceTo(controls.target) };
