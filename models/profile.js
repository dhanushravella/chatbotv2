// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

class Profile {
    constructor(name, email, picture) {
        this.name = name;
        this.email = email;
        this.picture = picture;
        this.isAuth = false;
        this.company = '';
        this.jobTitle = '';
        this.location = '';
        this.phone = '';
        this.lastUpdated = new Date();
        this.joinDate = new Date();
        this.lastProfileUpdate = new Date();
        this.lastLogin = new Date();
    }
}

module.exports.Profile = Profile;
