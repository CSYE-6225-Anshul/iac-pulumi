const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const vpcCidrBlock = new pulumi.Config("myVpc").require("cidrBlock");

// Create VPC
const vpc = () => {
    return new aws.ec2.Vpc("myVpc", {
        cidrBlock: vpcCidrBlock,
        instanceTenancy: "default",
        tags: {
            Name: "myVpc",
        },
    });
}

module.exports = vpc;
