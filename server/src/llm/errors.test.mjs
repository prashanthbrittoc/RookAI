import { classifyError } from "./errors.mjs"

describe('status Codes', () => {
    test('rate-limit',() => expect(classifyError({status: 429})).toMatchObject({kind: 'rate-limit'}))
    test('server',() => expect(classifyError({status: 501})).toMatchObject({kind: 'server'}))
    test('Bad Request',() => expect(classifyError({status: 402})).toMatchObject({kind: 'bad-request'}))
})