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

  const stageOrder = {
    'I Ćwierćfinał': 1,
    'II Ćwierćfinał': 2,
    'III Ćwierćfinał': 3,
    'IV Ćwierćfinał': 4,
    'I Półfinał': 5,
    'II Półfinał': 6,
    'III Półfinał': 7,
    'Wielki Finał': 8,
    'Wyniki (Scorewiz)': 9,
    'Tabela graficzna (Imgur)': 10,
    'Fandom Wiki': 11
  };

  const parsed = parts.map((url, idx) => {
    const lower = url.toLowerCase();
    let label = '';

    if (lower.includes('fandom.com')) {
      label = 'Fandom Wiki';
    } else if (lower.includes('imgur.com')) {
      label = 'Tabela graficzna (Imgur)';
    }
    // Ćwierćfinały (4, 3, 2, 1) - both roman (iv, iii, ii, i) and digits
    else if (/(?:iv|4)[-_]?(?:wierfina|cwierc)/i.test(lower)) {
      label = 'IV Ćwierćfinał';
    } else if (/(?:iii|3)[-_]?(?:wierfina|cwierc)/i.test(lower)) {
      label = 'III Ćwierćfinał';
    } else if (/(?:ii|2)[-_]?(?:wierfina|cwierc)/i.test(lower)) {
      label = 'II Ćwierćfinał';
    } else if (/(?:i|1)[-_]?(?:wierfina|cwierc)/i.test(lower)) {
      label = 'I Ćwierćfinał';
    }
    // Półfinały (3, 2, 1) - both roman (iii, ii, i) and digits
    else if (/(?:iii|3)[-_]?(?:pfina|semifinal|polfina)/i.test(lower)) {
      label = 'III Półfinał';
    } else if (/(?:ii|2)[-_]?(?:pfina|semifinal|polfina)/i.test(lower)) {
      label = 'II Półfinał';
    } else if (/(?:i|1)[-_]?(?:pfina|semifinal|polfina)/i.test(lower)) {
      label = 'I Półfinał';
    }
    // Wielki Finał / Finał
    else if (lower.includes('wielki') || lower.includes('wielkiego') || lower.includes('fina')) {
      label = 'Wielki Finał';
    } else if (parts.length === 1 && lower.includes('scorewiz.eu')) {
      label = 'Wyniki (Scorewiz)';
    } else {
      label = `Scorewiz #${idx + 1}`;
    }

    return { url, label };
  });

  return parsed.sort((a, b) => {
    const oA = stageOrder[a.label] || 99;
    const oB = stageOrder[b.label] || 99;
    return oA - oB;
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
