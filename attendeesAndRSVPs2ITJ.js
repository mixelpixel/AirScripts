/* This has been written for use in an Airtable automation. The source records
come from the Sessions table.  The input fields are: Topics, and two links to
the People table: RSVPs, and Attendees.  The goal is to combine the people in
RSVPs and Attendees into a single array of unique People recordIDs (not all
attendees rsvp & and not all rsvps attend the session, BUT either case is of
note for topic interest), then for each person, for each topic, send a record to
the Interest Topic Junction (ITJ) table.

With the automations' inputs, the data structure we're working with is an object
i.e.
{
input1: ...,
input2: ...,
...
}
e.g. per Airtable API field type's data structure
{
  attendees: ["rec...", ...],
  rsvps: ["rec...", ...],
  topics: ["rec...", ...],
  date: "YYYY-MM-DDTHH:MM:SS.mmmZ",
  url: "https://...",
  sessions: "rec...",
  topicsText: "...\n..."
} */

// the input configuration for the Airtable automation script, per each
// triggering record.  In the first exmple, there are four unique People
// recordIDs and two topics, for a rersult of eight combinations
/* ************************************************************ */
// Actual airscript automation code:
/* ************************************************************ */
// let inputConfig = input.config();
/* ************************************************************ */
const inputConfig = {
  attendees: [
    "recmx0FIxnKzdpfsa",
    "reczna053dNuHuyeg",
    "recLSx8btcYCrHRKZ"
  ],
  rsvps: [
    "reczna053dNuHuyeg",
    "recLSx8btcYCrHRKZ",
    "recCB9AHh1oG5FL0O",
  ],
  topics: [
    "recRPW5NZupTR8lhi",
    "recP3osaF9eWEFG9s"
  ],
  date: "2019-08-01T18:30:00.000Z",
  url: "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
  sessions: "recaFZcUmi4PFNEek",
  topicText: "TESTY TEST TEST\nof multi line text\ncool"
};
// This alternate inputData is included for for testing the case where the input
// for RSVPs is an empty array
// const inputConfig = {
//   attendees: [
//     "recgWOWU4MUqyR0eG",
//     "recKrZ6S8HQcIDckr",
//     "rec0ymZI2oaXQSBDH",
//     "recmx0FIxnKzdpfsa",
//     "reczna053dNuHuyeg",
//     "recLSx8btcYCrHRKZ"
//   ],
//   rsvps: [],
//   topics: [
//     "recRPW5NZupTR8lhi",
//     "recP3osaF9eWEFG9s"
//   ],
//   date: "2019-08-01T18:30:00.000Z",
//   url: "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
//   sessions: "recaFZcUmi4PFNEek",
//   topicText: "TESTY TEST TEST\nof multi line text\ncool"
// };

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
let uniquePeopleIDsWithoutCompany = [];
/* An empty array to hold the iterable, line item array of objects for writing to the ITJ */
let data = [];

/* vvv COMMENT THIS OUT TO RUN IN NODE vvv */
// The table we'll write to
let tableITJ = base.getTable("Interest Topic Junction");
// console.log(tableITJ);
/* ^^^ COMMENT THIS OUT TO RUN IN NODE ^^^ */

// add all the values from attendees and rsvps
allPeopleIDs.push(...attendees, ...rsvps);
// console.log(allPeopleIDs);

// Make a unique set and add that set's values to an array
uniquePeopleIDs.push(...new Set(allPeopleIDs));
console.log(uniquePeopleIDs);

/* vvv COMMENT ALL OF THIS OUT TO RUN IN NODE vvv */
// accessing records on the People table for weeding out THIS Company employees and test records
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

// Query to the people table to see if the personID has an THIS Company company or "example" name string
// If so, then preclude adding those to the unique array for the Interest Topic Junction.
// Also checks for where there is no company associated
uniquePeopleIDs.forEach(u => {
    // console.log(`id: ${u} is ${peopleQuery.getRecord(u).getCellValue("Name")} who works at ${peopleQuery.getRecord(u).getCellValue("Companies")[0].name}`);
    // console.log(peopleQuery.getRecord(u).getCellValue("Name").toLowerCase().includes('example'));
    if(peopleQuery.getRecord(u).getCellValue("Companies") !== null) {
        if (peopleQuery.getRecord(u).getCellValue("Companies")[0].name !== 'THIS Company') {
            if(peopleQuery.getRecord(u).getCellValue("Name").toLowerCase().includes('example') !== true) {
                uniquePeopleIDsWithoutCompany.push(u);
                }
            }
        } else if (peopleQuery.getRecord(u).getCellValue("Name").toLowerCase().includes('example') !== true) {
            uniquePeopleIDsWithoutCompany.push(u);
        }
    }
)
console.log(uniquePeopleIDsWithoutCompany);
/* ^^^ COMMENT ALL OF THIS OUT TO RUN IN NODE ^^^ */

/* vvv TO RUN IN NODE UNCOMMENT THIS vvv */
// uniquePeopleIDsWithoutCompany.push(...uniquePeopleIDs);
/* ^^^ TO RUN IN NODE UNCOMMENT THIS ^^^ */

/* Create (unique(rsvp,attendees) * topics) # of permutations. */
// iterate over Attendees
for (let u = 0; u < uniquePeopleIDsWithoutCompany.length; u++) {
    // iterate over Topics
    for (let t = 0; t < topics.length; t++) {
        data.push(
            {
                fields: {
                    "People": [{id: uniquePeopleIDsWithoutCompany[u]}], // <-- link field
                    "Topics": [{id: topics[t]}], // <-- link field
                    "Source Table": {name: "Sessions"}, // <-- single-select field
                    "Source Date": date, // <-- date field
                    "Zapier Delivery": true, // <-- checkbox field
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

/* Example result

[
  {
    "fields": {
      "People": [
        {
          "id": "recmx0FIxnKzdpfsa"
        }
      ],
      "Topics": [
        {
          "id": "recRPW5NZupTR8lhi"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "recmx0FIxnKzdpfsa"
        }
      ],
      "Topics": [
        {
          "id": "recP3osaF9eWEFG9s"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "reczna053dNuHuyeg"
        }
      ],
      "Topics": [
        {
          "id": "recRPW5NZupTR8lhi"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "reczna053dNuHuyeg"
        }
      ],
      "Topics": [
        {
          "id": "recP3osaF9eWEFG9s"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "recLSx8btcYCrHRKZ"
        }
      ],
      "Topics": [
        {
          "id": "recRPW5NZupTR8lhi"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "recLSx8btcYCrHRKZ"
        }
      ],
      "Topics": [
        {
          "id": "recP3osaF9eWEFG9s"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "recCB9AHh1oG5FL0O"
        }
      ],
      "Topics": [
        {
          "id": "recRPW5NZupTR8lhi"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "Zapier Delivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  },
  {
    "fields": {
      "People": [
        {
          "id": "recCB9AHh1oG5FL0O"
        }
      ],
      "Topics": [
        {
          "id": "recP3osaF9eWEFG9s"
        }
      ],
      "Source Table": {
        "name": "Sessions"
      },
      "Source Date": "2019-08-01T18:30:00.000Z",
      "ZapierDelivery": true,
      "Source Record URL": "https://airtable.com/appzuwjc0q5xR0RZU/tblBJYnbw6rry5vd0/viwAX0jOZKy4m7qIc/recaFZcUmi4PFNEek?blocks=hide",
      "Sessions": [
        {
          "id": "recaFZcUmi4PFNEek"
        }
      ],
      "Raw Text": "TESTY TEST TEST\nof multi line text\ncool"
    }
  }
]

*/
