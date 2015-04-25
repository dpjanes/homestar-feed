"use strict";

try {
    var model = require('iotdb-feed');
} catch (x) {
    var model = require('../index');
}

var _ = model.iotdb._;

var wrapper = model.wrap("USGSEarthquake");
wrapper.on('thing', function (model) {
    model.on('state', function (model) {
        console.log("+ state\n ", model.thing_id(), model.state("istate"));
    });
    model.on('meta', function (model) {
        console.log("+ meta\n ", model.thing_id(), model.state("meta"));
    });
    console.log("+ discovered\n ", model.thing_id(), model.state("meta"));
});
