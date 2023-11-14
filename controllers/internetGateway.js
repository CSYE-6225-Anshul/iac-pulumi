const aws = require("@pulumi/aws");

// Create an Internet Gateway resource and attach it to the VPC
const myInternetGateway = (myVpc) => {
    return new aws.ec2.InternetGateway("myInternetGateway", {
        vpcId: myVpc.id,
        tags: {
            Name: "myInternetGateway",
        },
    });
}

module.exports = myInternetGateway;
