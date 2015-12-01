var fs = require('fs');
var assert = require('assert');
var mapnik_backend = require('..');

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
        tileCoordsCompletion['grid_' + coords[0] + '_' + coords[1] + '_' + coords[2]] = true;
    });

    describe('getGrid() ', function() {
        var source;
        var completion = {};
        before(function(done) {
            new mapnik_backend('mapnik://./test/data/test.xml', function(err, s) {
                if (err) throw err;
                source = s;
                done();
            });
        });
        it('validates', function(done) {
            var count = 0;
            tileCoords.forEach(function(coords,idx,array) {
                source.getGrid(coords[0], coords[1], coords[2], coords[3], function(err, info, headers) {
                    var zxy = tileCoords_zxy[idx];
                    var key = zxy[0] + '_' + zxy[1] + '_' + zxy[2];
                    completion['grid_' + key] = true;
                    if (err) throw err;
                    var expected = 'test/fixture/grids/' + key + '.grid.json';
                    if (!fs.existsSync(expected) || process.env.UPDATE)
                    {
                        fs.writeFileSync(expected,JSON.stringify(info, null, 4));
                    }
                    assert.deepEqual(info, JSON.parse(fs.readFileSync('test/fixture/grids/' + key + '.grid.json', 'utf8')));
                    assert.deepEqual(headers, {
                        "Content-Type": "application/json"
                    });
                    ++count;
                    if (count == array.length) {
                        assert.deepEqual(completion,tileCoordsCompletion);
                        source.close(function(err) {
                            done();
                        });
                    }
                });
            });
        });
    });
});

describe('Grid Render Errors ', function() {

    it('invalid layer', function(done) {
        new mapnik_backend('mapnik://./test/data/invalid_interactivity_1.xml', function(err, source) {
            if (err) throw err;
            source.getGrid(0, 0, 0, 0, function(err, info, headers) {
                assert.ok(err);
                assert.equal(err.message, "Layer name 'blah' not found");
                source.close(function(err) {
                    done();
                });
            });
        });
    });

});
