L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
  
    onAdd: function (map) {
      // Triggered when the layer is added to a map.
      //   Register a click listener, then do all the upstream WMS things
      L.TileLayer.WMS.prototype.onAdd.call(this, map);
      map.on('click', this.getFeatureInfo, this);
      map.on('click', this.getFeatureInfoWholeDay, this);
    },
    
    onRemove: function (map) {
      // Triggered when the layer is removed from a map.
      //   Unregister a click listener, then do all the upstream WMS things
      L.TileLayer.WMS.prototype.onRemove.call(this, map);
      map.off('click', this.getFeatureInfo, this);
    },
    
    getFeatureInfo: function (evt) {
      var url = this.getFeatureInfoUrl(evt.latlng);
      var showResults = L.Util.bind(this.showGetFeatureInfo, this);

      $.ajax({
        url: url,
        success: function (data, status, xhr) {
          var err = typeof data === 'string' ? null : data;
          showResults(err, evt.latlng, data);
        },
        error: function (xhr, status, error) {
          showResults(error);
        }
      });
    },
    
    getFeatureInfoUrl: function (latlng) {
      // Construct a GetFeatureInfo request URL given a point
      var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
          size = this._map.getSize(),
          
          params = {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            styles: this.wmsParams.styles,
            transparent: this.wmsParams.transparent,
            version: this.wmsParams.version,      
            format: this.wmsParams.format,
            bbox: this._map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: this.wmsParams.layers,
            query_layers: this.wmsParams.layers,
            info_format: 'text/html',
            time: this.wmsParams.time
          };
      
      params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
      params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
      
      return this._url + L.Util.getParamString(params, this._url, true);
    },

    getFeatureInfoUrlForDatetime: function (latlng, datetime) {
      // Construct a GetFeatureInfo request URL given a point
      var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
          size = this._map.getSize(),
          
          params = {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            styles: this.wmsParams.styles,
            transparent: this.wmsParams.transparent,
            version: this.wmsParams.version,      
            format: this.wmsParams.format,
            bbox: this._map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: this.wmsParams.layers,
            query_layers: this.wmsParams.layers,
            info_format: 'application/json',
            time: datetime
          };
      
      params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
      params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
      
      return this._url + L.Util.getParamString(params, this._url, true);
    },

    getFeatureInfoWholeDay: function (evt) {
        var dt = $('#datetimepicker').datetimepicker('getValue');

        var data_chart = {
          labels: ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
          series: []
        };

        var vals = [];

        for (i = 7; i <= 18; i++) {
          dt.setHours(i);
          dt.setMinutes(0);
          dt.setSeconds(0);

          dt_str = dt.toWMSString();

          var url = this.getFeatureInfoUrlForDatetime(evt.latlng, dt_str);
          var val;

          $.ajax({
            url: url,
            async: false,
            success: function (data, status, xhr) {
                if (typeof data === 'string') {
                    vals.push(0);
                } else {
                    val = data.features[0].properties.UV_INDEX;
                    val = Math.round(val * 100) / 100;
                    vals.push(val);
                }
                //showResults(err, evt.latlng, data);
            },
            error: function (xhr, status, error) {
                //showResults(error);
                val = 0;
                vals.push(val);
            }
          });
        };

        data_chart.series.push(vals);
        new Chartist.Line('.ct-chart', data_chart);
    },
    
    showGetFeatureInfo: function (err, latlng, content) {
      if (err) { console.log(err); return; } // do nothing if there's an error
      
      // Otherwise show the content in a popup, or something.
      L.popup({ maxWidth: 800})
        .setLatLng(latlng)
        .setContent(content)
        .openOn(this._map);
    }
  });
  
  L.tileLayer.betterWms = function (url, options) {
    return new L.TileLayer.BetterWMS(url, options);  
  };