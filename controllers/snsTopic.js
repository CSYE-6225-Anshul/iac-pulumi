const aws = require("@pulumi/aws");

// Creating an AWS SNS Topic
const topic = () => new aws.sns.Topic("myTopic");

module.exports = topic;
