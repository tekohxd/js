const { Message } = require("discord.js");;;
const { formatDate } = require("../utils/utils");
const { getPeaks, inCooldown, addCooldown } = require("../guilds/utils.js");
const { Command, categories } = require("../utils/classes/Command");
const { ErrorEmbed, CustomEmbed } = require("../utils/classes/EmbedBuilders.js")

const cmd = new Command("server", "view information about the server", categories.INFO).setAliases(["serverinfo", "membercount"])

/**
 * @param {Message} message 
 * @param {Array<String>} args 
 */
async function run(message, args) {

    const server = message.guild;

    const created = formatDate(server.createdAt).toLowerCase();

    let members 

    if (inCooldown(server) || message.guild.memberCount == message.guild.members.cache.size || message.guild.memberCount <= 50) {
        members = server.members.cache
    } else {
        members = await server.members.fetch()
        addCooldown(server, 3600)
    }

    const users = members.filter(member => !member.user.bot)
    const bots = members.filter(member => member.user.bot)

    if (args.length == 1 && args[0] == "-id") {
        const embed = new CustomEmbed(message.member)
            .setTitle(server.name)
            .setDescription("`" + server.id + "`")
        
        return message.channel.send(embed)
    }
       
    if (args.length == 1 && args[0] == "-m") {
        const embed = new CustomEmbed(message.member)
            .setThumbnail(server.iconURL({format: "png", dynamic: true, size: 128}))
            .setTitle(server.name)

            .addField("member info", `**total** ${server.memberCount.toLocaleString()}\n` +
                `**humans** ${users.size.toLocaleString()}\n` +
                `**bots** ${bots.size.toLocaleString()}\n` + 
                `**member peak** ${getPeaks(message.guild).members.toLocaleString()}`)

        return message.channel.send(embed)
    }

    const embed = new CustomEmbed(message.member)
        .setThumbnail(server.iconURL({format: "png", dynamic: true, size: 128}))
        .setTitle(server.name)
        
        .addField("info", "**owner** " + server.owner.user.tag + "\n" +
            "**created** " + created + "\n" +
            "**region** " + server.region, true)

        .addField("info", "**roles** " + server.roles.cache.size + "\n" + 
            "**channels** " + server.channels.cache.size + "\n" +
            "**id** " + server.id, true)

        .addField("member info", `**total** ${server.memberCount.toLocaleString()}\n` +
            `**humans** ${users.size.toLocaleString()}\n` +
            `**bots** ${bots.size.toLocaleString()}\n` + 
            `**member peak** ${getPeaks(message.guild).members.toLocaleString()}`)

    if (server.memberCount >= 25000) {
        embed.setFooter(`real member count: ${server.memberCount} | stats are inaccurate to optimise with large servers`)
    }

    if ((users.size + bots.size) < server.memberCount) {
        embed.setFooter(`real full count: ${server.memberCount} | stats may be temporarily inaccurate`)
    }
    
    message.channel.send(embed)

}

cmd.setRun(run)

module.exports = cmd