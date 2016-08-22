"use strict";

const iotdb = require("iotdb")
const _ = iotdb._;

const module = require('homestar-feed');

const wrapper = _.bridge.wrap("TWNCurrentWeather", module.bindings, {
    feed: "http://rss.theweathernetwork.com/weather/caon0696"
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
