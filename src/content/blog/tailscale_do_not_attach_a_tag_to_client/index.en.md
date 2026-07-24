---
title: "[Tailscale] Never Tag Your Client Machines"
category: "Tech"
date: "2026-07-24T23:15:00+09:00"
originalDate: "2025-08-02T14:30:00+09:00"
desc: "After I tagged a client machine in Tailscale, shared-in devices disappeared, and removing the tag required reauthentication. I am writing this as a warning."
tags:
- Tailscale
- PC
- Networking
---

> [!NOTE]
> This article was initially translated with GPT-5.6 and then reviewed and edited by the author.

## TL;DR

**DO NOT APPLY A TAILSCALE TAG TO A CLIENT MACHINE, SUCH AS YOUR PERSONAL WINDOWS PC!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! BAD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!**

That is all. Thank you for reading.

## How this started

While casually using Tailscale, I ran `tailscale status` from a client machine, my Windows PC, and became extremely confused because none of the devices in the `Shared in` state appeared.

I eliminated several possible causes.

### Was Windows 23H2 the problem?

I upgraded to 24H2. It did not solve anything.

### Was Tailscale broken?

I deleted all Tailscale data and reinstalled it. Nothing changed.

### Was it the ACL?

There should not be any relationship between ACL rules and whether a device is discovered.

### Was it the firewall?

The devices sometimes appeared and sometimes disappeared depending on their mood, so it probably was not the firewall either.

## Identifying the trigger

After trying various things, I discovered that **other devices stopped being recognized immediately after I added a Tailscale tag**.

I threw the problem at Gemini, and it returned this answer:

> This is a known behavior with Tailscale. When you apply a tag to a device, it loses its user-based identity. Since shared-in devices are shared with a specific user, and your tagged device no longer has a user identity, it can no longer see or connect to those shared machines.

I asked the question in English, so the answer was also in English. I was not trying to show off. Sometimes AI refuses to give a decent answer unless you ask in English, so this is one useful technique.

In other words:

* Adding a tag removes the device from user-based ownership
* As a result, devices that depend on that user identity are no longer visible
* You cannot apply your own ACL tags to shared-in devices, so they all disappear and there is no straightforward way to fix it while the client remains tagged

Let’s look at the explanation in more detail.

> Here's a breakdown of why this happens and what you can do:
>
> **Why This Is Happening**
>
> Tags vs. Users: Tailscale treats tags and user accounts as two different types of identities. Tags are intended for non-human, service-based devices, such as servers or automated systems, while user accounts are for people and their devices.
>
> Shared Devices are User-Based: When a machine is shared with you, it is shared with your user account, such as your email address.
>
> ACLs and Tags: Your ACL rules are designed to work with either user-based identities or tag-based identities. When you tag your client, you are essentially changing its identity from `user:your-email-address` to `tag:your-tag-name`.
>
> The Disconnect: Because the shared-in device is expecting a connection from a specific user, and your tagged device no longer has that user identity, the connection is blocked.

So:

* Adding a tag makes the tag the owner of the machine, removing it from user-based ownership
* Shared-in devices are owned by users, so a tag-owned device cannot see them
* ACL rules themselves can use either tag-based or user-based identities

I will omit the rest of the answer, but apparently the only way to remove a tag once it has been applied is to reauthenticate the affected device by logging out.

```bash
tailscale logout
```

You need to run this command.

`tallsacle down` is not enough because it only disconnects the device and does not remove its authentication.

## Rewriting the ACL

Now that the tag has been removed, the ACL needs to be rewritten.

You probably do not have that many client devices, so instead of tagging them, it may be better to identify them by owner or machine.

```json5
"acls": [
  {
    "action": "accept",
    // Configure this according to your purpose.
    // You can use either an IP-based or user-based identity.
    "src": ["tag:target_server_kocchiha_tag_tsuitetemo_ii"],

    // Configure dst or src using an IP-based or user-based identity.
    "dst": ["100.114.5.14:8080", "oretachino_user_mail@example.com:8080"],
  }, // This trailing comma apparently does not cause an error.
]
```

That is all.

The lesson is that applying an ACL tag to a machine you want to use as a client device, particularly a device used to manage Tailscale, goes against the intended model.

It is surprisingly easy to overlook, so be careful.

I wasted about seven hours on this.
