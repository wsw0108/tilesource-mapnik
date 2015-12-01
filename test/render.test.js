var fs = require('fs');
var assert = require('./support/assert');
var mapnik_backend = require('..');
var util = require('util');

var SphericalMercator = require('sphericalmercator');
var sm = new SphericalMercator();

var resolutions = [
    156543.0339,
    78271.51695,
    39135.758475,
    19567.8792375,
    9783.93961875,
    4891.969809375,
    2445.9849046875,
    1222.99245234375,
    611.496226171875,
    305.7481130859375,
    152.87405654296876,
    76.43702827148438,
    38.21851413574219,
    19.109257067871095,
    9.554628533935547,
    4.777314266967774,
    2.388657133483887,
    1.1943285667419434,
    0.5971642833709717
];

describe('Render ', function() {

    it('getTile() override format', function(done) {
        var bbox = sm.bbox(0, 0, 0, false, '900913');
        new mapnik_backend('mapnik://./test/data/test.xml', function(err, source) {
            if (err) throw err;
            assert.equal(source._info.format,undefined); // so will default to png in getTile
            source._info.format = 'jpeg:quality=20';
            source.getTile(0, resolutions[0], bbox[0], bbox[1], function(err, tile, headers) {
                assert.imageEqualsFile(tile, 'test/fixture/tiles/world-jpeg20.jpeg', 0.05, 'jpeg:quality=20', function(err, similarity) {
                    if (err) throw err;
                    assert.deepEqual(headers, {
                        "Content-Type": "image/jpeg"
                    });
                    source.close(function(err){
                        done();
                    });
                });
            });
        });
    });

    var tileCoords_zxy = [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
        [2, 0, 0],
        [2, 0, 1],
        [2, 0, 2],
        [2, 0, 3],
        [2, 1, 0],
        [2, 1, 1],
        [2, 1, 2],
        [2, 1, 3],
        [2, 2, 0],
        [2, 2, 1],
        [2, 2, 2],
        [2, 2, 3],
        [2, 3, 0],
        [2, 3, 1],
        [2, 3, 2],
        [2, 3, 3]
    ];

    var tileCoords = [];
    tileCoords_zxy.forEach(function(zxy) {
        var z = zxy[0], x = zxy[1], y = zxy[2];
        var bbox = sm.bbox(x, y, z, false, '900913');
        tileCoords.push([ z, resolutions[z], bbox[0], bbox[1] ]);
    });

    var tileCoordsCompletion = {};
    tileCoords_zxy.forEach(function(coords) {
        tileCoordsCompletion['tile_' + coords[0] + '_' + coords[1] + '_' + coords[2]] = true;
    });

    describe('getTile() ', function() {
        var source;
        var completion = {};
        before(function(done) {
            new mapnik_backend('mapnik://./test/data/world.xml', function(err, s) {
                if (err) throw err;
                source = s;
                done();
            });
        });
        it('validates', function(done) {
            var count = 0;
            tileCoords.forEach(function(coords,idx,array) {
                source._info.format = 'png32';
                source.getTile(coords[0], coords[1], coords[2], coords[3],
                   function(err, tile, headers) {
                      if (err) throw err;
                      var zxy = tileCoords_zxy[idx];
                      var key = zxy[0] + '_' + zxy[1] + '_' + zxy[2];
                      assert.imageEqualsFile(tile, 'test/fixture/tiles/transparent_' + key + '.png', function(err, similarity) {
                          completion['tile_' + key] = true;
                          if (err) throw err;
                          assert.deepEqual(headers, {
                              "Content-Type": "image/png"
                          });
                          ++count;
                          if (count == array.length) {
                              assert.deepEqual(completion,tileCoordsCompletion);
                              source.close(function(err){
                                  done();
                              });
                          }
                      });
                });
            });
        });
    });

    describe('getTile() with XML string', function() {
        var source;
        var completion = {};
        before(function(done) {
            var xml = fs.readFileSync('./test/data/world.xml', 'utf8');
            new mapnik_backend({
                protocol: 'mapnik:',
                pathname: './test/data/world.xml',
                search: '?' + Date.now(), // prevents caching
                xml: xml } , function(err, s) {
                    if (err) throw err;
                    source = s;
                    done();
            });
        });
        it('validates', function(done) {
            var count = 0;
            tileCoords.forEach(function(coords,idx,array) {
                source._info.format = 'png32';
                source.getTile(coords[0], coords[1], coords[2], coords[3],
                   function(err, tile, headers) {
                      if (err) throw err;
                      var zxy = tileCoords_zxy[idx];
                      var key = zxy[0] + '_' + zxy[1] + '_' + zxy[2];
                      assert.imageEqualsFile(tile, 'test/fixture/tiles/transparent_' + key + '.png', function(err, similarity) {
                          completion['tile_' + key] = true;
                          if (err) throw err;
                          assert.deepEqual(headers, {
                              "Content-Type": "image/png"
                          });
                          ++count;
                          if (count == array.length) {
                              assert.deepEqual(completion,tileCoordsCompletion);
                              source.close(function(err){
                                  done();
                              });
                          }
                      });
                });
            });
        });
    });
});
