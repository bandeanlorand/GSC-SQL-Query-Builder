const predefinedCountries = [
  {
    "code": "AFG",
    "name": "Afghanistan"
  },
  {
    "code": "ALA",
    "name": "\u00c5land Islands"
  },
  {
    "code": "ALB",
    "name": "Albania"
  },
  {
    "code": "DZA",
    "name": "Algeria"
  },
  {
    "code": "ASM",
    "name": "American Samoa"
  },
  {
    "code": "AND",
    "name": "Andorra"
  },
  {
    "code": "AGO",
    "name": "Angola"
  },
  {
    "code": "AIA",
    "name": "Anguilla"
  },
  {
    "code": "ATA",
    "name": "Antarctica"
  },
  {
    "code": "ATG",
    "name": "Antigua and Barbuda"
  },
  {
    "code": "ARG",
    "name": "Argentina"
  },
  {
    "code": "ARM",
    "name": "Armenia"
  },
  {
    "code": "ABW",
    "name": "Aruba"
  },
  {
    "code": "AUS",
    "name": "Australia"
  },
  {
    "code": "AUT",
    "name": "Austria"
  },
  {
    "code": "AZE",
    "name": "Azerbaijan"
  },
  {
    "code": "BHS",
    "name": "Bahamas"
  },
  {
    "code": "BHR",
    "name": "Bahrain"
  },
  {
    "code": "BGD",
    "name": "Bangladesh"
  },
  {
    "code": "BRB",
    "name": "Barbados"
  },
  {
    "code": "BLR",
    "name": "Belarus"
  },
  {
    "code": "BEL",
    "name": "Belgium"
  },
  {
    "code": "BLZ",
    "name": "Belize"
  },
  {
    "code": "BEN",
    "name": "Benin"
  },
  {
    "code": "BMU",
    "name": "Bermuda"
  },
  {
    "code": "BTN",
    "name": "Bhutan"
  },
  {
    "code": "BOL",
    "name": "Bolivia, Plurinational State of"
  },
  {
    "code": "BES",
    "name": "Bonaire, Sint Eustatius and Saba"
  },
  {
    "code": "BIH",
    "name": "Bosnia and Herzegovina"
  },
  {
    "code": "BWA",
    "name": "Botswana"
  },
  {
    "code": "BVT",
    "name": "Bouvet Island"
  },
  {
    "code": "BRA",
    "name": "Brazil"
  },
  {
    "code": "IOT",
    "name": "British Indian Ocean Territory"
  },
  {
    "code": "BRN",
    "name": "Brunei Darussalam"
  },
  {
    "code": "BGR",
    "name": "Bulgaria"
  },
  {
    "code": "BFA",
    "name": "Burkina Faso"
  },
  {
    "code": "BDI",
    "name": "Burundi"
  },
  {
    "code": "KHM",
    "name": "Cambodia"
  },
  {
    "code": "CMR",
    "name": "Cameroon"
  },
  {
    "code": "CAN",
    "name": "Canada"
  },
  {
    "code": "CPV",
    "name": "Cape Verde"
  },
  {
    "code": "CYM",
    "name": "Cayman Islands"
  },
  {
    "code": "CAF",
    "name": "Central African Republic"
  },
  {
    "code": "TCD",
    "name": "Chad"
  },
  {
    "code": "CHL",
    "name": "Chile"
  },
  {
    "code": "CHN",
    "name": "China"
  },
  {
    "code": "CXR",
    "name": "Christmas Island"
  },
  {
    "code": "CCK",
    "name": "Cocos (Keeling) Islands"
  },
  {
    "code": "COL",
    "name": "Colombia"
  },
  {
    "code": "COM",
    "name": "Comoros"
  },
  {
    "code": "COG",
    "name": "Congo"
  },
  {
    "code": "COD",
    "name": "Congo, the Democratic Republic of the"
  },
  {
    "code": "COK",
    "name": "Cook Islands"
  },
  {
    "code": "CRI",
    "name": "Costa Rica"
  },
  {
    "code": "CIV",
    "name": "C\u00f4te d'Ivoire"
  },
  {
    "code": "HRV",
    "name": "Croatia"
  },
  {
    "code": "CUB",
    "name": "Cuba"
  },
  {
    "code": "CUW",
    "name": "Cura\u00e7ao"
  },
  {
    "code": "CYP",
    "name": "Cyprus"
  },
  {
    "code": "CZE",
    "name": "Czech Republic"
  },
  {
    "code": "DNK",
    "name": "Denmark"
  },
  {
    "code": "DJI",
    "name": "Djibouti"
  },
  {
    "code": "DMA",
    "name": "Dominica"
  },
  {
    "code": "DOM",
    "name": "Dominican Republic"
  },
  {
    "code": "ECU",
    "name": "Ecuador"
  },
  {
    "code": "EGY",
    "name": "Egypt"
  },
  {
    "code": "SLV",
    "name": "El Salvador"
  },
  {
    "code": "GNQ",
    "name": "Equatorial Guinea"
  },
  {
    "code": "ERI",
    "name": "Eritrea"
  },
  {
    "code": "EST",
    "name": "Estonia"
  },
  {
    "code": "ETH",
    "name": "Ethiopia"
  },
  {
    "code": "FLK",
    "name": "Falkland Islands (Malvinas)"
  },
  {
    "code": "FRO",
    "name": "Faroe Islands"
  },
  {
    "code": "FJI",
    "name": "Fiji"
  },
  {
    "code": "FIN",
    "name": "Finland"
  },
  {
    "code": "FRA",
    "name": "France"
  },
  {
    "code": "GUF",
    "name": "French Guiana"
  },
  {
    "code": "PYF",
    "name": "French Polynesia"
  },
  {
    "code": "ATF",
    "name": "French Southern Territories"
  },
  {
    "code": "GAB",
    "name": "Gabon"
  },
  {
    "code": "GMB",
    "name": "Gambia"
  },
  {
    "code": "GEO",
    "name": "Georgia"
  },
  {
    "code": "DEU",
    "name": "Germany"
  },
  {
    "code": "GHA",
    "name": "Ghana"
  },
  {
    "code": "GIB",
    "name": "Gibraltar"
  },
  {
    "code": "GRC",
    "name": "Greece"
  },
  {
    "code": "GRL",
    "name": "Greenland"
  },
  {
    "code": "GRD",
    "name": "Grenada"
  },
  {
    "code": "GLP",
    "name": "Guadeloupe"
  },
  {
    "code": "GUM",
    "name": "Guam"
  },
  {
    "code": "GTM",
    "name": "Guatemala"
  },
  {
    "code": "GGY",
    "name": "Guernsey"
  },
  {
    "code": "GIN",
    "name": "Guinea"
  },
  {
    "code": "GNB",
    "name": "Guinea-Bissau"
  },
  {
    "code": "GUY",
    "name": "Guyana"
  },
  {
    "code": "HTI",
    "name": "Haiti"
  },
  {
    "code": "HMD",
    "name": "Heard Island and McDonald Islands"
  },
  {
    "code": "VAT",
    "name": "Holy See (Vatican City State)"
  },
  {
    "code": "HND",
    "name": "Honduras"
  },
  {
    "code": "HKG",
    "name": "Hong Kong"
  },
  {
    "code": "HUN",
    "name": "Hungary"
  },
  {
    "code": "ISL",
    "name": "Iceland"
  },
  {
    "code": "IND",
    "name": "India"
  },
  {
    "code": "IDN",
    "name": "Indonesia"
  },
  {
    "code": "IRN",
    "name": "Iran, Islamic Republic of"
  },
  {
    "code": "IRQ",
    "name": "Iraq"
  },
  {
    "code": "IRL",
    "name": "Ireland"
  },
  {
    "code": "IMN",
    "name": "Isle of Man"
  },
  {
    "code": "ISR",
    "name": "Israel"
  },
  {
    "code": "ITA",
    "name": "Italy"
  },
  {
    "code": "JAM",
    "name": "Jamaica"
  },
  {
    "code": "JPN",
    "name": "Japan"
  },
  {
    "code": "JEY",
    "name": "Jersey"
  },
  {
    "code": "JOR",
    "name": "Jordan"
  },
  {
    "code": "KAZ",
    "name": "Kazakhstan"
  },
  {
    "code": "KEN",
    "name": "Kenya"
  },
  {
    "code": "KIR",
    "name": "Kiribati"
  },
  {
    "code": "PRK",
    "name": "Korea, Democratic People's Republic of"
  },
  {
    "code": "KOR",
    "name": "Korea, Republic of"
  },
  {
    "code": "KWT",
    "name": "Kuwait"
  },
  {
    "code": "KGZ",
    "name": "Kyrgyzstan"
  },
  {
    "code": "LAO",
    "name": "Lao People's Democratic Republic"
  },
  {
    "code": "LVA",
    "name": "Latvia"
  },
  {
    "code": "LBN",
    "name": "Lebanon"
  },
  {
    "code": "LSO",
    "name": "Lesotho"
  },
  {
    "code": "LBR",
    "name": "Liberia"
  },
  {
    "code": "LBY",
    "name": "Libya"
  },
  {
    "code": "LIE",
    "name": "Liechtenstein"
  },
  {
    "code": "LTU",
    "name": "Lithuania"
  },
  {
    "code": "LUX",
    "name": "Luxembourg"
  },
  {
    "code": "MAC",
    "name": "Macao"
  },
  {
    "code": "MKD",
    "name": "Macedonia, The Former Yugoslav Republic of"
  },
  {
    "code": "MDG",
    "name": "Madagascar"
  },
  {
    "code": "MWI",
    "name": "Malawi"
  },
  {
    "code": "MYS",
    "name": "Malaysia"
  },
  {
    "code": "MDV",
    "name": "Maldives"
  },
  {
    "code": "MLI",
    "name": "Mali"
  },
  {
    "code": "MLT",
    "name": "Malta"
  },
  {
    "code": "MHL",
    "name": "Marshall Islands"
  },
  {
    "code": "MTQ",
    "name": "Martinique"
  },
  {
    "code": "MRT",
    "name": "Mauritania"
  },
  {
    "code": "MUS",
    "name": "Mauritius"
  },
  {
    "code": "MYT",
    "name": "Mayotte"
  },
  {
    "code": "MEX",
    "name": "Mexico"
  },
  {
    "code": "FSM",
    "name": "Micronesia, Federated States of"
  },
  {
    "code": "MDA",
    "name": "Moldova, Republic of"
  },
  {
    "code": "MCO",
    "name": "Monaco"
  },
  {
    "code": "MNG",
    "name": "Mongolia"
  },
  {
    "code": "MNE",
    "name": "Montenegro"
  },
  {
    "code": "MSR",
    "name": "Montserrat"
  },
  {
    "code": "MAR",
    "name": "Morocco"
  },
  {
    "code": "MOZ",
    "name": "Mozambique"
  },
  {
    "code": "MMR",
    "name": "Myanmar"
  },
  {
    "code": "NAM",
    "name": "Namibia"
  },
  {
    "code": "NRU",
    "name": "Nauru"
  },
  {
    "code": "NPL",
    "name": "Nepal"
  },
  {
    "code": "NLD",
    "name": "Netherlands"
  },
  {
    "code": "NCL",
    "name": "New Caledonia"
  },
  {
    "code": "NZL",
    "name": "New Zealand"
  },
  {
    "code": "NIC",
    "name": "Nicaragua"
  },
  {
    "code": "NER",
    "name": "Niger"
  },
  {
    "code": "NGA",
    "name": "Nigeria"
  },
  {
    "code": "NIU",
    "name": "Niue"
  },
  {
    "code": "NFK",
    "name": "Norfolk Island"
  },
  {
    "code": "MNP",
    "name": "Northern Mariana Islands"
  },
  {
    "code": "NOR",
    "name": "Norway"
  },
  {
    "code": "OMN",
    "name": "Oman"
  },
  {
    "code": "PAK",
    "name": "Pakistan"
  },
  {
    "code": "PLW",
    "name": "Palau"
  },
  {
    "code": "PSE",
    "name": "Palestinian Territory, Occupied"
  },
  {
    "code": "PAN",
    "name": "Panama"
  },
  {
    "code": "PNG",
    "name": "Papua New Guinea"
  },
  {
    "code": "PRY",
    "name": "Paraguay"
  },
  {
    "code": "PER",
    "name": "Peru"
  },
  {
    "code": "PHL",
    "name": "Philippines"
  },
  {
    "code": "PCN",
    "name": "Pitcairn"
  },
  {
    "code": "POL",
    "name": "Poland"
  },
  {
    "code": "PRT",
    "name": "Portugal"
  },
  {
    "code": "PRI",
    "name": "Puerto Rico"
  },
  {
    "code": "QAT",
    "name": "Qatar"
  },
  {
    "code": "REU",
    "name": "R\u00e9union"
  },
  {
    "code": "ROU",
    "name": "Romania"
  },
  {
    "code": "RUS",
    "name": "Russian Federation"
  },
  {
    "code": "RWA",
    "name": "Rwanda"
  },
  {
    "code": "BLM",
    "name": "Saint Barth\u00e9lemy"
  },
  {
    "code": "SHN",
    "name": "Saint Helena, Ascension and Tristan da Cunha"
  },
  {
    "code": "KNA",
    "name": "Saint Kitts and Nevis"
  },
  {
    "code": "LCA",
    "name": "Saint Lucia"
  },
  {
    "code": "MAF",
    "name": "Saint Martin (French part)"
  },
  {
    "code": "SPM",
    "name": "Saint Pierre and Miquelon"
  },
  {
    "code": "VCT",
    "name": "Saint Vincent and the Grenadines"
  },
  {
    "code": "WSM",
    "name": "Samoa"
  },
  {
    "code": "SMR",
    "name": "San Marino"
  },
  {
    "code": "STP",
    "name": "Sao Tome and Principe"
  },
  {
    "code": "SAU",
    "name": "Saudi Arabia"
  },
  {
    "code": "SEN",
    "name": "Senegal"
  },
  {
    "code": "SRB",
    "name": "Serbia"
  },
  {
    "code": "SYC",
    "name": "Seychelles"
  },
  {
    "code": "SLE",
    "name": "Sierra Leone"
  },
  {
    "code": "SGP",
    "name": "Singapore"
  },
  {
    "code": "SXM",
    "name": "Sint Maarten (Dutch part)"
  },
  {
    "code": "SVK",
    "name": "Slovakia"
  },
  {
    "code": "SVN",
    "name": "Slovenia"
  },
  {
    "code": "SLB",
    "name": "Solomon Islands"
  },
  {
    "code": "SOM",
    "name": "Somalia"
  },
  {
    "code": "ZAF",
    "name": "South Africa"
  },
  {
    "code": "SGS",
    "name": "South Georgia and the South Sandwich Islands"
  },
  {
    "code": "SSD",
    "name": "South Sudan"
  },
  {
    "code": "ESP",
    "name": "Spain"
  },
  {
    "code": "LKA",
    "name": "Sri Lanka"
  },
  {
    "code": "SDN",
    "name": "Sudan"
  },
  {
    "code": "SUR",
    "name": "Suriname"
  },
  {
    "code": "SJM",
    "name": "Svalbard and Jan Mayen"
  },
  {
    "code": "SWZ",
    "name": "Swaziland"
  },
  {
    "code": "SWE",
    "name": "Sweden"
  },
  {
    "code": "CHE",
    "name": "Switzerland"
  },
  {
    "code": "SYR",
    "name": "Syrian Arab Republic"
  },
  {
    "code": "TWN",
    "name": "Taiwan, Province of China"
  },
  {
    "code": "TJK",
    "name": "Tajikistan"
  },
  {
    "code": "TZA",
    "name": "Tanzania, United Republic of"
  },
  {
    "code": "THA",
    "name": "Thailand"
  },
  {
    "code": "TLS",
    "name": "Timor-Leste"
  },
  {
    "code": "TGO",
    "name": "Togo"
  },
  {
    "code": "TKL",
    "name": "Tokelau"
  },
  {
    "code": "TON",
    "name": "Tonga"
  },
  {
    "code": "TTO",
    "name": "Trinidad and Tobago"
  },
  {
    "code": "TUN",
    "name": "Tunisia"
  },
  {
    "code": "TUR",
    "name": "Turkey"
  },
  {
    "code": "TKM",
    "name": "Turkmenistan"
  },
  {
    "code": "TCA",
    "name": "Turks and Caicos Islands"
  },
  {
    "code": "TUV",
    "name": "Tuvalu"
  },
  {
    "code": "UGA",
    "name": "Uganda"
  },
  {
    "code": "UKR",
    "name": "Ukraine"
  },
  {
    "code": "ARE",
    "name": "United Arab Emirates"
  },
  {
    "code": "GBR",
    "name": "United Kingdom"
  },
  {
    "code": "USA",
    "name": "United States"
  },
  {
    "code": "UMI",
    "name": "United States Minor Outlying Islands"
  },
  {
    "code": "URY",
    "name": "Uruguay"
  },
  {
    "code": "UZB",
    "name": "Uzbekistan"
  },
  {
    "code": "VUT",
    "name": "Vanuatu"
  },
  {
    "code": "VEN",
    "name": "Venezuela, Bolivarian Republic of"
  },
  {
    "code": "VNM",
    "name": "Viet Nam"
  },
  {
    "code": "VGB",
    "name": "Virgin Islands, British"
  },
  {
    "code": "VIR",
    "name": "Virgin Islands, U.S."
  },
  {
    "code": "WLF",
    "name": "Wallis and Futuna"
  },
  {
    "code": "ESH",
    "name": "Western Sahara"
  },
  {
    "code": "YEM",
    "name": "Yemen"
  },
  {
    "code": "ZMB",
    "name": "Zambia"
  },
  {
    "code": "ZWE",
    "name": "Zimbabwe"
  }
];

window.predefinedCountries = predefinedCountries;