/*
 *  FeedBridge.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-02-08
 *
 *  Copyright [2013-2015] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use struct";

var iotdb = require('iotdb')
var _ = iotdb.helpers;

var unirest = require('unirest')

var bunyan = require('bunyan');
var logger = bunyan.createLogger({
    name: 'homestar-feed',
    module: 'FeedBridge',
});

/**
 *  EXEMPLAR and INSTANCE
 *  <p>
 *  No subclassing needed! The following functions are 
 *  injected _after_ this is created, and before .discover and .connect
 *  <ul>
 *  <li><code>discovered</code> - tell IOTDB that we're talking to a new Thing
 *  <li><code>pulled</code> - got new data
 *  <li><code>connected</code> - this is connected to a Thing
 *  <li><code>disconnnected</code> - this has been disconnected from a Thing
 *  </ul>
 */
var FeedBridge = function(initd, native) {
    var self = this;

    self.initd = _.defaults(initd, {
        poll: 120,
        iri: null,
        fresh: false,
        track_links: false,
    });

    self.native = native;
};

/* --- lifecycle --- */

/**
 *  EXEMPLAR. 
 *  Discover WeMo Socket
 *  <ul>
 *  <li>look for Things (using <code>self.bridge</code> data to initialize)
 *  <li>find / create a <code>native</code> that does the talking
 *  <li>create an FeedBridge(native)
 *  <li>call <code>self.discovered(bridge)</code> with it
 */
FeedBridge.prototype.discover = function(discoverd) {
    var self = this;

    if (!self.initd.iri && discoverd && discoved.iri) {
        self.initd.iri = discoverd.iri;
    }

    if (!self.initd.iri) {
        logger.error({
            method: "discover",
            cause: "all Feeds must be explicitly set up with an IRI",
        }, "no 'iri' parameter - cannot do discovery");
        return;
    }

    self.discovered(new FeedBridge(self.initd, true));
};

/**
 *  INSTANCE
 *  This is called when the Bridge is no longer needed. When
 */
FeedBridge.prototype.connect = function() {
    var self = this;
    if (!self.native) {
        return;
    }
};

FeedBridge.prototype._forget = function() {
    var self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "_forget"
    }, "called");

    self.native = null;
    self.pulled();
}

/**
 *  INSTANCE and EXEMPLAR (during shutdown). 
 *  This is called when the Bridge is no longer needed. When
 */
FeedBridge.prototype.disconnect = function() {
    var self = this;
    if (!self.native || !self.native) {
        return;
    }
};

/* --- data --- */

/**
 *  INSTANCE.
 *  Send data to whatever you're taking to.
 */
FeedBridge.prototype.push = function(pushd) {
    var self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "push",
        unique_id: self.unique_id,
        pushd: pushd,
    }, "pushed");
};

/**
 *  INSTANCE.
 *  Pull data from whatever we're talking to. You don't
 *  have to implement this if it doesn't make sense
 */
FeedBridge.prototype.pull = function() {
    var self = this;
    if (!self.native) {
        return;
    }
};

/* --- state --- */

/**
 *  INSTANCE.
 *  Return the metadata - compact form can be used.
 *  Does not have to work when not reachable
 *  <p>
 *  Really really useful things are:
 *  <ul>
 *  <li><code>iot:thing</code> required - a unique ID
 *  <li><code>iot:device</code> suggested if linking multiple things together
 *  <li><code>iot:name</code>
 *  <li><code>iot:number</code>
 *  <li><code>schema:manufacturer</code>
 *  <li><code>schema:model</code>
 */
FeedBridge.prototype.meta = function() {
    var self = this;
    if (!self.native) {
        return;
    }

    return {
        "iot:thing": _.id.thing_urn.unique("Feed", self.native.uuid),
        "iot:name": self.native.friendlyName || "Feed",
        "schema:manufacturer": "http://www.belkin.com/",
        "schema:model": "http://www.belkin.com/us/p/P-F7C027/",
    };
};

/**
 *  INSTANCE.
 *  Return True if this is reachable. You 
 *  do not need to worry about connect / disconnect /
 *  shutdown states, they will be always checked first.
 */
FeedBridge.prototype.reachable = function() {
    return this.native !== null;
};

/**
 *  INSTANCE.
 *  Return True if this is configured. Things
 *  that are not configured are always not reachable.
 *  If not defined, "true" is returned
 */
FeedBridge.prototype.configured = function() {
    return true;
};

/* --- injected: THIS CODE WILL BE REMOVED AT RUNTIME, DO NOT MODIFY  --- */
FeedBridge.prototype.discovered = function(bridge) {
    throw new Error("FeedBridge.discovered not implemented");
};

FeedBridge.prototype.pulled = function(pulld) {
    throw new Error("FeedBridge.pulled not implemented");
};

/* --- Internals --- */
FeedBridge.prototype._fetch = function () {
    var self = this;

    logger.info({
        method: "_fetch",
        iri: self.iri,
    }, "called");

    unirest
        .get(self.iri)
        .end(function (result) {
            if (result.error) {
                logger.error({
                    method: "_fetch",
                    iri: self.iri,
                    error: result.error,
                }, "can't get feed");
            } else {
                self._process(result.body);
            }

            self.poll_reschedule();
        });
};

FeedBridge.prototype._process = function (body) {
    var self = this;

    var s = new stream.Readable();
    s._read = function noop() {}; // redundant? see update below
    s.push(body);
    s.push(null);

    var fp = new FeedParser({
        feedurl: self.iri
    });
    fp.on('error', function () {});
    fp.on('readable', function () {
        var stream = this;
        var item = null;
        while (item = stream.read()) {
            if (item.guid === undefined) {
                continue;
            }

            if (self.seend[item.guid] && self.track_links) {
                continue;
            }
            self.seend[item.guid] = 1;

            var date = item.date;
            if (!date) {
                if (self.fresh) {
                    continue;
                }
            } else {
                item.is_fresh = date.getTime() >= self.started.getTime();
                if (self.fresh && !item.is_fresh) {
                    continue;
                }
            }

            self.pulled(self._flatten(item));
        }
    });

    s.pipe(fp);
};

FeedBridge.prototype._flatten = function (od) {
    var self = this;

    var nd = {};

    for (var okey in od) {
        var ovalue = od[okey];
        var nkey = okey.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (_.isString(ovalue)) {
            if (ovalue.length !== 0) {
                nd[nkey] = ovalue;
            }
        } else if (_.isArray(ovalue)) {
            if (ovalue.length !== 0) {
                nd[nkey] = ovalue;
            }
        } else if (_.isDate(ovalue)) {
            nd[nkey] = ovalue;
        } else if (_.isObject(ovalue)) {
            if (_.isEmpty(ovalue)) {
                continue;
            }

            var ohash = ovalue['#'];
            if (ohash === undefined) {
                continue;
            } else {
                nd[nkey] = ovalue['#'];
            }

            var oat = ovalue['@'];
            if (oat !== undefined) {
                for (var skey in oat) {
                    var svalue = oat[skey];
                    skey = skey.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    nd[nkey + "_" + skey] = svalue;
                }
            }
        } else {
            nd[nkey] = ovalue;
        }
    }

    return nd;
};

/*
 *  API
 */
exports.Bridge = FeedBridge;
