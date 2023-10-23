const { Dialog } = require('botbuilder-dialogs');
const { ValueExpression } = require('adaptive-expressions');
// const { JToken, JArray } = require('node_modules/json-net');
// const { JsonConvert, JObject } = require('json2net');

class SetPropertyDialog extends Dialog {
    constructor(flow, service) {
        super(flow.objectId);
        this.flow = flow;
    }

    async beginDialog(dc, options = null) {
        const flowData = options;
        const expression = new ValueExpression(this.flow.value ? this.flow.value.toString() : '');

        let value = null;

        if (this.flow.mapping) {
            const mapping = this.flow.mapping;
            const contentStr = mapping.content.getValue(flowData.dictionary);
            const content = JSON.parse.DeserializeObject(contentStr);
            const currentKey = mapping.currentKey.getValue(flowData.dictionary);
            const currentValue = mapping.currentValue.getValue(flowData.dictionary).toLowerCase();
            const newKey = mapping.NewKey.getValue(flowData.dictionary);

            for (const item of content) {
                const itemValue = item[currentKey].toString().toLowerCase();

                if (itemValue.includes(currentValue) || currentValue.includes(itemValue)) {
                    // eslint-disable-next-line no-undef
                    value = JToken.FromObject(item[newKey].toString());
                    break;
                }
            }
        } else {
            const val = expression.getValue(flowData.dictionary);

            if (val !== null) {
                if (flowData.currentFlow.property === 'toDate') {
                    // eslint-disable-next-line no-prototype-builtins
                    if (flowData.dictionary.hasOwnProperty(flowData.currentFlow.property) && flowData.dictionary[flowData.currentFlow.property] !== null) {
                        value = flowData.dictionary[flowData.currentFlow.property];
                    } else {
                        var query = flowData.dictionary.lastLuisResult.result.query;
                        if (query.includes('for')) {
                            value = val;
                        }
                    }
                } else if (flowData.currentFlow.property === 'fromTimeData') {
                    value = [{ value: '9 am' }, { value: '9:30 am to 6:30 pm' }, { value: '10 am' }, { value: '10:30 am to 7:30 pm' }];
                } else if (flowData.currentFlow.property === 'toTimeData') {
                    value = [{ value: '6 pm' }, { value: '6:30 pm' }, { value: '7 pm' }, { value: '7:30 pm' }];
                } else {
                    value = val;
                }
            }
        }

        return await dc.endDialog(value);
    }
}

module.exports.SetPropertyDialog = SetPropertyDialog;
