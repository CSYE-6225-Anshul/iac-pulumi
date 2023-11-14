const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const vpcCidrBlock = new pulumi.Config("myVpc").require("cidrBlock");
const publicRouteTableCidrBlock = new pulumi.Config("myPublicRouteTable").require("cidrBlock");

const calculateSubnetCidrBlock = require('./calculateSubnetCidrBlock');

const myPublicSubnets = [];
const myPrivateSubnets = [];

const sn = (myVpc, myInternetGateway, availabilityZones) => {
    // Create a public route table and associate all public subnets
    const myPublicRouteTable = new aws.ec2.RouteTable("myPublicRouteTable", {
        vpcId: myVpc.id,
        routes: [
            {
                cidrBlock: publicRouteTableCidrBlock, // destination CIDR block for the internet
                gatewayId: myInternetGateway.id, // internet gateway as the target
            },
        ],
        tags: {
            Name: "myPublicRouteTable",
        },
    });

    const publicRoute = new aws.ec2.Route("publicRoute", {
        routeTableId: myPublicRouteTable.id,
        destinationCidrBlock: publicRouteTableCidrBlock,
        gatewayId: myInternetGateway.id,
    });

    for (let i = 0; i < availabilityZones.length; i++) {
        // Create public subnet
        const publicSubnetCidrBlock = calculateSubnetCidrBlock(vpcCidrBlock, i * 2 + 1);
        const privateSubnetCidrBlock = calculateSubnetCidrBlock(vpcCidrBlock, i * 2 + 2);

        const publicSubnet = new aws.ec2.Subnet(`myPublicSubnets${i + 1}`, {
            vpcId: myVpc.id,
            availabilityZone: availabilityZones[i],
            // cidrBlock: `10.0.1${i + 1}.0/24`, // Adjust CIDR blocks as needed
            cidrBlock: publicSubnetCidrBlock,
            mapPublicIpOnLaunch: true, // Enable auto-assign public IPv4 address
            tags: {
                Name: `myPublicSubnets${i + 1}`,
            },
        });
        myPublicSubnets.push(publicSubnet);

        // Create private subnet
        const privateSubnet = new aws.ec2.Subnet(`myPrivateSubnets${i + 1}`, {
            vpcId: myVpc.id,
            availabilityZone: availabilityZones[i],
            // cidrBlock: `10.0.2${i + 1}.0/24`, // Adjust CIDR blocks as needed
            cidrBlock: privateSubnetCidrBlock,
            tags: {
                Name: `myPrivateSubnets${i + 1}`,
            },
        });
        myPrivateSubnets.push(privateSubnet);
    }

    for (let i = 0; i < myPublicSubnets.length; i++) {
        new aws.ec2.RouteTableAssociation(`myPublicRouteTableAssociation-${i}`, {
            subnetId: myPublicSubnets[i].id,
            routeTableId: myPublicRouteTable.id,
        });
    }

    // Create a private route table and associate all private subnets
    const myPrivateRouteTable = new aws.ec2.RouteTable("myPrivateRouteTable", {
        vpcId: myVpc.id,
        tags: {
            Name: "myPrivateRouteTable",
        },
    });

    for (let i = 0; i < myPrivateSubnets.length; i++) {
        new aws.ec2.RouteTableAssociation(`myPrivateRouteTableAssociation-${i}`, {
            subnetId: myPrivateSubnets[i].id,
            routeTableId: myPrivateRouteTable.id,
        });
    }

    return {
        publicRoute,
        myPublicSubnets,
        myPrivateSubnets,
        myPublicRouteTable,
        myPrivateRouteTable,
    }
}

module.exports = sn;
