/*
 *  TWNCurrentWeather.js
 *
 *  David Janes
 *  IOTDB
 *  2014-05-05
 */

"use strict";

var iotdb = require("iotdb")

exports.Model = iotdb.make_model('TWNCurrentWeather')
    .i("temperature", iotdb.sensor.number.temperature.celsius)
    .i("humidity", iotdb.sensor.percent.humidity)
    .i("conditions", iotdb.string)
    .make();

exports.binding = {
    model: exports.Model,
    bridge: require('./FeedBridge').Bridge,
    connectd: {
        data_in: function(paramd) {
            if (paramd.rawd.title !== "Current Weather") {
                return
            }

            var description = paramd.rawd.description
            if (description !== undefined) {
                // 'A few clouds,\r\n\t\t11&nbsp;&deg;C\t\t, Humidity\t\t43%\t\t, Wind\t\tSW 9km/h'
                var match = description.match(/^(.*?),/)
                if (match) {
                    paramd.cookd.conditions = match[1]
                }

                var match = description.match(/([-]?[\d.]+)&nbsp;&deg;C/)
                if (match) {
                    paramd.cookd.temperature = match[1]
                }

                var match = description.match(/Humidity\t\t(\d+)%\t\t/)
                if (match) {
                    paramd.cookd.humidity = match[1]
                }
            }
        },
    },
};
