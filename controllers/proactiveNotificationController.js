async function GetDetailsFromDbAsync(PartitionKey, RowKey, tableService) {
    const tableName = 'UserProfile';
    // Check if the entity exists in the Azure Table
    return new Promise((resolve) => {
        tableService.retrieveEntity(tableName, PartitionKey, RowKey, (error, result, response) => {
            if (!error) {
                console.log('Record Already exists');

                resolve(result);
            } else if (error.statusCode === 404) {
            // Entity doesn't exist; insert it
                resolve(null);
            } else {
                console.error('Error checking entity existence:', error);
                resolve(null);
            }
        });
    });
}

async function ExecuteProactiveAsync(data, tableService, adapter) {
    let success = false;
    const userProfiles = await GetDetailsFromDbAsync(data.emailId, data.emailId, tableService);

    let profs = userProfiles.filter(p => p.IsValidProfile(p, BOT_ID));

    if (data.ConversationId) {
        profs = profs.filter(p => p.ConversationId === data.ConversationId);
    }

    // const tasks = [];

    // // #if DEBUG
    // profs = profs.filter(p => p.ChannelId === "emulator");
    // // #endif

    // profs = await CheckDirectLineValidity(profs);

    const results = await Promise.all(profs.map(async (prof) => {
        const cloned = {
            ...request
        };
        try {
            await ProcessProactiveMessageAsync(prof, cloned);
            await BotDbService.AddNotificationToDbAsync(prof, 'Proactive', true, JSON.stringify({
                cloned
            }));
            return true;
        } catch (error) {
            await BotDbService.AddNotificationToDbAsync(prof, 'Proactive', false, JSON.stringify({
                cloned,
                error: error.message
            }));
            return false;
        }
    }));

    if (results.some(result => result)) {
        success = true;
    }

    return success;
}

module.exports = { ExecuteProactiveAsync };
