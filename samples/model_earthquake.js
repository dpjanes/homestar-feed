try {
    var model = require('iotdb-feed')
} catch (x) {
    var model = require('../index')
}

var _ = model.iotdb._;

wrapper = model.wrap("USGSEarthquake");
wrapper.on('thing', function(model) {
    model.on('state', function(model) {
        console.log("+ state\n ", model.thing_id(), model.state());
    });
    model.on('meta', function(model) {
        console.log("+ meta\n ", model.thing_id(), _.ld.compact(model.meta().state()));
    });
    /*
    model.on("meta", function(model) {
        console.log("+ meta\n ", model.thing_id(), _.ld.compact(model.meta().state()));
    });
    */
    
    console.log("+ discovered\n ", _.ld.compact(model.meta().state()), "\n ", model.thing_id());
})
