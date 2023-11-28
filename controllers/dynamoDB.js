const aws = require('@pulumi/aws');

const createDynamoDB = () => {
    // DynamoDB Table
    return dynamoTable = new aws.dynamodb.Table("mytable", {
        attributes: [
            { name: "Email", type: "S" },  // Email column
            { name: "URL", type: "S" },    // URL column
            { name: "EmailSentTime", type: "S" },  // Email sent time column
        ],
        hashKey: "Email", // Using Email as the hash key
        readCapacity: 1,
        writeCapacity: 1,
        globalSecondaryIndexes: [
            {
                name: "EmailSentTimeIndex",
                hashKey: "EmailSentTime",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            },
            {
                name: "URLIndex",
                hashKey: "URL",
                projectionType: "ALL",
                readCapacity: 1,
                writeCapacity: 1,
            }
        ],
    });
}

module.exports = createDynamoDB;
