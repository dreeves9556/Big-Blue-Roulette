import sys
sys.path.insert(0, '/Users/danielsmac/Documents/Kentucky Basketball Team Draft/src')

from data.footballPlayers import footballAllSeasons, footballSeasonPlayersMap

print('Total seasons:', len(footballAllSeasons))
print('Seasons with < 5 players:')
for season in footballAllSeasons:
    players = footballSeasonPlayersMap[season]
    if len(players) < 5:
        print(f'  {season}: {len(players)} players')

print('---')
print('Seasons with no QBs:')
for season in footballAllSeasons:
    players = footballSeasonPlayersMap[season]
    qbs = [p for p in players if p['primaryPosition'] == 'QB']
    if len(qbs) == 0:
        print(f'  {season}')

print('---')
print('Seasons with no RBs:')
for season in footballAllSeasons:
    players = footballSeasonPlayersMap[season]
    rbs = [p for p in players if p['primaryPosition'] == 'RB']
    if len(rbs) == 0:
        print(f'  {season}')

print('---')
print('Seasons with no WRs:')
for season in footballAllSeasons:
    players = footballSeasonPlayersMap[season]
    wrs = [p for p in players if p['primaryPosition'] == 'WR']
    if len(wrs) == 0:
        print(f'  {season}')

print('---')
print('Seasons with no TEs:')
for season in footballAllSeasons:
    players = footballSeasonPlayersMap[season]
    tes = [p for p in players if p['primaryPosition'] == 'TE']
    if len(tes) == 0:
        print(f'  {season}')
