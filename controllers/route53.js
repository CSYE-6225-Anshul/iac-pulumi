const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const hostedZoneId = new pulumi.Config("domain").require("hostedZoneId");
const subdomain = new pulumi.Config("domain").require("subdomain");

const aRecord = (loadBalancer) => {
    let applicationLoadBalancer = loadBalancer.applicationLoadBalancer;

    return new aws.route53.Record("demo.anshulsharma.me", {
        zoneId: hostedZoneId,
        name: subdomain,
        type: "A",
        // ttl: 60, // TTL in seconds
        aliases: [{
            name: applicationLoadBalancer.dnsName,  // Specify the DNS name of your load balancer here
            zoneId: applicationLoadBalancer.zoneId,
            evaluateTargetHealth: true,
        }],
        // allowOverwrite: true,
        // records: [applicationLoadBalancer.dnsName],
    });
}

module.exports = aRecord;
