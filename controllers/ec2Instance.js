const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
// const amiId = new pulumi.Config("myAmiID").require("amiId");
const keyId = new pulumi.Config("myKeyId").require("keyId");

// Create an EC2 instance
const ec2 = (amiId, myVpc, subnets, securityGroups, userDataScript, cloudWatchAgent) => {
    let myPublicSubnets = subnets.myPublicSubnets;
    let applicationSecurityGroup = securityGroups.applicationSecurityGroup;
    let ec2InstanceRoleAttachment = cloudWatchAgent.ec2InstanceRoleAttachment;
    
    const ec2Instance = new aws.ec2.Instance("myEc2Instance", {
        vpcId: myVpc.id,
        vpcSecurityGroupIds: [applicationSecurityGroup.id],
        subnetId: myPublicSubnets[0].id,
        ami: amiId,
        keyName: keyId,
        instanceType: "t2.micro",
        rootBlockDevice: {
            volumeSize: 25,
            volumeType: "gp2",
            deleteOnTermination: true,
        },
        protectFromTermination: false,
        userData: userDataScript,
        tags: {
            Name: "myEc2Instance",
        },
        iamInstanceProfile: ec2InstanceRoleAttachment.name
    });

    return ec2Instance;
}

module.exports = ec2;
