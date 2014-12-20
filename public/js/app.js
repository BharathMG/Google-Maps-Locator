/**
    Application JS Code
**/

// Helper method to read text file contents.
function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                callback(allText);
            }
        }
    }
    rawFile.send(null);
}


// Listeners for home page buttons.
$(document).on("pageinit", "#home-page", function() {
    $('#all-show-map').click(function(e) {
        window.location = "#all-map-page";
    });
    $('#show-map').click(function(e) {
        window.location = "#map-page";
    });

});

// Listener when "Show All" is clicked.
$(document).on("pageshow", "#all-map-page", function() {
    function drawMap(storeAddresses) {
        var myOptions = {
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("all-map-canvas"), myOptions);
        // Add an overlay to the map of current lat/lng
        var lines = storeAddresses.split("\n");
        var bounds = new google.maps.LatLngBounds();
        var storeNamesArray = [],
            storeAddressesArray = [];
        var infowindow = new google.maps.InfoWindow();
        for (var line in lines) {
            // Sample stores text is not properly formatted. So need to find by "substring" way.
            var details = lines[line];
            var storeAddress = details.substring(details.indexOf('"'), details.lastIndexOf('"') + 1);
            var storeName = details.substring(0, details.indexOf(","));
            storeNamesArray.push(storeName);
            storeAddressesArray.push(storeAddress);
            var storeLatLng = details.substring(details.lastIndexOf('",') + 2, details.length);
            var latlng = storeLatLng.split(",");
            var googleLatLng = new google.maps.LatLng(latlng[0], latlng[1]);
            bounds.extend(googleLatLng);
            var marker = new google.maps.Marker({
                position: googleLatLng,
                map: map,
                title: storeName
            });

            google.maps.event.addListener(marker, 'click', (function(marker, line) {
                return function() {
                    infowindow.setContent(storeNamesArray[line] + "<br/>" + storeAddressesArray[line]);
                    infowindow.open(map, marker);
                }
            })(marker, line));
            map.fitBounds(bounds);
        }
    }
    // Start the process with reading text file.
    readTextFile('sample_stores.txt', drawMap);
});

// Listener when "Show Nearest Store" page is shown
$(document).on("pageshow", "#map-page", function() {
    var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434);
    var storeAddresses;

    function initMap(allText) {
        storeAddresses = allText;
        if (navigator.geolocation) {
            function success(pos) {
                // Location found, show store near these coordinates
                showNearestStore(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            }

            function fail(error) {
                    showNearestStore(defaultLatLng); // Failed to find location, show default map
                }
            
            // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
            navigator.geolocation.getCurrentPosition(success, fail, {
                maximumAge: 500000,
                enableHighAccuracy: true,
                timeout: 6000
            });
        } else {
            showNearestStore(defaultLatLng); // No geolocation support, show default map
        }
    }

    function showNearestStore(currentlatlng) {
        var myOptions = {
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        var lines = storeAddresses.split("\n");
        var bounds = new google.maps.LatLngBounds();
        var infowindow = new google.maps.InfoWindow();
        // Maximum threshold at first.
        var threshold = 1000000000,
            nearestName, nearestAddress, nearestLatLng;
        // For each store, find the minimum distance between user's
        // current location and store location.
        for (var line in lines) {
            var details = lines[line];
            var storeAddress = details.substring(details.indexOf('"'), details.lastIndexOf('"') + 1);
            var storeName = details.substring(0, details.indexOf(","));
            var storeLatLng = details.substring(details.lastIndexOf('",') + 2, details.length);
            var latlng = storeLatLng.split(",");
            var googleLatLng = new google.maps.LatLng(latlng[0], latlng[1]);
            var distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(googleLatLng, currentlatlng);
            // When we find smaller distance than threshold,
            // update the nearest store details.
            if (distanceBetween < threshold) {
                threshold = distanceBetween;
                nearestName = storeName;
                nearestAddress = storeAddress;
                nearestLatLng = googleLatLng;
            }
        }
        bounds.extend(nearestLatLng);
        var marker = new google.maps.Marker({
            position: nearestLatLng,
            map: map,
            title: nearestAddress
        });

        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(nearestName + "<br/>" + nearestAddress);
            infowindow.open(map, marker);
        });
        map.fitBounds(bounds);
    }
    // Start the process with reading text file.
    readTextFile('sample_stores.txt', initMap);
});