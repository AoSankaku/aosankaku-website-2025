---

title: "[Minecraft] Compost Croparia Seeds with CraftTweaker"
category: "Minecraft"
date: "2026-06-30T13:50:00+09:00"
originalDate: "2025-04-27T16:50:00+09:00"
desc: "This article explains how to make the huge number of leftover Croparia seeds usable in a composter."
tags:
- Mod
- CraftTweaker
- KubeJS

---

> [!NOTE]
> This article was initially translated with GPT-5.5 and then reviewed and edited by the author.

Do you use Croparia?

This mod lets you grow ores on farmland, which gives it enough power to easily destroy game balance. However, it has one fatal problem: **you end up with an absurd amount of seeds**.

In this article, I will introduce CraftTweaker and KubeJS scripts that make it possible to put Croparia seeds into a composter.

## CraftTweaker

**CraftTweaker** is a mod that mainly lets you modify various things, such as adding recipes.

https://modrinth.com/mod/crafttweaker

It has a long history and supports many different Minecraft versions.

### How to use it

Open the folder for your Minecraft launch configuration and look for a folder named `scripts`. If it does not exist, create it. Be careful with uppercase and lowercase letters.

Inside that folder, create a file with a name like `main.zs`, copy and paste the code below into it, and save it. It should work after that.

## The script itself

The contents should be mostly the same across versions, but here I am assuming Forge 1.20.1. For some reason, the original Croparia crashes on this version, so I use a mod called Croparia-IF instead.

The implementation strategy is simple. We just give Croparia seeds a value that says, “this has this much composting value.”

### CraftTweaker

Use this API.

https://docs.blamejared.com/1.20.1/en/vanilla/api/misc/Composter/

```zs
import crafttweaker.api.misc.Composter;

var cropariaSeeds = <tag:items:croparia:crop_seeds>.elements;

for e in cropariaSeeds {
  composter.setValue(e, 0.1); // 0.1 is the composter efficiency, for example 10%
}
```

#### Explanation

The composter does not work by checking whether an item has a tag like “this item is compostable.” Instead, you need to define the probability of how much that item fills the composter, so it is managed separately.

If you write something like `composter.setValue(<item:itemnonamae:name>, 0.1)`, CraftTweaker will nicely™ process it so that the item can be used in a composter.

### KubeJS

KubeJS is also a similar kind of mod, but the script gets quite long, and you need to touch native methods, which is annoying. I recommend just doing it with CraftTweaker.

## Bonus: About composter probabilities

https://minecraft.wiki/w/Composter

It is listed on the Minecraft Wiki. Apparently, most seeds are around 30%. However, Croparia gives you a truly ridiculous amount of seeds, so lowering the probability may actually make the balance better. Try it out.
