const pulumi = require('@pulumi/pulumi');
const gcp = require('@pulumi/gcp');
const project = new pulumi.Config("gcp").require("project");

const createServiceAccount = () => {
    // Google Service Account
    let serviceAccount = new gcp.serviceaccount.Account("myServiceAccount", {
        accountId: "myserviceaccount123",
        displayName: "My Service Account",
    });

    // Access keys for the Google Service account
    let accessKeys = new gcp.serviceaccount.Key("myAccessKeys", {
        serviceAccountId: serviceAccount.name,
    });

     // Grant storage permissions
    let storageObjectCreatorRole = new gcp.projects.IAMMember("storageObjectCreator", {
        project: project,
        role: "roles/storage.objectCreator",
        member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
    });

    return {
        serviceAccount,
        accessKeys
    }
}

module.exports = createServiceAccount;
