const pulumi = require('@pulumi/pulumi');
const aws = require('@pulumi/aws');
const region = new pulumi.Config("aws").require("region");
const project = new pulumi.Config("gcp").require("project");
const sourceEmail = new pulumi.Config("source").require("email");

const lambdaFunction = (snsTopic, storageBucket, serviceAccount, dynamoDB, lambdaRole) => {
    let snsArn = pulumi.interpolate`${snsTopic.arn}`;
    let bucket = storageBucket;
    let accessKeys = serviceAccount.accessKeys;
    let dynamoTable = dynamoDB;
    let lr = lambdaRole.lambdaRole;
    
    // Lambda function
    let lambdaFunc = new aws.lambda.Function("lambdaFunction", {
        code: new pulumi.asset.FileArchive("./serverless.zip"),
        role: lr.arn,
        handler: "serverless/index.handler",
        runtime: "nodejs18.x",
        environment: {
            variables: {
                "BUCKET_NAME": bucket.name,
                "GOOGLE_CREDENTIALS": accessKeys.privateKey,
                "GOOGLE_PROJECT_ID": project,
                "DYNAMODB_TABLE": dynamoTable.name,
                "SOURCE_EMAIL": sourceEmail,
                "REGION": region
            },
        },
    });

    // SNS topic subscription
    let topicSubscription = new aws.sns.TopicSubscription("mySubscription", {
        topic: snsArn,
        endpoint: lambdaFunc.arn,
        protocol: "lambda",
    },
    {
        dependsOn: snsTopic
    });

    return {
        lambdaFunc,
        topicSubscription
    }
}

module.exports = lambdaFunction;
