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

var homestar = require("homestar")

exports.Model = homestar.make_model('USGSEarthquake')
    .i("name", homestar.string)
    .i("address", homestar.string.iri, { "iot:purpose": "schema:address" })
    .i("timestamp", homestar.datetime.timestamp)
    .i("latitude", homestar.vector.number.lle.latitude)
    .i("longitude", homestar.vector.number.lle.longitude)
    .i("elevation", homestar.vector.number.lle.elevation, { "iot:unit": "iot-unit:length.si.metre" })
    .i("fresh", homestar.boolean.flag)
    .i("magnitude", homestar.number, { "iot:unit": "iot-unit:energy.magnitude.richter" })
    .make();

exports.binding = {
    model: exports.Model,
    bridge: require('./FeedBridge').Bridge,
    initd: {
        iri: 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom'
    },
    connectd: {
        data_in: function(paramd) {
            if (paramd.rawd.date) {
                paramd.cookd.timestamp = paramd.rawd.date
            }

            if (paramd.rawd.title) {
                paramd.cookd.name = paramd.rawd.title

                var match = paramd.rawd.title.match(/^M ([0-9][^ ]*)/)
                if (match) {
                    paramd.cookd.magnitude = match[1]
                }

                var match = paramd.rawd.title.match(/^.*? of (.*)$/)
                if (match) {
                    paramd.cookd.address = match[1]
                }
            }

            var p = paramd.rawd.georss_point
            if (p) {
                var parts = p.split(' ')
                if (parts.length == 2) {
                    paramd.cookd.latitude = parseFloat(parts[0])
                    paramd.cookd.longitude = parseFloat(parts[1])
                }
            }

            var e = paramd.rawd.georss_elev
            if (e) {
                paramd.cookd.elevation = parseInt(e)
            }
        },
    },
};
