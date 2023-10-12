const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const vpcCidrBlock = new pulumi.Config("myVpc").require("cidrBlock");
const publicRouteTableCidrBlock = new pulumi.Config("myPublicRouteTable").require("cidrBlock");
const region = new pulumi.Config("aws").require("region");

// get available AWS availability zones
const getAvailableAvailabilityZones = async () => {
    const zones = await aws.getAvailabilityZones({ state: "available" });
    const i = Math.min(zones.names.length, 3);
    console.log('zones now: ', i);
    return zones.names.slice(0, i);
};

// Function to calculate CIDR block for subnets

const calculateSubnetCidrBlock = (baseCIDRBlock, index) => {
    const subnetMask = 24; // Adjust the subnet mask as needed
    const baseCidrParts = baseCIDRBlock.split("/");
    const networkAddress = baseCidrParts[0].split(".");
    const newSubnetAddress = `${networkAddress[0]}.${networkAddress[1]}.${index}.${networkAddress[2]}`;
    return `${newSubnetAddress}/${subnetMask}`;
};

// Create VPC
const myVpc = new aws.ec2.Vpc("myVpc", {
    cidrBlock: vpcCidrBlock,
    instanceTenancy: "default",
    tags: {
        Name: "myVpc",
    },
});

// Get available zones
const createSubnets = async () => {
    const availabilityZones = await getAvailableAvailabilityZones();

    // Create an Internet Gateway resource and attach it to the VPC
    const myInternetGateway = new aws.ec2.InternetGateway("myInternetGateway", {
        vpcId: myVpc.id,
        tags: {
            Name: "myInternetGateway",
        },
    });

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

    const myPublicSubnets = [];
    const myPrivateSubnets = [];

    for (let i = 0; i < availabilityZones.length; i++) {
        // Create public subnet
        const publicSubnetCidrBlock = calculateSubnetCidrBlock(vpcCidrBlock, i + 10);
        const privateSubnetCidrBlock = calculateSubnetCidrBlock(vpcCidrBlock, i + 15);

        const publicSubnet = new aws.ec2.Subnet(`myPublicSubnets${i + 1}`, {
            vpcId: myVpc.id,
            availabilityZone: availabilityZones[i],
            // cidrBlock: `10.0.1${i + 1}.0/24`, // Adjust CIDR blocks as needed
            cidrBlock: publicSubnetCidrBlock,
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
};

// Create a public route in the public route table with the internet gateway as the target
// Invoking create subnets
createSubnets();