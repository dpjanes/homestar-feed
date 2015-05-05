# homestar-feed

IOTDB HomeStar Atom / RSS Controller. 
This will convert feeds into structured data.

<img src="https://github.com/dpjanes/iotdb-homestar/blob/master/docs/HomeStar.png" align="right" />

See <a href="samples/">the samples</a> for details how to add to your project.
particularly <code>model\_\*.js</code> for "standalone" and <code>iotdb\_\*.js</code>
for use in IOTDB / HomeStar projects.

# Installation

Install Home☆Star first. 
See: https://github.com/dpjanes/iotdb-homestar#installation

Then

    $ homestar install homestar-feed

# Quick Start

Get earthquakes as they happen (more or less)

	$ npm install -g homestar ## with 'sudo' if error
	$ homestar setup
	$ homestar install homestar-feed
	$ node
	>>> iotdb = require('iotdb')
	>>> iot = iotdb.iot()
	>>> things = iot.connect("USGSEarthquake")
	>>> things.on("state", function(thing) {
        console.log(thing.state());
    });

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

