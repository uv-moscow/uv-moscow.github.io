window.onload = function() {
    createDtPicker('#datetimepicker');

    var map = createMap('map', '#datetimepicker');
};

// extend standart js date to get string without convertation to utc
Date.prototype.toWMSString = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    var HH = this.getHours();
    var MM = this.getMinutes();
    var SS = this.getSeconds();

    return [this.getFullYear(),
            '-',
            (mm>9 ? '' : '0') + mm,
            '-',
            (dd>9 ? '' : '0') + dd,
            'T',
            (HH>9 ? '' : '0') + HH,
            ':',
            (MM>9 ? '' : '0') + MM,
            ':',
            (SS>9 ? '' : '0') + SS,
            '.000Z'
            ].join('');
};


// js date to UTC
function convertDateToMsk(date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 
        date.getUTCHours() + 3, date.getUTCMinutes(), date.getUTCSeconds());
};

// get yesterday date
// data for yesterday become available ~ at 13.00 MSK
function getLastAvailableDatetime() {
    var localDate = new Date();
    var mskDate = new Date(convertDateToMsk(localDate));

    if (mskDate.getHours < 13) {
        mskDate.setDate(mskDate.getDate() - 2);  // if it's < 13MSK, then get day before yesterday
    } else {
        mskDate.setDate(mskDate.getDate() - 1);  // if it's > 13MSK, then get yesterday
    }

    // set round hours
    mskDate.setHours(12);
    mskDate.setMinutes(0);
    mskDate.setSeconds(0);

    return mskDate;
};

// datetime widget creation
function createDtPicker(id) {
    jQuery(id).datetimepicker({
        format: 'Y-m-d\\TH:00:00.000\\Z',
        lang: 'ru',
        minDate: '2019/05/01',
        maxDate: getLastAvailableDatetime(),
        startDate: getLastAvailableDatetime(),
        mask: true,
        inline: true,
        dayOfWeekStart: 1
    }) ;

    jQuery.datetimepicker.setLocale('ru');
};

// get current selected dt from widget
function getSelectedDatetime(id) {
    var selectedDate = jQuery(id).datetimepicker('getValue');

    selectedDate.setMinutes(0);
    selectedDate.setSeconds(0);

    return selectedDate.toWMSString();
};

function getColorUvindex(d) {
return  d > 8 ?     '#d73027' :
        d > 7 ?     '#f46d43' :
        d > 6 ?     '#fdae61' :
        d > 5 ?     '#fee090' :
        d > 4  ?    '#ffffbf' :
        d > 3  ?    '#e0f3f8' :
        d > 2  ?    '#abd9e9' :
        d > 1  ?    '#74add1' :
                    '#4575b4';
};

function getColorUvres(d) {
return  d > 4  ? '#d7191c' :
        d > 3  ? '#fdae61' :
        d > 2  ? '#ffffbf' :
        d > 1  ? '#abd9e9' :
                 '#2c7bb6';
};


function getColorQer(d) {
return  d > 700  ? '#4575b4' :
        d > 600  ? '#74add1' :
        d > 500  ? '#abd9e9' :
        d > 400  ? '#e0f3f8' :
        d > 300  ? '#fee090' :
        d > 200  ? '#fdae61' :
        d > 100  ? '#f46d43' :
                   '#d73027';
};

function getUvindexHtml()
{
    return '<i style="background:#4575b4"></i> 0–1<br><i style="background:#74add1"></i> 1–2<br><i style="background:#abd9e9"></i> 2–3<br><i style="background:#e0f3f8"></i> 3–4<br><i style="background:#ffffbf"></i> 4–5<br><i style="background:#fee090"></i> 5–6<br><i style="background:#fdae61"></i> 6–7<br><i style="background:#f46d43"></i> 7–8<br><i style="background:#d73027"></i> 8';
};

function getUvresHtml()
{
    return '<i style="background:#2c7bb6"></i> 0<br><i style="background:#abd9e9"></i> 1<br><i style="background:#ffffbf"></i> 2<br><i style="background:#fdae61"></i> 3<br><i style="background:#d7191c"></i> 4';
};

function getQerHtml()
{
    return '<i style="background:#d73027"></i> 0–100<br><i style="background:#f46d43"></i> 100–200<br><i style="background:#fdae61"></i> 200–300<br><i style="background:#fee090"></i> 300–400<br><i style="background:#e0f3f8"></i> 400–500<br><i style="background:#abd9e9"></i> 500–600<br><i style="background:#74add1"></i> 600–700<br><i style="background:#4575b4"></i> 700';
};

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,])[1]
    );
}

