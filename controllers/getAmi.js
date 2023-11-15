const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create an AMI that will start a small web server on a t2.micro EC2 instance
let amiId = () => {
    return aws.ec2.getAmi({
        filters: [
            {
                name: "name",
                values: ["cyse_6225_*"],
            },
        ],
        // owners: ['self'],
        mostRecent: true,
    }).then(ami => ami.id);
}

module.exports = amiId;