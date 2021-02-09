Module.register("MMM-COVID-THL", {
  defaults: {
    districtWatchList: ["All", "Uusimaa", "Pirkanmaa"], // Support for partial search, available districts: "Åland", "Southwest Finland Hospital District","Satakunta Hospital District","Kanta-Häme Hospital District","Pirkanmaa Hospital District","Päijät-Häme Hospital District", "Kymenlaakso Hospital District", "South Karelia Hospital District", "South Savo Hospital District", "Itä-Savo Hospital District","North Karelia Hospital District","North Savo Hospital District",	"Central Finland Hospital District",	"South Ostrobothnia Hospital District",	"Vaasa Hospital District",	"Central Ostrobothnia Hospital District",	"North Ostrobothnia Hospital District",	"Kainuu Hospital District",	"Länsi-Pohja Hospital District",	"Lappi Hospital District",	"Helsinki and Uusimaa Hospital District","All areas"
    // municipalityWatchList: ["Helsinki", "Tampere"], // Not supported yet
    lastDateOffset: 0, // Last day's offset to today.  (Default: 0 / it means last date is today)
    days: 14, // How many days of entries
    updateInterval: 60 * 60000, // How often we would call the API's in milliseconds. (Default 60 minutes)
    language: "en", // now only support en, future available: en/fi/sv
    moduleTitle: "😷 Number of Covid cases in Finland (Source: THL)",
    infectedColor: "red", // Text color for Covid-19 positive numbers 
    vaccinatedColor: "green" // Text color for Covid-19 vaccincated numbers 
  },
  // Define required scripts.
  getScripts: function () {
    return ["moment.js"];
  },

  getStyles: function () {
    return ["thlcovid_style.css"];
  },

  getTranslations: function () {
    return {
      en: "translations/en.json",
      nb: "translations/nb.json"
    };
  },

  start: function () {
    // Request data every {updateInterval} ms.
    const self = this;
    this.requestData();

    this.timer = setInterval(function () {
      self.requestData();
    }, this.config.updateInterval);
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "thlwrapper";
    if (this.fetchedData && this.fetchedData["header"]) {
      Log.info("THL fetchedData ");

      // Module title
      const title = document.createElement("span");
      title.innerHTML = this.config.moduleTitle;
      title.className = "title";
      wrapper.appendChild(title);

      Log.info(JSON.stringify(this.fetchedData));

      // Table Wrapper

      const table = document.createElement("table");
      table.className = "covid-table";

      var headerRow = document.createElement("tr");
      headerRow.className = "covid-header-row";

      let headerRowTitle = document.createElement("td");
      headerRowTitle.innerHTML = "";
      headerRowTitle.className = "covid-header-cell";
      headerRow.appendChild(headerRowTitle);

      for (let i = 0; i < this.fetchedData["header"].length; i++) {
        let headerRowCell = document.createElement("td");

        let rawHeader = this.fetchedData["header"][i];
        let dateString = rawHeader.split("-");

        headerRowCell.innerHTML =
          i <= this.config.days - this.config.lastDateOffset
            ? dateString[2] + "." + dateString[1]
            : rawHeader;
        headerRowCell.className = "covid-header-cell";
        headerRow.appendChild(headerRowCell);
      }

      table.appendChild(headerRow);

      for (let key in this.fetchedData["body"]) {
        let detailedRow = document.createElement("tr");

        let detailedRowTitle = document.createElement("td");
        detailedRowTitle.innerHTML = key.replace(" Hospital District", "");
        detailedRowTitle.className = "covid-detail-location";
        detailedRow.appendChild(detailedRowTitle);

        for (let column in this.fetchedData["body"][key]) {
          let detailedRowCell = document.createElement("td");
          detailedRowCell.className = "covid-detail-cell";

          let numberOfCases = document.createElement("span");
          numberOfCases.innerHTML = this.fetchedData["body"][key][column][
            "Number of cases"
          ];
          numberOfCases.className = "covid-detail-postive";
          numberOfCases.style.color = this.config.infectedColor;

          if (column == "Vaccinated")
            numberOfCases.style.color = this.config.vaccinatedColor;
          else numberOfCases.style.color = this.config.infectedColor;

          detailedRowCell.appendChild(numberOfCases);

          detailedRow.appendChild(detailedRowCell);
        }
        table.appendChild(detailedRow);
      }

      wrapper.appendChild(table);
    } else {
      if (this.fetchedData === undefined) {
        wrapper.innerHTML = this.translate("LOADING");
      } else {
        wrapper.innerHTML = this.translate("FETCH_DATA_ERROR");
      }
    }
    return wrapper;
  },

  getImage: function (name) {
    return "/modules/MMM-COVID-THL/img/" + name + ".png";
  },

  requestData: function () {
    this.sendSocketNotification("FETCH_DATA", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    this.fetchedData = notification === "DATA_FETCHED" ? payload : null;
    this.updateDom();
  }
});
