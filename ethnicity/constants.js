let annotationsLoc = [
  {'name': 'Jurong West Central', 'dx': -60, 'dy': -40, 'direction': 'right', 'race': 'Chinese'},
  {'name': 'Tampines East', 'dx': 40, 'dy': 0, 'direction': 'left', 'race': 'Malays'},
  {'name': 'Simei', 'dx': 20, 'dy': 0, 'direction': 'left', 'race': 'Others'},
  {'name': 'Woodlands East', 'dx': 100, 'dy': -30, 'direction': 'left', 'race': 'Malays'},
  {'name': 'Sengkang Town Centre', 'dx': 20, 'dy': -80, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Rivervale', 'dx': 20, 'dy': -20, 'direction': 'left', 'race': 'Indians'},
  {'name': 'Trafalgar', 'dx': -20, 'dy': -40, 'direction': 'right', 'race': 'Indians'},
  {'name': 'Hougang West', 'dx': 60, 'dy': 0, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Bedok North', 'dx': 20, 'dy': 50, 'direction': 'left', 'race': 'Malays'},
  {'name': 'Bedok South', 'dx': 20, 'dy': 0, 'direction': 'left', 'race': 'Others'},
  {'name': 'Frankel', 'dx': 20, 'dy': 50, 'direction': 'left', 'race': 'Others'},
  {'name': 'Bendemeer', 'dx': 40, 'dy': 100, 'direction': 'left', 'race': 'Indians'}
]

let annotationsLocMobile = [
  {'name': 'Jurong West Central', 'dx': 20, 'dy': 80, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Tampines East', 'dx': 40/2, 'dy': 0, 'direction': 'left', 'race': 'Malays'},
  {'name': 'Simei', 'dx': 20/2, 'dy': 0, 'direction': 'left', 'race': 'Others'},
  {'name': 'Woodlands East', 'dx': 20, 'dy': -60/2, 'direction': 'left', 'race': 'Malays'},
  {'name': 'Sengkang Town Centre', 'dx': 20/2, 'dy': -80/2, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Rivervale', 'dx': 20/2, 'dy': -20/2, 'direction': 'left', 'race': 'Indians'},
  {'name': 'Trafalgar', 'dx': -20/2, 'dy': -40/2, 'direction': 'right', 'race': 'Indians'},
  {'name': 'Hougang West', 'dx': 60/2, 'dy': 0, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Bedok North', 'dx': 20/2, 'dy': 50/2, 'direction': 'left', 'race': 'Malays'},
  {'name': 'Bedok South', 'dx': 20/2, 'dy': 0, 'direction': 'left', 'race': 'Others'},
  {'name': 'Frankel', 'dx': 20/2, 'dy': 50/2, 'direction': 'left', 'race': 'Others'},
  {'name': 'Bendemeer', 'dx': 40/2, 'dy': 100/2, 'direction': 'left', 'race': 'Indians'}
]

let annotationsLocMini = [
  {'name': 'Jurong West Central', 'dx': 20, 'dy': 60, 'direction': 'left', 'race': ''},
  {'name': 'Tampines East', 'dx': 20, 'dy': -10, 'direction': 'left', 'race': ''},
  {'name': 'Tampines West', 'dx': 20, 'dy': 20, 'direction': 'left', 'race': ''},
  {'name': 'Woodlands East', 'dx': 100, 'dy': -20, 'direction': 'left', 'race': ''},
  {'name': 'Bedok North', 'dx': 20, 'dy': 40, 'direction': 'left', 'race': ''},
  {'name': 'Bedok South', 'dx': 20, 'dy': 0, 'direction': 'left', 'race': ''},
  {'name': 'Yunnan', 'dx': -10, 'dy': -20, 'direction': 'right', 'race': ''},
  {'name': 'Pasir Ris Drive', 'dx': 20, 'dy': -20, 'direction': 'left', 'race': ''},

  {'name': 'Springleaf', 'dx': 20, 'dy': -40, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Anak Bukit', 'dx': 10, 'dy': -20, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'China Square', 'dx': 20, 'dy': 0, 'direction': 'left', 'race': 'Chinese'},
  {'name': "People's Park", 'dx': 40, 'dy': 20, 'direction': 'left', 'race': 'Chinese'},
  {'name': "Bugis", 'dx': 20, 'dy': -20, 'direction': 'left', 'race': 'Chinese'},

  {'name': "Pasir Ris Drive", 'dx': 20, 'dy': 20, 'direction': 'left', 'race': 'Chinese'},
  {'name': 'Changi West', 'dx': 20, 'dy': 0, 'direction': 'left', 'race': 'Malays'},
  {'name': "North Coast", 'dx': 20, 'dy': -20, 'direction': 'left', 'race': 'Malays'},
  {'name': "Woodlands West", 'dx': 0, 'dy': 0, 'direction': 'right', 'race': 'Malays'},

  {'name': "Little India", 'dx': 20, 'dy': -20, 'direction': 'left', 'race': 'Others'},
  {'name': "Kampong Glam", 'dx': 40, 'dy': 0, 'direction': 'left', 'race': 'Indians'},
  {'name': "Farrer Park", 'dx': -20, 'dy': -20, 'direction': 'right', 'race': 'Indians'},
  {'name': "Selegie", 'dx': 10, 'dy': 40, 'direction': 'left', 'race': 'Indians'},
  {'name': "Tanjong Rhu", 'dx': 10, 'dy': 20, 'direction': 'left', 'race': 'Indians'},

  {'name': "Tanglin", 'dx': 40, 'dy': 0, 'direction': 'left', 'race': 'Others'},
  {'name': "Fort Canning", 'dx': 20, 'dy': 10, 'direction': 'left', 'race': 'Others'},
  {'name': "Sentosa", 'dx': 20, 'dy': 10, 'direction': 'left', 'race': 'Others'},
  {'name': "Newton Circus", 'dx': 20, 'dy': -10, 'direction': 'left', 'race': 'Others'},
  {'name': "Boat Quay", 'dx': 20, 'dy': 20, 'direction': 'left', 'race': 'Others'}
]

module.exports = {
    annotationsLoc: annotationsLoc,
    annotationsLocMobile: annotationsLocMobile,
    annotationsLocMini: annotationsLocMini
}