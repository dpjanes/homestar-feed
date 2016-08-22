/*
 *  How to use this module in IOTDB / HomeStar
 *  This is the best way to do this
 *  Note: to work, this package must have been installed by 'homestar install' 
 */

"use strict";

const iotdb = require('iotdb');
const _ = iotdb._;

iotdb.use("homestar-feed");

const things = iotdb.connect('FoursquareCheckin', {
    feed: process.argv[2]
});
things.on('istate', function (thing) {
    console.log("+", "istate\n ", thing.thing_id(), "\n ", thing.state("istate"));
});
things.on("meta", function (thing) {
    console.log("+ meta\n ", thing.thing_id(), thing.state("meta"));
});
things.on("thing", function (thing) {
    console.log("+ discovered\n ", thing.thing_id(), thing.state("meta"));
});
