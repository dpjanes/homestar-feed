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

var unirest = require('unirest');
var stream = require('stream');
var FeedParser = require('feedparser');

var logger = iotdb.logger({
    name: 'homestar-feed',
    module: 'FeedBridge',
});

/**
 *  See {iotdb.bridge.Bridge#Bridge} for documentation.
 *  <p>
 *  @param {object|undefined} native
 *  only used for instances, should be 
 */
var FeedBridge = function (initd, native) {
    var self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("bridges/FeedBridge/initd"), {
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
    }
};

FeedBridge.prototype = new iotdb.Bridge();

/* --- lifecycle --- */

/**
 *  See {iotdb.bridge.Bridge#discover} for documentation.
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
 *  See {iotdb.bridge.Bridge#connect} for documentation.
 */
FeedBridge.prototype.connect = function (connectd) {
    var self = this;
    if (!self.native) {
        return;
    }

    self._validate_connect(connectd);

    self.connectd = _.defaults(connectd, {}, self.connectd);

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
 *  See {iotdb.bridge.Bridge#disconnect} for documentation.
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
 *  See {iotdb.bridge.Bridge#push} for documentation.
 */
FeedBridge.prototype.push = function (pushd, done) {
    var self = this;
    if (!self.native) {
        done(new Error("not connected", pushd));
        return;
    }

    self._validate_push(pushd, done);

    logger.info({
        method: "push",
        unique_id: self.unique_id,
        pushd: pushd,
    }, "pushed");

    done();
};

/**
 *  See {iotdb.bridge.Bridge#pull} for documentation.
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
 *  See {iotdb.bridge.Bridge#meta} for documentation.
 */
FeedBridge.prototype.meta = function () {
    var self = this;
    if (!self.native) {
        return;
    }

    return {
        "iot:thing-id": _.id.thing_urn.unique_hash("Feed", self.initd.feed),
        "schema:name": self.initd.name || self.native.name || "Feed",
    };
};

/**
 *  See {iotdb.bridge.Bridge#reachable} for documentation.
 */
FeedBridge.prototype.reachable = function () {
    return (this.native !== null) && this._reachable;
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
