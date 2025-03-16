import { world, system, Dimension, Block } from '@minecraft/server';

const woodBlocks = new Set([
    'minecraft:oak_log',
    'minecraft:spruce_log',
    'minecraft:birch_log',
    'minecraft:jungle_log',
    'minecraft:acacia_log',
    'minecraft:dark_oak_log',
    'minecraft:mangrove_log',
    'minecraft:cherry_log',
    'minecraft:crimson_stem',
    'minecraft:warped_stem',
]);

world.beforeEvents.playerBreakBlock.subscribe(e => {
    const { block, player } = e;
    const hand = player.getComponent('minecraft:equippable').getEquipment("Mainhand");
    if (!hand) return;
    const lore = hand.getLore();
    const veinminer = lore?.includes('Treecapitator') && woodBlocks.has(block.typeId);

    if (!veinminer) {
        const dimension = block.dimension;
        if (woodBlocks.has(block.typeId)) {
            system.runJob(breakTree(dimension, block));
            e.cancel = true
        }
    }
});


/**
 * 
 * @param {Dimension} dimension 
 * @param {Block} block 
 */
function* breakTree(dimension, block) {
    let toBreak = [block.location];
    let checked = new Set();

    while (toBreak.length > 0) {
        let location = toBreak.shift();
        let key = `${location.x},${location.y},${location.z}`;
        if (checked.has(key)) continue;
        checked.add(key);

        let currentBlock = dimension.getBlock(location);
        if (currentBlock && woodBlocks.has(currentBlock.typeId)) {
            system.run(() => {
                dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
            })
            let adjacent = [
                { x: location.x + 1, y: location.y, z: location.z },
                { x: location.x - 1, y: location.y, z: location.z },
                { x: location.x, y: location.y + 1, z: location.z },
                { x: location.x, y: location.y - 1, z: location.z },
                { x: location.x, y: location.y, z: location.z + 1 },
                { x: location.x, y: location.y, z: location.z - 1 }
            ];
            for (let loc of adjacent) {
                toBreak.push(loc);
            }
        }
        yield;
    }
} 
