import type { Media } from '@/types';

/**
 * Mídia de demonstração.
 * As imagens são ilustrações SVG geradas aqui mesmo (sem depender de servidores externos,
 * logo nunca aparecem quebradas). Os vídeos ficam em public/media.
 * Com o backend, basta que `Media.url` aponte para os arquivos reais.
 */

function svgUri(width: number, height: number, body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="system-ui,-apple-system,Segoe UI,sans-serif">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Gerador pseudoaleatório determinístico: as cenas saem sempre iguais. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function stars(width: number, height: number, count: number, seed: number): string {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    out += `<circle cx="${(r() * width).toFixed(0)}" cy="${(r() * height).toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.25 + r() * 0.65).toFixed(2)}"/>`;
  }
  return out;
}

function windows(x: number, y: number, cols: number, rows: number, w: number, h: number, gap: number, seed: number, litRatio = 0.55): string {
  const r = rng(seed);
  let out = '';
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const lit = r() < litRatio;
      const warm = r() < 0.7;
      const fill = lit ? (warm ? '#ffd98a' : '#bcd4ff') : '#1c2748';
      out += `<rect x="${x + col * (w + gap)}" y="${y + row * (h + gap)}" width="${w}" height="${h}" rx="3" fill="${fill}" opacity="${lit ? (0.75 + r() * 0.25).toFixed(2) : 1}"/>`;
    }
  }
  return out;
}

function tree(x: number, base: number, size: number, fill: string): string {
  return `<rect x="${x - size * 0.06}" y="${base - size * 0.5}" width="${size * 0.12}" height="${size * 0.5}" fill="${fill}"/><circle cx="${x}" cy="${base - size * 0.72}" r="${size * 0.42}" fill="${fill}"/><circle cx="${x - size * 0.3}" cy="${base - size * 0.52}" r="${size * 0.3}" fill="${fill}"/><circle cx="${x + size * 0.3}" cy="${base - size * 0.5}" r="${size * 0.32}" fill="${fill}"/>`;
}

