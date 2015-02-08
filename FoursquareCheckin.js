/*
 *  FoursquareCheckin.js
 *
 *  David Janes
 *  IOTDB
 *  2014-05-04
 */

"use strict";

var iotdb = require("iotdb")

exports.Model = iotdb.make_model('FoursquareCheckin')
    .i("where", iotdb.string.iri, { "iot:purpose", "wikipedia:check-in" }),
    .i("name", iotdb.string)
    .i("timestamp", iotdb.datetime.timestamp)
    .i("latitude", iotdb.vector.number.ll.latitude),
    .i("longitude", iotdb.vector.number.ll.longitude),
    .i("fresh", iotdb.boolean.flag),
    .make();

/*
    .driver_in(function(paramd) {
        // paramd.libs.log(paramd.driverd)

        if (paramd.driverd.link !== undefined) {
            paramd.thingd.where = paramd.driverd.link
        }

        if (paramd.driverd.date !== undefined) {
            paramd.thingd.timestamp = paramd.driverd.date
        }

        if (paramd.driverd.title !== undefined) {
            paramd.thingd.name = paramd.driverd.title
        }

        if (paramd.driverd.fresh !== undefined) {
            paramd.thingd.fresh = paramd.driverd.fresh
        }

        var p = paramd.driverd.georss_point
        if (p) {
            var parts = p.split(' ')
            if (parts.length == 2) {
                paramd.thingd.latitude = parseFloat(parts[0])
                paramd.thingd.longitude = parseFloat(parts[1])
            }
        }
    })
    .make()
*/
