process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var Client = require('node-rest-client').Client;
var client = new Client();

var routerlist = null;
var routers = null;

var path = './cache_routerlist.json';

var metacommunity = {
	"id" : "franken",
	"data" : {
		"name" : "Freifunk Franken",
		"url" : "http://freifunk-franken.de",
		"state" : {
			"message" : "Jeder darf mitmachen!"
		},
		"location" : {
			"city" : "Nürnberg",
			"lat" : 49.448856931202,
			"lon" : 11.082108258271
		},
		"contact" : {
			"email" : "fragen@freifunk-franken.de",
			"facebook" : "https://www.facebook.com/FreifunkFranken",
			"ml" : "http://lists.freifunk.net/mailman/listinfo/franken-freifunk.net",
			"phone" : "+49 9101 7018607",
			"twitter" : "FreifunkFranken"
		},
		"techDetails" : {
			"stoererhaftung" : "VPN nach Rumänien und zum Freie Netze e.V.",
			"bootstrap" : "http://freifunk-franken.de/checkliste_routerinstallation",
			"firmware" : {
				"url" : "https://dev.freifunk-franken.de/firmware/",
				"name" : "Freifunk-Franken Firmware"
			},
			"routing" : "BATMAN",
			"topodata" : "https://netmon.freifunk-franken.de/batman.png",
			"updatemode" : "manual over ssh",
			"vpn" : "fastd"
		},
		"api" : "0.1"
	}
};

var communities = [ {
	"id" : "fuerth",
	"radius" : 4, // community radius in km
	"data" : {
		"name" : "Freifunk Fürth",
		"metacommunity" : "Freifunk Franken",
		"location" : {
			"city" : "Fürth",
			"lat" : 49.47833,
			"lon" : 10.99027
		}
	}
}, {
	"id" : "unfinden",
	"radius" : 10, // community radius in km
	"data" : {
		"name" : "Freifunk Unfinden",
		"metacommunity" : "Freifunk Franken",
		"location" : {
			"city" : "Unfinden",
			"lat" : 50.093555895082,
			"lon" : 10.568013390003
		}
	}
} ];

function extend(destination, source) {
	for ( var property in source) {
		if (!destination[property]) {
			destination[property] = source[property];
		}
	}
	return destination;
}

function saveCommunityData(data, output_filename) {
	fs.writeFile(output_filename, JSON.stringify(data, null, 4), function(err) {
		if (err) {
			winston.error(err);
		} else {
			winston.info("Updated " + output_filename);
		}
	});
}

function updateCommunity(community, count) {
	var output_filename = "freifunk" + community.id + ".json";
	if (!community.data.state) {
		community.data.state = {};
	}
	community.data.state.nodes = count;
	community.data.state.lastchange = Math.round((new Date()).getTime() / 1000);
	
	winston.info("==============================================================");
	winston.info("Online nodes in community '" + community.data.name + "': " + count + "\n");
	saveCommunityData(community.data, output_filename);
}

function getDistance(p1, p2) {
	function toRad(n) {
		return n * (Math.PI / 180);
	}
	var dLat = toRad(p2.lat - p1.lat);
	var dLon = toRad(p2.lon - p1.lon);
	var lat1 = toRad(p1.lat);
	var lat2 = toRad(p2.lat);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(p1.lat) * Math.cos(p2.lat);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var R = 6371; // km
	var d = R * c;
	return d;
}

function updateCommunities() {
	var count = 0;
	for (var n = 0; n < routers.length; n = n + 1) {
		if (routers[n].statusdata[0].status[0] !== "online") {
			continue;
		}
		count = count + 1;
	}
	// write meta-community file
	updateCommunity(metacommunity, count);

	// write community files
	var length = communities.length;
	var community = {};
	for (var i = 0; i < length; i = i + 1) {
		count = 0;
		winston.info("Routers in " + communities[i].data.name + " (radius: " + communities[i].radius + " km): ");
		winston.info("-------------------------------------------------------------");
		for (var j = 0; j < routers.length; j = j + 1) {
//			if (routers[j].statusdata[0].status !== "online") {
//				continue;
//			}
			
			var distance = getDistance({
				"lat" : parseFloat(routers[j].latitude),
				"lon" : parseFloat(routers[j].longitude)
			}, communities[i].data.location).toFixed(2);
			
			if (distance < communities[i].radius) {
				winston.info("Node " + routers[j].hostname[0] + ", distance: " + distance + " km");
				count = count + 1;
			}
		}

		community.id = communities[i].id;
		community.data = extend(communities[i].data, metacommunity.data);
		updateCommunity(community, count);
	}
}

function processCommunityData(data) {
	routerlist = data.netmon_response.routerlist;
	routers = data.netmon_response.routerlist[0].router;
	updateCommunities();
}



fs.stat(path, function(err, stats) {
	var minutesDiff = 9999999;
	if (!err) {
		var mtime = stats.mtime;
		var fileDate = moment(mtime);
		var now = moment();
		minutesDiff = now.diff(fileDate, 'minutes');
		winston.info("Age of local routerlist: " + minutesDiff + " minutes\n");
	}

	if (minutesDiff > 60) {
		winston.info("Loading routerlist from netmon...");
		client.get("https://netmon.freifunk-franken.de/api/rest/routerlist/?limit=500",
			function(data, response) {
				winston.info("saving data to file " + path + "\n");
				fs.writeFile(path, JSON.stringify(data, null, 4), function(err) {
					if (err) {
						winston.error(err);
					}
				});
				processCommunityData(data);
			}
		);
	} else  {
		winston.info("Loading local routerlist...");
		fs.readFile(path, 'utf8', function read(err, data) {
			if (err) {
				throw err;
			}
			processCommunityData(JSON.parse(data));
		});
	}
});