const campusNight = svgUri(
  1200,
  750,
  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a1a"/><stop offset="0.7" stop-color="#1a2f63"/><stop offset="1" stop-color="#2c4f96"/></linearGradient><radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="750" fill="url(#sky)"/>${stars(1200, 380, 90, 7)}
  <circle cx="980" cy="130" r="46" fill="#eef3ff"/><circle cx="962" cy="118" r="46" fill="#111634" opacity="0.92"/>
  <rect x="120" y="330" width="330" height="300" fill="#141b3a"/><rect x="450" y="250" width="380" height="380" fill="#19224a"/><rect x="830" y="360" width="260" height="270" fill="#141b3a"/>
  <rect x="450" y="238" width="380" height="14" fill="#2a3b78"/><rect x="120" y="320" width="330" height="12" fill="#243468"/><rect x="830" y="350" width="260" height="12" fill="#243468"/>
  ${windows(150, 362, 6, 5, 34, 38, 14, 11)}${windows(482, 290, 7, 5, 34, 44, 14, 23, 0.7)}${windows(858, 392, 5, 4, 34, 38, 12, 5, 0.45)}
  <rect x="582" y="540" width="116" height="90" rx="4" fill="#ffd98a"/><rect x="636" y="540" width="6" height="90" fill="#19224a"/>
  <rect x="560" y="198" width="160" height="44" rx="8" fill="#244b8f"/><text x="640" y="230" text-anchor="middle" font-size="30" font-weight="800" fill="#fff" letter-spacing="4">UBM</text>
  <ellipse cx="640" cy="640" rx="260" ry="46" fill="url(#glow)"/>
  <rect y="630" width="1200" height="120" fill="#0d0c1c"/><path d="M560 750 L610 630 L670 630 L720 750Z" fill="#1b2347"/>
  ${tree(70, 640, 190, '#0b1126')}${tree(1130, 640, 210, '#0b1126')}${tree(330, 640, 110, '#0e1530')}${tree(900, 640, 120, '#0e1530')}
  <g fill="#ffd98a"><circle cx="500" cy="660" r="5"/><circle cx="780" cy="660" r="5"/><circle cx="440" cy="700" r="5"/><circle cx="840" cy="700" r="5"/></g>`,
);

const campusSunset = svgUri(
  1200,
  800,
  `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242a66"/><stop offset="0.45" stop-color="#8a4d86"/><stop offset="0.75" stop-color="#e9825f"/><stop offset="1" stop-color="#f8c377"/></linearGradient></defs>
  <rect width="1200" height="800" fill="url(#s)"/><circle cx="600" cy="560" r="120" fill="#ffe2a6" opacity="0.95"/>
  <g fill="#2a2459" opacity="0.5"><ellipse cx="260" cy="210" rx="190" ry="26"/><ellipse cx="880" cy="150" rx="230" ry="22"/><ellipse cx="700" cy="300" rx="150" ry="16"/></g>
  <g fill="#17122e"><rect x="0" y="600" width="1200" height="200"/><rect x="140" y="430" width="280" height="190"/><rect x="420" y="490" width="200" height="130"/><rect x="760" y="400" width="300" height="220"/><rect x="820" y="350" width="120" height="60"/></g>
  ${windows(165, 455, 6, 3, 26, 30, 14, 3, 0.35)}${windows(785, 428, 6, 4, 28, 30, 16, 9, 0.3)}
  ${tree(660, 620, 200, '#120e25')}${tree(80, 620, 150, '#120e25')}${tree(1130, 620, 170, '#120e25')}
  <g stroke="#17122e" stroke-width="3" fill="none" stroke-linecap="round"><path d="M300 250q12-12 24 0q12-12 24 0"/><path d="M380 300q9-9 18 0q9-9 18 0"/><path d="M930 240q10-10 20 0q10-10 20 0"/></g>`,
);

const blueprint = svgUri(
  1200,
  900,
  `<defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" stroke-opacity="0.09"/></pattern></defs>
  <rect width="1200" height="900" fill="#1a3769"/><rect width="1200" height="900" fill="url(#g)"/>
  <g fill="none" stroke="#eaf1ff" stroke-width="5" stroke-linejoin="round"><rect x="160" y="160" width="880" height="520"/><path d="M160 420H520M520 160V330M520 420V680M760 160V470M760 560V680M760 470H1040"/></g>
  <g fill="none" stroke="#aec6f1" stroke-width="3"><path d="M520 330A90 90 0 0 1 610 420" stroke-dasharray="8 8"/><path d="M760 470A90 90 0 0 0 850 560" stroke-dasharray="8 8"/><circle cx="330" cy="290" r="62"/><circle cx="330" cy="290" r="8"/><rect x="230" y="500" width="200" height="110" rx="6"/><rect x="820" y="230" width="150" height="150" rx="75"/><path d="M590 520h110v110H590z"/></g>
  <g fill="#eaf1ff" font-size="24" font-weight="600"><text x="250" y="210">Auditório</text><text x="235" y="470">Sala de estudos</text><text x="565" y="210">Hall</text><text x="812" y="210">Café</text><text x="820" y="640">Acervo</text></g>
  <g stroke="#aec6f1" stroke-width="2"><path d="M160 740H1040M160 725V755M1040 725V755"/></g><text x="600" y="780" text-anchor="middle" fill="#aec6f1" font-size="22">22,00 m</text>
  <rect x="820" y="790" width="300" height="70" fill="none" stroke="#eaf1ff" stroke-width="3"/><text x="840" y="820" fill="#eaf1ff" font-size="20" font-weight="700">Centro de Convivência</text><text x="840" y="846" fill="#aec6f1" font-size="17">Estudo 03 — Projeto V</text>`,
);

const court = svgUri(
  1200,
  800,
  `<rect width="1200" height="800" fill="#0f1d3d"/><rect x="90" y="80" width="1020" height="640" rx="10" fill="#1f417c"/>
  <g fill="none" stroke="#eaf1ff" stroke-width="6"><rect x="130" y="120" width="940" height="560"/><path d="M600 120V680"/><circle cx="600" cy="400" r="92"/><path d="M130 280a120 120 0 0 1 0 240M1070 280a120 120 0 0 0 0 240"/></g>
  <circle cx="600" cy="400" r="8" fill="#eaf1ff"/><g fill="#eaf1ff"><rect x="112" y="345" width="18" height="110"/><rect x="1070" y="345" width="18" height="110"/></g>
  <g fill="#ffd98a" stroke="#0f1d3d" stroke-width="4"><circle cx="300" cy="300" r="22"/><circle cx="420" cy="500" r="22"/><circle cx="520" cy="350" r="22"/><circle cx="250" cy="430" r="22"/><circle cx="170" cy="400" r="22"/></g>
  <g fill="#ff8fa6" stroke="#0f1d3d" stroke-width="4"><circle cx="760" cy="290" r="22"/><circle cx="880" cy="470" r="22"/><circle cx="690" cy="520" r="22"/><circle cx="960" cy="330" r="22"/><circle cx="1030" cy="400" r="22"/></g>
  <circle cx="556" cy="372" r="11" fill="#fff"/><path d="M520 350q60 -70 160 -30" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 9" opacity="0.7"/>`,
);

