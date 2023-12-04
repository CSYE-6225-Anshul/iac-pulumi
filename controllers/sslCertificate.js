const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const domain = new pulumi.Config("acm").require("domain");

const getCertificate = async () => {
    const certificate = await aws.acm.getCertificate({
        domain: domain,
        mostRecent: true,
        statuses: ["ISSUED"],
    });

    if (!certificate) {
        throw new Error("No certificate found for the specified domain.");
    }

    return certificate.arn;
}

module.exports = getCertificate();
