const JSONstat = require("jsonstat-toolkit");

async function getVaccinationData(language, districtWatchList) {
  const vaccregUrl = `https://sampo.thl.fi/pivot/prod/${language}/vaccreg/cov19cov/fact_cov19cov.json?row=cov_vac_dose-533170.533164.&column=area-518362`;

  hcdRegexp = new RegExp(districtWatchList.join("|"), "gi");
  const j = await JSONstat(vaccregUrl);

  var data = j
    .Dataset(0)
    .toTable({ type: "arrobj", content: "label" }, function (d) {
      // return d;
      if (d.area.match(hcdRegexp)) {
        if (d.cov_vac_dose == "First dose") {
          return {
            hcdmunicipality: d.area,
            first_dose: d.value ? d.value : 0
          };
        } else {
          return {
            hcdmunicipality: d.area,
            second_dose: d.value ? d.value : 0
          };
        }
      }
    });

  // console.log(JSON.stringify(data));
  let body = data.reduce(function (r, a) {
    r[a.hcdmunicipality] = r[a.hcdmunicipality] || {};

    if (a.first_dose) {
      r[a.hcdmunicipality]["first_dose"] = a.first_dose;
    }
    if (a.second_dose) {
      r[a.hcdmunicipality]["second_dose"] = a.second_dose;
    }

    return r;
  }, Object.create(null));

  //console.log(JSON.stringify(body));
  return body;
}

module.exports = getVaccinationData;
