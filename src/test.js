// Parse-check the built page's script, then exercise the Cal AI text parser.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = __dirname;
const html = fs.readFileSync(path.join(dir, 'dist/demo.html'), 'utf8');
const src = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));

try { new vm.Script(src); console.log('syntax: OK'); }
catch (e) { console.log('syntax: FAIL', e.message); process.exit(1); }

// pull just the parser out and run it against realistic clipboard text
const start = src.indexOf('function parseMacros');
const end = src.indexOf('document.getElementById("nParse")');
const parseMacros = eval('(' + src.slice(start, end).replace('function parseMacros', 'function') + ')');

const cases = [
  ['EN card', 'Today\n1,842 Calories\nProtein 165g\nCarbs 180g\nFat 62g'],
  ['ES card', 'Hoy\n2.150 Calorías\nProteína 178 g\nCarbohidratos 205 g\nGrasas 71 g'],
  ['number first', '165g Protein  180g Carbs  62g Fat  1842 kcal'],
  ['no kcal label', 'Protein 165 g\nCarbs 180 g\nFat 62 g\n1842'],
  ['junk', 'hello world'],
];
cases.forEach(([n, t]) => console.log(n.padEnd(14), JSON.stringify(parseMacros(t))));
