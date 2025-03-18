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
    if (treecapitator) {
        await (ev.cancel = true);
        system.runJob(breakTree(dimension, block));
    }
    if (autosmelt) {
        if (player.getGameMode() == "creative" || !oreToIngot(blockId)) return;
        await true;
        const loc = block.center();
        const blockId = block.typeId;
        const oreRaw = oreToRaw(blockId);
        const item = new ItemStack(oreToIngot(blockId));
        for (const en of dimension.getEntities({ location: loc, maxDistance: 1, type: "item" })) {
            const itemComponent = en.getComponent("item");
            if (itemComponent.itemStack.typeId != oreRaw) return;
            else en.remove();
            dimension.spawnItem(item, en.location).applyImpulse(en.getVelocity());

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

    while (toBreak.length) {
        let { x, y, z } = toBreak.shift();
        let key = `${x},${y},${z}`;
        if (checked.has(key)) continue;
        checked.add(key);

        let currentBlock = dimension.getBlock({ x, y, z });
        if (!currentBlock || !woodBlocks.has(currentBlock.typeId)) yield;
        toBreak.push(
            { x: x + 1, y, z },
            { x: x - 1, y, z },
            { x, y: y + 1, z },
            { x, y: y - 1, z },
            { x, y, z: z + 1 },
            { x, y, z: z - 1 }
        );
        dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
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

function oreToRaw(blockId) {
    switch (blockId.substring(10)) {
        case 'iron_ore':
        case 'deepslate_iron_ore':
            return 'minecraft:raw_iron';

        case 'copper_ore':
        case 'deepslate_copper_ore':
            return 'minecraft:raw_copper';

        case 'gold_ore':
        case 'deepslate_gold_ore':
            return 'minecraft:raw_gold';

        default: return null;
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