function codeLines(): string {
  const r = rng(42);
  const colors = ['#82a8e8', '#ffd98a', '#ff8fa6', '#9fe3c1', '#d9d4f5'];
  let out = '';
  for (let line = 0; line < 15; line += 1) {
    const y = 170 + line * 34;
    const indent = [0, 1, 2, 2, 3, 2, 1, 1, 2, 3, 3, 2, 1, 0, 0][line] * 34;
    out += `<text x="70" y="${y + 12}" fill="#5b5a85" font-size="18" font-family="ui-monospace,monospace" text-anchor="end">${line + 1}</text>`;
    let x = 100 + indent;
    const parts = 1 + Math.floor(r() * 4);
    for (let p = 0; p < parts; p += 1) {
      const w = 40 + r() * 130;
      out += `<rect x="${x.toFixed(0)}" y="${y}" width="${w.toFixed(0)}" height="14" rx="7" fill="${colors[Math.floor(r() * colors.length)]}" opacity="0.9"/>`;
      x += w + 14;
    }
  }
  return out;
}

const codeEditor = svgUri(
  1200,
  800,
  `<rect width="1200" height="800" fill="#17152d"/><rect x="30" y="30" width="1140" height="740" rx="22" fill="#0f0d1d" stroke="#2d2a52" stroke-width="2"/>
  <g><circle cx="70" cy="72" r="9" fill="#ff7272"/><circle cx="100" cy="72" r="9" fill="#f2b84b"/><circle cx="130" cy="72" r="9" fill="#3fd69b"/></g>
  <rect x="180" y="52" width="230" height="40" rx="10" fill="#1e1b3a"/><text x="200" y="79" fill="#b4b2cf" font-size="19" font-family="ui-monospace,monospace">CaronaService.java</text>
  <path d="M30 112H1170" stroke="#2d2a52" stroke-width="2"/>${codeLines()}
  <rect x="760" y="140" width="380" height="600" rx="16" fill="#131126" stroke="#2d2a52" stroke-width="2"/>
  <text x="790" y="190" fill="#8a87ad" font-size="19" font-family="ui-monospace,monospace">$ mvn test</text>
  <g font-family="ui-monospace,monospace" font-size="19"><text x="790" y="240" fill="#3fd69b">✓ cria carona</text><text x="790" y="276" fill="#3fd69b">✓ calcula rota</text><text x="790" y="312" fill="#3fd69b">✓ divide o custo</text><text x="790" y="348" fill="#3fd69b">✓ avisa passageiros</text><text x="790" y="404" fill="#fff" font-weight="700">12 testes, 0 falhas</text><text x="790" y="440" fill="#8a87ad">BUILD SUCCESS  3.2 s</text></g>
  <rect x="790" y="470" width="12" height="24" fill="#82a8e8"/>`,
);

