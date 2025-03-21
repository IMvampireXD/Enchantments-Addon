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

world.beforeEvents.playerBreakBlock.subscribe(async ev => {
    const { block, dimension, player } = ev;
    const treecapitator = ev.itemStack?.getLore().includes('§r§5Treecapitator') && woodBlocks.has(block.typeId);
    const autosmelt = lore?.includes('§r§5Hot Pickaxe');

    // Has enchantment - treecapitator
    if (treecapitator) {
        ev.cancel = true;
        system.runJob(breakTree(dimension, block));
    }

    // Has enchantment - autosmelt
    if (autosmelt) {
        if (player.getGameMode() == "creative" || !oreToIngot(blockId)) return;
        const loc = block.center();
        const blockId = block.typeId;
        if (player.getGameMode() == "creative") return;

        system.run(() => {
            if (oreToIngot(blockId) == null) return;

            dimension.getEntities({ location: loc, maxDistance: 3, type: "minecraft:item", closest: 1 }).forEach(entity => {
                const itemComponent = entity.getComponent("item");
                
                if (itemComponent.itemStack.typeId == oreToRaw(blockId)) {
                    entity.remove()
                } else {
                    return;
                }
            });

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

    while (toBreak.length) {
        let { x, y, z } = toBreak.shift();
        let key = `${x},${y},${z}`;
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
    switch (blockId.substring(10)) {
        case 'iron_ore':
        case 'deepslate_iron_ore':
            return 'minecraft:iron_ingot';

        case 'copper_ore':
        case 'deepslate_copper_ore':
            return 'minecraft:copper_ingot';

        case 'gold_ore':
        case 'deepslate_gold_ore':
            return 'minecraft:gold_ingot';

        default: return null;
    }
}

/**
 * 
 * @param {string} blockId 
 * @returns {string | null}
 */
function oreToRaw(blockId) {
    if (blockId === 'minecraft:iron_ore' || blockId === 'minecraft:deepslate_iron_ore') {
        return 'minecraft:raw_iron'
    }
    else if (blockId === 'minecraft:gold_ore' || blockId === 'minecraft:deepslate_gold_ore') {
        return 'minecraft:raw_gold'
    }
    else if (blockId === 'minecraft:copper_ore' || blockId === 'minecraft:deepslate_copper_ore') {
        return 'minecraft:raw_copper'
    } else {
        return null;
    }
}

// Registering recipes of enchantments //

new RecipePlusPlus()
    .setSlot(0, "axe")
    .setSlot(1, "book:treecapitator")
    .setResult(null, true, ["§r§5Treecapitator", "§r§o§8Cuts down entire tree by just breaking one block"]);


new RecipePlusPlus()
    .setSlot(0, "pickaxe")
    .setSlot(1, "book:autosmelting")
    .setResult(null, true, ["§r§5Hot Pickaxe", "§r§o§8Auto-smelts mined ores"]);


new RecipePlusPlus()
    .setSlot(0, "axe")
    .setSlot(1, "book:frostaspect")
    .setResult(null, true, ["§r§5Frost Aspect", "§r§o§8Has 20% chance of freezing mobs when hit"]);
