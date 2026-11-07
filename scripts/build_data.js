const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const jsonPath = path.join(rootDir, 'vrlracinzqvrl.json');

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const tables = {};
for (const item of raw) {
  if (item.type === 'table') {
    tables[item.name] = item.data;
  }
}

const COUNTRY_CODES = {
  'Albania': 'al', 'Andora': 'ad', 'Armenia': 'am', 'Australia': 'au', 'Austria': 'at', 'Azerbejdżan': 'az',
  'Belgia': 'be', 'Białoruś': 'by', 'Bośnia i Hercegowina': 'ba', 'Bułgaria': 'bg', 'Chorwacja': 'hr', 'Cypr': 'cy',
  'Czarnogóra': 'me', 'Czechy': 'cz', 'Dania': 'dk', 'Estonia': 'ee', 'Finlandia': 'fi', 'Francja': 'fr',
  'Grecja': 'gr', 'Gruzja': 'ge', 'Hiszpania': 'es', 'Holandia': 'nl', 'Irlandia': 'ie', 'Islandia': 'is',
  'Izrael': 'il', 'Kazachstan': 'kz', 'Kosowo': 'xk', 'Liechtenstein': 'li', 'Litwa': 'lt', 'Luksemburg': 'lu',
  'Łotwa': 'lv', 'Macedonia': 'mk', 'Malta': 'mt', 'Monako': 'mc', 'Mołdawia': 'md', 'Niemcy': 'de',
  'Norwegia': 'no', 'Polska': 'pl', 'Portugalia': 'pt', 'Rosja': 'ru', 'Rumunia': 'ro', 'San Marino': 'sm',
  'Serbia': 'rs', 'Szwajcaria': 'ch', 'Szwecja': 'se', 'Słowacja': 'sk', 'Słowenia': 'si', 'Turcja': 'tr',
  'Ukraina': 'ua', 'Wielka Brytania': 'gb', 'Wyspy Owcze': 'fo', 'Węgry': 'hu', 'Włochy': 'it'
};

function parseScorewizLinks(scorewizStr) {
  if (!scorewizStr || !scorewizStr.trim()) return [];
  const parts = scorewizStr.split(' ; ').map(s => s.trim()).filter(Boolean);
  return parts.map((url, idx) => {
    const lower = url.toLowerCase();
    let label = `Scorewiz #${idx + 1}`;
    if (lower.includes('fandom.com')) {
      label = 'Fandom Wiki';
    } else if (lower.includes('imgur.com')) {
      label = 'Grafika / Imgur';
    } else if (lower.includes('1-wierfina') || lower.includes('1-cwierc')) {
      label = 'I Ćwierćfinał';
    } else if (lower.includes('2-wierfina') || lower.includes('2-cwierc')) {
      label = 'II Ćwierćfinał';
    } else if (lower.includes('3-wierfina') || lower.includes('3-cwierc')) {
      label = 'III Ćwierćfinał';
    } else if (lower.includes('4-wierfina') || lower.includes('4-cwierc')) {
      label = 'IV Ćwierćfinał';
    } else if (lower.includes('i-pfina') || lower.includes('1-pfina') || lower.includes('1-semifinal') || lower.includes('i-semifinal')) {
      label = 'I Półfinał';
    } else if (lower.includes('ii-pfina') || lower.includes('2-pfina') || lower.includes('2-semifinal') || lower.includes('ii-semifinal')) {
      label = 'II Półfinał';
    } else if (lower.includes('iii-pfina') || lower.includes('3-pfina') || lower.includes('3-semifinal')) {
      label = 'III Półfinał';
    } else if (lower.includes('wielki-fina') || lower.includes('fina')) {
      label = 'Wielki Finał';
    } else if (parts.length === 1 && lower.includes('scorewiz.eu')) {
      label = 'Wyniki (Scorewiz)';
    }
    return { url, label };
  });
}

const edycje = (tables.edycje || []).map(e => ({
  id: parseInt(e.id, 10),
  nazwa: e.nazwa || '',
  scorewiz: parseScorewizLinks(e.scorewiz)
})).sort((a, b) => a.id - b.id);

const panstwa = (tables.panstwa || []).map(p => ({
  id: parseInt(p.id, 10),
  nazwa: p.nazwa || '',
  code: COUNTRY_CODES[p.nazwa] || ''
})).sort((a, b) => a.id - b.id);

const uczestnicy = (tables.uczestnicy || []).map(u => ({
  id: parseInt(u.id, 10),
  nick: u.nick || ''
})).sort((a, b) => a.nick.localeCompare(b.nick, 'pl'));

const piosenki = (tables.piosenki || []).map(p => ({
  id: parseInt(p.id, 10),
  utwor: p.utwor || ''
})).sort((a, b) => a.utwor.localeCompare(b.utwor, 'pl'));

const udzialy = (tables.piosenkaudzial || []).map(u => ({
  id: parseInt(u.idudzialu, 10),
  piosenkaId: parseInt(u.idpiosenki, 10),
  edycjaId: parseInt(u.idedycji, 10),
  panstwoId: parseInt(u.idpanstwa, 10),
  uczestnikId: parseInt(u.iduczestnika, 10),
  wygrana: u.wygrana === '1' || u.wygrana === 1
}));

const exportData = {
  metadata: {
    title: 'Archiwum KP ESCFORUM',
    exportedAt: new Date().toISOString(),
    totalEditions: edycje.length,
    totalSongs: piosenki.length,
    totalCountries: panstwa.length,
    totalParticipants: uczestnicy.length,
    totalParticipations: udzialy.length
  },
  edycje,
  panstwa,
  uczestnicy,
  piosenki,
  udzialy
};

// Write data.json
const jsonTarget = path.join(rootDir, 'data', 'data.json');
fs.writeFileSync(jsonTarget, JSON.stringify(exportData, null, 2), 'utf8');
console.log('Saved', jsonTarget, 'size:', (fs.statSync(jsonTarget).size / 1024).toFixed(1), 'KB');

// Write data.js (compact window.ARCHIWUM_DATA assignment)
const jsTarget = path.join(rootDir, 'data', 'data.js');
const jsContent = `/**
 * Archiwum Konkursu Piosenki ESCFORUM - Baza danych (statyczna)
 * Wygenerowano: ${new Date().toISOString()}
 */
window.ARCHIWUM_DATA = ${JSON.stringify(exportData)};
`;
fs.writeFileSync(jsTarget, jsContent, 'utf8');
console.log('Saved', jsTarget, 'size:', (fs.statSync(jsTarget).size / 1024).toFixed(1), 'KB');
