const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const sslCertificate = require("./sslCertificate");
const hostedZoneId = new pulumi.Config("domain").require("hostedZoneId");

const lb = (myVpc, subnets, securityGroups) => {
    let myPublicSubnets = subnets.myPublicSubnets;
    let loadBalancerSecurityGroup = securityGroups.loadBalancerSecurityGroup;
    
    const applicationLoadBalancer = new aws.lb.LoadBalancer("myLoadBalancer", {
        loadBalancerType: "application",
        securityGroups: [loadBalancerSecurityGroup.id],
        subnets: myPublicSubnets.map(subnet => subnet.id),
    });
    
    // Create a target group
    const targetGroup = new aws.lb.TargetGroup("myTargetGroup", {
        port: 8080,
        protocol: "HTTP",
        targetType: "instance",
        vpcId: myVpc.id,
        healthCheck: {
            path: "/healthz",
            port: "8080",
            protocol: "HTTP",
            interval: 30,
            timeout: 5,
            healthyThreshold: 3,
            unhealthyThreshold: 3,
        }
    });

    const listener = new aws.lb.Listener("myListener", {
        loadBalancerArn: applicationLoadBalancer.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-2016-08",
        certificateArn: sslCertificate,
        defaultActions: [{
            type: "forward",
            targetGroupArn: targetGroup.arn
        }],
    });
    
    return {
        applicationLoadBalancer,
        listener,
        targetGroup
    }
}

module.exports = lb;
