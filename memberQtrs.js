/*
  How many quarters since a member's start date?
  
  This script is intended to run daily per a scheduled automation trigger
  
  IF TRIGGERING "WHEN A RECORD ENTERS A VIEW" the following code can act upon each triggered record individually
    let inputConfig = input.config();
    let now = new Date();
    const calQuarter = 92*24*60*60*1000;
    let duration =  Date.parse(now) - Date.parse(inputConfig.created);
    let currentQtr = Math.floor(duration / calQuarter) + 1;
    output.set('currentMemberQuarter', `MQ${currentQtr}`);
*/

async function updateCurrMQ() {
    // ~3 months in epoch time
    const calQuarter = 92*24*60*60*1000;
    let updates = new Array();

    // query for all the records in a table, sorted accordingly
    let table = base.getTable("People");
    let queryResult = await table.selectRecordsAsync({
        fields: [
            "Created",
            "MQ1"
        ],
        sorts: [
            {field: "Current MQ"},
            {field: "Created", direction: "desc"}]
    });

    let recids = queryResult.recordIds;
    recids.forEach(x => {
        updates.push(
            {
                'id': x,
                'fields': {
                    'fldhyT4hBDiBactMb': null
                    }
                }
            )
    })

    /* PREPARE THE ARRAY OF STRUCTURED UPDATES */
    for(let i = 0; i < updates.length; i++) {
        if (queryResult.records[i].getCellValue("MQ1") != null) {
            let now = Date();
            let duration =  Date.parse(now) - Date.parse(queryResult.records[i].getCellValue("Created"));
            let currentQtr = Math.floor(duration / calQuarter) + 1;
            updates[i].fields.fldhyT4hBDiBactMb = `MQ${currentQtr}`;
        }
    };

    /* Throttle to Airtable's limit of updating max 50 records at a time */
    while (updates.length > 0){
        // WRITING TO AIRTABLE
        await table.updateRecordsAsync(updates.slice(0, 50));
        // Set up the next 50...
        updates = updates.slice(50);
    };
};

await updateCurrMQ();
