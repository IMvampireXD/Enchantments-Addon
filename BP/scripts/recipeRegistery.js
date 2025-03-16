import { world, system, ItemStack, Block, ItemLockMode } from "@minecraft/server";

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
    const recipeEntities = world.getDimension("overworld").getEntities({
        type: "ench:recipeguy2"
    });
    
    for (const entity of recipeEntities) {
        const inv = entity.getComponent("minecraft:inventory").container;
        
        if (!entity.hasTag("hadResult") && inv.getItem(2) && inv.getItem(2).getDynamicProperty("reciped")) {
            entity.addTag("hadResult");
        }
        
        if (entity.hasTag("hadResult") && !inv.getItem(2) && inv.getItem(0) && inv.getItem(1)) {
            for (const recipe of RecipePlusPlus.getRecipes()) {
                if (inv.getItem(0).typeId.includes(recipe.slots[0]) && 
                    inv.getItem(1).typeId.includes(recipe.slots[1])) {
                    inv.setItem(0, null);
                    inv.setItem(1, null);
                    entity.removeTag("hadResult");
                    break;
                }
            }
        }
        
        if (inv.getItem(2) && !inv.getItem(2).getDynamicProperty("reciped")) {
            entity.dimension.spawnItem(inv.getItem(2), entity.location);
            inv.setItem(2, null);
        }
        
        if (inv.getItem(2) && inv.getItem(2).getDynamicProperty("reciped") == true) {
            if (!inv.getItem(0) || !inv.getItem(1)) {
                inv.setItem(2, null);
                entity.removeTag("hadResult");
            }
        }
        
        if (!inv.getItem(2) && inv.getItem(0) && inv.getItem(1) && !entity.hasTag("hadResult")) {
            for (const recipe of RecipePlusPlus.getRecipes()) {
                if (inv.getItem(0).typeId.includes(recipe.slots[0]) && 
                    inv.getItem(1).typeId.includes(recipe.slots[1])) {
                    
                    const resultToPut = recipe.result;
                    if (recipe.input) {
                        const itemToAdd = new ItemStack(inv.getItem(0).typeId, 1);
                        itemToAdd.setLore(recipe.lore);
                        itemToAdd.setDynamicProperty("reciped", true);
                        inv.setItem(2, itemToAdd);
                    } else {
                        resultToPut.setDynamicProperty("reciped", true);
                        inv.setItem(2, resultToPut);
                    }
                    break;
                }
            }
        }
    }

    for (const player of world.getPlayers()) {
        const inv = player.getComponent("minecraft:inventory").container;
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (!item) return;
            if (item.getDynamicProperty("reciped") !== undefined) {
                item.setDynamicProperty("reciped");
                inv.setItem(i, item);
            }
        }
    }
});


world.afterEvents.entityHitEntity.subscribe(e => {
    const { damagingEntity: attacker, hitEntity: victim } = e;

    if (victim.typeId == "ench:recipeguy2") {
        const inv = victim.getComponent("minecraft:inventory").container;
        inv.setItem(2, null)
        inv.getItem(0) && victim.dimension.spawnItem(inv.getItem(0), victim.location);
        inv.getItem(1) && victim.dimension.spawnItem(inv.getItem(1), victim.location);
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