const lab = svgUri(
  1200,
  900,
  `<rect width="1200" height="900" fill="#e8edf7"/><rect y="640" width="1200" height="260" fill="#d5ddee"/>
  ${[
    [300, 330, 190, 3],
    [720, 300, 210, 8],
    [960, 600, 150, 13],
    [470, 640, 170, 21],
  ]
    .map(([cx, cy, radius, seed]) => {
      const r = rng(seed);
      let dots = '';
      for (let i = 0; i < 26; i += 1) {
        const angle = r() * Math.PI * 2;
        const dist = Math.sqrt(r()) * radius * 0.78;
        dots += `<circle cx="${(cx + Math.cos(angle) * dist).toFixed(0)}" cy="${(cy + Math.sin(angle) * dist).toFixed(0)}" r="${(5 + r() * 15).toFixed(0)}" fill="${r() < 0.5 ? '#244b8f' : '#7a5fc0'}" opacity="${(0.45 + r() * 0.5).toFixed(2)}"/>`;
      }
      return `<circle cx="${cx}" cy="${cy + 10}" r="${radius + 8}" fill="#b9c4dd"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="#f6e9c9" stroke="#fff" stroke-width="12"/>${dots}`;
    })
    .join('')}
  <rect x="120" y="96" width="210" height="46" rx="8" fill="#fff"/><text x="140" y="127" fill="#244b8f" font-size="22" font-weight="700">Amostra 14 — 48 h</text>
  <rect x="870" y="110" width="250" height="46" rx="8" fill="#fff"/><text x="890" y="141" fill="#244b8f" font-size="22" font-weight="700">Ágar sangue, 37 °C</text>`,
);

const desk = svgUri(
  1200,
  900,
  `<rect width="1200" height="900" fill="#2a2140"/><rect width="1200" height="900" fill="#3a2d52" opacity="0.5"/>
  <g transform="rotate(-6 420 470)"><rect x="170" y="190" width="520" height="620" rx="10" fill="#f4f1ea"/><rect x="170" y="190" width="40" height="620" fill="#244b8f"/><g stroke="#c9c4d8" stroke-width="2">${Array.from({ length: 14 }, (_, i) => `<path d="M240 ${260 + i * 38}H650"/>`).join('')}</g>
  <g stroke="#244b8f" stroke-width="5" stroke-linecap="round" fill="none"><path d="M250 250h210"/><path d="M250 292q40-20 80 0t80 0t80 0"/><path d="M250 330h300M250 368h240M250 444h330M250 482h180"/></g><rect x="250" y="396" width="230" height="26" fill="#ffd98a" opacity="0.7"/></g>
  <circle cx="930" cy="250" r="130" fill="#1b1730" opacity="0.5"/><circle cx="920" cy="240" r="120" fill="#f4f1ea"/><circle cx="920" cy="240" r="88" fill="#5a3a2a"/><circle cx="920" cy="240" r="88" fill="none" stroke="#6f4a36" stroke-width="10"/><path d="M1030 240h50a26 26 0 0 1 0 52h-40" fill="none" stroke="#f4f1ea" stroke-width="22"/>
  <g transform="rotate(8 930 640)"><rect x="800" y="520" width="240" height="240" fill="#ffd98a"/><text x="825" y="590" font-size="30" font-weight="700" fill="#3a2d52">P2 de Cálculo</text><text x="825" y="635" font-size="26" fill="#3a2d52">quinta, 19h</text><text x="825" y="700" font-size="26" fill="#3a2d52">sala 204 ✦</text></g>
  <g transform="rotate(34 700 760)"><rect x="560" y="745" width="330" height="20" rx="10" fill="#82a8e8"/><path d="M890 745l34 10l-34 10z" fill="#f4f1ea"/></g>`,
);

