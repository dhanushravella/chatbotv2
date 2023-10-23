async function convertToCustomFormat(time24Hour) {
    // Split the time into hours and minutes
    const [hours, minutes] = time24Hour.split(':').map(Number);

    // Check if the input is a valid time
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return 'Invalid time format';
    }

    // Determine whether it's AM or PM
    const period = hours < 12 ? 'AM' : 'PM';

    // Convert hours to 12-hour format
    const hours12Hour = (hours % 12) || 12; // Handle midnight (00:00) as 12 AM

    // Format the result as an object
    const customFormat = {
        hour: hours12Hour.toString().padStart(2, '0'),
        minute: minutes.toString().padStart(2, '0'),
        inap: period
    };

    return customFormat;
}

// // Example usage:
// const time24Hour = '08:00'; // Input time in 24-hour format
// const customTimeFormat = convertToCustomFormat(time24Hour);
// console.log(customTimeFormat); // Output: { hour: '08', min: '00', inap: 'AM' }
module.exports = { convertToCustomFormat };
