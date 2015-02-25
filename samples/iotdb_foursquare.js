/*
 *  How to use this module in IOTDB / HomeStar
 *  This is the best way to do this
 */

var iotdb = require('iotdb')
var _ = iotdb._;
var iot = iotdb.iot();

var things = iot.connect('FoursquareCheckin', {
    feed: process.argv[2]
});
things.on('state', function(thing) {
    console.log("+ state\n ", thing.thing_id(), "\n ", thing.state());
});
things.on('meta', function(thing) {
    console.log("+ meta\n ", thing.thing_id(), "\n ", _.ld.compact(thing.meta().state()));
});
