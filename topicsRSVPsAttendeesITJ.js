let inputConfig = input.config();
// console.log(inputConfig);

// Input variables
let attendees = inputConfig.attendees;
let rsvps = inputConfig.rsvps;
let topics = inputConfig.topics;
let date = inputConfig.date;
let url = inputConfig.url;
let sessions = inputConfig.sessions;
let topicText = inputConfig.topicText;
// console.log(attendees);
// console.log(rsvps);
// console.log(topics);
// console.log(date);
// console.log(url);
// console.log(sessions);
// console.log(topicText);

// placeholders for preparing write data
let allPeopleIDs = [];
let uniquePeopleIDs = [];
let uniquePeopleIDsWithoutEnrich = [];
/* An empty array to hold the iterable, line item array of objects for writing to the ITJ */
let data = [];

// The table we'll write to
let tableITJ = base.getTable("Interest Topic Junction");
// console.log(tableITJ);

// add all the values from attendees and rsvps
allPeopleIDs.push(...attendees, ...rsvps);
// console.log(allPeopleIDs);

// Make a unique set and add that set's values to an array
uniquePeopleIDs.push(...new Set(allPeopleIDs));
// console.log(uniquePeopleIDs);

// accessing records on the People table for weeding out enrich employees and test records
let tablePeople = base.getTable("People");
// console.log(getPeople);
let peopleQuery = await tablePeople.selectRecordsAsync({
    sorts: [
        {field: "When their record was created"}
    ],
    fields: [
        "Name",
        "Companies"
    ]
});
// console.log(peopleQuery);
// console.log(peopleQuery.records); // <-- array of {id: "recID...", name: Firstname Lastname"} objects (if we didn't bring in the "Name" field, then the name: value would be "Unnamed record")
// Find the company
/* *************************************************************************************************************** */
// console.log(peopleQuery.getRecord('recZA4SBQFM55Uqfg').getCellValue("Companies")[0].name); // <-- 'Twitter'
// console.log(peopleQuery.getRecord('recZA4SBQFM55Uqfg').getCellValue("Name")); // <-- Sharon Ly
/* *************************************************************************************************************** */
/* ^^^ e.g. console.log(peopleQuery.getRecord(`${iterable}`).getCellValue("Companies")[0].name); ^^^ */

// Query to the people table to see if the personID has an enrich company or "example" name string
// If so, then preclude adding those to the unique array for the Interest Topic Junction.
// Also checks for where there is no company associated
uniquePeopleIDs.forEach(u => {
    // console.log(`id: ${u} is ${peopleQuery.getRecord(u).getCellValue("Name")} who works at ${peopleQuery.getRecord(u).getCellValue("Companies")[0].name}`);
    // console.log(peopleQuery.getRecord(u).getCellValue("Name").toLowerCase().includes('example'));
    if(peopleQuery.getRecord(u).getCellValue("Companies") !== null) {
        if (peopleQuery.getRecord(u).getCellValue("Companies")[0].name !== 'enrich') {
            if(peopleQuery.getRecord(u).getCellValue("Name").toLowerCase().includes('example') !== true) {
                uniquePeopleIDsWithoutEnrich.push(u);
                }
            }
        } else if (peopleQuery.getRecord(u).getCellValue("Name").toLowerCase().includes('example') !== true) {
            uniquePeopleIDsWithoutEnrich.push(u);
        }
    }
)
// console.log(uniquePeopleIDsWithoutEnrich);

/* Create (unique(rsvp,attendees) * topics) # of permutations. */
// iterate over Attendees
for (let u = 0; u < uniquePeopleIDsWithoutEnrich.length; u++) {
    // iterate over Topics
    for (let t = 0; t < topics.length; t++) {
        data.push(
            {
                fields: {
                    "People": [{id: uniquePeopleIDsWithoutEnrich[u]}], // <-- link field
                    "Topics": [{id: topics[t]}], // <-- link field
                    "Source Table": {name: "Sessions"}, // <-- single-select field
                    "Source Date": date, // <-- date field
                    "Airtable Delivery": true, // <-- checkbox field
                    "Source Record URL": url, // <-- url field
                    "Sessions": [{id: sessions}], //<-- link field
                    "Raw Text": topicText // <-- newline separated text
                }
            }
        );
    }
}
// console.log(data);
// console.log(JSON.stringify(data));

// Apply that set of unique people per Sessions record to the People and Topic
// link fields along with some other data for delivery to ITJ.
// Throttle the updates to under 50 at a time
/* ************************************************************ */
while (data.length > 0) {
  await tableITJ.createRecordsAsync(data.slice(0, 50));
  data = data.slice(50);
}
/* ************************************************************ */
