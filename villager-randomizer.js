/**
 * Villager Randomizer for Random Villager Creator
 * Generates random follower configurations with weighted selection
 */

class VillagerRandomizer {
    // Weight configuration for forms: higher = more likely
    // Category 0 = common/base game, higher categories = rarer/special/DLC
    static FORM_WEIGHTS = { 0: 70, 1: 15, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 };

    constructor(followerData) {
        this.data = followerData;
        this.formsByCategory = this.groupByCategory(Object.entries(followerData.forms));
    }

    /**
     * Group items by their category
     */
    groupByCategory(entries) {
        const grouped = {};
        for (const [id, data] of entries) {
            const category = data.category ?? 0;
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push({ id, data });
        }
        return grouped;
    }

    /**
     * Select a random item using weighted category selection
     */
    weightedRandomCategory(groupedItems, weights) {
        let totalWeight = 0;
        const availableCategories = [];

        for (const [category, weight] of Object.entries(weights)) {
            if (groupedItems[category]?.length > 0) {
                totalWeight += weight;
                availableCategories.push({ category: parseInt(category), weight });
            }
        }

        if (totalWeight === 0) {
            return this.randomItem(Object.values(groupedItems).flat());
        }

        let random = Math.random() * totalWeight;
        for (const { category, weight } of availableCategories) {
            random -= weight;
            if (random <= 0) {
                return this.randomItem(groupedItems[category]);
            }
        }

        return this.randomItem(groupedItems[availableCategories[0].category]);
    }

    randomItem(arr) {
        if (!arr?.length) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    randomInt(max) {
        return Math.floor(Math.random() * max);
    }

    /**
     * Generate a random follower configuration
     */
    generate() {
        // Form selection (weighted toward common forms)
        const formItem = this.weightedRandomCategory(
            this.formsByCategory,
            VillagerRandomizer.FORM_WEIGHTS
        );
        const formData = formItem.data;

        // Form color set (form-specific + general)
        const totalColorSets = formData.sets.length + this.data.generalColorSets.length;

        return {
            form: formItem.id,
            formVariantIdx: this.randomInt(formData.variants.length),
            formColorSetIdx: this.randomInt(totalColorSets),
            clothing: "Default_Clothing",
            clothingVariantIdx: 0,
            clothingColorSetIdx: 0
        };
    }

    /**
     * Generate multiple configurations (for shuffle animation)
     */
    generateMultiple(count) {
        return Array.from({ length: count }, () => this.generate());
    }
}
