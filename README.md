# tilesource-mapnik

- A fork of [tilelive-mapnik](http://github.com/mapbox/tilelive-mapnik)

Renderer backend for [tilesource.js](http://github.com/wsw0108/tilesource) that
uses [node-mapnik](http://github.com/mapnik/node-mapnik) to render tiles and
grids from a Mapnik XML file.

## Usage

```javascript
var tilesource = require('tilesource');
require('tilesource-mapnik').registerProtocols(tilesource);

tilesource.load('mapnik:///path/to/file.xml', function(err, source) {
    if (err) throw err;

    // Interface is (z, res, xmin, ymin).
    source.getTile(z, res, xmin, ymin, function(err, tile, headers) {
        // `err` is an error object when generation failed, otherwise null.
        // `tile` contains the compressed image file as a Buffer
        // `headers` is a hash with HTTP headers for the image.
    });

    // The `.getGrid` is implemented accordingly.
});
```

Note that grid generation will only work when there's metadata inside a
`<Parameters>` object in the Mapnik XML.

The key fields are `interactivity_layer` and `interactivity_fields`. See an
[example in the tests](https://github.com/mapbox/tilelive-mapnik/blob/4e9cbf8347eba7c3c2b7e8fd4270ea39f9cc7af5/test/data/test.xml#L6-L7). These `Parameters` are normally added by the application that creates the XML,
in this case [CartoCSS](https://github.com/mapbox/carto/blob/55fbafe0d0e8ec00515c5782a3664c15502f0437/lib/carto/renderer.js#L152-L189)
