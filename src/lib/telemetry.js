// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * TelemetryMock mocks-out telemetry 
 */

class Telemetry {
    constructor(appObject) {}

    async start(userHash) {}

    async hashIds(ids) {
        const data = {userHash: null, accountHash: null};
        return data
    }

    track () {}
}
export { Telemetry }
