import fs from 'fs';
const data = fs.readFileSync('/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src/data/players.js', 'utf8');
const ids = ['hanson_reggie','farmer_richie','brassow_jeff','ford_travis','delk_tony','rhodes_rodrick','riddick_andre','dent_rodney','prickett_jared','martinez_gimel','harrison_chris','pelphrey_john','feldhaus_deron','woods_sean','mashburn_jamal'];
for (const id of ids) {
  const m = data.match(new RegExp('"id": "' + id + '"[\\s\\S]*?"primaryPosition": "([^"]+)"'));
  console.log(id + ' -> ' + (m ? m[1] : 'NOT FOUND'));
}
