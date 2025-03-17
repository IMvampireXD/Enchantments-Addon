import { world, system, Dimension, Block, ItemStack } from '@minecraft/server';
import { RecipePlusPlus } from './recipeRegistery';

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
    const { block, dimension, player } = e;
    const hand = player.getComponent('minecraft:equippable').getEquipment("Mainhand");
    if (!hand) return;
    const lore = hand.getLore();
    const treecapitator = lore?.includes('Treecapitator') && woodBlocks.has(block.typeId);
    const autosmelt = lore?.includes('Hot Pickaxe');
    if (treecapitator) {
        const dimension = block.dimension;
        system.runJob(breakTree(dimension, block));
        e.cancel = true;
    }
    if (autosmelt) {
        const loc = block.location;
        const blockId = block.typeId;
        system.run(() => {
            dimension.getEntities({ location: loc, maxDistance: 1, type: "minecraft:item" }).forEach(entity => entity.remove());
            spawnItem(dimension, oreToIngot(blockId), loc, 1);
        });
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

function spawnItem(Dimension, typeId, location, amount = 1) {
    const item = new ItemStack(typeId, amount);
    Dimension.spawnItem(item, location);
}

function oreToIngot(blockId) {
    if (blockId === 'minecraft:iron_ore' || blockId === 'minecraft:deepslate_iron_ore') {
        return 'minecraft:iron_ingot'
    }
    else if (blockId === 'minecraft:gold_ore' || blockId === 'minecraft:deepslate_gold_ore') {
        return 'minecraft:gold_ingot'
    }
    else if (blockId === 'minecraft:copper_ore' || blockId === 'minecraft:deepslate_copper_ore') {
        return 'minecraft:copper_ingot'
    }
}


// Registering recipe of TreeCapitator
new RecipePlusPlus()
    .setSlot(0, "axe")
    .setSlot(1, "book:treecapitator")
    .setResult(null, true, ["Treecapitator"]);

//Registering recipe of Auto Smelting
new RecipePlusPlus()
    .setSlot(0, "pickaxe")
    .setSlot(1, "book:autosmelting")
    .setResult(null, true, ["Hot Pickaxe"]);
