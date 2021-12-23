/*
First reset all the values from the DuplicateEmail field to empty
(i.e. "not checked" which is a checkbox cell value of "null"), then
find duplicate e-mails and mark the record "true" in its duplicateName
checkbox field.  Skips null values, and makes comparisons in lower case.
*/

/* Read from table People */
let table = base.getTable("People");

/* Query the People table */
let query = await table.selectRecordsAsync({
    sorts: [{field: "When their record was created"}],
    fields: ["DuplicateEmail", "Email"]
});
// console.log(query);

/* An empty array to put the changes for each record into */
let reset = [];

/* A counter for reporting how many duplicates are reset */
let counter = 0;

/*
Loop over all the record on the table and remove any true values from the DuplicateEmail field (which is field type: checkbox).
*/
query.records.forEach((record, i) => {
    // console.log(record.getCellValue("DuplicateEmail"));
    reset.push({
        id: query.records[i].id,
        fields: {
            "DuplicateEmail": false //can also be explicitly "null"
        }
    })
    if(record.getCellValue("DuplicateEmail") == true) {
        counter += 1;
    }
})
// console.log(counter);

/*
Confirm the reset array's objects are structured properly, e.g.
(#) [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object, …]
0: {
    id: "reclD6PBFzrVt3sJl",
    fields: {
        DuplicateEmail: false
    }
}
*/
// console.log(reset);

output.text(`There are ${reset.length} records on the People table`);

/* Process the reset */
/* throttling to 50 record limit */
while (reset.length > 0){
    await table.updateRecordsAsync(reset.slice(0, 50));
    reset = reset.slice(50);
};

output.text(`There were ${counter} duplicate e-mails`);

/* Confirm the results of clearing the values */
// query.records.forEach((record, i) => {
//     console.log(`At index ${i}: ${record.getCellValue("DuplicateEmail")}`);
// })


/* Identify duplicates */
/* Loop through all the records */
let duplicates = query.records.filter((record)=> {
    if (record.getCellValue("Email") != null) {
    /* Compare record to potentialDuplicate*/
    return query.records.find((potentialDuplicate)=> {
        if (potentialDuplicate.getCellValue("Email") != null) {
        return record.getCellValue("Email").toLowerCase() === potentialDuplicate.getCellValue("Email").toLowerCase() && record.id !== potentialDuplicate.id;
    }})}
});
// console.log(duplicates);

/* Map a list of recordIDs which will be noted as duplicates (checkbox field: Duplicates) */
let updates = duplicates.map(update => {
    return {
        "id":update.id,
        fields: {
            "DuplicateEmail": true
        }
    }
});
// console.log(updates);

/* How many records will get updated? */
let numUpdates = updates.length;

output.text(`There are ${numUpdates} duplicate e-mails`);

/* Throttle to 50 record limit */
while (updates.length > 0){
    await table.updateRecordsAsync(updates.slice(0,50));
    updates = updates.slice(50);
};

/* TEST for the output report of new total dupes  (because the while loop mutates the updates array, and length ends up as zero)  */
console.log(`updates.length before while loop: ${numUpdates}\nupdates.length after while loop: ${updates.length}`);

/*
Update the DuplicateEmail field description to denote when the script was last run.
*/
let dupeEmailField = table.getField("DuplicateEmail");
// console.log(dupeEmailField.description);

await dupeEmailField.updateDescriptionAsync(`This field is used by the Script "Find Duplicate Emails" to identify matching names.\nThe script is a manually triggered Airtable app which you can find in the PDK app directory.\n\nLast updated on ${new Date()}.\n\n${counter} records with duplicate e-mails.`)

output.text(`DuplicateEmail field description updated to:\n"${dupeEmailField.description}"`);
