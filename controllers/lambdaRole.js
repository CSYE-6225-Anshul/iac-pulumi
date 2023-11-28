const pulumi = require('@pulumi/pulumi');
const aws = require('@pulumi/aws');

const lambdaRole = (snsTopic) => {
    let snsArn = pulumi.interpolate`${snsTopic.arn}`;

    // Lambda IAM Role
    let lambdaRole = new aws.iam.Role("lambdaRole", {
        assumeRolePolicy: JSON.stringify({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": { "Service": "lambda.amazonaws.com" },
                    "Effect": "Allow",
                }
            ],
        }),
    });

    // sns and ses policy to lambda fn
    let snsPublishPolicy = new aws.iam.RolePolicy("sns&sesPublishPolicy", {
        role: lambdaRole.id,
        policy: pulumi.all([snsArn]).apply(([snsArn]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: "sns:Publish",
                    Resource: snsArn
                },
                {
                    Effect: "Allow",
                    Action: ["ses:*"],
                    Resource: "*"
                }
            ]
        })),
    },
    {
        dependsOn: snsTopic
    });

    // Delegate full access to the dynamoDB service
    let fullAccessToDynamoDb = new aws.iam.RolePolicyAttachment("fullAccessToDynamoDb", {
        role: lambdaRole.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    });

    // Attach policies to Lambda IAM Role
    const lambdaPolicy = new aws.iam.RolePolicyAttachment("lambdaPolicy", {
        role: lambdaRole.name,
        policyArn: "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
    });

    // Attach lambda cloudwatch policy
    const cloudwatchPolicy = new aws.iam.RolePolicyAttachment("logPolicy", {
        role: lambdaRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    });

    return {
        lambdaRole,
        snsPublishPolicy,
        fullAccessToDynamoDb,
        lambdaPolicy,
        cloudwatchPolicy
    }
}

module.exports = lambdaRole;
