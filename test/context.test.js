const ContextLoggerPlugin = require('../lib/context')
const f = require('@funcmaticjs/funcmatic')

describe('Essentials', async () => {
  let ctx = { }
  let plugin = null
  let noop = () => { }
  beforeEach(() => {
    ctx = {
      event: { },
      context: { },
      state: { },
      logger: f.logger 
    }
    plugin = new ContextLoggerPlugin()
  })
  it ('should set empty values if AWS lambda context is empty', async () => {
    await plugin.env(ctx, noop)
    expect(ctx.logger.state()).toMatchObject({
      functionName: '',
      functionVersion: '',
      invokedQualifier: '',
      coldstart: null,
      awsRequestId: '',
      memoryLimitInMB: -1
    })
  })
  it ('should provide values for complete AWS lambda conext', async () => {
    ctx.context = getTestLambdaContext()
    await plugin.env(ctx, noop)
    expect(ctx.logger.state()).toMatchObject({
      functionName: 'funcmatic-invokefunction-dev-invokefunction',
      functionVersion: '20',
      invokedQualifier: 'PROD',
      coldstart: null,
      awsRequestId: '296790b6-f5a8-4f14-b5ce-f059e44dc764',
      memoryLimitInMB: 1024
    })
  })
  it ('should get coldstart state set by Funcmatic framework', async () => {
    ctx.state.coldstart = true
    await plugin.env(ctx, noop)
    expect(ctx.logger.state()).toMatchObject({
      coldstart: true
    })
    ctx.state.coldstart = false
    await plugin.env(ctx, noop)
    expect(ctx.logger.state()).toMatchObject({
      coldstart: false
    })
  })
})

describe('Funcmatic Integration', async () => {
  let func = null
  let ctx = null
  beforeEach(async () => {
    func = f.create()
    func.use(new ContextLoggerPlugin())
    ctx = { }
  })
  it ("should log in handler", async () => {
    func.request(async (ctx) => {
      ctx.response = ctx.logger.info("hello world")
    })
    ctx.context = getTestLambdaContext()
    await func.invoke(ctx)
    // first invocation so coldstart should be true
    expect(ctx.response).toMatchObject({
      functionName: 'funcmatic-invokefunction-dev-invokefunction',
      functionVersion: '20',
      invokedQualifier: 'PROD',
      coldstart: true,
      awsRequestId: '296790b6-f5a8-4f14-b5ce-f059e44dc764',
      memoryLimitInMB: 1024
    })
    // second invocation so coldstart should be false
    await func.invoke(ctx)
    expect(ctx.response).toMatchObject({
      coldstart: false
    })
  })
})

function getTestLambdaContext() {
  return {
    "callbackWaitsForEmptyEventLoop": true,
    "logGroupName": "/aws/lambda/funcmatic-invokefunction-dev-invokefunction",
    "logStreamName": "2019/02/26/[20]e38f863de9e34dcea565d4879f3d458c",
    "functionName": "funcmatic-invokefunction-dev-invokefunction",
    "memoryLimitInMB": "1024",
    "functionVersion": "20",
    "invokeid": "296790b6-f5a8-4f14-b5ce-f059e44dc764",
    "awsRequestId": "296790b6-f5a8-4f14-b5ce-f059e44dc764",
    "invokedFunctionArn": "arn:aws:lambda:us-west-2:233748856986:function:funcmatic-invokefunction-dev-invokefunction:PROD"
  }
}