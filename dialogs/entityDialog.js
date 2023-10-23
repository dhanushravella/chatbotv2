const { Dialog } = require('botbuilder-dialogs');

class CustomEntityDialog extends Dialog {
    constructor(flow, services) {
        super(flow.objectId);
        this.flow = flow;
        this.services = services;
    }

    getJObject = (str) => {
        const formatStr = str.substring(1, str.length - 1); // Remove the outermost curly braces
        return JSON.parse(formatStr);
    };

    getDate = (obj, value) => {
        const dateList = [];
        const values = obj.resolutions;
    
        for (const datePair of values) {
            const pairStart = datePair[value].toString();
            dateList.push(new Date(pairStart));
        }
    
        const now = new Date();
    
        const spanList = dateList.map((date) => {
            const timeDifference = Math.abs(now - date); // Calculate time difference in milliseconds
            return Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Convert to days
          });

        // console.log(spanList[0].getUTCDate());
    
        for (let i = 0; i < 2; i++) {
            if (spanList[i] < 7 && dateList[i].getDay() === now.getUTCDay()) {
                obj = JSON.parse(JSON.stringify(values[i]));
                // obj = this.getJObject(dateStr);
                return obj;
            }
        }
    
        switch (spanList[0] < spanList[1]) {
            case true:
                obj = JSON.parse(JSON.stringify(values[0]));
                break;
            default:
                obj = JSON.parse(JSON.stringify(values[1]));
                break;
        }
    
        return obj;
    };

