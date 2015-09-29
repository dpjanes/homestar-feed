/*
 *  USGSEarthquake.js
 *
 *  David Janes
 *  IOTDB
 *  2014-05-04
 *
 *  Parsed earthquake from
 *  'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom'
 */

"use strict";

var iotdb = require("iotdb");

exports.Model = iotdb.make_model('USGSEarthquake')
    .i("name", iotdb.string)
    .i("address", iotdb.string.iri, {
        "iot:purpose": "schema:address"
    })
    .i("timestamp", iotdb.datetime.timestamp)
    .i("latitude", iotdb.vector.number.lle.latitude)
    .i("longitude", iotdb.vector.number.lle.longitude)
    .i("elevation", iotdb.vector.number.lle.elevation, {
        "iot:unit": "iot-unit:length.si.metre"
    })
    .i("fresh", iotdb.boolean.flag)
    .i("magnitude", iotdb.number, {
        "iot:unit": "iot-unit:energy.magnitude.richter"
    })
    .make();

exports.binding = {
    model: exports.Model,
    bridge: require('../FeedBridge').Bridge,
    discover: false,
    initd: {
        feed: 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom'
    },
    connectd: {
        data_in: function (paramd) {
            if (paramd.rawd.is_fresh !== undefined) {
                paramd.cookd.fresh = paramd.rawd.is_fresh;
            }

            if (paramd.rawd.date !== undefined) {
                paramd.cookd.timestamp = paramd.rawd.date.toISOString();
            }

            if (paramd.rawd.title !== undefined) {
                paramd.cookd.name = paramd.rawd.title;

                var match = paramd.rawd.title.match(/^M ([0-9][^ ]*)/);
                if (match) {
                    paramd.cookd.magnitude = match[1];
                }

                match = paramd.rawd.title.match(/^.*? of (.*)$/);
                if (match) {
                    paramd.cookd.address = match[1];
                }
            }

            var p = paramd.rawd.georss_point;
            if (p !== undefined) {
                var parts = p.split(' ');
                if (parts.length === 2) {
                    paramd.cookd.latitude = parseFloat(parts[0]);
                    paramd.cookd.longitude = parseFloat(parts[1]);
                }
            }

            var e = paramd.rawd.georss_elev;
            if (e !== undefined) {
                paramd.cookd.elevation = parseInt(e);
            }
        },
    },
};
