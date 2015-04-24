/*
 *  How to use this module in IOTDB / HomeStar
 *  This is the best way to do this
 *  Note: to work, this package must have been installed by 'homestar install' 
 */

var iotdb = require('iotdb')
var _ = iotdb._;
var iot = iotdb.iot();

var things = iot.connect("TWNCurrentWeather", {
    feed: "http://rss.theweathernetwork.com/weather/caon0696"
});
things.on('state', function(thing) {
    console.log("+ state\n ", thing.thing_id(), "\n ", thing.state("istate"));
});
things.on("meta", function(thing) {
    console.log("+ meta\n ", thing.thing_id(), thing.state("meta"));
});
things.on("thing", function(thing) {
    console.log("+ discovered\n ", thing.thing_id(), thing.state("meta"));
});
