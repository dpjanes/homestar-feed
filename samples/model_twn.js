/*
 *  Use a Model to see data semantically
 *
 */

var homestar = require("homestar");
var _ = homestar._;

var ModelBinding = require('../TWNCurrentWeather');
var feed_iri = "http://rss.theweathernetwork.com/weather/caon0696";

wrapper = _.bridge_wrapper(ModelBinding.binding, { iri: feed_iri });
wrapper.on('model', function(model) {
    model.on_change(function(model) {
        console.log("+ state\n ", model.thing_id(), model.state());
    });
    model.on_meta(function(model) {
        console.log("+ meta\n ", model.thing_id(), _.ld.compact(model.meta().state()));
    });
    
    console.log("+ discovered\n ", _.ld.compact(model.meta().state()), "\n ", model.thing_id());
})
wrapper.on('ignored', function(bridge) {
    console.log("+ ignored\n ", _.ld.compact(bridge.meta()));
});
