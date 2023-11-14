const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const hostedZoneId = new pulumi.Config("domain").require("hostedZoneId");

const lb = (myVpc, subnets, securityGroups) => {
    let myPublicSubnets = subnets.myPublicSubnets;
    let loadBalancerSecurityGroup = securityGroups.loadBalancerSecurityGroup;
    
    const applicationLoadBalancer = new aws.lb.LoadBalancer("myLoadBalancer", {
        // vpcId: myVpc.id,
        // availabilityZone: hostedZoneId,
        // internal: false,
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

    // const listenerHttp = new aws.lb.ListenerHttp("myHTTPListener", {
    //     loadBalancerArn: applicationLoadBalancer.arn,
    //     port: 80,
    //     protocol: "HTTP",
    //     defaultActions: [{
    //         type: "forward",
    //         targetGroupArn: targetGroup.arn
    //     }],
    // });

    const listener = new aws.lb.Listener("myListener", {
        loadBalancerArn: applicationLoadBalancer.arn,
        port: 80,
        defaultActions: [{
            type: "forward",
            targetGroupArn: targetGroup.arn
        }],
    });
    
    return {
        applicationLoadBalancer,
        listener,
        targetGroup,
        // listenerHttp
    }
}

module.exports = lb;
