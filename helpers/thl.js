const JSONstat = require("jsonstat-toolkit");
const moment = require("moment");
const getVaccinationData = require("./rokotus.js");

const allDimensions = require("./dimensions2020.json");

function findWeekSid(dayOffset = 0, weekOffset = 0) {
  let target_date = moment()
    .subtract(dayOffset, "day")
    .subtract(weekOffset, "week");
  let year = target_date.year();

  let weekNumber =
    year == 2020 ? target_date.isoWeek() : (target_date.isoWeek() % 53) + 53;
  console.log("weekNumber: ", weekNumber);
  let results = allDimensions[1]["children"][0]["children"].find(
    (element) => element.sort == weekNumber + 1
  );
  return results.sid;
}

function createXdayHeader(dayOffset, days) {
  let header = [];
  if (days < 3) {
    console.error("Days must be more than 2 days");
  } else {
    for (let i = days; i > 0; i--) {
      let today = moment().subtract(dayOffset, "day");
      header.push(today.subtract(i - 1, "days").format("YYYY-MM-DD"));
    }
  }
  header.push("Total");
  return header;
}

async function fetchWeeklyData(language, weekSID, districtWatchList) {
  const url = `https://sampo.thl.fi/pivot/prod/${language}/epirapo/covid19case/fact_epirapo_covid19case.json?column=dateweek20200101-${weekSID}&column=hcdmunicipality2020-445222&row=measure-141082`;

  hcdRegexp = new RegExp(districtWatchList.join("|"), "gi");

  let newData = {};
  console.log("Trying to fetch from:", url);
  try {
    const j = await JSONstat(url);

    var data = j
      .Dataset(0)
      .toTable({ type: "arrobj", content: "label" }, function (d) {
        if (
          d.hcdmunicipality2020.match(hcdRegexp) &&
          d.measure.match(/(cases)|(deaths)|(tests)|(Population)/)
        ) {
          return {
            date: d.dateweek20200101,
            hcdmunicipality: d.hcdmunicipality2020,
            measure: d.measure,
            value: d.value ? d.value : 0
          };
        }
      });

    let header = [...new Set(data.map((element) => element.date))];

    let body = data.reduce(function (r, a) {
      r[a.hcdmunicipality] = r[a.hcdmunicipality] || {};

      r[a.hcdmunicipality][a.date] = r[a.hcdmunicipality][a.date] || {};
      r[a.hcdmunicipality][a.date][a["measure"]] = a["value"];

      return r;
    }, Object.create(null));

    let newData = {
      header,
      body
    };
    return newData;
  } catch (err) {
    console.log("MMM-COVID-THL ERROR: ", err);
    return {
      header: null,
      body: null
    };
  }
}

const THL = {
  fetchData: async function (
    { language, districtWatchList, lastDateOffset, days },
    callback
  ) {
    const forLoop = async (_) => {
      let rawAllData = [];
      let weeks = Math.ceil((days - lastDateOffset - 1) / 7) + 1; // Add one more week to be sure we get all the data

      let target_date_week = moment().subtract(lastDateOffset, "day").isoWeek();
      console.log(target_date_week);
      if (target_date_week > 52 || target_date_week < 2) {
        weeks++;
      }

      console.log("Start async...");
      for (let i = weeks; i > 0; i--) {
        weekSID = findWeekSid(lastDateOffset, i - 1);
        let data = await fetchWeeklyData(language, weekSID, districtWatchList);
        rawAllData.push(data["body"]);
      }

      let rokotusData = await getVaccinationData(language, districtWatchList); // to fix

      /* let rokotusData = await getRokotusData(); */ return [
        rawAllData,
        rokotusData
      ];
    };

    forLoop().then((result) => {
      let rawAllDataBody = result[0];
      let rokotusData = result[1];

      let allData = {};
      allData["header"] = createXdayHeader(lastDateOffset, days);
      let allDataBody = {};
      for (const date of allData["header"]) {
        for (const body of rawAllDataBody) {
          for (key in body) {
            if (body[key][date]) {
              if (!allDataBody[key]) allDataBody[key] = {};
              allDataBody[key][date] = body[key][date];
            }
          }
        }
      }

      /* Add vaccination data */
      allData["header"].push("Vaccinated");

      let sumData = {};

      for (let location in allDataBody) {
        if (!sumData[location]) sumData[location] = {};
        for (let date in allDataBody[location]) {
          for (key in allDataBody[location][date]) {
            if (!sumData[location][key]) sumData[location][key] = 0;
            sumData[location][key] += parseInt(
              allDataBody[location][date][key]
            );
          }
        }
      }

      for (let location in sumData) {
        allDataBody[location]["Total"] = sumData[location];
        allDataBody[location]["Vaccinated"] = {
          "Number of cases": (
            parseInt(rokotusData[location]["first_dose"]) +
            parseInt(rokotusData[location]["second_dose"])
          ).toString()
        };
      }

      allData["body"] = allDataBody;
      callback(allData);
    });
  }
};

module.exports = THL;