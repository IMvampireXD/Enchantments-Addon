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

// Registering recipes of enchantments
// would highly advise of putting this in another file, same goes with the class - jeanmajid

new RecipePlusPlus()
    .setSlot(0, "axe")
    .setSlot(1, "book:treecapitator")
    .setResult(null, true, ["§r§5Treecapitator", "§r§o§8Cut down entire trees with one cut"]);


new RecipePlusPlus()
    .setSlot(0, "pickaxe")
    .setSlot(1, "book:autosmelting")
    .setResult(null, true, ["§r§5Hot Pickaxe", "§r§o§8Auto-smelts mined ores"]);


new RecipePlusPlus()
    .setSlot(0, "axe")
    .setSlot(1, "book:frostaspect")
    .setResult(null, true, ["§r§5Frost Aspect", "§r§o§8Has 20% chance of freezing mobs when hit"]);


system.runInterval(() => {
    // only works in overworld either loop through all dimensions or
    // just give the enitity an tick component and make it call an script event - jeanmajid

    // only update recipeEntites who are being used, like if a player is in its range
    const recipeEntities = world.getDimension("overworld").getEntities({
        type: "ench:recipeguy2",
    });

    for (const entity of recipeEntities) {
        /** @type {Container} */
        const inv = entity.getComponent("minecraft:inventory").container;

        // Reuse for less API calls
        let item_00 = inv.getItem(0) || null;
        let item_01 = inv.getItem(1) || null;
        let item_02 = inv.getItem(2) || null;
        // ---

        if (item_02) {
            return;
        }

        if (item_00 && item_01) {
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
                        inv.setItem(2, itemToAdd);
                    } else {
                        resultToPut.setDynamicProperty("reciped", true);
                        inv.setItem(2, resultToPut);
                    }

                    inv.setItem(0, undefined);
                    inv.setItem(1, undefined);

                    break;
                }
            }
        }
    }
}, 10);

// Add a tickDelay because of lag

world.afterEvents.entityHitEntity.subscribe(({ hitEntity: victim }) => {
    if (victim.typeId !== "ench:recipeguy2") return;

    const inv = victim.getComponent("minecraft:inventory").container;
    inv.setItem(2, null);
    inv.item_00 && victim.dimension.spawnItem(inv.item_00, victim.location);
    inv.item_01 && victim.dimension.spawnItem(inv.item_01, victim.location);
    victim.runCommand("setblock ~~~ air destroy");
    victim.remove();
});

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
    if (block.typeId !== "minecraft:chest") return;

    const enchGuy = block.dimension.spawnEntity("ench:recipeguy2", {
        x: block.location.x + 0.5,
        y: block.location.y + 0.5,
        z: block.location.z + 0.5,
    });
    enchGuy.nameTag = "§t§e§s§t§r";
});
