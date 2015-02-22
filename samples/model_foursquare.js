/*
 *  NOTE: your foursquare checkin URL is required as an argument
 *  Get it from this page:
 *  https://foursquare.com/feeds/
 */

try {
    var model = require('homestar-feed')
} catch (x) {
    var model = require('../index')
}

var _ = model.homestar._;

wrapper = model.wrap("FoursquareCheckin", {
    feed: process.argv[2]
});
wrapper.on('thing', function(model) {
    model.on("state", function(model) {
        console.log("+ state\n ", model.thing_id(), model.state());
    });
    model.on("meta", function(model) {
        console.log("+ meta\n ", model.thing_id(), _.ld.compact(model.meta().state()));
    });
    
    console.log("+ discovered\n ", _.ld.compact(model.meta().state()), "\n ", model.thing_id());
})
wrapper.on('ignored', function(bridge) {
    console.log("+ ignored\n ", _.ld.compact(bridge.meta()));
});