// map creation
function createMap(div, dtId) {
    // create leaflet map
    var map = L.map('map');

    // set map bounds and view
    map.setMaxBounds([
        [56.85, 40.18],
        [54.12, 35.13]
    ]);

    map.setView([55.75, 37.61], 9);
    map.setMaxZoom(11);

    // add sidebar to map
    var sidebar = L.control.sidebar('sidebar').addTo(map);
    sidebar.open('home');

    // Mapbox light streets layer
    var mapboxLayer = L.tileLayer('https://a.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWxleHpoZGFub3YiLCJhIjoiY2pjM3Q1NzMwMHF6YTJxbXgwYjB6aHZmdiJ9.KOCowZCJOVOCsijSlcynKQ', {
        id: 'mapbox.light',
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>'
    });

    mapboxLayer.addTo(map);

    // WMS layers
    // UV index layer
    var uvindexLayer = L.tileLayer.betterWms('https://3-120-5-41.sslip.io:8443/geoserver/uv-moscow/wms?', {
        name: 'uvindex',
        layers: 'uvindex-datastore, uv-moscow:uvindex-datastore',
        version: '1.1.1',
        format: 'image/png',
        transparent: 'true',
        opacity: 0.7,
        attribution: 'uv-moscow.github.io, EUMETSAT, NASA',
        time: getLastAvailableDatetime().toWMSString()
    });

    uvindexLayer.addTo(map);

    // UV resources layer
    var uvresLayer = L.tileLayer.betterWms('https://3-120-5-41.sslip.io/geoserver/uv-moscow/wms?', {
        name: 'uvres',
        layers: 'uvres-datastore, uv-moscow:uvres-datastore',
        version: '1.1.1',
        format: 'image/png',
        transparent: 'true',
        opacity: 0.7,
        attribution: 'uv-moscow.github.io, EUMETSAT, NASA',
        time: getLastAvailableDatetime().toWMSString()
    });

    // QER layer
    var qerLayer = L.tileLayer.betterWms('https://3-120-5-41.sslip.io/geoserver/uv-moscow/wms?', {
        name: 'qer',
        layers: 'qer-datastore, uv-moscow:qer-datastore',
        version: '1.1.1',
        format: 'image/png',
        transparent: 'true',
        opacity: 0.7,
        attribution: 'uv-moscow.github.io, EUMETSAT, NASA',
        time: getLastAvailableDatetime().toWMSString()
    });

    // WMS layers dict
    var baselayers = {
        "УФ индекс" : uvindexLayer,
        "УФ ресурсы" : uvresLayer,
        "Qer" : qerLayer
    };

    // control to switch WMS baselayers
    var control = L.control.layers(baselayers, null, { collapsed: false });
    control.addTo(map);

    // add legend for uv index by default
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = getUvindexHtml();

        return div;
    };

    legend.addTo(map);

    // remove and add new legend depending on selected layer
    map.on('baselayerchange', function (evt) {
        var name = evt.layer.options["name"];

        var currentLegend = document.getElementsByClassName("info legend leaflet-control")[0];
        L.DomUtil.remove(currentLegend);

        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');

            if (name == "uvindex") {
                div.innerHTML = getUvindexHtml();
            } else if (name == "uvres") {
                div.innerHTML = getUvresHtml();
            } else if (name == "qer") {
                div.innerHTML = getQerHtml();
            }

            return div;
        };
    
        legend.addTo(map);
    });

    // Leaflet.Geosearch
    // var regionParameter = getURLParameter('region');
    // var region = (regionParameter === 'undefined') ? '' : regionParameter;
    
    // new L.Control.GeoSearch({
    //         provider: new L.GeoSearch.Provider.OpenStreetMap({
    //         region: region
    //     })
    // }).addTo(map);
    

    // bind dt change event to switch layers time parameter
    jQuery(dtId).datetimepicker({
        onChangeDateTime: function(dp,$input){
            var selectedDate = getSelectedDatetime(dtId);

            uvindexLayer.setParams({ 'time': selectedDate }, false);
            uvresLayer.setParams({ 'time': selectedDate }, false);
            qerLayer.setParams({ 'time': selectedDate }, false);
        }
    });

    return map;
};
