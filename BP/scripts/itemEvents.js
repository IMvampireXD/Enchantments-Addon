import { world, system, Dimension, Block, ItemStack, Player } from '@minecraft/server';
import { RecipePlusPlus } from './recipeRegistery';

world.beforeEvents.playerBreakBlock.subscribe(async ev => {
    const { block, dimension, player } = ev;

    const lores = ev.itemStack?.getLore();
    if (lores.length === 0) return;

    const treeCapitator = lores.includes('§r§5Treecapitator') && woodBlocks.has(block.typeId);
    const autoSmelt = lores.includes('§r§5Hot Pickaxe');

    // Has enchantment - treeCapitator
    if (treeCapitator) {
        ev.cancel = true;
        system.runJob(breakTree(dimension, block));
    }

    // Has enchantment - autoSmelt
    if (autoSmelt) {
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

//  Player hit entity  //
world.afterEvents.entityHitEntity.subscribe((event) => {
    const {
        damagingEntity: player,
        hitEntity: victim,
    } = event;

    const lores = getHoldingItem(player);
    if (lores === null || lores.length === 0) return;

    const isFrostAspect = lores.includes('§r§5Frost Aspect');

    if (isFrostAspect && Math.floor(Math.random()) < 0.05) {
        // freeze Victim
    }
}, {
    entityTypes: ["minecraft:player"]
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

/**
 * @param {Player} player 
 * @returns {ItemStack | null}
 */
function getHoldingItem(player) {
    return (player.getComponent("minecraft:equippable")?.getEquipment("Mainhand")) || null;
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


//  Registering recipes of enchantments  //

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
