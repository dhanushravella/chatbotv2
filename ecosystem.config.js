module.exports = {
    apps: [
        {
            name: 'chatbotV2',
            script: 'npm',
            args: 'run start',
            watch: true,
            ignore_watch: ['node_modules'],
            watch_options: {
                followSymlinks: false
            }
        }
    ]
};
