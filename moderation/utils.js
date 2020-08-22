const fs = require("fs")
const { getTimestamp } = require("../utils/utils")
const { inCooldown, addCooldown } = require("../guilds/utils")
let data = JSON.parse(fs.readFileSync("./moderation/data.json"))

let timer = 0
let timerCheck = true
setInterval(() => {
    const data1 = JSON.parse(fs.readFileSync("./moderation/data.json"))

    if (JSON.stringify(data) != JSON.stringify(data1)) {
        fs.writeFile("./moderation/data.json", JSON.stringify(data), (err) => {
            if (err) {
                return console.log(err)
            }
            console.log("\x1b[32m[" + getTimestamp() + "] moderation data saved\x1b[37m")
        })

        timer = 0
        timerCheck = false
    } else if (!timerCheck) {
        timer++
    }

    if (timer >= 5 && !timerCheck) {
        data = JSON.parse(fs.readFileSync("./moderation/data.json"))
        console.log("\x1b[32m[" + getTimestamp() + "] moderation data refreshed\x1b[37m")
        timerCheck = true
    }

    if (timer >= 30 && timerCheck) {
        data = JSON.parse(fs.readFileSync("./moderation/data.json"))
        console.log("\x1b[32m[" + getTimestamp() + "] moderation data refreshed\x1b[37m")
        timer = 0
    }
}, 60000)

module.exports = {

    /**
     * 
     * @param {*} guild guild to create profile for
     */
    createProfile: function(guild) {
        data[guild.id] = {
            caseCount: 0,
            cases: [],
            mutes: []
        }
    },

    /**
     * @returns {Boolean}
     * @param {*} guild check if profile exists for this guild
     */
    profileExists: function(guild) {
        if (data[guild.id]) {
            return true
        } else {
            return false
        }
    },

    /**
     * @returns {Number}
     * @param {*} guild guild to get case count of
     */
    getCaseCount: function(guild) {
        return data[guild.id].caseCount
    },

    /**
     * 
     * @param {*} guild guild to create new case in
     * @param {*} caseType mute, unmute, kick, warn, ban, unban
     * @param {*} userID id of user being punished
     * @param {*} moderator moderator issuing punishment
     * @param {*} command entire message
     */
    newCase: function(guild, caseType, userID, moderator, command) {
        const currentCases = data[guild.id].cases
        const count = data[guild.id].caseCount

        const case0 = {
            id: count,
            type: caseType,
            user: userID,
            moderator: moderator,
            command: command,
            time: new Date().getTime(),
            deleted: false
        }

        currentCases.push(case0)

        data[guild.id].cases = currentCases
        data[guild.id].caseCount = count + 1
    },

    /**
     * 
     * @param {*} guild guild to delete case in
     * @param {*} caseID case to delete
     */
    deleteCase: function(guild, caseID) {
        const caseInfo = data[guild.id].cases[caseID]

        caseInfo.deleted = true

        data[guild.id].cases[caseID] = caseInfo
    },

    /**
     * 
     * @param {*} guild guild to delete data for
     */
    deleteServer: function(guild) {
        delete data[guild.id]
    },

    /**
     * @returns {Array}
     * @param {*} guild guild to get cases of
     * @param {String} userID user to get cases of
     */
    getCases: function(guild, userID) {
        const cases = []

        for (case0 of data[guild.id].cases) {
            if (case0.user == userID) {
                cases.push(case0)
            }
        }

        return cases.reverse()
    },

    /**
     * @returns {*} case
     * @param {*} guild guild to search for case in
     * @param {*} caseID case to fetch
     */
    getCase: function(guild, caseID) {
        return data[guild.id].cases[caseID]
    },

    newMute: function(guild, member, date) {
        const currentMutes = data[guild.id].mutes

        const d = {
            user: member.user.id,
            unmuteTime: date
        }

        currentMutes.push(d)

        data[guild.id].mutes = currentMutes
    },

    deleteMute: function(guild, member) {
        deleteMute(guild, member)
    },

    isMuted: function(guild, member) {
        const currentMutes = data[guild.id].mutes

        for (mute of currentMutes) {
            if (mute.user == member.user.id) {
                return true
            }
        }

        return false
    },

    runUnmuteChecks: function(client) {
        setInterval(() => {
            const date = new Date().getTime()
        
            for (guild in data) {
                const mutes = data[guild].mutes
        
                if (mutes.length > 0) {
                    for (mute of mutes) {
                        if (mute.unmuteTime <= date) {
                            requestUnmute(guild, mute.user, client)
                        }
                    }
                }
            }
        
        }, 120000)
    },

    setReason: function(guild, caseID, reason) {
        const currentCase = data[guild.id].cases[caseID]

        currentCase.command = reason

        data[guild.id].cases[caseID] = currentCase
    }
}

function deleteMute(guild, member) {
    const currentMutes = data[guild.id].mutes

    for (mute of currentMutes) {
        if (mute.user == member.user.id) {
            currentMutes.splice(currentMutes.indexOf(mute), 1)
        }
    }

    data[guild.id].mutes = currentMutes
}

async function requestUnmute(guild, member, client) {
    guild = client.guilds.cache.find(g => g.id == guild)

    if (!guild) return 

    let members

    if (inCooldown(guild)) {
        members = guild.members.cache
    } else {
        members = await guild.members.fetch()

        addCooldown(guild, 3600)
    }

    member = members.find(m => m.id == member)

    if (!member) return

    const muteRole = guild.roles.cache.find(r => r.name.toLowerCase() == "muted")

    if (!muteRole) return deleteMute(guild, member)

    deleteMute(guild, member)

    return await member.roles.remove(muteRole).catch()
}