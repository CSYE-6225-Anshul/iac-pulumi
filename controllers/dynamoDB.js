const aws = require('@pulumi/aws');
const uuid = require('uuid');

const createDynamoDB = () => {
    // DynamoDB Table
    return dynamoTable = new aws.dynamodb.Table("mytable", {
        attributes: [
            { name: "id", type: "S" },  // Unique identifier with UUID
            { name: "email", type: "S" },
            { name: "submissionURL", type: "S" },
            { name: "gcsURL", type: "S" },
            { name: "emailSentTime", type: "S" },
            { name: "assignmentId", type: "S" },
            { name: "accountId", type: "S" },
            { name: "status", type: "S" }
        ],
        hashKey: "id", // Using Email as the hash key
        readCapacity: 1,
        writeCapacity: 1,
        globalSecondaryIndexes: [
            {
                name: "EmailIndex",
                hashKey: "email",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "SubmissionUrlIndex",
                hashKey: "submissionURL",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "GcsUrlIndex",
                hashKey: "gcsURL",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "EmailSentTimeIndex",
                hashKey: "emailSentTime",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "AssignmentIdIndex",
                hashKey: "assignmentId",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "AccountIdIndex",
                hashKey: "accountId",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "StatusIndex",
                hashKey: "status",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
        ],
    }, {
        dynamicProviders: {
            id: () => uuid.v4(),
        },
    });
}

module.exports = createDynamoDB;
