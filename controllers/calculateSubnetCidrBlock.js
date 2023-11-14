const pulumi = require("@pulumi/pulumi");
const mySubnetMask = new pulumi.Config("mySubnetMask").require("subnetMask");

// Function to calculate CIDR block for subnets
const calculateSubnetCidrBlock = (baseCIDRBlock, index) => {
    const subnetMask = mySubnetMask; // Adjust the subnet mask as needed
    const baseCidrParts = baseCIDRBlock.split("/");
    const networkAddress = baseCidrParts[0].split(".");
    const newSubnetAddress = `${networkAddress[0]}.${networkAddress[1]}.${index}.${networkAddress[2]}`;
    return `${newSubnetAddress}/${subnetMask}`;
};

module.exports = calculateSubnetCidrBlock;
