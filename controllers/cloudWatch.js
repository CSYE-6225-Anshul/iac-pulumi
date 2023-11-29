const aws = require("@pulumi/aws");

// Create IAM Role for CloudWatch Agent
const cw = () => {
    const cloudWatchAgentRole = new aws.iam.Role("cloudWatchAgentRole", {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "ec2.amazonaws.com",
                },
            }],
        }),
    });

    // Attach IAM policy for CloudWatch Agent to the role
    const cloudWatchAgentPolicyAttachment = new aws.iam.PolicyAttachment("cloudWatchAgentPolicyAttachment", {
        policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
        roles: [cloudWatchAgentRole.name],
    });

    // Attach IAM policy for CloudWatch Agent to the role
    const cloudWatchAgentSNSPolicyAttachment = new aws.iam.PolicyAttachment("cloudWatchAgentSNSPolicyAttachment", {
        policyArn: "arn:aws:iam::aws:policy/AmazonSNSFullAccess",
        roles: [cloudWatchAgentRole.name],
    });

    // Attach IAM role to EC2 instance
    const ec2InstanceRoleAttachment = new aws.iam.InstanceProfile("ec2InstanceProfile", {
        role: cloudWatchAgentRole.name,
    });

    return {
        cloudWatchAgentRole,
        cloudWatchAgentPolicyAttachment,
        cloudWatchAgentSNSPolicyAttachment,
        ec2InstanceRoleAttachment
    }
}

module.exports = cw;
