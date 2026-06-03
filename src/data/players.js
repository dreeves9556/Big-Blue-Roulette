// Kentucky Wildcats Basketball Player Dataset
// Source: bigbluehistory.net/bb/statistics/
// Every player from every roster page scraped from the site.
// Positions: PG, SG, SF, PF, C

export const players = [

  // ── 2025-26 ───────────────────────────────────────────────────────────────
  { id: "aberdeen_denzel",    fullName: "Denzel Aberdeen",       seasons: ["2025-26"], height: 77, weight: 195, jerseyNumber: "1",  class: "SR", primaryPosition: "SG" },
  { id: "dioubate_mouhamed",  fullName: "Mouhamed Dioubate",     seasons: ["2025-26"], height: 79, weight: 220, jerseyNumber: "23", class: "JR", primaryPosition: "PF" },
  { id: "lowe_jaland",        fullName: "Jaland Lowe",           seasons: ["2025-26"], height: 74, weight: 170, jerseyNumber: "15", class: "JR", primaryPosition: "PG" },
  { id: "moreno_malachi",     fullName: "Malachi Moreno",        seasons: ["2025-26"], height: 84, weight: 250, jerseyNumber: "24", class: "FR", primaryPosition: "C"  },
  { id: "williams_kam",       fullName: "Kam Williams",          seasons: ["2025-26"], height: 80, weight: 205, jerseyNumber: "3",  class: "SO", primaryPosition: "SG" },
  { id: "jelavic_andrija",    fullName: "Andrija Jelavic",       seasons: ["2025-26"], height: 83, weight: 225, jerseyNumber: "4",  class: "SO", primaryPosition: "PF" },
  { id: "quaintance_jayden",  fullName: "Jayden Quaintance",     seasons: ["2025-26"], height: 83, weight: 255, jerseyNumber: "21", class: "SO", primaryPosition: "PF" },
  { id: "johnson_jasper",     fullName: "Jasper Johnson",        seasons: ["2025-26"], height: 77, weight: 180, jerseyNumber: "2",  class: "FR", primaryPosition: "SG" },
  { id: "tow_zach",           fullName: "Zach Tow",              seasons: ["2025-26"], height: 77, weight: 220, jerseyNumber: "20", class: "SR", primaryPosition: "SF" },
  { id: "hawthorne_braydon",  fullName: "Braydon Hawthorne",     seasons: ["2025-26"], height: 80, weight: 190, jerseyNumber: "22", class: "FR", primaryPosition: "SF" },
  { id: "potter_reece",       fullName: "Reece Potter",          seasons: ["2025-26"], height: 85, weight: 230, jerseyNumber: "33", class: "JR", primaryPosition: "PF" },

  // ── 2024-25 ───────────────────────────────────────────────────────────────
  // Height in inches. Guards (PG/SG) capped at 6'9" (81 inches)
  { id: "oweh_otega",         fullName: "Otega Oweh",            seasons: ["2024-25", "2025-26"], height: 76, weight: 220, jerseyNumber: "00", class: "SR", primaryPosition: "SG" },
  { id: "robinson_jaxson",    fullName: "Jaxson Robinson",       seasons: ["2024-25"], height: 78,               primaryPosition: "SG" },
  { id: "brea_koby",          fullName: "Koby Brea",             seasons: ["2024-25"], height: 78,               primaryPosition: "SF" },
  { id: "butler_lamont",      fullName: "Lamont Butler",         seasons: ["2024-25"], height: 74,               primaryPosition: "PG" },
  { id: "williams_amari",     fullName: "Amari Williams",        seasons: ["2024-25"], height: 81,               primaryPosition: "C"  },
  { id: "carr_andrew",        fullName: "Andrew Carr",           seasons: ["2024-25"], height: 83,               primaryPosition: "SF" },
  { id: "garrison_brandon",   fullName: "Brandon Garrison",      seasons: ["2024-25", "2025-26"], height: 82, weight: 245, jerseyNumber: "10", class: "JR", primaryPosition: "PF" },
  { id: "almonor_ansley",     fullName: "Ansley Almonor",        seasons: ["2024-25"], height: 79,               primaryPosition: "SF" },
  { id: "kriisa_kerr",        fullName: "Kerr Kriisa",           seasons: ["2024-25"], height: 77,               primaryPosition: "PG" },
  { id: "chandler_collin",    fullName: "Collin Chandler",       seasons: ["2024-25", "2025-26"], height: 77, weight: 205, jerseyNumber: "5",  class: "SO", primaryPosition: "SG" },
  { id: "perry_travis",       fullName: "Travis Perry",          seasons: ["2024-25"], height: 73,               primaryPosition: "PG" },
  { id: "noah_trent",         fullName: "Trent Noah",            seasons: ["2024-25", "2025-26"], height: 77, weight: 220, jerseyNumber: "9",  class: "SO", primaryPosition: "PF" },

  // ── 2023-24 ───────────────────────────────────────────────────────────────
  { id: "reeves_antonio",     fullName: "Antonio Reeves",        seasons: ["2022-23", "2023-24"],                primaryPosition: "SG" },
  { id: "dillingham_rob",     fullName: "Rob Dillingham",        seasons: ["2023-24"],                           primaryPosition: "PG" },
  { id: "sheppard_reed",      fullName: "Reed Sheppard",         seasons: ["2023-24"],                           primaryPosition: "SG" },
  { id: "mitchell_tre",       fullName: "Tre Mitchell",          seasons: ["2022-23", "2023-24"],                primaryPosition: "PF" },
  { id: "wagner_dj",          fullName: "D.J. Wagner",           seasons: ["2023-24"],                           primaryPosition: "PG" },
  { id: "edwards_justin",     fullName: "Justin Edwards",        seasons: ["2023-24"],                           primaryPosition: "SF" },
  { id: "thiero_adou",        fullName: "Adou Thiero",           seasons: ["2022-23", "2023-24"],                primaryPosition: "SF" },
  { id: "ivisic_zvonimir",    fullName: "Zvonimir Ivisic",       seasons: ["2023-24"],                           primaryPosition: "C"  },
  { id: "bradshaw_aaron",     fullName: "Aaron Bradshaw",        seasons: ["2023-24"],                           primaryPosition: "C"  },
  { id: "onyenso_ugonna",     fullName: "Ugonna Onyenso",        seasons: ["2022-23", "2023-24"],                primaryPosition: "C"  },
  { id: "burks_jordan",       fullName: "Jordan Burks",          seasons: ["2023-24"],                           primaryPosition: "SG" },
  { id: "hart_joey",          fullName: "Joey Hart",             seasons: ["2023-24"],                           primaryPosition: "PF" },
  { id: "canada_brennan",     fullName: "Brennan Canada",        seasons: ["2020-21", "2021-22", "2022-23", "2023-24"], primaryPosition: "PG" },
  { id: "watkins_kareem",     fullName: "Kareem Watkins",        seasons: ["2020-21", "2021-22", "2022-23", "2023-24"], primaryPosition: "SG" },
  { id: "darbyshire_grant",   fullName: "Grant Darbyshire",      seasons: ["2023-24"],                           primaryPosition: "SG" },
  { id: "horn_walker",        fullName: "Walker Horn",           seasons: ["2023-24", "2025-26"], height: 75, weight: 190, jerseyNumber: "11", class: "SR", primaryPosition: "SF" },

  // ── 2022-23 ───────────────────────────────────────────────────────────────
  { id: "tshiebwe_oscar",     fullName: "Oscar Tshiebwe",        seasons: ["2020-21", "2021-22", "2022-23"],               primaryPosition: "C"  },
  { id: "toppin_jacob",       fullName: "Jacob Toppin",          seasons: ["2020-21", "2021-22", "2022-23"],     primaryPosition: "SF" },
  { id: "wallace_cason",      fullName: "Cason Wallace",         seasons: ["2022-23"],                           primaryPosition: "SG" },
  { id: "wheeler_sahvir",     fullName: "Sahvir Wheeler",        seasons: ["2021-22", "2022-23"],                primaryPosition: "PG" },
  { id: "livingston_chris",   fullName: "Chris Livingston",      seasons: ["2022-23"],                           primaryPosition: "SF" },
  { id: "fredrick_cj",        fullName: "C.J. Fredrick",         seasons: ["2021-22", "2022-23"],                primaryPosition: "SG" },
  { id: "ware_lance",         fullName: "Lance Ware",            seasons: ["2020-21", "2021-22", "2022-23"],     primaryPosition: "PF" },
  { id: "collins_daimion",    fullName: "Daimion Collins",       seasons: ["2021-22", "2022-23"],                primaryPosition: "C"  },

  // ── 2021-22 ───────────────────────────────────────────────────────────────
  { id: "washington_tyty",    fullName: "TyTy Washington",       seasons: ["2021-22"],                           primaryPosition: "PG" },
  { id: "grady_kellan",       fullName: "Kellan Grady",          seasons: ["2021-22", "2022-23"],                primaryPosition: "SF" },
  { id: "mintz_davion",       fullName: "Davion Mintz",          seasons: ["2020-21", "2021-22"],                primaryPosition: "PG" },
  { id: "brooks_keion",       fullName: "Keion Brooks",          seasons: ["2019-20", "2020-21", "2021-22"],     primaryPosition: "SF" },
  { id: "sharpe_shaedon",     fullName: "Shaedon Sharpe",        seasons: ["2021-22"],                           primaryPosition: "SG" },
  { id: "allen_dontaie",      fullName: "Dontaie Allen",         seasons: ["2019-20", "2020-21", "2021-22"],     primaryPosition: "SG" },
  { id: "hopkins_bryce",      fullName: "Bryce Hopkins",         seasons: ["2021-22"],                           primaryPosition: "PF" },
  { id: "payne_zan",          fullName: "Zan Payne",             seasons: ["2018-19", "2019-20", "2020-21", "2021-22"], primaryPosition: "PG" },

  // ── 2020-21 ───────────────────────────────────────────────────────────────
  { id: "boston_brandon",     fullName: "Brandon Boston Jr.",    seasons: ["2020-21"],                           primaryPosition: "SF" },
  { id: "sarr_olivier",       fullName: "Olivier Sarr",          seasons: ["2020-21"],                           primaryPosition: "C"  },
  { id: "clarke_terrence",    fullName: "Terrence Clarke",       seasons: ["2020-21"],                           primaryPosition: "SG" },
  { id: "jackson_isaiah",     fullName: "Isaiah Jackson",        seasons: ["2020-21"],                           primaryPosition: "C"  },
  { id: "askew_devin",        fullName: "Devin Askew",           seasons: ["2020-21"],                           primaryPosition: "PG" },
  { id: "fletcher_camron",    fullName: "Cam'Ron Fletcher",      seasons: ["2020-21"],                           primaryPosition: "SF" },
  { id: "welch_riley",        fullName: "Riley Welch",           seasons: ["2020-21"],                           primaryPosition: "SG" },

  // ── 2019-20 ───────────────────────────────────────────────────────────────
  { id: "quickley_immanuel",  fullName: "Immanuel Quickley",     seasons: ["2018-19", "2019-20"],                primaryPosition: "PG" },
  { id: "maxey_tyrese",       fullName: "Tyrese Maxey",          seasons: ["2019-20"],                           primaryPosition: "SG" },
  { id: "richards_nick",      fullName: "Nick Richards",         seasons: ["2017-18", "2018-19", "2019-20"],     primaryPosition: "C"  },
  { id: "hagans_ashton",      fullName: "Ashton Hagans",         seasons: ["2018-19", "2019-20"],                primaryPosition: "PG" },
  { id: "montgomery_ej",      fullName: "E.J. Montgomery",       seasons: ["2018-19", "2019-20"],                primaryPosition: "PF" },
  { id: "sestina_nate",       fullName: "Nate Sestina",          seasons: ["2019-20"],                           primaryPosition: "PF" },
  { id: "juzang_johnny",      fullName: "Johnny Juzang",         seasons: ["2019-20"],                           primaryPosition: "SG" },
  { id: "whitney_kahlil",     fullName: "Kahlil Whitney",        seasons: ["2019-20"],                           primaryPosition: "SF" },

  // ── 2018-19 ───────────────────────────────────────────────────────────────
  { id: "herro_tyler",        fullName: "Tyler Herro",           seasons: ["2018-19"],                           primaryPosition: "SG" },
  { id: "washington_pj",      fullName: "P.J. Washington",       seasons: ["2017-18", "2018-19"],                primaryPosition: "PF" },
  { id: "johnson_keldon",     fullName: "Keldon Johnson",        seasons: ["2018-19"],                           primaryPosition: "SF" },
  { id: "travis_reid",        fullName: "Reid Travis",           seasons: ["2018-19"],                           primaryPosition: "PF" },
  { id: "green_quade",        fullName: "Quade Green",           seasons: ["2017-18", "2018-19"],                primaryPosition: "PG" },
  { id: "baker_jemarl",       fullName: "Jemarl Baker",          seasons: ["2017-18", "2018-19"],                primaryPosition: "SG" },
  { id: "david_jonny",        fullName: "Jonny David",           seasons: ["2016-17", "2017-18", "2018-19"],     primaryPosition: "SG" },
  { id: "calipari_brad",      fullName: "Brad Calipari",         seasons: ["2016-17", "2017-18", "2018-19"],     primaryPosition: "PG" },

  // ── 2017-18 ───────────────────────────────────────────────────────────────
  { id: "knox_kevin",         fullName: "Kevin Knox",            seasons: ["2017-18"],                           primaryPosition: "SF" },
  { id: "gilgeous_shai",      fullName: "Shai Gilgeous-Alexander", seasons: ["2017-18"],                         primaryPosition: "SG" },
  { id: "diallo_hamidou",     fullName: "Hamidou Diallo",        seasons: ["2016-17", "2017-18"],                primaryPosition: "SG" },
  { id: "vanderbilt_jarred",  fullName: "Jarred Vanderbilt",     seasons: ["2017-18"],                           primaryPosition: "PF" },
  { id: "gabriel_wenyen",     fullName: "Wenyen Gabriel",        seasons: ["2016-17", "2017-18"],                primaryPosition: "PF" },
  { id: "humphries_isaac",    fullName: "Isaac Humphries",       seasons: ["2016-17", "2017-18"],                primaryPosition: "C"  },
  { id: "killeya_jones_sacha",fullName: "Sacha Killeya-Jones",   seasons: ["2016-17", "2017-18"],                primaryPosition: "PF" },
  { id: "wynyard_tai",        fullName: "Tai Wynyard",           seasons: ["2015-16", "2016-17", "2017-18"],     primaryPosition: "C"  },
  { id: "pulliam_dillon",     fullName: "Dillon Pulliam",        seasons: ["2015-16", "2016-17", "2017-18"],     primaryPosition: "SG" },

  // ── 2016-17 ───────────────────────────────────────────────────────────────
  { id: "monk_malik",         fullName: "Malik Monk",            seasons: ["2016-17"],                           primaryPosition: "SG" },
  { id: "fox_deaaron",        fullName: "De'Aaron Fox",          seasons: ["2016-17"],                           primaryPosition: "PG" },
  { id: "adebayo_bam",        fullName: "Bam Adebayo",           seasons: ["2016-17"],                           primaryPosition: "C"  },
  { id: "briscoe_isaiah",     fullName: "Isaiah Briscoe",        seasons: ["2015-16", "2016-17"],                primaryPosition: "PG" },
  { id: "willis_derek",       fullName: "Derek Willis",          seasons: ["2013-14", "2014-15", "2015-16", "2016-17"], primaryPosition: "PF" },
  { id: "mulder_mychal",      fullName: "Mychal Mulder",         seasons: ["2015-16", "2016-17"],                primaryPosition: "SG" },
  { id: "hawkins_dominique",  fullName: "Dominique Hawkins",     seasons: ["2013-14", "2014-15", "2015-16", "2016-17"], primaryPosition: "PG" },

  // ── 2015-16 ───────────────────────────────────────────────────────────────
  { id: "murray_jamal",       fullName: "Jamal Murray",          seasons: ["2015-16"],                           primaryPosition: "SG" },
  { id: "ulis_tyler",         fullName: "Tyler Ulis",            seasons: ["2014-15", "2015-16"],                primaryPosition: "PG" },
  { id: "poythress_alex",     fullName: "Alex Poythress",        seasons: ["2012-13", "2013-14", "2014-15", "2015-16"], primaryPosition: "SF" },
  { id: "labissiere_skal",    fullName: "Skal Labissiere",       seasons: ["2015-16"],                           primaryPosition: "C"  },
  { id: "lee_marcus",         fullName: "Marcus Lee",            seasons: ["2013-14", "2014-15", "2015-16", "2016-17"], primaryPosition: "C"  },
  { id: "matthews_charles",   fullName: "Charles Matthews",      seasons: ["2015-16"],                           primaryPosition: "SF" },
  { id: "floreal_ej",         fullName: "E.J. Floreal",          seasons: ["2013-14", "2014-15", "2015-16"],     primaryPosition: "SG" },

  // ── 2014-15 ───────────────────────────────────────────────────────────────
  { id: "towns_kat",          fullName: "Karl-Anthony Towns",    seasons: ["2014-15"],                           primaryPosition: "C"  },
  { id: "booker_devin",       fullName: "Devin Booker",          seasons: ["2014-15"],                           primaryPosition: "SG" },
  { id: "harrison_aaron",     fullName: "Aaron Harrison",        seasons: ["2013-14", "2014-15"],                primaryPosition: "SG" },
  { id: "harrison_andrew",    fullName: "Andrew Harrison",       seasons: ["2013-14", "2014-15"],                primaryPosition: "PG" },
  { id: "cauley_willie",      fullName: "Willie Cauley-Stein",   seasons: ["2012-13", "2013-14", "2014-15"],     primaryPosition: "C"  },
  { id: "lyles_trey",         fullName: "Trey Lyles",            seasons: ["2014-15"],                           primaryPosition: "PF" },
  { id: "johnson_dakari",     fullName: "Dakari Johnson",        seasons: ["2013-14", "2014-15"],                primaryPosition: "C"  },

  // ── 2013-14 ───────────────────────────────────────────────────────────────
  { id: "randle_julius",      fullName: "Julius Randle",         seasons: ["2013-14"],                           primaryPosition: "PF" },
  { id: "young_james",        fullName: "James Young",           seasons: ["2013-14"],                           primaryPosition: "SG" },
  { id: "polson_jarrod",      fullName: "Jarrod Polson",         seasons: ["2010-11", "2011-12", "2012-13", "2013-14"], primaryPosition: "PG" },
  { id: "malone_sam",         fullName: "Sam Malone",            seasons: ["2011-12", "2012-13", "2013-14"],     primaryPosition: "SG" },
  { id: "long_brian",         fullName: "Brian Long",            seasons: ["2011-12", "2012-13", "2013-14"],     primaryPosition: "PF" },
  { id: "lanter_tod",         fullName: "Tod Lanter",            seasons: ["2012-13", "2013-14"],                primaryPosition: "PG" },

  // ── 2012-13 ───────────────────────────────────────────────────────────────
  { id: "goodwin_archie",     fullName: "Archie Goodwin",        seasons: ["2012-13"],                           primaryPosition: "SG" },
  { id: "noel_nerlens",       fullName: "Nerlens Noel",          seasons: ["2012-13"],                           primaryPosition: "C"  },
  { id: "wiltjer_kyle",       fullName: "Kyle Wiltjer",          seasons: ["2011-12", "2012-13"],                primaryPosition: "PF" },
  { id: "harrow_ryan",        fullName: "Ryan Harrow",           seasons: ["2012-13"],                           primaryPosition: "PG" },
  { id: "mays_julius",        fullName: "Julius Mays",           seasons: ["2012-13"],                           primaryPosition: "SG" },
  { id: "beckham_twany",      fullName: "Twany Beckham",         seasons: ["2010-11", "2011-12", "2012-13"],     primaryPosition: "SG" },
  { id: "hood_jon",           fullName: "Jon Hood",              seasons: ["2009-10", "2010-11", "2011-12", "2012-13", "2013-14"], primaryPosition: "SF" },

  // ── 2011-12 ───────────────────────────────────────────────────────────────
  { id: "davis_anthony",      fullName: "Anthony Davis",         seasons: ["2011-12"],                           primaryPosition: "C"  },
  { id: "lamb_doron",         fullName: "Doron Lamb",            seasons: ["2010-11", "2011-12"],                primaryPosition: "SG" },
  { id: "jones_terrence",     fullName: "Terrence Jones",        seasons: ["2010-11", "2011-12"],                primaryPosition: "PF" },
  { id: "mkg_michael",        fullName: "Michael Kidd-Gilchrist",seasons: ["2011-12"],                           primaryPosition: "SF" },
  { id: "teague_marquis",     fullName: "Marquis Teague",        seasons: ["2011-12"],                           primaryPosition: "PG" },
  { id: "miller_darius",      fullName: "Darius Miller",         seasons: ["2008-09", "2009-10", "2010-11", "2011-12"], primaryPosition: "SF" },
  { id: "vargas_eloy",        fullName: "Eloy Vargas",           seasons: ["2010-11", "2011-12"],                primaryPosition: "C"  },
  { id: "poole_stacey",       fullName: "Stacey Poole",          seasons: ["2010-11"],                           primaryPosition: "SG" },

  // ── 2010-11 ───────────────────────────────────────────────────────────────
  { id: "knight_brandon",     fullName: "Brandon Knight",        seasons: ["2010-11"],                           primaryPosition: "PG" },
  { id: "liggins_deandre",    fullName: "DeAndre Liggins",       seasons: ["2008-09", "2009-10", "2010-11"],     primaryPosition: "SG" },
  { id: "harrellson_josh",    fullName: "Josh Harrellson",       seasons: ["2008-09", "2009-10", "2010-11"],     primaryPosition: "C"  },
  { id: "kanter_enes",        fullName: "Enes Kanter",           seasons: ["2010-11"],                           primaryPosition: "C"  },

  // ── 2009-10 ───────────────────────────────────────────────────────────────
  { id: "wall_john",          fullName: "John Wall",             seasons: ["2009-10"],                           primaryPosition: "PG" },
  { id: "bledsoe_eric",       fullName: "Eric Bledsoe",          seasons: ["2009-10"],                           primaryPosition: "PG" },
  { id: "cousins_demarcus",   fullName: "DeMarcus Cousins",      seasons: ["2009-10"],                           primaryPosition: "C"  },
  { id: "orton_daniel",       fullName: "Daniel Orton",          seasons: ["2009-10"],                           primaryPosition: "C"  },
  { id: "dodson_darnell",     fullName: "Darnell Dodson",        seasons: ["2008-09", "2009-10"],                primaryPosition: "SF" },
  { id: "patterson_patrick",  fullName: "Patrick Patterson",     seasons: ["2007-08", "2008-09", "2009-10"],     primaryPosition: "PF" },
  { id: "stevenson_perry",    fullName: "Perry Stevenson",       seasons: ["2006-07", "2007-08", "2008-09", "2009-10"], primaryPosition: "PF" },
  { id: "harris_ramon",       fullName: "Ramon Harris",          seasons: ["2006-07", "2007-08", "2008-09", "2009-10"], primaryPosition: "SF" },

  // ── 2008-09 ───────────────────────────────────────────────────────────────
  { id: "meeks_jodie",        fullName: "Jodie Meeks",           seasons: ["2006-07", "2007-08", "2008-09"],     primaryPosition: "SG" },
  { id: "porter_michael",     fullName: "Michael Porter",        seasons: ["2006-07", "2007-08", "2008-09"],     primaryPosition: "SF" },
  { id: "stewart_aj",        fullName: "A.J. Stewart",          seasons: ["2006-07", "2007-08", "2008-09"],     primaryPosition: "PF" },
  { id: "perry_dwight",       fullName: "Dwight Perry",          seasons: ["2006-07", "2007-08", "2008-09"],     primaryPosition: "PG" },
  { id: "krebs_mark",         fullName: "Mark Krebs",            seasons: ["2006-07", "2007-08", "2008-09"],     primaryPosition: "C"  },
  { id: "galloway_kevin",     fullName: "Kevin Galloway",        seasons: ["2007-08", "2008-09"],                primaryPosition: "SF" },
  { id: "slone_landon",       fullName: "Landon Slone",          seasons: ["2007-08", "2008-09"],                primaryPosition: "PG" },
  { id: "carter_jared",       fullName: "Jared Carter",          seasons: ["2005-06", "2006-07", "2007-08"],     primaryPosition: "PF" },
  { id: "halsell_mark",       fullName: "Mark Halsell",          seasons: ["2007-08", "2008-09"],                primaryPosition: "C"  },
  { id: "scherbenske_matt",   fullName: "Matt Scherbenske",      seasons: ["2007-08", "2008-09"],                primaryPosition: "PF" },

  // ── 2007-08 ───────────────────────────────────────────────────────────────
  { id: "crawford_joe",       fullName: "Joe Crawford",          seasons: ["2004-05", "2005-06", "2006-07", "2007-08"], primaryPosition: "SF" },
  { id: "bradley_ramel",      fullName: "Ramel Bradley",         seasons: ["2004-05", "2005-06", "2006-07", "2007-08"], primaryPosition: "SG" },
  { id: "jasper_derrick",     fullName: "Derrick Jasper",        seasons: ["2006-07", "2007-08"],                primaryPosition: "SG" },
  { id: "benson_kerry",       fullName: "Kerry Benson",          seasons: ["2007-08"],                           primaryPosition: "C"  },
  { id: "legion_alex",        fullName: "Alex Legion",           seasons: ["2007-08"],                           primaryPosition: "SG" },
  { id: "coury_mark",         fullName: "Mark Coury",            seasons: ["2005-06", "2006-07", "2007-08"],     primaryPosition: "PF" },
  { id: "williams_morakinyo", fullName: "Morakinyo Williams",    seasons: ["2006-07", "2007-08"],                primaryPosition: "SF" },

  // ── 2006-07 ───────────────────────────────────────────────────────────────
  { id: "morris_randolph",    fullName: "Randolph Morris",       seasons: ["2004-05", "2005-06", "2006-07"],     primaryPosition: "C"  },
  { id: "perry_bobby",        fullName: "Bobby Perry",           seasons: ["2003-04", "2004-05", "2005-06", "2006-07"], primaryPosition: "SF" },
  { id: "thomas_sheray",      fullName: "Sheray Thomas",         seasons: ["2003-04", "2004-05", "2005-06", "2006-07"], primaryPosition: "SF" },
  { id: "obrzut_lukasz",      fullName: "Lukasz Obrzut",         seasons: ["2003-04", "2004-05", "2005-06", "2006-07"], primaryPosition: "C"  },

  // ── 2005-06 ───────────────────────────────────────────────────────────────
  { id: "rondo_rajon",        fullName: "Rajon Rondo",           seasons: ["2004-05", "2005-06"],                primaryPosition: "PG" },
  { id: "sparks_patrick",     fullName: "Patrick Sparks",        seasons: ["2004-05", "2005-06"],                primaryPosition: "SG" },
  { id: "moss_ravi",          fullName: "Ravi Moss",             seasons: ["2002-03", "2003-04", "2004-05", "2005-06"], primaryPosition: "SG" },
  { id: "sims_rekalin",       fullName: "Rekalin Sims",          seasons: ["2004-05", "2005-06"],                primaryPosition: "SF" },
  { id: "stockton_brandon",   fullName: "Brandon Stockton",      seasons: ["2002-03", "2003-04", "2004-05", "2005-06"], primaryPosition: "PG" },
  { id: "alleyne_shagari",    fullName: "Shagari Alleyne",       seasons: ["2004-05", "2005-06"],                primaryPosition: "C"  },
  { id: "lemaster_preston",   fullName: "Preston LeMaster",      seasons: ["2002-03", "2003-04", "2004-05", "2005-06"], primaryPosition: "PG" },
  { id: "williams_adam",      fullName: "Adam Williams",         seasons: ["2004-05", "2005-06"],                primaryPosition: "SG" },
  { id: "carrier_josh",       fullName: "Josh Carrier",          seasons: ["2001-02", "2002-03", "2003-04", "2004-05"], primaryPosition: "PG" },

  // ── 2004-05 ───────────────────────────────────────────────────────────────
  { id: "azubuike_kelenna",   fullName: "Kelenna Azubuike",      seasons: ["2002-03", "2003-04", "2004-05"],     primaryPosition: "SG" },
  { id: "hayes_chuck",        fullName: "Chuck Hayes",           seasons: ["2001-02", "2002-03", "2003-04", "2004-05"], primaryPosition: "C"  },

  // ── 2003-04 ───────────────────────────────────────────────────────────────
  { id: "fitch_gerald",       fullName: "Gerald Fitch",          seasons: ["2000-01", "2001-02", "2002-03", "2003-04"], primaryPosition: "SG" },
  { id: "daniels_erik",       fullName: "Erik Daniels",          seasons: ["2000-01", "2001-02", "2002-03", "2003-04"], primaryPosition: "PF" },
  { id: "hawkins_cliff",      fullName: "Cliff Hawkins",         seasons: ["2001-02", "2002-03", "2003-04"],     primaryPosition: "PG" },
  { id: "barbour_antwain",    fullName: "Antwain Barbour",       seasons: ["2001-02", "2002-03", "2003-04"],     primaryPosition: "SG" },
  { id: "cote_bernard",       fullName: "Bernard Cote",          seasons: ["2002-03", "2003-04"],                primaryPosition: "C"  },
  { id: "heissenbuttel_matt", fullName: "Matt Heissenbuttel",    seasons: ["2000-01", "2001-02", "2002-03", "2003-04"], primaryPosition: "PG" },

  // ── 2002-03 ───────────────────────────────────────────────────────────────
  { id: "bogans_keith",       fullName: "Keith Bogans",          seasons: ["1999-00", "2000-01", "2001-02", "2002-03"], primaryPosition: "SG" },
  { id: "estill_marquis",     fullName: "Marquis Estill",        seasons: ["2000-01", "2001-02", "2002-03"],     primaryPosition: "C"  },

  // ── 2001-02 ───────────────────────────────────────────────────────────────
  { id: "prince_tayshaun",    fullName: "Tayshaun Prince",       seasons: ["1998-99", "1999-00", "2000-01", "2001-02"], primaryPosition: "SF" },
  { id: "carruth_rashaad",    fullName: "Rashaad Carruth",       seasons: ["2001-02"],                           primaryPosition: "SG" },
  { id: "stone_marvin",       fullName: "Marvin Stone",          seasons: ["2000-01", "2001-02"],                primaryPosition: "PF" },
  { id: "blevins_jp",         fullName: "J.P. Blevins",          seasons: ["1998-99", "1999-00", "2000-01", "2001-02"], primaryPosition: "PG" },
  { id: "sears_cory",         fullName: "Cory Sears",            seasons: ["1999-00", "2000-01", "2001-02"],     primaryPosition: "C"  },

  // ── 2000-01 ───────────────────────────────────────────────────────────────
  { id: "smith_saul",         fullName: "Saul Smith",            seasons: ["1998-99", "1999-00", "2000-01", "2001-02"], primaryPosition: "PG" },
  { id: "parker_jason",       fullName: "Jason Parker",          seasons: ["2000-01"],                           primaryPosition: "C"  },
  { id: "camara_souleymane",  fullName: "Souleymane Camara",     seasons: ["1999-00", "2000-01", "2001-02"],     primaryPosition: "PF" },

  // ── 1999-00 ───────────────────────────────────────────────────────────────
  { id: "magloire_jamaal",    fullName: "Jamaal Magloire",       seasons: ["1996-97", "1997-98", "1998-99", "1999-00"], primaryPosition: "C"  },
  { id: "hogan_ryan",         fullName: "Ryan Hogan",            seasons: ["1997-98", "1998-99", "1999-00"],     primaryPosition: "PF" },
  { id: "tackett_todd",       fullName: "Todd Tackett",          seasons: ["1998-99", "1999-00", "2000-01"],     primaryPosition: "SG" },
  { id: "masiello_steve",     fullName: "Steve Masiello",        seasons: ["1996-97", "1997-98", "1998-99", "1999-00", "2000-01"], primaryPosition: "PG" },
  { id: "allison_desmond",    fullName: "Desmond Allison",       seasons: ["1997-98", "1998-99", "1999-00"],     primaryPosition: "SF" },
  { id: "anthony_myron",      fullName: "Myron Anthony",         seasons: ["1997-98", "1998-99", "1999-00"],     primaryPosition: "SF" },

  // ── 1998-99 ───────────────────────────────────────────────────────────────
  { id: "padgett_scott",      fullName: "Scott Padgett",         seasons: ["1995-96", "1996-97", "1997-98", "1998-99"], primaryPosition: "PF" },
  { id: "evans_heshimu",      fullName: "Heshimu Evans",         seasons: ["1997-98", "1998-99"],                primaryPosition: "SF" },
  { id: "turner_wayne",       fullName: "Wayne Turner",          seasons: ["1995-96", "1996-97", "1997-98", "1998-99"], primaryPosition: "PG" },
  { id: "mills_cameron",      fullName: "Cameron Mills",         seasons: ["1995-96", "1996-97", "1997-98", "1998-99"], primaryPosition: "SG" },
  { id: "bradley_michael",    fullName: "Michael Bradley",       seasons: ["1997-98", "1998-99", "1999-00"],     primaryPosition: "C"  },

  // ── 1997-98 ───────────────────────────────────────────────────────────────
  { id: "sheppard_jeff",      fullName: "Jeff Sheppard",         seasons: ["1994-95", "1995-96", "1997-98"],     primaryPosition: "SG" },
  { id: "mohammed_nazr",      fullName: "Nazr Mohammed",         seasons: ["1995-96", "1996-97", "1997-98"],     primaryPosition: "C"  },
  { id: "edwards_allen",      fullName: "Allen Edwards",         seasons: ["1995-96", "1996-97", "1997-98", "1998-99"], primaryPosition: "SG" },

  // ── 1996-97 ───────────────────────────────────────────────────────────────
  { id: "mercer_ron",         fullName: "Ron Mercer",            seasons: ["1995-96", "1996-97"],                primaryPosition: "SG" },
  { id: "anderson_derek",     fullName: "Derek Anderson",        seasons: ["1995-96", "1996-97"],                primaryPosition: "SG" },
  { id: "epps_anthony",       fullName: "Anthony Epps",          seasons: ["1993-94", "1994-95", "1995-96", "1996-97"], primaryPosition: "PG" },
  { id: "prickett_jared",     fullName: "Jared Prickett",        seasons: ["1993-94", "1994-95", "1995-96", "1996-97"], primaryPosition: "PF" },
  { id: "simmons_oliver",     fullName: "Oliver Simmons",        seasons: ["1996-97"],                           primaryPosition: "PF" },

  // ── 1995-96 ───────────────────────────────────────────────────────────────
  { id: "delk_tony",          fullName: "Tony Delk",             seasons: ["1992-93", "1993-94", "1994-95", "1995-96"], primaryPosition: "SG" },
  { id: "walker_antoine",     fullName: "Antoine Walker",        seasons: ["1994-95", "1995-96"],                primaryPosition: "PF" },
  { id: "mccarty_walter",     fullName: "Walter McCarty",        seasons: ["1993-94", "1994-95", "1995-96"],     primaryPosition: "PF" },
  { id: "pope_mark",          fullName: "Mark Pope",             seasons: ["1993-94", "1994-95", "1995-96"],     primaryPosition: "C"  },
  { id: "riddick_andre",      fullName: "Andre Riddick",         seasons: ["1992-93", "1993-94", "1994-95"],     primaryPosition: "C"  },

  // ── 1993-94 ───────────────────────────────────────────────────────────────
  { id: "rhodes_rodrick",     fullName: "Rodrick Rhodes",        seasons: ["1992-93", "1993-94", "1994-95"],     primaryPosition: "SF" },
  { id: "ford_travis",        fullName: "Travis Ford",           seasons: ["1990-91", "1991-92", "1992-93", "1993-94"], primaryPosition: "PG" },
  { id: "dent_rodney",        fullName: "Rodney Dent",           seasons: ["1993-94"],                           primaryPosition: "C"  },
  { id: "brassow_jeff",       fullName: "Jeff Brassow",          seasons: ["1990-91", "1991-92", "1992-93", "1993-94"], primaryPosition: "SF" },
  { id: "martinez_gimel",     fullName: "Gimel Martinez",        seasons: ["1992-93", "1993-94", "1994-95"],     primaryPosition: "SF" },
  { id: "harrison_chris",     fullName: "Chris Harrison",        seasons: ["1993-94"],                           primaryPosition: "PG" },

  // ── 1992-93 ───────────────────────────────────────────────────────────────
  { id: "mashburn_jamal",     fullName: "Jamal Mashburn",        seasons: ["1990-91", "1991-92", "1992-93"],     primaryPosition: "PF" },
  { id: "woods_sean",         fullName: "Sean Woods",            seasons: ["1989-90", "1990-91", "1991-92"],     primaryPosition: "PG" },

  // ── 1991-92 ───────────────────────────────────────────────────────────────
  { id: "pelphrey_john",      fullName: "John Pelphrey",         seasons: ["1988-89", "1989-90", "1990-91", "1991-92"], primaryPosition: "SF" },
  { id: "feldhaus_deron",     fullName: "Deron Feldhaus",        seasons: ["1988-89", "1989-90", "1990-91", "1991-92"], primaryPosition: "SF" },
  { id: "farmer_richie",      fullName: "Richie Farmer",         seasons: ["1988-89", "1989-90", "1990-91", "1991-92"], primaryPosition: "SG" },

  // ── 1987-88 ───────────────────────────────────────────────────────────────
  { id: "chapman_rex",        fullName: "Rex Chapman",           seasons: ["1986-87", "1987-88"],                primaryPosition: "SG" },
  { id: "davender_ed",        fullName: "Ed Davender",           seasons: ["1984-85", "1985-86", "1986-87", "1987-88"], primaryPosition: "PG" },
  { id: "hanson_reggie",      fullName: "Reggie Hanson",         seasons: ["1986-87", "1987-88", "1988-89"],     primaryPosition: "C"  },
  { id: "blackmon_james",     fullName: "James Blackmon",        seasons: ["1984-85", "1985-86", "1986-87"],     primaryPosition: "SG" },

  // ── 1985-86 ───────────────────────────────────────────────────────────────
  { id: "walker_kenny",       fullName: "Kenny Walker",          seasons: ["1982-83", "1983-84", "1984-85", "1985-86"], primaryPosition: "SF" },
  { id: "harden_roger",       fullName: "Roger Harden",          seasons: ["1982-83", "1983-84", "1984-85", "1985-86"], primaryPosition: "PG" },
  { id: "madison_richard",    fullName: "Richard Madison",       seasons: ["1983-84", "1984-85", "1985-86", "1986-87"], primaryPosition: "PF" },

  // ── 1983-84 ───────────────────────────────────────────────────────────────
  { id: "turpin_melvin",      fullName: "Melvin Turpin",         seasons: ["1980-81", "1981-82", "1982-83", "1983-84"], primaryPosition: "C"  },
  { id: "master_jim",         fullName: "Jim Master",            seasons: ["1980-81", "1981-82", "1982-83", "1983-84"], primaryPosition: "SG" },
  { id: "bowie_sam",          fullName: "Sam Bowie",             seasons: ["1979-80", "1980-81", "1983-84"],     primaryPosition: "C"  },

  // ── 1981-82 ───────────────────────────────────────────────────────────────
  { id: "beal_dicky",         fullName: "Dicky Beal",            seasons: ["1980-81", "1981-82", "1982-83", "1983-84"], primaryPosition: "PG" },
  { id: "shidler_jay",        fullName: "Jay Shidler",           seasons: ["1979-80", "1980-81", "1981-82"],     primaryPosition: "SG" },
  { id: "cowan_fred",         fullName: "Fred Cowan",            seasons: ["1979-80", "1980-81", "1981-82", "1982-83"], primaryPosition: "PF" },
  { id: "hurt_charles",       fullName: "Charles Hurt",          seasons: ["1979-80", "1980-81", "1981-82"],     primaryPosition: "PF" },

  // ── 1979-80 ───────────────────────────────────────────────────────────────
  { id: "macy_kyle",          fullName: "Kyle Macy",             seasons: ["1977-78", "1978-79", "1979-80"],     primaryPosition: "PG" },
  { id: "hord_derrick",       fullName: "Derrick Hord",          seasons: ["1979-80", "1980-81", "1981-82", "1982-83"], primaryPosition: "SF" },
  { id: "minniefield_dirk",   fullName: "Dirk Minniefield",      seasons: ["1979-80", "1980-81", "1981-82", "1982-83"], primaryPosition: "PG" },
  { id: "anderson_dwight",    fullName: "Dwight Anderson",       seasons: ["1979-80"],                           primaryPosition: "SG" },
  { id: "verderber_chuck",    fullName: "Chuck Verderber",       seasons: ["1979-80", "1980-81"],                primaryPosition: "PF" },
  { id: "heitz_tom",          fullName: "Tom Heitz",             seasons: ["1978-79", "1979-80", "1980-81"],     primaryPosition: "C"  },
  { id: "williams_lavon",     fullName: "Lavon Williams",        seasons: ["1979-80", "1980-81"],                primaryPosition: "PF" },
  { id: "gettelfinger_chris", fullName: "Chris Gettelfinger",    seasons: ["1978-79", "1979-80"],                primaryPosition: "SF" },
  { id: "lanter_bo",          fullName: "Bo Lanter",             seasons: ["1979-80", "1980-81", "1981-82"],     primaryPosition: "SF" },

  // ── 1977-78 ───────────────────────────────────────────────────────────────
  { id: "givens_jack",        fullName: "Jack Givens",           seasons: ["1974-75", "1975-76", "1976-77", "1977-78"], primaryPosition: "SF" },
  { id: "robey_rick",         fullName: "Rick Robey",            seasons: ["1974-75", "1975-76", "1976-77", "1977-78"], primaryPosition: "C"  },
  { id: "casey_dwane",        fullName: "Dwane Casey",           seasons: ["1975-76", "1976-77", "1977-78", "1978-79"], primaryPosition: "PG" },
  { id: "grevey_kevin",       fullName: "Kevin Grevey",          seasons: ["1972-73", "1973-74", "1974-75"],     primaryPosition: "SF" },
  { id: "conner_jimmydan",    fullName: "Jimmy Dan Conner",      seasons: ["1972-73", "1973-74", "1974-75"],     primaryPosition: "PG" },

  // ── 1969-70 ───────────────────────────────────────────────────────────────
  { id: "issel_dan",          fullName: "Dan Issel",             seasons: ["1967-68", "1968-69", "1969-70"],     primaryPosition: "C"  },
  { id: "pratt_mike",         fullName: "Mike Pratt",            seasons: ["1967-68", "1968-69", "1969-70"],     primaryPosition: "SF" },
  { id: "steele_larry",       fullName: "Larry Steele",          seasons: ["1969-70", "1970-71"],                primaryPosition: "SG" },
  { id: "parker_tom",         fullName: "Tom Parker",            seasons: ["1968-69", "1969-70", "1970-71"],     primaryPosition: "SF" },
  { id: "mills_terry",        fullName: "Terry Mills",           seasons: ["1969-70", "1970-71"],                primaryPosition: "PG" },
  { id: "hollenbeck_kent",    fullName: "Kent Hollenbeck",       seasons: ["1968-69", "1969-70", "1970-71"],     primaryPosition: "PG" },
  { id: "key_stan",           fullName: "Stan Key",              seasons: ["1969-70", "1970-71", "1971-72"],     primaryPosition: "SF" },
  { id: "payne_tom",          fullName: "Tom Payne",             seasons: ["1970-71"],                           primaryPosition: "C"  },

  // ── 1965-66 ───────────────────────────────────────────────────────────────
  { id: "riley_pat",          fullName: "Pat Riley",             seasons: ["1963-64", "1964-65", "1965-66"],     primaryPosition: "SF" },
  { id: "dampier_louie",      fullName: "Louie Dampier",         seasons: ["1964-65", "1965-66", "1966-67"],     primaryPosition: "SG" },
  { id: "kron_tommy",         fullName: "Tommy Kron",            seasons: ["1963-64", "1964-65", "1965-66"],     primaryPosition: "PG" },
  { id: "conley_larry",       fullName: "Larry Conley",          seasons: ["1963-64", "1964-65", "1965-66"],     primaryPosition: "SF" },
  { id: "jaracz_thad",        fullName: "Thad Jaracz",           seasons: ["1964-65", "1965-66", "1966-67"],     primaryPosition: "C"  },
  { id: "embry_randy",        fullName: "Randy Embry",           seasons: ["1965-66", "1966-67", "1967-68"],     primaryPosition: "PG" },

  // ── 1963-64 ───────────────────────────────────────────────────────────────
  { id: "nash_cotton",        fullName: "Cotton Nash",           seasons: ["1961-62", "1962-63", "1963-64"],     primaryPosition: "C"  },

  // ── 1957-58 ───────────────────────────────────────────────────────────────
  { id: "hatton_vernon",      fullName: "Vernon Hatton",         seasons: ["1955-56", "1956-57", "1957-58"],     primaryPosition: "SG" },
  { id: "crigler_john",       fullName: "John Crigler",          seasons: ["1955-56", "1956-57", "1957-58"],     primaryPosition: "SF" },
  { id: "beck_ed",            fullName: "Ed Beck",               seasons: ["1955-56", "1956-57", "1957-58"],     primaryPosition: "C"  },
  { id: "cox_johnny",         fullName: "Johnny Cox",            seasons: ["1956-57", "1957-58", "1958-59"],     primaryPosition: "SF" },
  { id: "mills_don",          fullName: "Don Mills",             seasons: ["1957-58", "1958-59", "1959-60"],     primaryPosition: "PF" },
  { id: "cohen_sid",          fullName: "Sid Cohen",             seasons: ["1957-58", "1958-59", "1959-60", "1960-61"], primaryPosition: "SG" },
  { id: "lickert_bill",       fullName: "Bill Lickert",          seasons: ["1958-59", "1959-60", "1960-61"],     primaryPosition: "SF" },
  { id: "parsons_dick",       fullName: "Dick Parsons",          seasons: ["1958-59", "1959-60", "1960-61"],     primaryPosition: "PG" },
  { id: "jennings_ned",       fullName: "Ned Jennings",          seasons: ["1958-59", "1959-60", "1960-61"],     primaryPosition: "C"  },
  { id: "pursiful_larry",     fullName: "Larry Pursiful",        seasons: ["1959-60", "1960-61", "1961-62"],     primaryPosition: "SG" },
  { id: "burchett_carroll",   fullName: "Carroll Burchett",      seasons: ["1959-60", "1960-61", "1961-62"],     primaryPosition: "PF" },
  { id: "feldhaus_allen",     fullName: "Allen Feldhaus",        seasons: ["1959-60", "1960-61", "1961-62"],     primaryPosition: "SF" },
  { id: "coffman_bennie",     fullName: "Bennie Coffman",        seasons: ["1958-59", "1959-60"],                primaryPosition: "PF" },

  // ── 1953-54 ───────────────────────────────────────────────────────────────
  { id: "hagan_cliff",        fullName: "Cliff Hagan",           seasons: ["1950-51", "1951-52", "1953-54"],     primaryPosition: "SF" },
  { id: "ramsey_frank",       fullName: "Frank Ramsey",          seasons: ["1950-51", "1951-52", "1953-54"],     primaryPosition: "SG" },
  { id: "tsioropoulos_lou",   fullName: "Lou Tsioropoulos",      seasons: ["1951-52", "1952-53", "1953-54"],     primaryPosition: "SF" },

  // ── 1949-50 ───────────────────────────────────────────────────────────────
  { id: "beard_ralph",        fullName: "Ralph Beard",           seasons: ["1945-46", "1946-47", "1947-48", "1948-49"], primaryPosition: "PG" },
  { id: "groza_alex",         fullName: "Alex Groza",            seasons: ["1944-45", "1946-47", "1947-48", "1948-49"], primaryPosition: "C"  },
  { id: "rollins_ken",        fullName: "Ken Rollins",           seasons: ["1944-45", "1946-47", "1947-48", "1948-49"], primaryPosition: "PG" },
  { id: "barker_cliff",       fullName: "Cliff Barker",          seasons: ["1944-45", "1946-47", "1947-48", "1948-49"], primaryPosition: "SG" },
  { id: "jones_wallace",      fullName: "Wallace Jones",         seasons: ["1945-46", "1946-47", "1947-48", "1948-49"], primaryPosition: "SF" },
  { id: "spivey_bill",        fullName: "Bill Spivey",           seasons: ["1949-50", "1950-51"],                primaryPosition: "C"  },
  { id: "linville_shelby",    fullName: "Shelby Linville",       seasons: ["1949-50", "1950-51", "1951-52"],     primaryPosition: "PF" },
  { id: "line_jim",           fullName: "Jim Line",              seasons: ["1947-48", "1948-49", "1949-50"],     primaryPosition: "SF" },
  { id: "watson_bobby",       fullName: "Bobby Watson",          seasons: ["1949-50", "1950-51", "1951-52"],     primaryPosition: "SG" },
  { id: "hirsch_walter",      fullName: "Walter Hirsch",         seasons: ["1949-50", "1950-51"],                primaryPosition: "PF" },
  { id: "barnstable_dale",    fullName: "Dale Barnstable",       seasons: ["1947-48", "1948-49", "1949-50"],     primaryPosition: "SG" },
  { id: "whitaker_lucian",    fullName: "Lucian Whitaker",       seasons: ["1947-48", "1948-49", "1949-50"],     primaryPosition: "PG" },
  { id: "newton_cm",          fullName: "C.M. Newton",           seasons: ["1948-49", "1949-50", "1950-51"],     primaryPosition: "SF" },
  { id: "noel_paul",          fullName: "Paul Noel",             seasons: ["1944-45", "1945-46", "1946-47"],     primaryPosition: "SF" },

  // ── 1939-40 ───────────────────────────────────────────────────────────────
  { id: "rouse_layton",       fullName: "Layton Rouse",          seasons: ["1939-40", "1940-41"],                primaryPosition: "PF" },
  { id: "cluggish_marion",    fullName: "Marion Cluggish",       seasons: ["1939-40", "1940-41", "1941-42"],     primaryPosition: "C"  },
  { id: "allen_ermal",        fullName: "Ermal Allen",           seasons: ["1939-40", "1940-41", "1941-42"],     primaryPosition: "SG" },
  { id: "farnsley_keith",     fullName: "Keith Farnsley",        seasons: ["1939-40", "1940-41"],                primaryPosition: "SF" },
  { id: "huber_lee",          fullName: "Lee Huber",             seasons: ["1939-40", "1940-41"],                primaryPosition: "SF" },
  { id: "combs_carl",         fullName: "Carl Combs",            seasons: ["1938-39", "1939-40"],                primaryPosition: "PG" },
  { id: "white_waller",       fullName: "Waller White",          seasons: ["1939-40", "1940-41"],                primaryPosition: "SF" },
  { id: "king_james",         fullName: "James King",            seasons: ["1937-38", "1938-39", "1939-40"],     primaryPosition: "PF" },
  { id: "opper_bernie",       fullName: "Bernard Opper",         seasons: ["1937-38", "1938-39"],                primaryPosition: "PG" },
  { id: "staker_carl",        fullName: "Carl Staker",           seasons: ["1938-39", "1939-40"],                primaryPosition: "C"  },

  // ── 1930s ─────────────────────────────────────────────────────────────────
  { id: "sale_forest",        fullName: "Forest Sale",           seasons: ["1930-31", "1931-32", "1932-33"],     primaryPosition: "C"  },
  { id: "spicer_carey",       fullName: "Carey Spicer",          seasons: ["1928-29", "1929-30", "1930-31"],     primaryPosition: "SF" },
  { id: "mcbrayer_paul",      fullName: "Paul McBrayer",         seasons: ["1928-29", "1929-30", "1930-31"],     primaryPosition: "SG" },
  { id: "hayden_basil",       fullName: "Basil Hayden",          seasons: ["1920-21", "1921-22", "1922-23"],     primaryPosition: "PG" },

];

// Build a season → players lookup map
export const seasonPlayersMap = players.reduce((map, player) => {
  player.seasons.forEach((season) => {
    if (!map[season]) map[season] = [];
    map[season].push(player);
  });
  return map;
}, {});

// All unique seasons, sorted descending — only include seasons with ≥ 6 players
// Only include seasons from 1950 onwards (modern era with complete stats)
const MIN_SEASON_YEAR = 1950;

export const allSeasons = Object.keys(seasonPlayersMap)
  .filter((s) => seasonPlayersMap[s].length >= 6)
  .filter((s) => parseInt(s.split("-")[0]) >= MIN_SEASON_YEAR)
  .sort((a, b) => {
    const yearA = parseInt(a.split("-")[0]);
    const yearB = parseInt(b.split("-")[0]);
    return yearB - yearA;
  });

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

export const POSITION_LABELS = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C:  "Center",
};
