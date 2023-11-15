const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const applicationPort = new pulumi.Config("myApplicationPort").require("applicationPort");

const sg = (myVpc) => {
    const loadBalancerSecurityGroup = new aws.ec2.SecurityGroup("loadBalancerSecurityGroup", {
        vpcId: myVpc.id,
        ingress: [
            {
                fromPort: 80,
                toPort: 80,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                ipv6_cidr_blocks: ["::/0"]
            },
            {
                fromPort: 443,
                toPort: 443,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                ipv6_cidr_blocks: ["::/0"]
            },
        ],
    });

    pulumi.log.info(
        pulumi.interpolate`Load Balancer Security Group VPC ID: ${loadBalancerSecurityGroup.vpcId}, ID: ${loadBalancerSecurityGroup.id}`
    );
    
    const applicationSecurityGroup = new aws.ec2.SecurityGroup("applicationSecurityGroup", {
        vpcId: myVpc.id,
        ingress: [
            {
                fromPort: 22,
                toPort: 22,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                ipv6_cidr_blocks: ["::/0"]
            },
            {
                fromPort: applicationPort,
                toPort: applicationPort,
                protocol: "tcp",
                securityGroups: [loadBalancerSecurityGroup.id]
                // cidrBlocks: ["0.0.0.0/0"],
                // ipv6_cidr_blocks: ["::/0"]
            },
        ],
        egress: [
            {
                fromPort: 0,
                toPort: 0,
                protocol: "-1",
                cidrBlocks: ["0.0.0.0/0"],
                ipv6_cidr_blocks: ["::/0"]
            },
        ]
    }); 

    const databaseSecurityGroup = new aws.ec2.SecurityGroup("databaseSecurityGroup", {
        vpcId: myVpc.id,
        ingress: [
            // Add ingress rule
            {
                fromPort: 3306,
                toPort: 3306,
                protocol: "tcp",
                securityGroups: [applicationSecurityGroup.id]
            }
        ],
        egress: [
            // Add egress rule
            {
                fromPort: 3306,
                toPort: 3306,
                protocol: "tcp",
                securityGroups: [applicationSecurityGroup.id]
            }
        ]
    });

    const myLoadBalancerEgressRule = new aws.ec2.SecurityGroupRule("myLoadBalancerEgressRule", {
        type: "egress",
        securityGroupId: loadBalancerSecurityGroup.id,
        protocol: "tcp",
        fromPort: applicationPort,
        toPort: applicationPort,
        sourceSecurityGroupId: applicationSecurityGroup.id
    });

    return {
        applicationSecurityGroup,
        databaseSecurityGroup,
        loadBalancerSecurityGroup,
        myLoadBalancerEgressRule
    }
}

module.exports = sg;
