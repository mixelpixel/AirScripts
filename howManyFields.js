/*
TBD: update this so that it prompts for a choice from a list of tables, or an option for all
*/

let table = base.getTable("People");
let primaryFieldId = table.fields[0].id;
let query = await table.selectRecordsAsync({fields: [primaryFieldId]});
// output.table(query.records);

output.text(`There are ${table.fields.length} fields (columns) on the People table.\n\nAirtable has a hard limit of 500 fields max per table.\n\nIt is advisable to keep it under 250,\n\We've got ${250 - table.fields.length} more fields until we hit the halfway point!`);
