import { execSync } from 'child_process'
import { versionStringToNumber } from '../helpers/common'

describe('Requirements for production', () => {
    test('initDev() have to be undefined', () => {
        const initDev =  require('../index')['initDev']
        expect(initDev).toBeUndefined()
    })
    
    test('npm repository version have to be lower than local version', done => {
        const { version, name } = require('../../package.json')
        const localVersionNumber = versionStringToNumber(version)
        const cmd = `npm view ${name} dist-tags.latest`
        try {
            const npmRepoVersionString = execSync(cmd, { encoding: 'utf-8' })
            const npmRepoVersionNumber = versionStringToNumber(npmRepoVersionString)
            expect(localVersionNumber).toBeGreaterThan(npmRepoVersionNumber)
            done()
        }
        catch(err) {
            if( err.toString().includes('npm ERR! code E404')) done()
            else done(err)
        }
    })
})
