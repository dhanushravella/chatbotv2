async function getTeamsAuth(userEmail) {
    const authEmailUrl = 'https://bot.honohr.com/integration/teams_bot/';
    var res = await fetch(authEmailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: userEmail
        })
    });

    return await res.json();
}

module.exports = { getTeamsAuth };
