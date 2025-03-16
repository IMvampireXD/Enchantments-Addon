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
    'minecraft:warped_stem'
]);

world.beforeEvents.playerBreakBlock.subscribe(e => {
    const {block,dimension,player} = e;
    const hand = player.getComponent('minecraft:equippable').getEquipment("Mainhand");
    if (!hand) return;
    const lore = hand.getLore();
    const treecapitator = lore?.includes('Treecapitator') && woodBlocks.has(block.typeId);
    const autosmelt = lore?.includes('Auto Smelting');
    if (treecapitator) {
        const dimension = block.dimension;
        system.runJob(breakTree(dimension, block));
        e.cancel = true;
    }
    if (autosmelt) {
        const loc = block.location;
        dimension.getEntities({location: loc, maxDistance: 1}).forEach(entity => entity.remove());
        system.run(() => {
            spawnItem(dimension, oreToIngot(block), loc, 1);
        });
    }
});

/**
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
function spawnItem(Dimension, typeId, location, amount = 1) {
    const item = new ItemStack(typeId, amount);
    Dimension.spawnItem(item, location);
}
function oreToIngot(block) {
    if (block.typeId === 'minecraft:iron_ore' && 'minecraft:deepslate_iron_ore') {
        return 'minecraft:iron_ingot'
    }
    if (block.typeId === 'minecraft:gold_ore' && 'minecraft:deepslate_gold_ore') {
        return 'minecraft:gold_ingot'
    }
    if (block.typeId === 'minecraft:copper_ore' && 'minecraft:deepslate_copper_ore') {
        return 'minecraft:copper_ingot'
    }
}
