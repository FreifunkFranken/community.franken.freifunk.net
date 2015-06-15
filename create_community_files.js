process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var fs = require('fs');
var deepExtend = require('extend');
var stringify = require('json-stable-stringify');
var winston = require('winston');
var moment = require('moment');
var restClient = require('node-rest-client').Client;

var options = {
	netmonUrl: "https://netmon.freifunk-franken.de/api/rest/routerlist/?limit=2000",
	communitysFile: 'communitys_franken.json',
	outputDir: '../freifunkfranken-community/',
	outputPrefix: '',
	cacheRouterlistFile: './cache.routerlist.json',
	cacheMaxAge: 30, //in minutes
};

var client = new restClient();
var routerlist = null;
var routers = null;

// gets loaded from file
var metacommunity = null;
var communities = null;

function extend(destination, source) {
	for ( var property in source) {
		if (!destination[property]) {
			destination[property] = source[property];
		} else if (destination[property] instanceof Array && source[property] instanceof Array) {
			Array.prototype.push.apply(destination[property], source[property]);
		} else {
			if (typeof destination[property] == 'object') {
				deepExtend(true, destination[property], source[property]);
			}
		}
	}
	return destination;
}

function saveCommunityData(data, output_filename) {
	fs.writeFile(output_filename, stringify(data, {space: 4}), function(err) {
		if (err) {
			winston.error(err);
		} else {
			winston.info("Updated " + output_filename);
		}
	});
}

function updateCommunity(community, onlineCount, offlineCount) {
	var output_filename = options.outputDir + options.outputPrefix + community.id + ".json";
	if (!community.data.state) {
		community.data.state = {};
	}
	community.data.state.nodes = onlineCount;
	community.data.state.lastchange = new Date().toJSON();
	
	winston.info("==============================================================");
	winston.info("Online nodes in community '" + community.data.name + "': " + onlineCount + " (offine: " + offlineCount + ") \n");
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

function updateCommunities(data) {
	var onlineCount = 0, offlineCount = 0;
	routerlist = data.netmon_response.routerlist;
	routers = data.netmon_response.routerlist[0].router;
	
	// write community files
	var length = communities.length;
	var community = {};
	for (var i = 0; i < length; i = i + 1) {
		onlineCount = offlineCount = 0;
		winston.info("Routers in " + communities[i].data.name + " (radius: " + communities[i].radius + " km): ");
		winston.info("-------------------------------------------------------------");
		for (var j = 0; j < routers.length; j = j + 1) {
			var distance = getDistance({
				"lat" : parseFloat(routers[j].latitude),
				"lon" : parseFloat(routers[j].longitude)
			}, communities[i].data.location).toFixed(2);
			
			if (distance < communities[i].radius) {
				if (routers[j].statusdata[0].status[0] === "online") {
					winston.info("Node ON  " + routers[j].hostname[0] + ", distance: " + distance + " km");
					onlineCount = onlineCount + 1;
				} else {
					winston.info("Node OFF " + routers[j].hostname[0] + ", distance: " + distance + " km");
					offlineCount = offlineCount + 1;
				}
			}
		}
		community.id = communities[i].id;
		community.data = extend(communities[i].data, metacommunity.data);
		
		updateCommunity(community, onlineCount, offlineCount);
	}
}

function exec(instructions) {
	var terminal = require('child_process').spawn('bash');
	terminal.stdout.on('data', function (data) {
		console.log("" + data);
	});
	terminal.on('exit', function (code) {
		console.log("-------------------------------------------------------");
		console.log("DONE");
	});
	
	for (var i=0; i<instructions.length; i=i+1) {
		console.log('\n' + instructions[i]);
		console.log("-------------------------------------------------------");
		terminal.stdin.write(instructions[i] + "\n");
	}
	terminal.stdin.end();
}

function run() {
	fs.readFile(options.communitysFile, 'utf8', function read(err, data) {
		if (err) {
			throw err;
		}
		data = JSON.parse(data);
		metacommunity = data.metacommunity;
		communities = data.communities;
		
		fs.stat(options.cacheRouterlistFile, function(err, stats) {
			var minutesDiff = -1;
			if (!err) {
				var mtime = stats.mtime;
				var fileDate = moment(mtime);
				var now = moment();
				minutesDiff = now.diff(fileDate, 'minutes');
				winston.info("Age of local routerlist: " + minutesDiff + " minutes\n");
			}
			if (err || (minutesDiff > options.cacheMaxAge)) {
				winston.info("Loading routerlist from netmon...");
				//TODO split into multiple requests
				client.get(options.netmonUrl,
					function(data, response) {
						winston.info("saving data to file " + options.cacheRouterlistFile + "\n");
						fs.writeFile(options.cacheRouterlistFile, stringify(data, {space: 4}), function(err) {
							if (err) {
								winston.error(err);
							}
						});
						updateCommunities(data);
					}
				);
			} else  {
				winston.info("Loading local routerlist...");
				fs.readFile(options.cacheRouterlistFile, 'utf8', function read(err, data) {
					if (err) {
						throw err;
					}
					updateCommunities(JSON.parse(data));
				});
			}
		});
	});
}

run();
