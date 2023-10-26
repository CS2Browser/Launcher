const execSync = require('child_process').execSync;

function checkProcessIsRunning(processName) {
    try {
        const cmd = `tasklist | findstr ${processName}`
        const output = execSync(cmd, { encoding: 'utf8' })
        return output.length > 0
    } catch (error) {     
        return false
    }
}

module.exports = {
    checkProcessIsRunning
}