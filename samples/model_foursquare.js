/*
 *  NOTE: your foursquare checkin URL is required as an argument
 *  Get it from this page:
 *  https://foursquare.com/feeds/
 */

"use strict";

try {
    var model = require('iotdb-feed');
} catch (x) {
    var model = require('../index');
}

var _ = model.iotdb._;

var wrapper = model.wrap("FoursquareCheckin", {
    feed: process.argv[2]
});
wrapper.on('thing', function (model) {
    model.on('state', function (model) {
        console.log("+ state\n ", model.thing_id(), model.state("istate"));
    });
    model.on('meta', function (model) {
        console.log("+ meta\n ", model.thing_id(), model.state("meta"));
    });
    console.log("+ discovered\n ", model.thing_id(), model.state("meta"));
});
wrapper.on('ignored', function (bridge) {
    console.log("+ ignored\n ", _.ld.compact(bridge.meta()));
});
