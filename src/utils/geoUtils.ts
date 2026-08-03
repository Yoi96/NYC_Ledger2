import { NYCBorough } from "../types";

export interface NYCSubwayLine {
  id: string;
  name: string;
  color: string;
  textColor: string;
  bullet: string;
}

export const NYC_SUBWAY_LINES: NYCSubwayLine[] = [
  { id: "7", name: "7 Line", color: "bg-purple-700 border-purple-500", textColor: "text-purple-300", bullet: "7" },
  { id: "NQRW", name: "N / Q / R / W", color: "bg-yellow-500 border-yellow-400 text-slate-950", textColor: "text-yellow-400", bullet: "N" },
  { id: "ACE", name: "A / C / E", color: "bg-blue-600 border-blue-400", textColor: "text-blue-400", bullet: "A" },
  { id: "123", name: "1 / 2 / 3", color: "bg-red-600 border-red-400", textColor: "text-red-400", bullet: "1" },
  { id: "456", name: "4 / 5 / 6", color: "bg-emerald-600 border-emerald-400", textColor: "text-emerald-400", bullet: "4" },
  { id: "BDFM", name: "B / D / F / M", color: "bg-orange-600 border-orange-400", textColor: "text-orange-400", bullet: "F" },
  { id: "L", name: "L Line", color: "bg-slate-500 border-slate-400", textColor: "text-slate-300", bullet: "L" },
  { id: "JZ", name: "J / Z", color: "bg-amber-800 border-amber-600", textColor: "text-amber-500", bullet: "J" },
  { id: "G", name: "G Line", color: "bg-lime-600 border-lime-400", textColor: "text-lime-400", bullet: "G" },
  { id: "S", name: "S Shuttle", color: "bg-zinc-600 border-zinc-400", textColor: "text-zinc-300", bullet: "S" },
];

export interface NYCSubwayStation {
  name: string;
  borough: NYCBorough;
  neighborhood: string;
  lines: string[];
}

