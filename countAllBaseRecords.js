// Count All Base Records
// how many tables
let tableCount = base.tables.length;
// cumulative counter of records in base
let totalRecords = 0;
// console.log(tableCount);

/* count up through the index of tables from left to right as arranged visually on the
   webpage (where the farthest left table is 0 index through to the farthest right tableCount -1) */
for (let i = 0; i < tableCount; i++){
    // each table
    let name = base.tables[i].name;
    // table name
    let table = base.getTable(name);
    // find the primary field
    let primaryFieldId = table.fields[0].id;
    // get all the records on the table by just the primary field (possible just by id?  Might be a nanosecond faster?)
    let result = await table.selectRecordsAsync({fields: [primaryFieldId]});

    // cumulative total of # records in each table
    totalRecords += result.records.length;
    // each table, total records
    output.text(name + ': ' + result.records.length);
}

output.text('Total Records in ' + base.name + ': ' + totalRecords);
