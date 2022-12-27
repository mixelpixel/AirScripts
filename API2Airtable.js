/*
This is close to what I want.  As is tho, it cannot do much more than 100 requests at a time.

Ideally I could set it up to 1) query in artworks url + id#.  If an http 200 is returned, then see if the medium_display starts with "Oil" - if so, then write to airtable.
*/


const start = 1;
const end = 10;
let id = start;

function getData() {
    return fetch(`https://api.artic.edu/api/v1/artworks/${id}`)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error(`HTTP status code ${response.status}`);
            }
        })
        .then(json => {
            // Extract the image_id from the JSON object
            const image_id = json.data.image_id;
            // Construct the URL using the image_id
            const image_url = `https://www.artic.edu/iiif/2/${image_id}/full/843,/0/default.jpg`
            // Return all the useable details
            const title = json.data.title;
            const artist_title = json.data.artist_title;
            const copyright_notice = json.data.copyright_notice;
            const id = json.data.id;
            const artist_display = json.data.artist_display;
            const date_display = json.data.date_display;
            const medium_display = json.data.medium_display;
            const alt_text = json.data.alt_text;
            const classification_title = json.data.classification_title;
            const place_of_origin = json.data.place_of_origin;
            const is_public_domain = json.data.is_public_domain;

            // if (medium_display.startsWith("Oil")) {
            // if (medium_display.startsWith("Watercolor over graphite on cream wove paper")) {
                return {
                    "fields": {
                        "Attachment": [
                            {
                                "url": image_url
                            }
                        ],
                        "Name": title,
                        "Artist": artist_title,
                        "image_id": image_id,
                        "Image URL": image_url,
                        "Copyright Notice": copyright_notice,
                        "API ID": id,
                        "artist display": artist_display,
                        "medium display": medium_display,
                        "date display": date_display,
                        "alt text": alt_text,
                        "classification title": classification_title,
                        "place of origin": place_of_origin,
                        "is_public_domain": JSON.stringify(is_public_domain),
                        "batch start": start,
                        "iteration": end
                    }
                };
            // }
        }
    );
}

// Get the data from a range of records:
while (id <= end) {
    // Do something with the current value of id
    // console.log(id);
    getData().then(data => {
        // Use the data here
        // console.log(data);
        var Airtable = require('airtable');
        var base = new Airtable({apiKey: 'keytNMtnk8kpGN1sJ'}).base('appeGbNwXFgnqhSbi');
        base('artworks').create([data], function(err, records) {
            if (err) {
                console.error(err);
                return;
            }
        records.forEach(function (record) {
            console.log(record.getId());
            });
        });
    }).catch(error => {
        console.error(error);
    });
  id++;
}
