const NodeHelper = require("node_helper");
const thl = require("./helpers/thl");

module.exports = NodeHelper.create({

	// Override start method.
	start: function () {
		console.log("Starting node helper for: " + this.name);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "FETCH_DATA") {
			this.fetchData(payload);
		}
	},

	fetchData: function (config) {
		const self = this;
		thl.fetchData(config, function (data) {
			self.sendSocketNotification("DATA_FETCHED", data);
		});
	}
});