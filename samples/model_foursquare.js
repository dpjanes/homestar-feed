/*
 *  Use a Model to see data semantically
 *
 *  NOTE: your foursquare checkin URL is required as an argument
 *  Get it from this page:
 *  https://foursquare.com/feeds/
 */

var iotdb = require("iotdb");

var ModelBinding = require('../FoursquareCheckin');
var feed_iri = process.argv[process.argv.length - 1];

wrapper = iotdb.bridge_wrapper(ModelBinding.binding, { iri: feed_iri });
wrapper.on('model', function(model) {
    model.on_change(function(model) {
        console.log("+ state\n ", model.thing_id(), model.state());
    });
    model.on_meta(function(model) {
        console.log("+ meta\n ", model.thing_id(), model.meta().state());
    });
    
    console.log("+ discovered\n ", model.meta().state(), "\n ", model.thing_id());
})
wrapper.on('ignored', function(bridge) {
    console.log("+ ignored\n ", bridge.meta());
});