    async beginDialog(dc, options = null) {
        try {
            const flowData = options;
            // console.log('ConversationData',dc.context.turnState.ConversationData);
            const convoData = dc.context.turnState.ConversationData;
            const lastLuisResult = convoData.LastLuisRes;
            const user = dc.context.turnState.UserData.user;
            const text = dc.context.activity.text;
            const luisRes = (lastLuisResult && lastLuisResult.result.query.toLowerCase() === text.toLowerCase())
                ? lastLuisResult
                : await this.luisRecognizer.recognize(dc.context);

            if (flowData.dictionary['lastLuisResult']) {
                flowData.dictionary['lastLuisResult'] = luisRes;
            } else {
                flowData.dictionary['lastLuisResult'] = luisRes;
            }

            const entities = luisRes.result.prediction.entities.find(entity => entity.extraInformation[0].value.toLowerCase() === this.flow.entity.toLowerCase());

            switch (this.flow.entity.toLowerCase()) {
                case 'clocktype':
                    const inEntity = luisRes.entities.find(entity =>
                        entity.type.toLowerCase() === this.flow.entity.toLowerCase() && entity.entity.toLowerCase() === 'in');
                    const outEntity = luisRes.entities.find(entity =>
                        entity.type.toLowerCase() === this.flow.entity.toLowerCase() && entity.entity.toLowerCase() === 'out');
                    if ((!inEntity && outEntity) || (inEntity && !outEntity)) {
                        return await dc.endDialog(entities.entity);
                    }
                    return await dc.endDialog();

                case 'builtin.geographyv2':
                    const geographyOptions = ['builtin.geographyV2.city', 'builtin.geographyV2.poi', 'builtin.geographyV2.countryRegion'];
                    const geographyEntity = luisRes.entities.find(entity =>
                        entity.type.toLowerCase().startsWith(this.flow.entity.toLowerCase()) && geographyOptions.includes(entity.type));
                    if (geographyEntity) {
                        return await dc.endDialog(geographyEntity.entity);
                    }
                    return await dc.endDialog();

                case 'snapshotsubinfo':
                    let empDataName = '';
                    const hasResolution = entities.additionalProperties?.resolution;
                    const empDataLuis = hasResolution?.values[0];
                    switch (empDataLuis) {
                        case 'employeeDob':
                            empDataName = 'Date of Birth';
                            break;
                        case 'nationality':
                            empDataName = 'Nationality';
                            break;
                        case 'phoneno1':
                            empDataName = 'Contact Number';
                            break;
                        case 'emailId':
                            empDataName = 'Email';
                            break;
                    }
                    return await dc.endDialog(empDataName);

                case 'builtin.number':
                    const entityInString = JSON.stringify(entities.additionalProperties.values);
                    const obj = this.getJObject(entityInString);
                    const value = obj.value.toString();
                    return await dc.endDialog(value);

                case 'datetime.daterange':
                    var dateObj = entities;
                    if (dateObj.resolutions.length === 1) {
                        const dateStr = JSON.stringify(dateObj.resolutions);
                        dateObj = this.getJObject(dateStr);
                    } else if (dateObj.resolutions.length > 1) {
                        dateObj = this.getDate(dateObj, 'begin');
                    }
                    const startDate = dateObj.begin;
                    const endDate = dateObj.end;
                    const dateData = [startDate, endDate];
                    return await dc.endDialog(dateData);

                case 'datetime.date':
                    var dateObj = entities;
                    if (dateObj.resolutions.length === 1) {
                        const dateStr = JSON.stringify(dateObj.resolutions);
                        dateObj = this.getJObject(dateStr);
                    } else if (dateObj.resolutions.length > 1) {
                        dateObj = this.getDate(dateObj, 'value');
                    }
                    return await dc.endDialog(dateObj.value);

                case 'datetime.timerange':
                    var dateObj = entities;
                    if (dateObj.resolutions.length === 1) {
                        const dateStr = JSON.stringify(dateObj.resolutions);
                        dateObj = this.getJObject(dateStr);
                    } else if (dateObj.resolutions.length > 1) {
                        dateObj = this.getDate(dateObj, 'begin');
                    }
                    const startTime = dateObj.begin;
                    const endTime = dateObj.end;
                    const timeData = [startTime, endTime];
                    return await dc.endDialog(timeData);

                case 'datetime.time':
                    var timeObj = entities;
                    if (timeObj.resolutions.length === 1) {
                        const dateStr = JSON.stringify(timeObj.resolutions);
                        timeObj = this.getJObject(dateStr);
                    } else if (timeObj.resolutions.length > 1) {
                        const dateStr = JSON.stringify(timeObj.resolutions[0]);
                        timeObj = this.getJObject(dateStr);
                    }
                    return await dc.endDialog(timeObj.value);

                case 'datetime':
                    var dateTimeObj = entities;
                    if (dateTimeObj.resolutions.length === 1) {
                        const dateStr = JSON.stringify(dateTimeObj.resolutions);
                        dateTimeObj = this.getJObject(dateStr);
                    } else if (dateTimeObj.resolutions.length > 1) {
                        dateTimeObj = this.getDate(dateTimeObj, 'value');
                    }
                    dateTimeObj = dateTimeObj.value.split(' ')
                    const dateValue = dateTimeObj[0];
                    const timeValue = dateTimeObj[1];
                    const dateTimeValue = [dateValue, timeValue];
                    return await dc.endDialog(dateTimeValue);

                case 'datetime.datetimerange':
                    var dateTimeRangeObj = entities;
                    if (dateTimeRangeObj.resolutions.length === 1) {
                        const dateStr = JSON.stringify(dateTimeRangeObj.resolutions);
                        dateTimeRangeObj = this.getJObject(dateStr);
                    } else if (dateTimeRangeObj.resolutions.length > 1) {
                        dateTimeRangeObj = this.getDate(dateTimeRangeObj, 'begin');
                    }
                    const startDateTime = dateTimeRangeObj.begin.split(' ');
                    const endDateTime = dateTimeRangeObj.end.split(' ');
                    const DateTimeData = [startDateTime[0],startDateTime[1], endDateTime[1]];
                    return await dc.endDialog(DateTimeData);

                default:
                    if (!hasResolution) {
                        const resolution = entities;
                        res = resolution?.resolutions[0];
                    }
                    if (entities.entity) {
                        res = entities.entity;
                    } else if (res) {
                        res = res.value.toString();
                    } else if (!value) {
                        res = value;
                    }
                    return await dc.endDialog(res);
            }
        } catch (ex) {
            return await dc.endDialog(null);
        }
    }

    // Implement the recognize method for LUIS or any other language understanding service.
    async recognize(text, user) {
        // Implement LUIS or your language understanding logic here.
        // You'll need to make an HTTP request to your LUIS endpoint or use a Node.js library for LUIS integration.
    }
}

module.exports.CustomEntityDialog = CustomEntityDialog;