const poster = svgUri(
  1000,
  1000,
  `<rect width="1000" height="1000" fill="#244b8f"/><circle cx="830" cy="160" r="300" fill="#1a3769"/><circle cx="120" cy="930" r="210" fill="#2f5dae"/>
  <g fill="none" stroke="#aec6f1" stroke-width="3" opacity="0.7"><path d="M110 270L360 400L250 480L610 330L880 470"/></g>
  <g fill="#fff"><circle cx="110" cy="270" r="15"/><circle cx="360" cy="400" r="15"/><circle cx="250" cy="480" r="15"/><circle cx="610" cy="330" r="15"/><circle cx="880" cy="470" r="15"/></g>
  <text x="80" y="150" fill="#aec6f1" font-size="40" font-weight="600">UBM apresenta</text>
  <text x="74" y="640" fill="#fff" font-size="150" font-weight="800" letter-spacing="-5">Semana</text><text x="74" y="780" fill="#fff" font-size="150" font-weight="800" letter-spacing="-5">Acadêmica</text>
  <text x="80" y="860" fill="#ffd98a" font-size="54" font-weight="700">18 a 22 de novembro</text>
  <text x="80" y="915" fill="#dbe6f9" font-size="31">Palestras, oficinas e mostra de projetos de todos os cursos</text>`,
);

const hackathon = svgUri(
  1200,
  750,
  `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#82a8e8" stop-opacity="0.5"/><stop offset="1" stop-color="#82a8e8" stop-opacity="0"/></linearGradient></defs>
  <rect width="1200" height="750" fill="#0b0a16"/><path d="M180 0L60 520H300Z" fill="url(#b)" opacity="0.5"/><path d="M1020 0L900 520H1140Z" fill="url(#b)" opacity="0.5"/><path d="M600 0L470 420H730Z" fill="url(#b)" opacity="0.35"/>
  <rect x="250" y="110" width="700" height="330" rx="18" fill="#244b8f"/><rect x="250" y="110" width="700" height="330" rx="18" fill="none" stroke="#82a8e8" stroke-width="4"/>
  <text x="600" y="225" text-anchor="middle" fill="#fff" font-size="64" font-weight="800">Hackathon UBM</text><text x="600" y="330" text-anchor="middle" fill="#ffd98a" font-size="96" font-weight="800" font-family="ui-monospace,monospace">23:41:07</text><text x="600" y="395" text-anchor="middle" fill="#dbe6f9" font-size="28">tempo restante para a entrega</text>
  <rect x="150" y="470" width="900" height="24" rx="6" fill="#1e1b3a"/>
  <g fill="#17152d">${Array.from({ length: 13 }, (_, i) => `<circle cx="${70 + i * 90}" cy="${610 + (i % 2) * 24}" r="44"/><rect x="${18 + i * 90}" y="${650 + (i % 2) * 24}" width="104" height="120" rx="40"/>`).join('')}</g>
  <g fill="#bcd4ff" opacity="0.85">${[2, 5, 8, 11].map((i) => `<rect x="${52 + i * 90}" y="560" width="36" height="24" rx="3"/>`).join('')}</g>`,
);

const bowl = svgUri(
  1100,
  1100,
  `<rect width="1100" height="1100" fill="#efe7d8"/><circle cx="560" cy="570" r="420" fill="#d9cdb6"/><circle cx="550" cy="550" r="410" fill="#fff"/><circle cx="550" cy="550" r="340" fill="#f7f3ea"/>
  <path d="M550 550L550 210A340 340 0 0 1 870 440Z" fill="#f2b84b"/><path d="M550 550L870 440A340 340 0 0 1 760 818Z" fill="#7fb77e"/><path d="M550 550L760 818A340 340 0 0 1 300 780Z" fill="#e2785f"/><path d="M550 550L300 780A340 340 0 0 1 550 210Z" fill="#f1ead8"/>
  <g fill="#5d9a5c">${Array.from({ length: 9 }, (_, i) => `<circle cx="${740 + (i % 3) * 38}" cy="${560 + Math.floor(i / 3) * 44}" r="20"/>`).join('')}</g>
  <g fill="#c85b44">${Array.from({ length: 7 }, (_, i) => `<circle cx="${470 + (i % 4) * 46}" cy="${720 + Math.floor(i / 4) * 44}" r="18"/>`).join('')}</g>
  <g fill="#fff" opacity="0.9">${Array.from({ length: 22 }, (_, i) => `<ellipse cx="${370 + (i % 6) * 26}" cy="${420 + Math.floor(i / 6) * 34}" rx="10" ry="5" transform="rotate(${i * 37} ${370 + (i % 6) * 26} ${420 + Math.floor(i / 6) * 34})"/>`).join('')}</g>
  <circle cx="550" cy="550" r="62" fill="#fff"/><circle cx="550" cy="550" r="30" fill="#f2b84b"/>
  <rect x="60" y="70" width="330" height="84" rx="14" fill="#244b8f"/><text x="88" y="124" fill="#fff" font-size="38" font-weight="700">Custou R$ 9,40</text>`,
);

