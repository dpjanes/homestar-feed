/*
 *  FoursquareCheckin.js
 *
 *  David Janes
 *  IOTDB
 *  2014-05-04
 */

"use strict";

var iotdb = require("iotdb");

exports.binding = {
    model: require('./FoursquareCheckin.json'),
    bridge: require('../FeedBridge').Bridge,
    discover: false,
    connectd: {
        data_in: function (paramd) {
            if (paramd.rawd.link !== undefined) {
                paramd.cookd.where = paramd.rawd.link;
            }

            if (paramd.rawd.date !== undefined) {
                paramd.cookd.timestamp = paramd.rawd.date.toISOString();
            }

            if (paramd.rawd.title !== undefined) {
                paramd.cookd.name = paramd.rawd.title;
            }

            if (paramd.rawd.is_fresh !== undefined) {
                paramd.cookd.fresh = paramd.rawd.is_fresh;
            }

            var p = paramd.rawd.georss_point;
            if (p) {
                var parts = p.split(' ');
                if (parts.length === 2) {
                    paramd.cookd.latitude = parseFloat(parts[0]);
                    paramd.cookd.longitude = parseFloat(parts[1]);
                }
            }
        },
    },
};
