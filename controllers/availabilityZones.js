const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// get available AWS availability zones
const getAvailableAvailabilityZones = async () => {
    const zones = await aws.getAvailabilityZones({ state: "available" });
    const i = Math.min(zones.names.length, 3);
    console.log('zones now: ', i);
    return zones.names.slice(0, i);
};

module.exports = getAvailableAvailabilityZones;
