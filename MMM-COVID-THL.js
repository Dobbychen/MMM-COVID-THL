Module.register("MMM-COVID-THL", {

	defaults: {
		districtWatchList: ["All", "Uusimaa", "Pirkanmaa"], // Support for partial search, available districts: "Åland", "Southwest Finland Hospital District","Satakunta Hospital District","Kanta-Häme Hospital District","Pirkanmaa Hospital District","Päijät-Häme Hospital District", "Kymenlaakso Hospital District", "South Karelia Hospital District", "South Savo Hospital District", "Itä-Savo Hospital District","North Karelia Hospital District","North Savo Hospital District",	"Central Finland Hospital District",	"South Ostrobothnia Hospital District",	"Vaasa Hospital District",	"Central Ostrobothnia Hospital District",	"North Ostrobothnia Hospital District",	"Kainuu Hospital District",	"Länsi-Pohja Hospital District",	"Lappi Hospital District",	"Helsinki and Uusimaa Hospital District","All areas"
		// municipalityWatchList: ["Helsinki", "Tampere"], // Not supported yet
		days: 14, // How many days of entries
		updateInterval: 30 * 60000, // How often we would call the API's in milliseconds. (Default 30 minutes)
		language: "en", // now only support en, future available: en/fi/sv
	},
	// Define required scripts.
	getScripts: function () {
		return ["moment.js"]
	},

	getStyles: function () {
		return ["style.css"];
	},

	getTranslations: function () {
		return {
			en: "translations/en.json",
			nb: "translations/nb.json"
		}
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
		wrapper.className = "wrapper";
		if (this.fetchedData && this.fetchedData["header"]) {
			Log.info("THL fetchedData ")

			// Banner image
			const banner = document.createElement("span");
			banner.innerHTML = "😷 Number of Covid cases in Finland (Source: THL)";
			banner.className = "banner";
			wrapper.appendChild(banner);

			Log.info(JSON.stringify(this.fetchedData))

			// Table Wrapper

			const table = document.createElement("table");
			table.className = "covid-table";

			var headerRow = document.createElement("tr");
			headerRow.className = "covid-header-row"

			let headerRowTitle = document.createElement("td")
			headerRowTitle.innerHTML = ""
			headerRowTitle.className = "covid-header-cell"
			headerRow.appendChild(headerRowTitle)

			for (let i = 0; i < this.fetchedData["header"].length; i++) {
				let headerRowCell = document.createElement("td")
				let dateString = this.fetchedData["header"][i].split("-")
				headerRowCell.innerHTML = dateString[2] + "." + dateString[1]
				headerRowCell.className = "covid-header-cell"
				headerRow.appendChild(headerRowCell)
			}

			table.appendChild(headerRow)

			for (let key in this.fetchedData["body"]) {
				let detailedRow = document.createElement("tr");

				let detailedRowTitle = document.createElement("td")
				detailedRowTitle.innerHTML = key.replace(" Hospital District", "")
				detailedRowTitle.className = "covid-detail-location"
				detailedRow.appendChild(detailedRowTitle)

				for (let date in this.fetchedData["body"][key]) {
					let detailedRowCell = document.createElement("td")
					detailedRowCell.innerHTML = this.fetchedData["body"][key][date]["Number of cases"] /* + "/" + this.fetchedData["body"][key][date]["Number of deaths"] */
					detailedRowCell.className = "covid-detail-cell"
					detailedRow.appendChild(detailedRowCell)
				}
				table.appendChild(detailedRow)
			}

			wrapper.appendChild(table)

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
