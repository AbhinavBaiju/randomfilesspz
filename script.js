    // Initialize the map
    var initialZoomLevel = 7;
    var map = L.map('map').setView([42.9538, -75.5268], initialZoomLevel);

    // Add a basemap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(map);

    // Load GeoJSON data for New York counties
    var countiesDataUrl = 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/new-york-counties.geojson';

    // Customize the county styles
    function countyStyle(feature) {
        return {
            fillColor: 'white',
            weight: 2,
            opacity: 1,
            color: 'grey',
            fillOpacity: 0.5
        };
    }

    // Create a GeoJSON layer and add it to the map
    var geojsonLayer = L.geoJSON(null, {
        style: countyStyle,
        onEachFeature: function (feature, layer) {
            // Initialize a clicked flag for each feature
            feature.properties.clicked = false;

            // Add hover event listener to the county layer
            layer.on({
                mouseover: function (e) {
                    // Change color on hover if not clicked
                    if (!feature.properties.clicked) {
                        layer.setStyle({
                            fillColor: 'blue', // Change color on hover
                            fillOpacity: 0.3
                        });
                    }
                },
                mouseout: function (e) {
                    // Reset style on mouseout if not clicked
                    if (!feature.properties.clicked) {
                        geojsonLayer.resetStyle(layer);
                    }
                },
                click: function (e) {
                    // Zoom to the clicked county
                    map.fitBounds(e.target.getBounds());

                    // Set the clicked flag to true
                    feature.properties.clicked = true;

                    // Show the rehabMarkers when a county is clicked
                    map.addLayer(rehabMarkers);

                    // Reset the hover style for all counties
                    geojsonLayer.eachLayer(function (layer) {
                        layer.setStyle({
                            fillColor: 'white',
                            weight: 2,
                            opacity: 1,
                            color: 'grey',
                            fillOpacity: 0.7
                        });
                        layer.feature.properties.clicked = false;
                    });
                }
            });
        }
    }).addTo(map);

    // Load and add the GeoJSON data to the GeoJSON layer
    fetch(countiesDataUrl)
        .then(response => response.json())
        .then(data => {
            geojsonLayer.addData(data); // Use addData to update GeoJSON layer
        });

    // Create a marker cluster group for rehabilitation centers
    var rehabMarkers = L.markerClusterGroup();

    // Read the CSV data and create markers (with IDs) without adding them to the map initially
    Papa.parse('https://raw.githubusercontent.com/AbhinavBaiju/randomfilesspz/edf5d3f7c0b8b887db27a50be6835f68ee147d24/Rehabs.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            results.data.forEach(row => {
                const latitude = parseFloat(row.Latitude);
                const longitude = parseFloat(row.Longitude);

                if (!isNaN(latitude) && !isNaN(longitude)) {
                    var customIcon = L.icon({
                        iconUrl: '/Users/abhinav/Downloads/kindpng_7559828.png',
                        iconSize: [32, 42],
                        iconAnchor: [16, 32],
                    });

                    // Assign the "PROVIDER_NAME" as the marker's ID
                    var marker = L.marker([latitude, longitude], { icon: customIcon, id: row.PROVIDER_NAME });

                    // Add the marker to the cluster group
                    rehabMarkers.addLayer(marker);

                    // Add a click event handler for individual markers (pinpoints)
                    marker.on('click', function () {
                        var markerID = marker.options.id; // Access the ID of the clicked marker
                        updateDynamicInfoWithCSVData(markerID);
                    });
                }
            });
        },
        error: function (error) {
            console.error('Error reading CSV:', error);
        }
    });

    // Remove the cluster markers when the map zooms out
    map.on('zoomend', function () {
        if (map.getZoom() < initialZoomLevel) {
            map.removeLayer(rehabMarkers);
        }
    });

    var resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', function () {
        // Reset the map view to the initial view
        map.setView([42.9538, -75.5268], initialZoomLevel);
        // Remove the rehabilitation center markers if they were added
        map.removeLayer(rehabMarkers);
    });

    function updateDynamicInfoWithCSVData(providerName) {
    // Clear the existing content
    document.getElementById('DynamicInfo').innerHTML = '';

    // Replace this URL with the correct path to your CSV file
    const csvDataUrl = 'https://uploads-ssl.webflow.com/64eb3f8e57140c36d57424e9/64fa35454ab2a1ce81efbf11_RehabCenters.csv';

    // Fetch the CSV data
    Papa.parse(csvDataUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            // Find all rows with the matching PROVIDER_NAME
            const matchingRows = results.data.filter(row => row.PROVIDER_NAME === providerName);

            if (matchingRows.length > 0) {
                // Loop through each matching row and create a DynamicDiv for each
                matchingRows.forEach(matchingRow => {
                    const dynamicDiv = document.createElement('div');
                    dynamicDiv.className = 'DynamicDiv';

                    // Replace specific elements with new data
                    dynamicDiv.innerHTML = `
                    <strong class="center-heading">${matchingRow.PROVIDER_NAME}(${matchingRow.PROVIDER_NUMBER})</strong><br>
                    <strong>Programs:</strong><br>
                    <div class="program-container" style="font-size: 14px;">
                        <table style="margin-top: 15px;" cellspacing="0">
                            <tbody>
                                <tr>
                                    <td width="300" valign="top">
                                        <strong class="program-info">${matchingRow.PROGRAM_NAME}(${matchingRow.PROGRAM_NUMBER})</strong><br>
                                        <div class="program-info">
                                            <strong>Program Type:</strong> ${matchingRow.PROGRAM_TYPE}<br>
                                            <strong>Service Type:</strong> ${matchingRow.SERVICE_TYPE}<br>
                                        </div>
                                    </td>
                                    <td valign="top"><strong>Address:<br></strong></td>
                                    <td width="100%" valign="top" class="address-container">
                                        <div class="address-info">
                                            ${matchingRow.PROGRAM_STREET_ADDRESS}<br>
                                            ${matchingRow.PROGRAM_CITY},${matchingRow.PROGRAM_STATE} &nbsp; ${matchingRow.PROGRAM_ZIP_CODE}-${matchingRow.PROGRAM_ZIP_CODE_PLUS_4}
                                        </div>
                                        <div class="contact-info">
                                            <table>
                                                <tbody>
                                                    <tr>
                                                        <td valign="top"><strong>Admission Phone:</strong></td>
                                                        <td>${matchingRow.ADMISSION_PHONE}<br></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign="top"><strong>Program Director:</strong></td>
                                                        <td width="100%" valign="top">
                                                            ${matchingRow.PROGRAM_DIRECTOR}<br>
                                                            <a href="mailto:${matchingRow.PROGRAM_DIRECTOR_EMAIL}">${matchingRow.PROGRAM_DIRECTOR_EMAIL}</a><br>
                                                            ${matchingRow.PROGRAM_DIRECTOR_TELEPHONE}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="3">
                                        <strong>Designation/Endorsement(s):</strong><br>
                                        <div class="checkbox-container">
                                            <!-- You can populate the checkboxes here based on the CSV data -->
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="3"><hr></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;

// Append the DynamicDiv to the "DynamicInfo" div
document.getElementById('DynamicInfo').appendChild(dynamicDiv);
});
} else {
// Handle the case where no matching data is found
document.getElementById('DynamicInfo').innerHTML = 'No data found for this provider name.';
}
},
error: function (error) {
console.error('Error reading CSV:', error);
}
});
}
