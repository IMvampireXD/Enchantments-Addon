import { world, system, ItemStack, Container } from "@minecraft/server";

/**
 * 
 * @author Cennac
 * @example
 *  const recipe = new RecipePlusPlus();
    recipe.setSlot(0, "minecraft:iron_sword")
    recipe.setSlot(1, "minecraft:iron_ingot")
    recipe.setResult("minecraft:stone")    

    const recipeOutput = RecipePlusPlus.getRecipes()[0];
    const slot0 = recipeOutput.slots[0];
    const slot1 = recipeOutput.slots[1];
    const output = recipeOutput.result
 */
export class RecipePlusPlus {
    static recipes = [];

    /**
     * Initializes a new recipe with empty slots and no result.
     * Automatically adds the new recipe instance to the static recipes list.
     */

    constructor() {
        this.slots = {};
        this.result = null;
        this.input = false;
        this.lore = [];


        RecipePlusPlus.recipes.push(this);
    }

    /**
     * Sets the item at the given slot position.
     * @param {number} position The position of the slot. Must be a number between 0 and 8.
     * @param {string} item The item to be set at the given slot position. Must be a valid item id.
     * @returns {RecipePlusPlus} The current instance, for method chaining.
     */
    setSlot(position, item) {
        this.slots[position] = item;
        return this;
    }

    /**
     * Sets the result of the recipe.
     * @param {ItemStack} item The item to be set as the result. Must be a valid ItemStack.
     * @param {boolean} boolee
     * @param {string[]} lore
     * @returns {RecipePlusPlus} The current instance, for method chaining.
     */
    setResult(item, boolee = false, lore = []) {
        this.result = item;
        this.input = boolee;
        this.lore = lore;
        return this;
    }

    /**
     * Gets all recipes that have been created so far.
     * @returns {RecipePlusPlus[]} The list of all recipes.
     */
    static getRecipes() {
        return RecipePlusPlus.recipes;
    }
}

system.runInterval(() => {

    // only update recipeEntites who are being used, like if a player is in its range
    const recipeEntities = world.getDimension("overworld").getEntities({
        type: "ench:recipeguy2"
    });
    
    for (const entity of recipeEntities) {
        /** @type {Container} */
        const inv = entity.getComponent("minecraft:inventory").container;
        
        // Reuse for less API calls
        let hasTag = entity.hasTag("hadResult");
        let item_00 = inv.getItem(0) || null;
        let item_01 = inv.getItem(1) || null;
        let item_02 = inv.getItem(2) || null;
        // ---

        // check for recipe
        if (!entity.hasTag("hadResult") && item_02 && item_02.getDynamicProperty("reciped")) {
            entity.addTag("hadResult"); hasTag = true;
        }
        
        // why checking for "hadResult" if it will be always true
        if (!item_02 && item_00 && item_01) {
            for (const recipe of RecipePlusPlus.getRecipes()) {
                if (item_00.typeId.includes(recipe.slots[0]) && 
                item_01.typeId.includes(recipe.slots[1])) {
                    inv.setItem(0, null); item_00 = null;
                    inv.setItem(1, null); item_01 = null;
                    entity.removeTag("hadResult"); hasTag = false;
                    break;
                }
            }
        }

        // ...
        if (item_02) {
            if (!item_02.getDynamicProperty("reciped")) {
                entity.dimension.spawnItem(item_02, entity.location);
                getItem(2, null); item_02 = null;
            } else if (!item_00 || !item_01) {
                inv.setItem(2, null); item_02 = null;
                entity.removeTag("hadResult"); hasTag = true;
            }
        }

        // no need to check for item_02 since it will be always undefined
        if (item_00 && item_01 && !entity.hasTag("hadResult")) {
            const itemTypeId_00 = item_00.typeId;
            const itemTypeId_01 = item_01.typeId;

            // find recipe
            for (const recipe of RecipePlusPlus.getRecipes()) {
                if (itemTypeId_00.includes(recipe.slots[0]) && itemTypeId_01.includes(recipe.slots[1])) {
                    const resultToPut = recipe.result;

                    if (recipe.input) {
                        const itemToAdd = new ItemStack(itemTypeId_00, 1);
                        itemToAdd.setLore(recipe.lore);
                        itemToAdd.setDynamicProperty("reciped", true);
                        inv.setItem(2, itemToAdd); // item_02 = itemToAdd;
                    } else {
                        resultToPut.setDynamicProperty("reciped", true);
                        inv.setItem(2, resultToPut); // item_02 = resultToPut;
                    }

                    break;
                }
            }
        }
    }

    // Iterate all players, better buffer players who interact with the entity.
    for (const player of world.getPlayers()) {
        const inv = player.getComponent("minecraft:inventory").container;
        const invSize = inv.size;

        for (let i = 0; i < invSize; i++) {
            const item = getItem(i);

            // are you sure you mean "return" instead of continue/break ?
            if (!item) return;

            if (item.getDynamicProperty("reciped") !== undefined) {
                item.setDynamicProperty("reciped");
                inv.setItem(i, item);
            }
        }
    }
}, 10);

// Add a tickDelay because of lag


world.afterEvents.entityHitEntity.subscribe(e => {
    const { damagingEntity: attacker, hitEntity: victim } = e;

    if (victim.typeId == "ench:recipeguy2") {
        const inv = victim.getComponent("minecraft:inventory").container;
        inv.setItem(2, null)
        inv.item_00 && victim.dimension.spawnItem(inv.item_00, victim.location);
        inv.item_01 && victim.dimension.spawnItem(inv.item_01, victim.location);
        victim.runCommand("setblock ~~~ air destroy");
        victim.remove();
    }
})

world.afterEvents.playerPlaceBlock.subscribe(e => {
    const { block, player } = e;

    if (block.typeId == "minecraft:chest") {
        const enchGuy = block.dimension.spawnEntity("ench:recipeguy2", {
            x: block.location.x + 0.5,
            y: block.location.y + 0.5,
            z: block.location.z + 0.5
        })
        enchGuy.nameTag = "§t§e§s§t§r"
    }
})