const adoption = svgUri(
  1000,
  1000,
  `<rect width="1000" height="1000" fill="#f3ecff"/><circle cx="820" cy="170" r="250" fill="#d9d4f5"/>
  ${[
    [180, 700, 1],
    [330, 560, 0.8],
    [140, 430, 0.7],
    [820, 800, 1.1],
  ]
    .map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(-18)" fill="#244b8f" opacity="0.9"><ellipse cx="0" cy="20" rx="46" ry="38"/><circle cx="-50" cy="-28" r="18"/><circle cx="-18" cy="-52" r="19"/><circle cx="20" cy="-52" r="19"/><circle cx="52" cy="-28" r="18"/></g>`)
    .join('')}
  <text x="420" y="330" fill="#0f0d1d" font-size="108" font-weight="800" letter-spacing="-3">Feira de</text><text x="420" y="440" fill="#244b8f" font-size="108" font-weight="800" letter-spacing="-3">adoção</text>
  <text x="420" y="520" fill="#0f0d1d" font-size="42" font-weight="600">Sábado, 9h, no pátio central</text><text x="420" y="576" fill="#4a4768" font-size="34">12 cães e 7 gatos esperando um lar</text>
  <rect x="420" y="620" width="380" height="76" rx="38" fill="#0f0d1d"/><text x="610" y="669" text-anchor="middle" fill="#fff" font-size="32" font-weight="700">Projeto Patas UBM</text>`,
);

const base = import.meta.env.BASE_URL;

const img = (id: string, url: string, alt: string): Media => ({ id, type: 'image', url, alt });

export const mockMedia = {
  campusNight: img('m-campus-night', campusNight, 'Ilustração da fachada do campus à noite, com as janelas acesas'),
  campusSunset: img('m-campus-sunset', campusSunset, 'Ilustração do pôr do sol atrás dos prédios do campus'),
  blueprint: img('m-blueprint', blueprint, 'Planta baixa de um centro de convivência com auditório, sala de estudos e café'),
  court: img('m-court', court, 'Quadra de futsal vista de cima com dois times posicionados'),
  codeEditor: img('m-code', codeEditor, 'Editor de código com um terminal mostrando 12 testes aprovados'),
  lab: img('m-lab', lab, 'Placas de Petri com colônias de bactérias sobre a bancada'),
  desk: img('m-desk', desk, 'Mesa de estudos vista de cima com caderno, café e um lembrete da prova de Cálculo'),
  poster: img('m-poster', poster, 'Cartaz da Semana Acadêmica, de 18 a 22 de novembro'),
  hackathon: img('m-hackathon', hackathon, 'Telão do Hackathon UBM com a contagem regressiva e a plateia'),
  bowl: img('m-bowl', bowl, 'Prato montado com arroz, legumes e frango, com a etiqueta "Custou R$ 9,40"'),
  adoption: img('m-adoption', adoption, 'Cartaz da feira de adoção do Projeto Patas UBM'),
  videoCampus: {
    id: 'm-video-campus',
    type: 'video',
    url: `${base}media/anoitecer-no-campus.mp4`,
    poster: `${base}media/anoitecer-no-campus.jpg`,
    alt: 'Vídeo em timelapse do campus anoitecendo, com as janelas se acendendo',
  } as Media,
  videoApp: {
    id: 'm-video-app',
    type: 'video',
    url: `${base}media/demo-app-caronas.mp4`,
    poster: `${base}media/demo-app-caronas.jpg`,
    alt: 'Vídeo de demonstração de um aplicativo de caronas entre estudantes',
  } as Media,
};

/** Capa padrão do perfil. */
export const DEFAULT_COVER = campusNight;