export const NYC_SUBWAY_STATIONS: NYCSubwayStation[] = [
  // --- 7 LINE (7车 - Flushing / Midtown / Hudson Yards) ---
  { name: "Flushing - Main St", borough: "Queens", neighborhood: "Flushing", lines: ["7", "7车"] },
  { name: "Mets - Willets Point", borough: "Queens", neighborhood: "Flushing", lines: ["7", "7车"] },
  { name: "111 St", borough: "Queens", neighborhood: "Corona", lines: ["7", "7车"] },
  { name: "103 St - Corona Plaza", borough: "Queens", neighborhood: "Corona", lines: ["7", "7车"] },
  { name: "Junction Blvd", borough: "Queens", neighborhood: "Jackson Heights", lines: ["7", "7车"] },
  { name: "90 St - Elmhurst Ave", borough: "Queens", neighborhood: "Elmhurst", lines: ["7", "7车"] },
  { name: "82 St - Jackson Hts", borough: "Queens", neighborhood: "Jackson Heights", lines: ["7", "7车"] },
  { name: "74 St - Broadway / Jackson Hts", borough: "Queens", neighborhood: "Jackson Heights", lines: ["7", "7车", "ACE", "A车", "E车", "BDFM", "F车", "M车", "NQRW", "R车"] },
  { name: "69 St", borough: "Queens", neighborhood: "Woodside", lines: ["7", "7车"] },
  { name: "61 St - Woodside", borough: "Queens", neighborhood: "Woodside", lines: ["7", "7车", "LIRR"] },
  { name: "52 St", borough: "Queens", neighborhood: "Woodside", lines: ["7", "7车"] },
  { name: "46 St - Bliss St", borough: "Queens", neighborhood: "Sunnyside", lines: ["7", "7车"] },
  { name: "40 St - Lowery St", borough: "Queens", neighborhood: "Sunnyside", lines: ["7", "7车"] },
  { name: "33 St - Rawson St", borough: "Queens", neighborhood: "Long Island City", lines: ["7", "7车"] },
  { name: "Queensboro Plaza", borough: "Queens", neighborhood: "Long Island City", lines: ["7", "7车", "NQRW", "N车", "W车"] },
  { name: "Court Sq / 23 St", borough: "Queens", neighborhood: "Long Island City", lines: ["7", "7车", "ACE", "E车", "G", "G车", "BDFM", "M车"] },
  { name: "Hunters Point Ave", borough: "Queens", neighborhood: "Long Island City", lines: ["7", "7车", "LIRR"] },
  { name: "Vernon Blvd - Jackson Ave", borough: "Queens", neighborhood: "Long Island City", lines: ["7", "7车"] },
  { name: "Grand Central - 42 St", borough: "Manhattan", neighborhood: "Midtown", lines: ["7", "7车", "456", "4车", "5车", "6车", "S", "S车"] },
  { name: "5th Ave - Bryant Pk", borough: "Manhattan", neighborhood: "Midtown", lines: ["7", "7车", "BDFM", "B车", "D车", "F车", "M车"] },
  { name: "Times Sq - 42 St", borough: "Manhattan", neighborhood: "Midtown", lines: ["7", "7车", "123", "1车", "2车", "3车", "NQRW", "N车", "Q车", "R车", "W车", "ACE", "A车", "C车", "E车", "S", "S车"] },
  { name: "34 St - Hudson Yards", borough: "Manhattan", neighborhood: "Midtown", lines: ["7", "7车"] },

  // --- D LINE (D车 - Bronx / 6th Ave / Brooklyn) ---
  { name: "Norwood - 205 St", borough: "Bronx", neighborhood: "Norwood", lines: ["BDFM", "D车"] },
  { name: "Bedford Park Blvd", borough: "Bronx", neighborhood: "Bedford Park", lines: ["BDFM", "D车", "B车"] },
  { name: "Kingsbridge Rd", borough: "Bronx", neighborhood: "Kingsbridge", lines: ["BDFM", "D车", "B车"] },
  { name: "Fordham Rd", borough: "Bronx", neighborhood: "Fordham", lines: ["BDFM", "D车", "B车"] },
  { name: "182-183 Sts", borough: "Bronx", neighborhood: "Fordham", lines: ["BDFM", "D车"] },
  { name: "Tremont Ave", borough: "Bronx", neighborhood: "Tremont", lines: ["BDFM", "D车", "B车"] },
  { name: "174-175 Sts", borough: "Bronx", neighborhood: "Tremont", lines: ["BDFM", "D车"] },
  { name: "170 St", borough: "Bronx", neighborhood: "Highbridge", lines: ["BDFM", "D车"] },
  { name: "167 St", borough: "Bronx", neighborhood: "Concourse", lines: ["BDFM", "D车"] },
  { name: "161 St - Yankee Stadium", borough: "Bronx", neighborhood: "Concourse", lines: ["BDFM", "D车", "B车", "456", "4车"] },
  { name: "155 St", borough: "Manhattan", neighborhood: "Harlem", lines: ["BDFM", "D车"] },
  { name: "145 St", borough: "Manhattan", neighborhood: "Harlem", lines: ["BDFM", "D车", "B车", "ACE", "A车", "C车"] },
  { name: "125 St", borough: "Manhattan", neighborhood: "Harlem", lines: ["BDFM", "D车", "B车", "ACE", "A车", "C车"] },
  { name: "59 St - Columbus Circle", borough: "Manhattan", neighborhood: "Upper West Side", lines: ["BDFM", "D车", "B车", "ACE", "A车", "C车", "123", "1车"] },
  { name: "7th Ave / 53 St", borough: "Manhattan", neighborhood: "Midtown", lines: ["BDFM", "D车", "E车"] },
  { name: "47-50 Sts - Rockefeller Ctr", borough: "Manhattan", neighborhood: "Midtown", lines: ["BDFM", "D车", "B车", "F车", "M车"] },
  { name: "42 St - Bryant Pk", borough: "Manhattan", neighborhood: "Midtown", lines: ["BDFM", "D车", "B车", "F车", "M车", "7", "7车"] },
  { name: "34 St - Herald Sq", borough: "Manhattan", neighborhood: "Midtown", lines: ["BDFM", "D车", "B车", "F车", "M车", "NQRW", "N车", "Q车", "R车", "W车"] },
  { name: "West 4 St - Wash Sq", borough: "Manhattan", neighborhood: "Greenwich Village", lines: ["BDFM", "D车", "B车", "F车", "M车", "ACE", "A车", "C车", "E车"] },
  { name: "Broadway - Lafayette St", borough: "Manhattan", neighborhood: "SoHo", lines: ["BDFM", "D车", "B车", "F车", "M车", "6车"] },
  { name: "Grand St", borough: "Manhattan", neighborhood: "Chinatown", lines: ["BDFM", "D车", "B车"] },
  { name: "DeKalb Ave", borough: "Brooklyn", neighborhood: "Downtown Brooklyn", lines: ["BDFM", "D车", "B车", "NQRW", "Q车", "R车"] },
  { name: "Atlantic Ave - Barclays Ctr", borough: "Brooklyn", neighborhood: "Downtown Brooklyn", lines: ["BDFM", "D车", "B车", "NQRW", "N车", "Q车", "R车", "123", "2车", "3车", "456", "4车", "5车", "LIRR"] },
  { name: "36 St", borough: "Brooklyn", neighborhood: "Sunset Park", lines: ["BDFM", "D车", "NQRW", "N车", "R车"] },
  { name: "9th Ave", borough: "Brooklyn", neighborhood: "Borough Park", lines: ["BDFM", "D车"] },
  { name: "Fort Hamilton Pkwy", borough: "Brooklyn", neighborhood: "Borough Park", lines: ["BDFM", "D车"] },
  { name: "50 St", borough: "Brooklyn", neighborhood: "Borough Park", lines: ["BDFM", "D车"] },
  { name: "55 St", borough: "Brooklyn", neighborhood: "Borough Park", lines: ["BDFM", "D车"] },
  { name: "62 St / New Utrecht Ave", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车", "NQRW", "N车"] },
  { name: "71 St", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车"] },
  { name: "79 St", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车"] },
  { name: "18th Ave", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车"] },
  { name: "20th Ave", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车"] },
  { name: "Bay Pkwy", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车"] },
  { name: "25th Ave", borough: "Brooklyn", neighborhood: "Bensonhurst", lines: ["BDFM", "D车"] },
  { name: "Bay 50 St", borough: "Brooklyn", neighborhood: "Gravesend", lines: ["BDFM", "D车"] },
  { name: "Coney Island - Stillwell Ave", borough: "Brooklyn", neighborhood: "Coney Island", lines: ["BDFM", "D车", "F车", "NQRW", "N车", "Q车"] },

  // --- A / C / E LINE (A/C/E车) ---
  { name: "Inwood - 207 St", borough: "Manhattan", neighborhood: "Inwood", lines: ["ACE", "A车"] },
  { name: "Dyckman St", borough: "Manhattan", neighborhood: "Inwood", lines: ["ACE", "A车"] },
  { name: "168 St", borough: "Manhattan", neighborhood: "Washington Heights", lines: ["ACE", "A车", "C车", "123", "1车"] },
  { name: "42 St - Port Authority Bus Terminal", borough: "Manhattan", neighborhood: "Midtown", lines: ["ACE", "A车", "C车", "E车", "123", "7", "NQRW"] },
  { name: "34 St - Penn Station", borough: "Manhattan", neighborhood: "Midtown", lines: ["ACE", "A车", "C车", "E车", "123", "1车", "2车", "3车", "LIRR"] },
  { name: "14 St / 8th Ave", borough: "Manhattan", neighborhood: "Chelsea", lines: ["ACE", "A车", "C车", "E车", "L", "L车"] },
  { name: "Spring St / Prince St", borough: "Manhattan", neighborhood: "SoHo", lines: ["ACE", "A车", "C车", "E车", "NQRW", "N车", "R车"] },
  { name: "Canal St", borough: "Manhattan", neighborhood: "Chinatown", lines: ["ACE", "A车", "C车", "E车", "NQRW", "N车", "Q车", "R车", "W车", "456", "J车"] },
  { name: "Fulton St Hub", borough: "Manhattan", neighborhood: "Financial District", lines: ["ACE", "A车", "C车", "123", "2车", "3车", "456", "4车", "5车", "J车"] },
  { name: "High St / DUMBO", borough: "Brooklyn", neighborhood: "DUMBO", lines: ["ACE", "A车", "C车"] },
  { name: "Jay St - MetroTech", borough: "Brooklyn", neighborhood: "Downtown Brooklyn", lines: ["ACE", "A车", "C车", "F车", "R车"] },
  { name: "JFK Airport / Howard Beach", borough: "Queens", neighborhood: "Howard Beach", lines: ["ACE", "A车"] },

  // --- L LINE (L车) ---
  { name: "8th Ave / 14th St", borough: "Manhattan", neighborhood: "Chelsea", lines: ["L", "L车", "ACE", "A车", "C车", "E车"] },
  { name: "6th Ave / 14th St", borough: "Manhattan", neighborhood: "Chelsea", lines: ["L", "L车", "BDFM", "F车", "M车", "123", "1车", "2车", "3车"] },
  { name: "14 St - Union Sq", borough: "Manhattan", neighborhood: "Union Square", lines: ["L", "L车", "456", "4车", "5车", "6车", "NQRW", "N车", "Q车", "R车", "W车"] },
  { name: "3rd Ave", borough: "Manhattan", neighborhood: "East Village", lines: ["L", "L车"] },
  { name: "1st Ave / Astor Pl", borough: "Manhattan", neighborhood: "East Village", lines: ["L", "L车", "456", "6车"] },
  { name: "Bedford Ave", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["L", "L车"] },
  { name: "Lorimer St / Metropolitan Ave", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["L", "L车", "G", "G车"] },
  { name: "Graham Ave", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["L", "L车"] },
  { name: "Grand St (Brooklyn)", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["L", "L车"] },
  { name: "Montrose Ave", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["L", "L车"] },
  { name: "Morgan Ave", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车"] },
  { name: "Jefferson St", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车"] },
  { name: "DeKalb Ave (L)", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车"] },
  { name: "Myrtle - Wyckoff Aves", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车", "M车"] },
  { name: "Halsey St", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车"] },
  { name: "Wilson Ave", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车"] },
  { name: "Bushwick Ave - Aberdeen St", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["L", "L车"] },
  { name: "Broadway Junction", borough: "Brooklyn", neighborhood: "East New York", lines: ["L", "L车", "ACE", "A车", "C车", "J车", "Z车"] },
  { name: "Canarsie - Rockaway Pkwy", borough: "Brooklyn", neighborhood: "Canarsie", lines: ["L", "L车"] },

  // --- N / Q / R / W LINE (N/Q/R/W车) ---
  { name: "Astoria - Ditmars Blvd", borough: "Queens", neighborhood: "Astoria", lines: ["NQRW", "N车", "W车"] },
  { name: "Astoria Blvd", borough: "Queens", neighborhood: "Astoria", lines: ["NQRW", "N车", "W车"] },
  { name: "30 Ave", borough: "Queens", neighborhood: "Astoria", lines: ["NQRW", "N车", "W车"] },
  { name: "Broadway (Astoria)", borough: "Queens", neighborhood: "Astoria", lines: ["NQRW", "N车", "W车"] },
  { name: "36 Ave", borough: "Queens", neighborhood: "Astoria", lines: ["NQRW", "N车", "W车"] },
  { name: "39 Ave - Dutch Kills", borough: "Queens", neighborhood: "Long Island City", lines: ["NQRW", "N车", "W车"] },
  { name: "Lexington Ave / 59 St", borough: "Manhattan", neighborhood: "Midtown East", lines: ["NQRW", "N车", "R车", "W车", "456", "4车", "5车", "6车", "F车"] },
  { name: "57 St - 7th Ave", borough: "Manhattan", neighborhood: "Midtown", lines: ["NQRW", "N车", "Q车", "R车", "W车"] },
  { name: "23 St (Broadway)", borough: "Manhattan", neighborhood: "Flatiron", lines: ["NQRW", "R车", "W车"] },
  { name: "8 St - NYU", borough: "Manhattan", neighborhood: "Greenwich Village", lines: ["NQRW", "R车", "W车"] },
  { name: "City Hall / Cortlandt St", borough: "Manhattan", neighborhood: "Financial District", lines: ["NQRW", "R车", "W车"] },
  { name: "86 St (Brooklyn N/R)", borough: "Brooklyn", neighborhood: "Bay Ridge", lines: ["NQRW", "R车"] },

  // --- 1 / 2 / 3 LINE (1/2/3车) ---
  { name: "Van Cortlandt Park - 242 St", borough: "Bronx", neighborhood: "Riverdale", lines: ["123", "1车"] },
  { name: "231 St", borough: "Bronx", neighborhood: "Kingsbridge", lines: ["123", "1车"] },
  { name: "Dyckman St (1)", borough: "Manhattan", neighborhood: "Inwood", lines: ["123", "1车"] },
  { name: "181 St", borough: "Manhattan", neighborhood: "Washington Heights", lines: ["123", "1车"] },
  { name: "137 St - City College", borough: "Manhattan", neighborhood: "Harlem", lines: ["123", "1车"] },
  { name: "96 St", borough: "Manhattan", neighborhood: "Upper West Side", lines: ["123", "1车", "2车", "3车"] },
  { name: "72 St", borough: "Manhattan", neighborhood: "Upper West Side", lines: ["123", "1车", "2车", "3车", "BDFM", "B车", "C车"] },
  { name: "Christopher St / Sheridan Sq", borough: "Manhattan", neighborhood: "Greenwich Village", lines: ["123", "1车", "2车"] },
  { name: "Houston St", borough: "Manhattan", neighborhood: "SoHo", lines: ["123", "1车", "2车"] },
  { name: "Chambers St", borough: "Manhattan", neighborhood: "Tribeca", lines: ["123", "1车", "2车", "3车", "ACE", "A车", "C车"] },
  { name: "WTC Cortlandt", borough: "Manhattan", neighborhood: "Financial District", lines: ["123", "1车", "PATH"] },
  { name: "South Ferry / Whitehall St", borough: "Manhattan", neighborhood: "Financial District", lines: ["123", "1车", "NQRW", "R车", "W车"] },

  // --- 4 / 5 / 6 LINE (4/5/6车) ---
  { name: "Woodlawn", borough: "Bronx", neighborhood: "Woodlawn", lines: ["456", "4车"] },
  { name: "Pelham Bay Park", borough: "Bronx", neighborhood: "Pelham Bay", lines: ["456", "6车"] },
  { name: "86 St (Lexington Ave)", borough: "Manhattan", neighborhood: "Upper East Side", lines: ["456", "4车", "5车", "6车"] },
  { name: "68 St - Hunter College", borough: "Manhattan", neighborhood: "Upper East Side", lines: ["456", "6车"] },
  { name: "Spring St (6)", borough: "Manhattan", neighborhood: "SoHo", lines: ["456", "6车"] },
  { name: "Brooklyn Bridge - City Hall", borough: "Manhattan", neighborhood: "Civic Center", lines: ["456", "4车", "5车", "6车", "J车", "Z车"] },
  { name: "Wall St", borough: "Manhattan", neighborhood: "Financial District", lines: ["456", "4车", "5车", "123", "2车", "3车"] },
  { name: "Borough Hall", borough: "Brooklyn", neighborhood: "Downtown Brooklyn", lines: ["456", "4车", "5车", "123", "2车", "3车", "R车"] },
  { name: "Crown Heights - Utica Ave", borough: "Brooklyn", neighborhood: "Crown Heights", lines: ["456", "3车", "4车"] },

  // --- B / F / M LINE (B/F/M车) ---
  { name: "Jamaica - 179 St", borough: "Queens", neighborhood: "Jamaica", lines: ["BDFM", "F车"] },
  { name: "Forest Hills - 71 Ave", borough: "Queens", neighborhood: "Forest Hills", lines: ["BDFM", "F车", "M车", "E车", "R车"] },
  { name: "Roosevelt Island", borough: "Manhattan", neighborhood: "Roosevelt Island", lines: ["BDFM", "F车"] },
  { name: "Lex Ave / 63 St", borough: "Manhattan", neighborhood: "Upper East Side", lines: ["BDFM", "F车", "Q车"] },
  { name: "57 St (6th Ave)", borough: "Manhattan", neighborhood: "Midtown", lines: ["BDFM", "F车"] },
  { name: "Lower East Side - Essex St", borough: "Manhattan", neighborhood: "Lower East Side", lines: ["BDFM", "F车", "M车", "J车", "Z车"] },
  { name: "York St", borough: "Brooklyn", neighborhood: "DUMBO", lines: ["BDFM", "F车"] },
  { name: "Bergen St", borough: "Brooklyn", neighborhood: "Boerum Hill", lines: ["BDFM", "F车", "G车"] },
  { name: "Church Ave (F/G)", borough: "Brooklyn", neighborhood: "Kensington", lines: ["BDFM", "F车", "G车"] },

  // --- G LINE (G车) ---
  { name: "Court Sq (G)", borough: "Queens", neighborhood: "Long Island City", lines: ["G", "G车", "7", "E车"] },
  { name: "21 St (G)", borough: "Queens", neighborhood: "Long Island City", lines: ["G", "G车"] },
  { name: "Greenpoint Ave", borough: "Brooklyn", neighborhood: "Greenpoint", lines: ["G", "G车"] },
  { name: "Nassau Ave", borough: "Brooklyn", neighborhood: "Greenpoint", lines: ["G", "G车"] },
  { name: "Flushing Ave", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["G", "G车", "J车", "M车"] },
  { name: "Myrtle - Willoughby Aves", borough: "Brooklyn", neighborhood: "Bed-Stuy", lines: ["G", "G车"] },
  { name: "Classon Ave", borough: "Brooklyn", neighborhood: "Bed-Stuy", lines: ["G", "G车"] },
  { name: "Clinton - Washington Aves", borough: "Brooklyn", neighborhood: "Clinton Hill", lines: ["G", "G车"] },

  // --- J / Z LINE (J/Z车) ---
  { name: "Jamaica Center - Parsons/Archer", borough: "Queens", neighborhood: "Jamaica", lines: ["JZ", "J车", "Z车", "E车"] },
  { name: "Woodhaven Blvd (J/Z)", borough: "Queens", neighborhood: "Woodhaven", lines: ["JZ", "J车", "Z车"] },
  { name: "Crescent St", borough: "Brooklyn", neighborhood: "Cypress Hills", lines: ["JZ", "J车", "Z车"] },
  { name: "Myrtle Ave (J/M/Z)", borough: "Brooklyn", neighborhood: "Bushwick", lines: ["JZ", "J车", "Z车", "M车"] },
  { name: "Marcy Ave", borough: "Brooklyn", neighborhood: "Williamsburg", lines: ["JZ", "J车", "Z车", "M车"] },
  { name: "Bowery", borough: "Manhattan", neighborhood: "Chinatown", lines: ["JZ", "J车", "Z车"] },
  { name: "Broad St", borough: "Manhattan", neighborhood: "Financial District", lines: ["JZ", "J车", "Z车"] },

  // --- STATEN ISLAND & NJ PATH ---
  { name: "St George Terminal", borough: "Staten Island", neighborhood: "St George", lines: ["S", "S车"] },
  { name: "World Trade Center PATH", borough: "Manhattan", neighborhood: "Financial District", lines: ["PATH"] },
  { name: "33rd St PATH Terminal", borough: "Manhattan", neighborhood: "Midtown", lines: ["PATH"] },
];

/**
 * Filter subway stations specifically for the selected subway line
 */
export function getStationsForLine(lineInput: string): NYCSubwayStation[] {
  if (!lineInput || lineInput.trim() === "") {
    return NYC_SUBWAY_STATIONS;
  }

  // Normalize input string: e.g. "7车" -> "7", "D车" -> "D", "BDFM" -> "B", "D", "F", "M"
  const rawClean = lineInput.replace(/车|Line/gi, "").trim().toUpperCase();
  
  if (!rawClean) return NYC_SUBWAY_STATIONS;

  const matched = NYC_SUBWAY_STATIONS.filter((st) => {
    return st.lines.some((stLine) => {
      const lineUpper = stLine.toUpperCase();
      // Exact or partial code match (e.g., "7" in "7", "D" in "D", "D" in "BDFM")
      return (
        lineUpper === rawClean ||
        rawClean.includes(lineUpper) ||
        lineUpper.includes(rawClean) ||
        rawClean.split("").some((char) => lineUpper.includes(char))
      );
    });
  });

  return matched.length > 0 ? matched : NYC_SUBWAY_STATIONS;
}


export interface NYCLocationResult {
  borough: NYCBorough;
  neighborhood: string;
  stationName?: string;
  subwayLine?: string;
  success?: boolean;
  message?: string;
}

const NYC_NEIGHBORHOOD_NODES = [
  { name: "Flushing", borough: "Queens" as NYCBorough, lat: 40.758, lng: -73.832, station: "Flushing - Main St", line: "7" },
  { name: "Astoria", borough: "Queens" as NYCBorough, lat: 40.764, lng: -73.923, station: "Astoria Blvd", line: "NQRW" },
  { name: "Long Island City", borough: "Queens" as NYCBorough, lat: 40.744, lng: -73.948, station: "Court Sq / 23 St", line: "7" },
  { name: "Jackson Heights", borough: "Queens" as NYCBorough, lat: 40.748, lng: -73.886, station: "74 St - Broadway / Jackson Hts", line: "ACE" },
  { name: "Midtown", borough: "Manhattan" as NYCBorough, lat: 40.754, lng: -73.984, station: "34 St - Herald Sq", line: "BDFM" },
  { name: "Koreatown", borough: "Manhattan" as NYCBorough, lat: 40.747, lng: -73.986, station: "34 St - Herald Sq", line: "NQRW" },
  { name: "SoHo", borough: "Manhattan" as NYCBorough, lat: 40.723, lng: -74.003, station: "Spring St / Prince St", line: "ACE" },
  { name: "East Village", borough: "Manhattan" as NYCBorough, lat: 40.726, lng: -73.981, station: "1st Ave / Astor Pl", line: "L" },
  { name: "Chinatown", borough: "Manhattan" as NYCBorough, lat: 40.715, lng: -73.997, station: "Canal St", line: "NQRW" },
  { name: "Financial District", borough: "Manhattan" as NYCBorough, lat: 40.707, lng: -74.008, station: "Fulton St Hub", line: "123" },
  { name: "Upper West Side", borough: "Manhattan" as NYCBorough, lat: 40.787, lng: -73.975, station: "72 St", line: "123" },
  { name: "Williamsburg", borough: "Brooklyn" as NYCBorough, lat: 40.714, lng: -73.957, station: "Bedford Ave", line: "L" },
  { name: "DUMBO", borough: "Brooklyn" as NYCBorough, lat: 40.703, lng: -73.988, station: "York St", line: "BDFM" },
  { name: "Bushwick", borough: "Brooklyn" as NYCBorough, lat: 40.694, lng: -73.921, station: "Jefferson St", line: "L" },
];

export function detectNYCLocation(lat: number, lng: number): NYCLocationResult {
  let closest = NYC_NEIGHBORHOOD_NODES[4]; // Default Midtown
  let minDistance = Infinity;

  for (const node of NYC_NEIGHBORHOOD_NODES) {
    const dist = Math.hypot(lat - node.lat, lng - node.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = node;
    }
  }

  return {
    borough: closest.borough,
    neighborhood: closest.name,
    stationName: closest.station,
    subwayLine: closest.line,
  };
}

export async function getCurrentNYCLocation(): Promise<NYCLocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        borough: "Manhattan",
        neighborhood: "Midtown",
        stationName: "34 St - Herald Sq",
        subwayLine: "BDFM",
        success: false,
        message: "已采用默认 NYC 站点: Manhattan Midtown (34 St - Herald Sq)",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const matched = detectNYCLocation(latitude, longitude);
        resolve({
          ...matched,
          success: true,
          message: `📍 已定位：${matched.borough} - ${matched.neighborhood} (${matched.stationName} ${matched.subwayLine}线)`,
        });
      },
      (err) => {
        resolve({
          borough: "Manhattan",
          neighborhood: "Midtown",
          stationName: "34 St - Herald Sq",
          subwayLine: "BDFM",
          success: false,
          message: "已采用标准 NYC 默认站点: Manhattan (Midtown)",
        });
      },
      { timeout: 4000, maximumAge: 60000 }
    );
  });
}
