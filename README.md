# homestar-feed
[IOTDB](https://github.com/dpjanes/node-iotdb) Bridge for Atom / RSS feeds. 

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

# About
This will convert feeds into structured data.

See <a href="samples/">the samples</a> for details how to add to your project.
particularly <code>model\_\*.js</code> for "standalone" and <code>iotdb\_\*.js</code>
for use in IOTDB / HomeStar projects.

# Installation

* [Read this first](https://github.com/dpjanes/node-iotdb/blob/master/docs/install.md)

Then:

    $ npm install homestar-feed

# Use

Get earthquakes as they happen (more or less)

	const iotdb = require('iotdb')
    iotdb.use("homestar-feed")

	const things = iot.connect("USGSEarthquake")

	things.on("istate", function(thing) {
        console.log(thing.state("istate"));
    });

# Models
## FoursquareCheckin

Note that you'll have to find your private foursquare feed here

e.g.

    {
        where: 'https://foursquare.com/dpjanes/checkin/54c26c61498edc51dd036731',
        name: 'Earl Bales Ski and Snowboard Centre',
        timestamp: '2015-01-23T15:44:33.000Z',
        latitude: 43.756907292981055,
        longitude: -79.40997973261516,
        fresh: false
    }

## TWNCurrentWeather

This requires the RSS feed from
http://legacyweb.theweathernetwork.com/rss/

e.g.

    {
        temperature: -11,
        humidity: 59,
        conditions: 'Clear'
    }

## USGSEarthquake

e.g.

    {
        name: 'M 0.6 - 8km S of Anza, California',
        address: 'Anza, California',
        timestamp: '2015-02-25T13:44:12.979Z',
        latitude: 33.4801667,
        longitude: -116.6638333,
        elevation: -25980,
        fresh: false,
        magnitude: 0.6
    }

