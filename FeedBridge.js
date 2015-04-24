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

"use strict";

var iotdb = require('iotdb');
var _ = iotdb._;
var bunyan = iotdb.bunyan;

var unirest = require('unirest');
var stream = require('stream');
var FeedParser = require('feedparser');

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
var FeedBridge = function (initd, native) {
    var self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("bridges/FeedBridge/initd"),
        {
            poll: 120,
            feed: null,
            fresh: false,
            track_links: true,
            name: null,
        }
    );

    self.native = native;

    if (self.native) {
        self._reachable = true;
        self._seend = {};
        self._started = new Date();
        self.connectd = {};
    }
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
FeedBridge.prototype.discover = function () {
    var self = this;

    if (!self.initd.feed) {
        logger.error({
            method: "discover",
            cause: "all Feeds must be explicitly set up with an IRI",
        }, "no 'feed' parameter - cannot do discovery");
        return;
    }

    self.discovered(new FeedBridge(self.initd, {}));
};

/**
 *  INSTANCE
 *  This is called when the Bridge is no longer needed. When
 */
FeedBridge.prototype.connect = function (connectd) {
    var self = this;
    if (!self.native) {
        return;
    }

    self.connectd = _.defaults(connectd, {});

    self._setup_polling();
    self.pull();
};

FeedBridge.prototype._setup_polling = function () {
    var self = this;
    if (!self.initd.poll) {
        return;
    }

    var timer = setInterval(function () {
        if (!self.native) {
            clearInterval(timer);
            return;
        }

        self.pull();
    }, self.initd.poll * 1000);
};

FeedBridge.prototype._forget = function () {
    var self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "_forget"
    }, "called");

    self.native = null;
    self.pulled();
};

/**
 *  INSTANCE and EXEMPLAR (during shutdown).
 *  This is called when the Bridge is no longer needed. When
 */
FeedBridge.prototype.disconnect = function () {
    var self = this;
    if (!self.native || !self.native) {
        return;
    }

    self._forget();
};

/* --- data --- */

/**
 *  INSTANCE.
 *  Send data to whatever you're taking to.
 */
FeedBridge.prototype.push = function (pushd) {
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
FeedBridge.prototype.pull = function () {
    var self = this;
    if (!self.native) {
        return;
    }

    self._fetch();
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
 *  <li><code>schema:name</code>
 *  <li><code>iot:number</code>
 *  <li><code>schema:manufacturer</code>
 *  <li><code>schema:model</code>
 */
FeedBridge.prototype.meta = function () {
    var self = this;
    if (!self.native) {
        return;
    }

    return {
        "iot:thing": _.id.thing_urn.unique_hash("Feed", self.initd.feed),
        "schema:name": self.initd.name || self.native.name || "Feed",
    };
};

/**
 *  INSTANCE.
 *  Return True if this is reachable. You
 *  do not need to worry about connect / disconnect /
 *  shutdown states, they will be always checked first.
 */
FeedBridge.prototype.reachable = function () {
    return (this.native !== null) && this._reachable;
};

/**
 *  INSTANCE.
 *  Configure an express web page to configure this Bridge.
 *  Return the name of the Bridge, which may be
 *  listed and displayed to the user.
 */
FeedBridge.prototype.configure = function (app) {};

/* --- injected: THIS CODE WILL BE REMOVED AT RUNTIME, DO NOT MODIFY  --- */
FeedBridge.prototype.discovered = function (bridge) {
    throw new Error("FeedBridge.discovered not implemented");
};

FeedBridge.prototype.pulled = function (pulld) {
    throw new Error("FeedBridge.pulled not implemented");
};

/* --- Internals --- */
FeedBridge.prototype._fetch = function () {
    var self = this;

    logger.info({
        method: "_fetch",
        feed: self.initd.feed,
    }, "called");

    unirest
        .get(self.initd.feed)
        .end(function (result) {
            if (result.error) {
                logger.error({
                    method: "_fetch",
                    feed: self.initd.feed,
                    error: result.error,
                }, "can't get feed");
            } else {
                self._process(result.body);
            }
        });
};

FeedBridge.prototype._process = function (body) {
    var self = this;

    var s = new stream.Readable();
    s._read = function noop() {}; // redundant? see update below
    s.push(body);
    s.push(null);

    var fp = new FeedParser({
        feedurl: self.initd.feed
    });
    fp.on('error', function () {
        // errors are OK if we've pulled data already 
        if (_.is.Empty(self._seend)) {
            self._set_reachable(false);
        }
    });
    fp.on('readable', function () {
        var stream = this;
        var item = null;
        while (item = stream.read()) {
            if (item.guid === undefined) {
                continue;
            }

            self._set_reachable(true);

            // metadata
            if (item.meta.title !== self.initd.name) {
                self.initd.name = item.meta.title;
                self.pulled();
            }

            // ...
            if (self._seend[item.guid] && self.initd.track_links) {
                continue;
            }
            self._seend[item.guid] = 1;

            var date = item.date;
            if (!date) {
                if (self.initd.fresh) {
                    continue;
                }
            } else {
                item.is_fresh = (date.getTime() >= self._started.getTime()) ? true : false;
                if (self.initd.fresh && !item.is_fresh) {
                    continue;
                }
            }

            if (self.connectd.data_in) {
                var paramd = {
                    rawd: self._flatten(item),
                    cookd: {},
                };
                self.connectd.data_in(paramd);
                self.pulled(paramd.cookd);
            } else {
                self.pulled(self._flatten(item));
            }
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

        if (_.is.String(ovalue)) {
            if (ovalue.length !== 0) {
                nd[nkey] = ovalue;
            }
        } else if (_.is.Array(ovalue)) {
            if (ovalue.length !== 0) {
                nd[nkey] = ovalue;
            }
        } else if (_.is.Date(ovalue)) {
            nd[nkey] = ovalue;
        } else if (_.is.Object(ovalue)) {
            if (_.is.Empty(ovalue)) {
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

FeedBridge.prototype._set_reachable = function (reachable) {
    var self = this;

    if (reachable === self._reachable) {
        return;
    }

    self._reachable = reachable;
    self.pulled();
};

/*
 *  API
 */
exports.Bridge = FeedBridge;
