const { StringExpression } = require('adaptive-expressions');
const { parse, format } = require('date-fns');

class Expressions {
    async StringExpressionJson(jsonBody, userInfo) {
        console.log('yooooooooooo');
        const exp = new StringExpression(jsonBody);
        // console.log(exp);
        var value = exp.getValue(userInfo);
        return value;
    }

    async dateformater(dob, dateFormat) {
        // const dobDate = '12/02/2001';
        // try

        var dateformate = dateFormat;
        var dobDate = dob;

        // Parse the date string to a Date object
        const date = parse(dobDate, 'dd/MM/yyyy', new Date());

        const finalDOBDate = format(date, dateformate);

        console.log('***** User DOB ******', finalDOBDate);

        return finalDOBDate;
    }
    
}

// module.exports = {dateformater}

module.exports = Expressions;
