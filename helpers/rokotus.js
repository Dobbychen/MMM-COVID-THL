const axios = require("axios");
const { parse } = require("node-html-parser");
const fs = require("fs");

async function getHTML() {
  let { data } = await axios.get(
    "https://www.thl.fi/episeuranta/rokotukset/koronarokotusten_edistyminen.html",
    {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"
      }
    }
  );

  return data;
}

const names = {
  Ahvenanmaa: "Åland",
  "Varsinais-Suomen SHP": "Southwest Finland Hospital District",
  "Satakunnan SHP": "Satakunta Hospital District",
  "Kanta-Hämeen SHP": "Kanta-Häme Hospital District",
  "Pirkanmaan SHP": "Pirkanmaa Hospital District",
  "Päijät-Hämeen SHP": "Päijät-Häme Hospital District",
  "Kymenlaakson SHP": "Kymenlaakso Hospital District",
  "Etelä-Karjalan SHP": "South Karelia Hospital District",
  "Etelä-Savon SHP": "South Savo Hospital District",
  "Itä-Savon SHP": "Itä-Savo Hospital District",
  "Pohjois-Karjalan SHP": "North Karelia Hospital District",
  "Pohjois-Savon SHP": "North Savo Hospital District",
  "Keski-Suomen SHP": "Central Finland Hospital District",
  "Etelä-Pohjanmaan SHP": "South Ostrobothnia Hospital District",
  "Vaasan SHP": "Vaasa Hospital District",
  "Keski-Pohjanmaan SHP": "Central Ostrobothnia Hospital District",
  "Pohjois-Pohjanmaan SHP": "North Ostrobothnia Hospital District",
  "Kainuun SHP": "Kainuu Hospital District",
  "Länsi-Pohjan SHP": "Länsi-Pohja Hospital District",
  "Lapin SHP": "Lappi Hospital District",
  "Helsingin ja Uudenmaan SHP": "Helsinki and Uusimaa Hospital District",
  "Muut alueet": "Other area",
  Kaikki: "All areas"
};

async function getRokotusData() {
  let data = await getHTML();

  const root = parse(data, {
    blockTextElements: {
      script: false, // keep text content when parsing
      noscript: false, // keep text content when parsing
      style: false, // keep text content when parsing
      pre: true // keep text content when parsing
    }
  });

  const rokotusData = root
    .querySelector("#covid-19-rokoteannokset-sairaanhoitopiireittäin")
    .childNodes.filter((child) => child.tagName == "TABLE")[0]
    .childNodes.filter((child) => child.tagName == "TBODY")[0];

  let vaccinationData = {};
  const body_tr_all = rokotusData.childNodes.filter(
    (head) => head.rawTagName == "tr"
  );
  
  body_tr_all.map((tr) => {
    const each_tr = tr.structuredText.split("\n");
    vaccinationData[names[each_tr[0]]] = {
      one_only: each_tr[1],
      one_and_two: each_tr[2],
      total: each_tr[3]
    };
  });

  return vaccinationData;
}

module.exports = getRokotusData;
